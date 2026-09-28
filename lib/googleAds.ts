/**
 * Minimal Google Ads API client for the DMR dashboard sync (server-side only).
 *
 * Plain REST rather than the `google-ads-api` package: the sync needs one
 * query, and the credentials are DMR-wide (one MCC, reused for every client),
 * so the only per-client input is the customer id stored in Report Settings.
 *
 *   GOOGLE_ADS_DEVELOPER_TOKEN     MCC → Tools → API Center (Basic access)
 *   GOOGLE_ADS_CLIENT_ID           Google Cloud OAuth client
 *   GOOGLE_ADS_CLIENT_SECRET       same OAuth client
 *   GOOGLE_ADS_REFRESH_TOKEN       DMR user with MCC access, scope .../auth/adwords
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID   DMR MCC id, digits only
 *   GOOGLE_ADS_API_VERSION         optional, e.g. v25. Google sunsets each
 *                                  version about a year after release, so
 *                                  bump this when the sync starts failing.
 */

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v25'

const REQUIRED = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
] as const

/** Names of the Google Ads env vars that are not set (empty when ready). */
export function missingGoogleAdsEnv(): string[] {
  return REQUIRED.filter((name) => !process.env[name])
}

const digits = (id: string) => id.replace(/\D/g, '')

async function accessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string }
  if (!res.ok || !json.access_token) {
    throw new Error(`Google OAuth token refresh failed (${res.status} ${json.error ?? ''})`.trim())
  }
  return json.access_token
}

export type CampaignMonth = {
  id: string
  name: string
  channel: string
  spend: number
  leads: number
}

type Row = {
  campaign?: { id?: string; name?: string; advertisingChannelType?: string }
  metrics?: { costMicros?: string; conversions?: number }
}

/**
 * Spend and leads per campaign for one month (`YYYY-MM-01`).
 *
 * Leads are the account's `conversions` column, i.e. the conversion actions
 * the account counts as primary, which is the same number the Ryze-built PDF
 * reports. Removed campaigns are included on purpose: if one spent money in
 * the month, leaving it out would understate spend. Rows with no spend and no
 * leads are dropped.
 */
export async function campaignsForMonth(customerId: string, month: string): Promise<CampaignMonth[]> {
  const token = await accessToken()
  const query = `
    SELECT campaign.id, campaign.name, campaign.advertising_channel_type,
           metrics.cost_micros, metrics.conversions
    FROM campaign
    WHERE segments.month = '${month}'`

  const res = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${digits(customerId)}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        'login-customer-id': digits(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    },
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Google Ads query failed (${res.status}): ${detail.slice(0, 500)}`)
  }

  const batches = (await res.json()) as { results?: Row[] }[]
  const byId = new Map<string, CampaignMonth>()
  for (const row of batches.flatMap((b) => b.results ?? [])) {
    const id = row.campaign?.id
    if (!id) continue
    const current = byId.get(id) ?? {
      id,
      name: row.campaign?.name ?? `Campaign ${id}`,
      channel: row.campaign?.advertisingChannelType ?? '',
      spend: 0,
      leads: 0,
    }
    current.spend += Number(row.metrics?.costMicros ?? 0) / 1e6
    current.leads += Number(row.metrics?.conversions ?? 0)
    byId.set(id, current)
  }

  return [...byId.values()]
    .filter((c) => c.spend > 0 || c.leads > 0)
    .map((c) => ({ ...c, spend: Math.round(c.spend * 100) / 100, leads: Math.round(c.leads) }))
    .sort((a, b) => b.spend - a.spend)
}
