/**
 * Writes the client's DMR dashboard settings into Sanity (SOP Step 5).
 *
 *   node scripts/dmr-seed-settings.mjs
 *
 * Reads NEXT_PUBLIC_SANITY_PROJECT_ID / SANITY_API_TOKEN from .env.local.
 * Safe to re-run: it replaces the single `dmr-client-settings` document, which
 * is the id the dashboard queries for.
 *
 * Monthly numbers are NOT seeded here. Those are real reported figures and
 * belong in the Studio (DMR Reports → Monthly Reports) or, later, the Google
 * Ads sync. The dashboard shows sample data until at least one month exists.
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    }),
)

if (!env.SANITY_API_TOKEN) {
  console.error('SANITY_API_TOKEN is missing from .env.local')
  process.exit(1)
}

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'yy80nmbb',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: env.SANITY_API_TOKEN,
  useCdn: false,
})

/*
 * Sources, so the next person can check rather than trust:
 *  - name, market, phone, brokerage, price band: Alexa's ClickUp client record
 *    (Active Clients → Alexa Devaney, Sep 2026)
 *  - ROI constants and playbook links: DMR defaults from the dashboard SOP
 *  - monthlyFee $650 confirmed by DMR, Sep 2026
 *  - left empty on purpose: channels, mediaBuyer, googleAdsCustomerId. Her
 *    campaigns are still being set up (confirmed Sep 2026), so there is
 *    nothing true to put there yet; guessing would print fiction on a
 *    client-facing report. Fill them in the Studio once the ads are live.
 */
const settings = {
  _id: 'dmr-client-settings',
  _type: 'dmrClientSettings',
  clientName: 'Alexa Devaney',
  market: 'North County San Diego, CA',
  websiteLabel: 'alexadevaney.com',

  /*
   * She reports a typical local sale price of $1.5M-$3M. This dashboard is a
   * deliberately low estimate, so it takes the bottom of her own range, not
   * the midpoint: one closing = $1.5M x 3% x 90% = $40,500 in commission.
   */
  avgHomePrice: 1500000,
  priceSource:
    'Client-stated typical sale price, North County San Diego (low end of $1.5M-$3M range), Sep 2026',

  commissionRate: 0.03,
  agentSplit: 0.9,
  closeRate: 0.01,
  monthlyFee: 650,
  industryCpl: 103,
  spendElasticity: 0.7,

  sprintSopUrl: 'https://app.clickup.com/9011606292/docs/8cj4crm-10651/8cj4crm-14651',
  scriptsUrl:
    'https://docs.google.com/document/d/1SJhk_ixJmNExBfiiqW3vp_WklqjCE6RoV4gTqvWXoTc/edit',
  propertyScriptUrl:
    'https://docs.google.com/document/d/1B7wn3HdhZiOb_LgaZSE_DKZKxD5NVU1L-xYSamg2CO8/edit',

  dataSource: 'manual',
}

await client.createOrReplace(settings)

const saved = await client.fetch(
  '*[_id == "dmr-client-settings"][0]{clientName, market, websiteLabel, avgHomePrice, priceSource, monthlyFee, closeRate, commissionRate, agentSplit, industryCpl}',
)
const months = await client.fetch('count(*[_type == "dmrMonthlyReport"])')

console.log('Report settings saved:\n', JSON.stringify(saved, null, 1))
console.log(`\nMonthly reports in the dataset: ${months}`)
if (months === 0) {
  console.log('The dashboard will show the "Sample data" badge until one is added.')
}
