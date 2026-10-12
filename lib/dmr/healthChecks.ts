import { envCustomerId, googleAdsConfigured, googleAdsSearch, missingGoogleAdsEnv } from "@/lib/googleAds";
import { getPreviewClient } from "@/lib/dmr/sanity";
import { recordSync, syncGoogleAds } from "@/lib/dmr/googleAdsSync";

/**
 * The portal's health checks for the daily cron (app/api/cron/route.ts):
 *   dashboard-data  reads DMR Report Settings + monthly reports from Sanity,
 *                   the same data the Studio dashboard renders
 *   google-ads      when Report Settings says "Google Ads sync": pulls the
 *                   last 13 months into the Monthly Reports (the same sync as
 *                   the Studio's "Sync Google Ads" button). Otherwise one
 *                   read-only query (last 7 days' spend) if credentials are
 *                   set, or skipped if they aren't.
 *
 * Managed by client-portal, so these update with the portal. The cron route
 * itself belongs to the client repo, which adds its own checks (IDX, listing
 * search, ...) next to these.
 */

export interface CheckResult {
  name: string;
  ok: boolean;
  skipped?: boolean;
  ms: number;
  detail: string;
}

export interface DashboardSettings {
  clientName?: string;
  dataSource?: "manual" | "googleAds";
  googleAdsCustomerId?: string;
  dmrStartDate?: string;
}

export async function check(name: string, run: () => Promise<string>): Promise<CheckResult> {
  const started = Date.now();
  try {
    const detail = await run();
    return { name, ok: true, ms: Date.now() - started, detail };
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : "unknown error";
    return { name, ok: false, ms: Date.now() - started, detail };
  }
}

export const skip = (name: string, detail: string): CheckResult => ({ name, ok: true, skipped: true, ms: 0, detail });
export const fail = (name: string, detail: string): CheckResult => ({ name, ok: false, ms: 0, detail });

export function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret set: allow local dev only, never an open endpoint in production.
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function checkDashboard(): Promise<{ result: CheckResult; settings: DashboardSettings | null }> {
  let settings: DashboardSettings | null = null;
  const result = await check("dashboard-data", async () => {
    const client = getPreviewClient();
    if (!client) throw new Error("Sanity not configured");
    const data = await client.fetch<{
      settings: DashboardSettings | null;
      months: number;
      lastSync: string | null;
    }>(`{
      "settings": *[_id == "dmr-client-settings"][0]{clientName, dataSource, googleAdsCustomerId, dmrStartDate},
      "months": count(*[_type == "dmrMonthlyReport"]),
      "lastSync": *[_type == "dmrMonthlyReport" && defined(syncedAt)] | order(syncedAt desc)[0].syncedAt
    }`);
    if (!data.settings) throw new Error("DMR Report Settings missing (run npm run dmr:seed)");
    settings = data.settings;
    const source = settings.dataSource ?? "manual";
    return `${settings.clientName ?? "client"}: ${data.months} monthly reports, source ${source}` +
      (data.lastSync ? `, last Ads sync ${data.lastSync.slice(0, 10)}` : "");
  });
  return { result, settings };
}

export async function checkGoogleAds(settings: DashboardSettings | null): Promise<CheckResult> {
  const name = "google-ads";
  const syncOn = settings?.dataSource === "googleAds";
  if (!googleAdsConfigured()) {
    return syncOn
      ? fail(name, `dashboard is set to Google Ads sync but this deployment can't see ${missingGoogleAdsEnv().join(", ")}`)
      : skip(name, "no GOOGLE_ADS_* credentials; dashboard is on manual data");
  }
  const customerId = envCustomerId() || settings?.googleAdsCustomerId;
  if (!customerId) {
    return fail(name, "no customer id (set GOOGLE_ADS_CUSTOMER_ID or it in DMR Report Settings)");
  }
  if (syncOn) {
    return check(name, async () => {
      const client = getPreviewClient();
      if (!client) throw new Error("Sanity not configured");
      const result = await syncGoogleAds(client, settings).catch((err) => ({
        ok: false,
        at: new Date().toISOString(),
        message: err instanceof Error ? err.message.slice(0, 600) : "Google Ads sync failed",
      }));
      await recordSync(client, result);
      if (!result.ok) throw new Error(result.message);
      return result.message;
    });
  }
  return check(name, async () => {
    const rows = await googleAdsSearch<{
      customer?: { descriptiveName?: string };
      metrics?: { costMicros?: string; clicks?: string; conversions?: number };
    }>(
      customerId,
      "SELECT customer.descriptive_name, metrics.cost_micros, metrics.clicks, metrics.conversions " +
        "FROM customer WHERE segments.date DURING LAST_7_DAYS",
    );
    const row = rows[0];
    const spend = Number(row?.metrics?.costMicros ?? 0) / 1_000_000;
    return `${row?.customer?.descriptiveName ?? customerId}: $${spend.toFixed(2)} spend, ` +
      `${row?.metrics?.clicks ?? 0} clicks, ${Math.round(row?.metrics?.conversions ?? 0)} conversions (7d)`;
  });
}
