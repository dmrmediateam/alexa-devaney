import type { ClientSettings } from './math'

/**
 * Ad spend projection. Leads scale with budget at diminishing returns:
 *   leads(s) = L0 × (s / S0)^e     (e = settings.spendElasticity, default 0.7)
 * anchored on the selected month's actual spend (S0) and leads (L0). Everything else
 * reuses the report's low-estimate math (close rate × value of one closing).
 */

export const STEP_PCT = 0.2 // DMR guideline: move budgets ~20% per month so bidding can re-learn
const DEFAULT_ELASTICITY = 0.7

export type Baseline = { spend: number; leads: number }

export function makePlanner(settings: ClientSettings, base: Baseline) {
  const e = settings.spendElasticity ?? DEFAULT_ELASTICITY
  const valuePerClose = settings.avgHomePrice * settings.commissionRate * settings.agentSplit
  const valuePerLead = settings.closeRate * valuePerClose
  const fee = settings.monthlyFee

  const leadsAt = (s: number) => (s <= 0 || base.spend <= 0 ? 0 : base.leads * (s / base.spend) ** e)
  const project = (s: number) => {
    const leads = leadsAt(s)
    const commission = leads * valuePerLead
    const cost = s + fee
    return {
      spend: s,
      leads,
      cpl: leads ? s / leads : 0,
      /** Cost of the next lead at this budget (derivative of spend w.r.t. leads). */
      marginalCpl: leads ? s / (e * leads) : 0,
      commission,
      cost,
      roi: cost ? (commission - cost) / cost : 0,
      closings: leads * settings.closeRate,
    }
  }

  // Range for the dial: 25% to 300% of current spend, rounded to $50.
  const min = roundTo(Math.max(250, base.spend * 0.25), 50)
  const max = roundTo(Math.max(min + 500, base.spend * 3), 50)

  // Lowest monthly spend where estimated commission covers spend + fee.
  let breakEven: number | null = null
  for (let s = 50; s <= max; s += 25) {
    if (project(s).roi >= 0) {
      breakEven = s
      break
    }
  }

  // Where the next lead would cost more than the industry average.
  let diminishingAt: number | null = null
  for (let s = base.spend; s <= max; s += 50) {
    if (project(s).marginalCpl > settings.industryCpl) {
      diminishingAt = s
      break
    }
  }

  // Recommendation: one ~20% step in the direction the numbers support.
  const current = project(base.spend)
  const up = project(base.spend * (1 + STEP_PCT))
  let recommendation: { spend: number; action: 'increase' | 'hold' | 'decrease'; reason: string }
  if (current.roi < 0) {
    recommendation = {
      spend: roundTo(base.spend * (1 - STEP_PCT), 50),
      action: 'decrease',
      reason: 'This month’s estimated commission doesn’t cover spend + fee. Trim one step while we fix cost per lead.',
    }
  } else if (up.marginalCpl <= settings.industryCpl && up.roi >= 1) {
    recommendation = {
      spend: roundTo(base.spend * (1 + STEP_PCT), 50),
      action: 'increase',
      reason: `Each extra lead would still cost about ${usdShort(up.marginalCpl)}, well under the ${usdShort(settings.industryCpl)} industry average. ROI % dips slightly as you scale, but total estimated commission grows.`,
    }
  } else {
    recommendation = {
      spend: roundTo(base.spend, 50),
      action: 'hold',
      reason: 'Extra leads are getting expensive at this budget. Hold spend and tighten the weaker campaigns first.',
    }
  }

  return { e, fee, valuePerLead, min, max, breakEven, diminishingAt, current, project, recommendation }
}

export const roundTo = (n: number, step: number) => Math.round(n / step) * step
const usdShort = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
