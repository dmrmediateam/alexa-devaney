import 'server-only';
import type { SanityClient } from '@sanity/client';
import { envCustomerId, googleAdsConfigured, googleAdsSearch, listAccessibleCustomers, missingGoogleAdsEnv } from '@/lib/googleAds';

/**
 * Pulls spend and leads per campaign per month from Google Ads into the
 * dashboard's `dmrMonthlyReport` documents. Run by the Studio's "Sync Google
 * Ads" button (/api/dmr/google-ads-sync) and by the daily cron.
 *
 * Only months Google Ads has data for are written, from the DMR start date
 * (Report Settings) on: ads that ran before DMR took over aren't ours. Each one's `campaigns`
 * array is replaced with what Ads reports; subtitles DMR typed by hand are
 * kept (matched by campaign id, then name), and so are the month's
 * overrides and footnote. "Leads" are Google Ads conversions, rounded, and
 * "value" is their Google Ads conversion value: the dashboard's ROI is built on it.
 */

export const SETTINGS_ID = 'dmr-client-settings';
const MONTHS_BACK = 12; // plus the current month

export interface SyncSettings {
  clientName?: string;
  dataSource?: 'manual' | 'googleAds';
  googleAdsCustomerId?: string;
  /** YYYY-MM-DD: when DMR took over. Nothing before its month is synced. */
  dmrStartDate?: string;
}

export interface SyncResult {
  ok: boolean;
  at: string;
  message: string;
  months?: number;
  campaigns?: number;
}

interface CampaignRow {
  campaign?: { id?: string; name?: string };
  segments?: { month?: string };
  metrics?: { costMicros?: string; conversions?: number; conversionsValue?: number };
}

interface StoredCampaign {
  _key: string;
  name: string;
  subtitle?: string;
  spend: number;
  leads: number;
  /** Google Ads conversion value, in the account's currency. */
  value: number;
  googleAdsCampaignId?: string;
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export async function syncGoogleAds(client: SanityClient, settings: SyncSettings | null): Promise<SyncResult> {
  const at = new Date().toISOString();
  if (!googleAdsConfigured()) {
    return {
      ok: false,
      at,
      message: `The website's production deployment can't see ${missingGoogleAdsEnv().join(', ')}. ` +
        'Check the names and that Production is ticked in Vercel, then redeploy.',
    };
  }
  const customerId = envCustomerId() || settings?.googleAdsCustomerId;
  if (!customerId) {
    return { ok: false, at, message: 'No Google Ads customer ID. Add it under Report Settings > Data source.' };
  }

  const now = new Date();
  const lookback = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MONTHS_BACK, 1));
  const dmrStart = settings?.dmrStartDate ? new Date(`${settings.dmrStartDate.slice(0, 7)}-01T00:00:00Z`) : null;
  const start = dmrStart && dmrStart > lookback ? dmrStart : lookback;
  let rows: CampaignRow[];
  try {
    rows = await googleAdsSearch<CampaignRow>(
      customerId,
      'SELECT campaign.id, campaign.name, segments.month, metrics.cost_micros, metrics.conversions, metrics.conversions_value ' +
        `FROM campaign WHERE segments.date BETWEEN '${isoDate(start)}' AND '${isoDate(now)}' ` +
        'AND metrics.impressions > 0',
    );
  } catch (err) {
    // Say which account we asked for, where the id came from, and what this
    // login can actually reach: most 403/404s are a wrong id or MCC.
    const source = envCustomerId() ? 'GOOGLE_ADS_CUSTOMER_ID in Vercel' : 'Report Settings';
    const loginId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || 'not set';
    const reachable = await listAccessibleCustomers().then((ids) => ids.join(', ') || 'none').catch(() => 'unknown');
    const reason = err instanceof Error ? err.message : 'Google Ads request failed';
    throw new Error(`${reason}. Account ${customerId} (from ${source}), login-customer-id ${loginId}; this login can reach: ${reachable}.`);
  }

  // month (YYYY-MM-01) -> campaign id -> totals
  const byMonth = new Map<string, Map<string, { name: string; spend: number; leads: number; value: number }>>();
  for (const row of rows) {
    const month = row.segments?.month;
    const id = row.campaign?.id;
    if (!month || !id) continue;
    const campaigns = byMonth.get(month) ?? new Map();
    const entry = campaigns.get(id) ?? { name: row.campaign?.name ?? `Campaign ${id}`, spend: 0, leads: 0, value: 0 };
    entry.spend += Number(row.metrics?.costMicros ?? 0) / 1_000_000;
    entry.leads += Number(row.metrics?.conversions ?? 0);
    entry.value += Number(row.metrics?.conversionsValue ?? 0);
    campaigns.set(id, entry);
    byMonth.set(month, campaigns);
  }

  const existing = await client.fetch<Array<{ _id: string; month: string; campaigns?: StoredCampaign[] }>>(
    `*[_type == "dmrMonthlyReport" && month in $months]{_id, month, campaigns}`,
    { months: Array.from(byMonth.keys()) },
  );
  const existingByMonth = new Map(existing.map((doc) => [doc.month, doc]));

  const tx = client.transaction();
  let campaignCount = 0;
  /* Array.from rather than spreading or for..of over the Maps: some client
     repos (eagan-luxury) target ES5, where that needs downlevelIteration. */
  for (const [month, campaigns] of Array.from(byMonth)) {
    const doc = existingByMonth.get(month);
    const previous = doc?.campaigns ?? [];
    const next: StoredCampaign[] = Array.from(campaigns)
      .map(([id, c]) => {
        const prior = previous.find((p) => p.googleAdsCampaignId === id) ?? previous.find((p) => p.name === c.name);
        return {
          _key: `gads-${id}`,
          name: c.name,
          ...(prior?.subtitle ? { subtitle: prior.subtitle } : {}),
          spend: Math.round(c.spend * 100) / 100,
          leads: Math.round(c.leads),
          value: Math.round(c.value * 100) / 100,
          googleAdsCampaignId: id,
        };
      })
      .sort((a, b) => b.spend - a.spend);
    campaignCount += next.length;

    if (doc) {
      tx.patch(doc._id, (p) => p.set({ campaigns: next, syncedAt: at }));
    } else {
      tx.createIfNotExists({ _id: `dmr-report-${month.slice(0, 7)}`, _type: 'dmrMonthlyReport', month, campaigns: next, syncedAt: at });
    }
  }
  if (byMonth.size) await tx.commit();

  const message = byMonth.size
    ? `Synced ${byMonth.size} month${byMonth.size === 1 ? '' : 's'}, ${campaignCount} campaign rows from Google Ads.`
    : `Google Ads returned no campaign activity since ${isoDate(start).slice(0, 7)}.`;
  return { ok: true, at, message, months: byMonth.size, campaigns: campaignCount };
}

/** Stores the outcome on the settings doc so the Studio button can show it. */
export async function recordSync(client: SanityClient, result: SyncResult): Promise<void> {
  await client.patch(SETTINGS_ID).set({ lastSync: result }).commit();
}
