import type { ClientSettings, MonthReport } from './math'

/**
 * Fictional sample data mirroring the "DMR Sample Client Report" PDF (Aug 2026).
 * Shown with a "Sample data" badge until real reports exist in the dataset
 * (or the Google Ads sync is connected — see DMR-CLIENT-DASHBOARD-PLAN.md).
 */
export const sampleSettings: ClientSettings = {
  clientName: 'Sample Client',
  market: 'Your Market, FL',
  channels: 'Google Search + Performance Max + Local Services Ads',
  websiteLabel: 'yourwebsite.com',
  avgHomePrice: 369815,
  priceSource: 'Redfin median sale price, your market, Jul 2026',
  commissionRate: 0.03,
  agentSplit: 0.9,
  closeRate: 0.01,
  monthlyFee: 650,
  industryCpl: 103,
  spendElasticity: 0.7,
  mediaBuyer: 'your DMR media buyer',
  sprintSopUrl: 'https://app.clickup.com/9011606292/docs/8cj4crm-10651/8cj4crm-14651',
  scriptsUrl: 'https://docs.google.com/document/d/1SJhk_ixJmNExBfiiqW3vp_WklqjCE6RoV4gTqvWXoTc/edit',
  propertyScriptUrl: 'https://docs.google.com/document/d/1B7wn3HdhZiOb_LgaZSE_DKZKxD5NVU1L-xYSamg2CO8/edit',
  dataSource: 'manual',
}

const history = (month: string, leads: number, spend: number): MonthReport => ({
  month,
  campaigns: [],
  leadsOverride: leads,
  spendOverride: spend,
})

export const sampleMonths: MonthReport[] = [
  history('2026-04-01', 7, 587),
  history('2026-05-01', 144, 2755),
  history('2026-06-01', 160, 2414),
  history('2026-07-01', 157, 3088),
  {
    month: '2026-08-01',
    campaigns: [
      { name: 'Performance Max', subtitle: 'vacation-rental buyer forms', spend: 1517, leads: 152 },
      { name: 'Search · Buyers', subtitle: 'homes for sale', spend: 457, leads: 1 },
      { name: 'Local Services Ads', subtitle: 'phone + message leads', spend: 437, leads: 5 },
      { name: 'Search · Sellers', subtitle: 'home value', spend: 42, leads: 1 },
    ],
    footnote: 'PMax leads are form submits. One LSA "get directions" click was not counted.',
  },
]
