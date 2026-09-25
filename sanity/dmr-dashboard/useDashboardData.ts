import { useEffect, useState } from 'react'
import { useClient } from 'sanity'
import type { ClientSettings, MonthReport } from './math'
import { sampleMonths, sampleSettings } from './sampleData'

const QUERY = `{
  "settings": *[_id == "dmr-client-settings"][0],
  "months": *[_type == "dmrMonthlyReport" && defined(month)] | order(month asc)[0...24]{
    month, campaigns[]{name, subtitle, spend, leads}, spendOverride, leadsOverride, footnote
  }
}`

type State =
  | { status: 'loading' }
  | { status: 'ready'; settings: ClientSettings; months: MonthReport[]; isSample: boolean }

/**
 * Reads the client's report settings + monthly reports from their own Sanity
 * dataset. Falls back to the sample report until real data exists.
 */
export function useDashboardData(): State {
  const client = useClient({ apiVersion: '2025-01-01' })
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    client
      .fetch<{ settings: Partial<ClientSettings> | null; months: MonthReport[] }>(QUERY)
      .then(({ settings, months }) => {
        if (!alive) return
        const hasReal = Boolean(settings?.avgHomePrice && months?.length)
        setState(
          hasReal
            ? {
                status: 'ready',
                settings: { ...sampleSettings, ...stripNulls(settings!) },
                months: months.map((m) => ({ ...m, campaigns: m.campaigns ?? [] })),
                isSample: false,
              }
            : { status: 'ready', settings: sampleSettings, months: sampleMonths, isSample: true },
        )
      })
      .catch(() => {
        if (alive) setState({ status: 'ready', settings: sampleSettings, months: sampleMonths, isSample: true })
      })
    return () => {
      alive = false
    }
  }, [client])

  return state
}

function stripNulls<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)) as Partial<T>
}
