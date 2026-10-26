/**
 * Report data shapes + the ROI math.
 *
 * What the leads are worth comes from Google Ads for every month the sync
 * wrote conversion values for, $0 included: a synced month whose leads Ads
 * put no value on is worth $0, not an estimate. Months without synced values
 * (entered by hand, synced before v1.2.0) and accounts that have never
 * reported any conversion value use the DMR monthly PDF's deliberately LOW
 * estimate instead:
 *   lead value (Google Ads) = the month's Google Ads conversion value
 *   lead value (estimate)   = leads × close rate × value of one closing
 *     value of one closing  = avg home price × commission (one side) × agent split
 *   average lead value      = lead value ÷ leads
 *   est. ROI                = lead value (conversion value) ÷ ad spend
 *
 * ROI is conversion value over ad spend only, the same ratio as Google Ads'
 * "Conv. value / cost": 100% means the leads were worth what Google charged.
 * The DMR fee is left out of ROI; break-even and "invested to date" still
 * count it, so anything that has to know whether a month covered spend + fee
 * compares value with cost directly.
 */

/** Estimated ROI: conversion value ÷ ad spend (see above). */
export const roiOf = (value: number, adSpend: number) => (adSpend > 0 ? value / adSpend : 0)

/** Where a month's lead value came from. */
export type ValueSource = 'googleAds' | 'estimate'

export type Campaign = {
  name: string
  subtitle?: string
  spend: number
  leads: number
  /** Google Ads conversion value (written by the sync). */
  value?: number
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
  /** YYYY-MM-DD. Months before this one are not DMR's and are left out of the report. */
  dmrStartDate?: string
}

/** First day of the month DMR started, or null when no start date is set. */
export function startMonth(dmrStartDate?: string | null): string | null {
  return dmrStartDate ? `${dmrStartDate.slice(0, 7)}-01` : null
}

/** How far into a month we are: `day` equals `days` for any month that's over. */
export function monthProgress(month: string, now = new Date()) {
  const y = Number(month.slice(0, 4))
  const m = Number(month.slice(5, 7)) - 1
  const days = new Date(y, m + 1, 0).getDate()
  const inProgress = now.getFullYear() === y && now.getMonth() === m
  return { day: inProgress ? now.getDate() : days, days }
}

export function monthTotals(m: MonthReport) {
  const spend = m.spendOverride ?? m.campaigns.reduce((s, c) => s + c.spend, 0)
  const leads = m.leadsOverride ?? m.campaigns.reduce((s, c) => s + c.leads, 0)
  /** Google Ads conversion value, $0 included; null when no campaign row carries one (manual or pre-v1.2.0 months). */
  const adsValue = m.campaigns.some((c) => c.value != null) ? m.campaigns.reduce((s, c) => s + (c.value ?? 0), 0) : null
  return { spend, leads, cpl: leads ? spend / leads : 0, adsValue }
}

/**
 * Whether the Google Ads account reports conversion values at all. If no
 * month ever had any, values aren't set up in Ads, and $0 everywhere would
 * mean "not tracked", not "worthless": every month keeps the estimate.
 * Pass every month, not just the ones up to the selected month, so the
 * month picker can't flip it.
 */
export const usesAdsValues = (months: MonthReport[]) => months.some((m) => (monthTotals(m).adsValue ?? 0) > 0)

export function computeDashboard(settings: ClientSettings, months: MonthReport[], adsValuesInUse = usesAdsValues(months)) {
  const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month))
  const valuePerClose = settings.avgHomePrice * settings.commissionRate * settings.agentSplit
  /** What one lead is worth when Google Ads has no conversion value to go on. */
  const estimatedLeadValue = settings.closeRate * valuePerClose

  const rows = sorted.map((m) => {
    const t = monthTotals(m)
    const valueSource: ValueSource = adsValuesInUse && t.adsValue != null ? 'googleAds' : 'estimate'
    const value = valueSource === 'googleAds' ? t.adsValue ?? 0 : t.leads * estimatedLeadValue
    const cost = t.spend + settings.monthlyFee
    return {
      ...m,
      ...t,
      value,
      valueSource,
      avgLeadValue: t.leads ? value / t.leads : estimatedLeadValue,
      cost,
      roi: roiOf(value, t.spend),
    }
  })

  const current = rows[rows.length - 1]
  const totalLeads = rows.reduce((s, r) => s + r.leads, 0)
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0)
  const totalFees = settings.monthlyFee * rows.length
  const totalValue = rows.reduce((s, r) => s + r.value, 0)
  const totalCost = totalSpend + totalFees
  const adsMonths = rows.filter((r) => r.valueSource === 'googleAds').length
  const launchLeadValue = totalLeads ? totalValue / totalLeads : estimatedLeadValue
  /**
   * The value the planner and break-even put on one lead: the selected month's
   * average when it has leads, otherwise the since-launch average.
   */
  const leadValue = current?.leads ? current.avgLeadValue : launchLeadValue

  return {
    rows,
    current,
    valuePerClose,
    estimatedLeadValue,
    leadValue,
    launch: {
      firstMonth: rows[0]?.month,
      leads: totalLeads,
      spend: totalSpend,
      fees: totalFees,
      value: totalValue,
      avgLeadValue: launchLeadValue,
      /** How many months' value came from Google Ads (the rest are estimates). */
      adsMonths,
      cost: totalCost,
      roi: roiOf(totalValue, totalSpend),
    },
    breakEvenLeads: current && leadValue ? Math.ceil(current.cost / leadValue) : 0,
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
