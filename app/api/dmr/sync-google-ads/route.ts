import { NextResponse } from 'next/server'
import { getPreviewClient } from '@/lib/client'
import { campaignsForMonth, missingGoogleAdsEnv } from '@/lib/googleAds'

/**
 * Pulls this client's Google Ads spend and leads into the DMR dashboard.
 *
 * The Studio never talks to Google. This route (run daily by Vercel Cron, see
 * vercel.json) reads Google Ads through DMR's MCC and writes the campaigns
 * into `dmrMonthlyReport` docs, which the dashboard already reads.
 *
 * - Runs only when Report Settings → Data source is "Google Ads sync" and a
 *   customer id is set, so manual clients are never overwritten.
 * - Syncs the current and previous month (the previous one keeps settling
 *   for a few days after it closes). `?month=YYYY-MM` syncs one month, for
 *   backfills.
 * - Updates an existing report for that month if there is one, otherwise
 *   creates `dmr-report-YYYY-MM`, so re-runs never duplicate a month. Writes
 *   only `campaigns` and `syncedAt`: a footnote DMR typed stays, and so does a
 *   campaign subtitle someone edited by hand.
 *
 * Unlike /api/warm this route writes data, so it needs the CRON_SECRET bearer
 * token, which Vercel Cron sends automatically when the variable is set.
 */
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type Settings = { dataSource?: string; googleAdsCustomerId?: string }
type StoredCampaign = { _key?: string; googleAdsCampaignId?: string; subtitle?: string }

const CHANNEL_LABELS: Record<string, string> = {
  SEARCH: 'Google Search',
  PERFORMANCE_MAX: 'Performance Max',
  LOCAL_SERVICES: 'Local Services Ads',
  DISPLAY: 'Display',
  VIDEO: 'YouTube',
  DEMAND_GEN: 'Demand Gen',
}

function monthStart(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function monthsToSync(param: string | null): string[] | null {
  if (param) return /^\d{4}-(0[1-9]|1[0-2])$/.test(param) ? [`${param}-01`] : null
  const now = new Date()
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  return [monthStart(previous), monthStart(now)]
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[DMR sync] CRON_SECRET is not set')
    return NextResponse.json({ error: 'Sync is not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
  }

  const months = monthsToSync(new URL(request.url).searchParams.get('month'))
  if (!months) return NextResponse.json({ error: 'month must be YYYY-MM' }, { status: 400 })

  const client = getPreviewClient()
  if (!client || !process.env.SANITY_API_TOKEN) {
    console.error('[DMR sync] Sanity is not configured (SANITY_API_TOKEN)')
    return NextResponse.json({ error: 'Dashboard is not configured' }, { status: 503 })
  }

  const settings = await client.fetch<Settings | null>(
    `*[_id == "dmr-client-settings"][0]{dataSource, googleAdsCustomerId}`,
  )
  if (settings?.dataSource !== 'googleAds' || !settings.googleAdsCustomerId) {
    return NextResponse.json({ synced: [], skipped: 'Data source is not "Google Ads sync"' })
  }

  const missing = missingGoogleAdsEnv()
  if (missing.length) {
    console.error('[DMR sync] missing env:', missing.join(', '))
    return NextResponse.json({ error: 'Google Ads is not configured', missing }, { status: 503 })
  }

  const synced: { month: string; id: string; campaigns: number; spend: number; leads: number }[] = []
  try {
    for (const month of months) {
      const campaigns = await campaignsForMonth(settings.googleAdsCustomerId, month)
      const existing = await client.fetch<{ _id: string; campaigns?: StoredCampaign[] } | null>(
        `*[_type == "dmrMonthlyReport" && month == $month && !(_id in path("drafts.**"))]
          | order(_updatedAt desc)[0]{_id, campaigns}`,
        { month },
      )
      // Nothing spent and nothing on file yet: don't create an empty month.
      if (!existing && campaigns.length === 0) continue

      const subtitles = new Map(
        (existing?.campaigns ?? [])
          .filter((c) => c.googleAdsCampaignId && c.subtitle)
          .map((c) => [c.googleAdsCampaignId!, c.subtitle!]),
      )
      const docCampaigns = campaigns.map((c) => ({
        _key: `gads-${c.id}`,
        _type: 'campaign',
        name: c.name,
        subtitle: subtitles.get(c.id) ?? CHANNEL_LABELS[c.channel] ?? '',
        spend: c.spend,
        leads: c.leads,
        googleAdsCampaignId: c.id,
      }))

      const id = existing?._id ?? `dmr-report-${month.slice(0, 7)}`
      await client
        .transaction()
        .createIfNotExists({ _id: id, _type: 'dmrMonthlyReport', month })
        .patch(id, (p) => p.set({ campaigns: docCampaigns, syncedAt: new Date().toISOString() }))
        .commit()

      synced.push({
        month: month.slice(0, 7),
        id,
        campaigns: docCampaigns.length,
        spend: Math.round(campaigns.reduce((s, c) => s + c.spend, 0) * 100) / 100,
        leads: campaigns.reduce((s, c) => s + c.leads, 0),
      })
    }
  } catch (error) {
    console.error('[DMR sync] failed', { error: String(error) })
    return NextResponse.json({ error: 'Sync failed', synced }, { status: 502 })
  }

  return NextResponse.json({ synced })
}
