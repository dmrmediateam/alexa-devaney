/**
 * Report data shapes + the ROI math from the DMR monthly PDF report.
 *
 * The math is deliberately a LOW estimate:
 *   value of one closing = avg home price × commission (one side) × agent split
 *   est. commission      = leads × close rate × value of one closing
 *   est. ROI             = (est. commission − (ad spend + fee)) ÷ (ad spend + fee)
 */

export type Campaign = {
  name: string
  subtitle?: string
  spend: number
  leads: number
}

export type MonthReport = {
  month: string // YYYY-MM-01
  campaigns: Campaign[]
  /** Optional override when the month total isn't the sum of campaigns (older months). */
  spendOverride?: number
  leadsOverride?: number
  footnote?: string
}

export type ClientSettings = {
  clientName: string
  market: string
  channels: string
  websiteLabel?: string
  avgHomePrice: number
  priceSource: string
  commissionRate: number
  agentSplit: number
  closeRate: number
  monthlyFee: number
  industryCpl: number
  /** How efficiently extra spend turns into leads (1 = linear, lower = faster diminishing returns). */
  spendElasticity?: number
  mediaBuyer?: string
  sprintSopUrl?: string
  scriptsUrl?: string
  propertyScriptUrl?: string
  dataSource: 'manual' | 'googleAds'
}

export function monthTotals(m: MonthReport) {
  const spend = m.spendOverride ?? m.campaigns.reduce((s, c) => s + c.spend, 0)
  const leads = m.leadsOverride ?? m.campaigns.reduce((s, c) => s + c.leads, 0)
  return { spend, leads, cpl: leads ? spend / leads : 0 }
}

export function computeDashboard(settings: ClientSettings, months: MonthReport[]) {
  const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month))
  const valuePerClose = settings.avgHomePrice * settings.commissionRate * settings.agentSplit
  const commissionFor = (leads: number) => leads * settings.closeRate * valuePerClose
  const roi = (commission: number, cost: number) => (cost ? (commission - cost) / cost : 0)

  const rows = sorted.map((m) => {
    const t = monthTotals(m)
    const commission = commissionFor(t.leads)
    const cost = t.spend + settings.monthlyFee
    return { ...m, ...t, commission, cost, roi: roi(commission, cost) }
  })

  const current = rows[rows.length - 1]
  const totalLeads = rows.reduce((s, r) => s + r.leads, 0)
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0)
  const totalFees = settings.monthlyFee * rows.length
  const totalCommission = commissionFor(totalLeads)
  const totalCost = totalSpend + totalFees

  return {
    rows,
    current,
    valuePerClose,
    launch: {
      firstMonth: rows[0]?.month,
      leads: totalLeads,
      spend: totalSpend,
      fees: totalFees,
      closings: totalLeads * settings.closeRate,
      commission: totalCommission,
      cost: totalCost,
      roi: roi(totalCommission, totalCost),
    },
    breakEvenLeads: current
      ? Math.ceil(current.cost / (settings.closeRate * valuePerClose))
      : 0,
    cplVsIndustry: current && settings.industryCpl
      ? 1 - current.cpl / settings.industryCpl
      : 0,
  }
}

export const usd = (n: number, digits = 0) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
export const pct = (n: number) => `${Math.round(n * 100)}%`
export const num = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })

export const monthLabel = (iso: string, style: 'long' | 'short' = 'long') =>
  new Date(`${iso.slice(0, 7)}-15T12:00:00Z`).toLocaleDateString('en-US', {
    month: style,
    ...(style === 'long' ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  })
