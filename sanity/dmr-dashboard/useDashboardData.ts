import { useCallback, useEffect, useState } from 'react'
import { useClient } from 'sanity'
import type { SyncResult } from './googleAdsSync'
import { startMonth, type ClientSettings, type MonthReport } from './math'
import { sampleMonths, sampleSettings } from './sampleData'

const QUERY = `{
  "settings": *[_id == "dmr-client-settings"][0],
  "months": *[_type == "dmrMonthlyReport" && defined(month)] | order(month asc)[0...24]{
    month, campaigns[]{name, subtitle, spend, leads, value}, spendOverride, leadsOverride, footnote
  },
  "leadMonths": *[_type == "dmrLead" && defined(month)].month
}`

/** From the saved settings, even while the report shows sample data. */
export type SyncInfo = { enabled: boolean; lastSync?: SyncResult }

type State = (
  | { status: 'loading' }
  | { status: 'ready'; settings: ClientSettings; months: MonthReport[]; isSample: boolean; sync: SyncInfo }
) & { reload: () => void }

/**
 * Reads the client's report settings + monthly reports from their own Sanity
 * dataset. Falls back to the sample report until real data exists.
 */
export function useDashboardData(): State {
  const client = useClient({ apiVersion: '2025-01-01' })
  const [state, setState] = useState<DistributiveOmit<State, 'reload'>>({ status: 'loading' })
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let alive = true
    client
      .fetch<{ settings: (Partial<ClientSettings> & RawSyncFields) | null; months: MonthReport[]; leadMonths: string[] }>(QUERY)
      .then(({ settings, months, leadMonths }) => {
        if (!alive) return
        // Months before DMR took over are someone else's ads: never report them.
        const start = startMonth(settings?.dmrStartDate)
        months = withLoggedLeads((months ?? []).filter((m) => !start || m.month >= start), leadMonths ?? [])
        const sync: SyncInfo = { enabled: settings?.dataSource === 'googleAds', lastSync: settings?.lastSync ?? undefined }
        const hasReal = Boolean(settings?.avgHomePrice && months?.length)
        setState(
          hasReal
            ? {
                status: 'ready',
                settings: { ...sampleSettings, ...stripNulls(settings!) },
                months: months.map((m) => ({ ...m, campaigns: m.campaigns ?? [] })),
                isSample: false,
                sync,
              }
            : { status: 'ready', settings: sampleSettings, months: sampleMonths, isSample: true, sync },
        )
      })
      .catch(() => {
        if (alive) setState({ status: 'ready', settings: sampleSettings, months: sampleMonths, isSample: true, sync: { enabled: false } })
      })
    return () => {
      alive = false
    }
  }, [client, version])

  return { ...state, reload }
}

/**
 * A month's lead total is the number of leads the site actually logged
 * (dmrLead) whenever there are any: Google Ads conversions only count the
 * actions being tracked, often qualified leads alone. Campaign rows keep the
 * Ads conversions, so the footnote says why the two differ. A hand-entered
 * leadsOverride still wins.
 */
function withLoggedLeads(months: MonthReport[], leadMonths: string[]): MonthReport[] {
  const counts = new Map<string, number>()
  for (const m of leadMonths) counts.set(m.slice(0, 7), (counts.get(m.slice(0, 7)) ?? 0) + 1)
  return months.map((m) => {
    const logged = counts.get(m.month.slice(0, 7))
    if (!logged || m.leadsOverride != null) return m
    const conversions = (m.campaigns ?? []).reduce((sum, c) => sum + (c.leads ?? 0), 0)
    return {
      ...m,
      leadsOverride: logged,
      footnote: m.footnote ?? `Lead total is every lead the site received (${logged}). Campaign rows show Google Ads conversions (${conversions}).`,
    }
  })
}

type RawSyncFields = { dataSource?: string; lastSync?: SyncResult | null }
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

function stripNulls<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)) as Partial<T>
}
