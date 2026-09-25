import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Where the dashboard reads from. Today DMR fills these in by hand each month
 * (same numbers as the PDF). Once the Google Ads sync is live it writes the
 * `campaigns` array automatically.
 */

export const dmrClientSettings = defineType({
  name: 'dmrClientSettings',
  title: 'DMR · Report Settings',
  type: 'document',
  groups: [
    { name: 'client', title: 'Client', default: true },
    { name: 'math', title: 'ROI math' },
    { name: 'links', title: 'Playbook links' },
    { name: 'data', title: 'Data source' },
  ],
  fields: [
    defineField({ name: 'clientName', title: 'Client name', type: 'string', group: 'client', validation: (r) => r.required() }),
    defineField({ name: 'market', title: 'Market', type: 'string', group: 'client', description: 'e.g. "St. Petersburg, FL"' }),
    defineField({ name: 'channels', title: 'Channels', type: 'string', group: 'client', description: 'e.g. "Google Search + Performance Max"' }),
    defineField({ name: 'websiteLabel', title: 'Website label', type: 'string', group: 'client' }),
    defineField({ name: 'mediaBuyer', title: 'Media buyer name', type: 'string', group: 'client' }),

    defineField({ name: 'avgHomePrice', title: 'Average home price', type: 'number', group: 'math', validation: (r) => r.required().positive() }),
    defineField({ name: 'priceSource', title: 'Price source', type: 'string', group: 'math', initialValue: 'Redfin median sale price' }),
    defineField({ name: 'commissionRate', title: 'Commission (one side)', type: 'number', group: 'math', initialValue: 0.03, description: '0.03 = 3%' }),
    defineField({ name: 'agentSplit', title: 'Agent split after brokerage', type: 'number', group: 'math', initialValue: 0.9, description: '0.9 = 90%' }),
    defineField({ name: 'closeRate', title: 'Lead-to-close rate', type: 'number', group: 'math', initialValue: 0.01, description: '0.01 = 1% (low estimate on purpose)' }),
    defineField({ name: 'monthlyFee', title: 'DMR monthly fee', type: 'number', group: 'math', initialValue: 650 }),
    defineField({ name: 'industryCpl', title: 'Industry avg cost per lead', type: 'number', group: 'math', initialValue: 103, description: 'LocaliQ/WordStream real estate benchmark' }),
    defineField({
      name: 'spendElasticity',
      title: 'Spend efficiency (planner)',
      type: 'number',
      group: 'math',
      initialValue: 0.7,
      description: 'How leads scale with budget in the Ad spend planner. 0.7 = doubling spend gives ~1.6× the leads. Lower it for small markets.',
      validation: (r) => r.min(0.3).max(1),
    }),

    defineField({ name: 'sprintSopUrl', title: '7-Day Sprint SOP URL', type: 'url', group: 'links' }),
    defineField({ name: 'scriptsUrl', title: 'Scripts, texts & emails URL', type: 'url', group: 'links' }),
    defineField({ name: 'propertyScriptUrl', title: 'Property inquiry script URL', type: 'url', group: 'links' }),

    defineField({
      name: 'dataSource',
      title: 'Data source',
      type: 'string',
      group: 'data',
      initialValue: 'manual',
      options: { list: [
        { title: 'Manual (entered monthly)', value: 'manual' },
        { title: 'Google Ads sync', value: 'googleAds' },
      ], layout: 'radio' },
    }),
    defineField({
      name: 'googleAdsCustomerId',
      title: 'Google Ads customer ID',
      type: 'string',
      group: 'data',
      description: '10 digits, no dashes. Used by the sync job — not a secret.',
      validation: (r) => r.regex(/^\d{10}$/, { name: '10 digits' }),
    }),
  ],
  preview: { select: { title: 'clientName', subtitle: 'market' } },
})

export const dmrMonthlyReport = defineType({
  name: 'dmrMonthlyReport',
  title: 'DMR · Monthly Report',
  type: 'document',
  fields: [
    defineField({ name: 'month', title: 'Month', type: 'date', description: 'Use the 1st of the month', validation: (r) => r.required() }),
    defineField({
      name: 'campaigns',
      title: 'Campaigns',
      type: 'array',
      of: [defineArrayMember({
        type: 'object',
        name: 'campaign',
        fields: [
          defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'subtitle', type: 'string' }),
          defineField({ name: 'spend', type: 'number', validation: (r) => r.min(0) }),
          defineField({ name: 'leads', type: 'number', validation: (r) => r.min(0).integer() }),
          defineField({ name: 'googleAdsCampaignId', title: 'Google Ads campaign ID', type: 'string', readOnly: true }),
        ],
        preview: { select: { title: 'name', leads: 'leads', spend: 'spend' },
          prepare: ({ title, leads, spend }) => ({ title, subtitle: `${leads ?? 0} leads · $${spend ?? 0}` }) },
      })],
    }),
    defineField({ name: 'spendOverride', title: 'Total spend override', type: 'number', description: 'Only for months without a campaign breakdown' }),
    defineField({ name: 'leadsOverride', title: 'Total leads override', type: 'number' }),
    defineField({ name: 'footnote', title: 'Footnote', type: 'string' }),
    defineField({ name: 'syncedAt', title: 'Last synced from Google Ads', type: 'datetime', readOnly: true }),
  ],
  orderings: [{ title: 'Month, newest', name: 'monthDesc', by: [{ field: 'month', direction: 'desc' }] }],
  preview: { select: { title: 'month' }, prepare: ({ title }) => ({ title: title ? `Report · ${title.slice(0, 7)}` : 'Report' }) },
})

/**
 * Created from the Ad spend planner's "Adjust ad spend" button. The website's
 * /api/dmr/budget-request route only emails DMR for a request that exists here,
 * so creating one requires a signed-in Studio user.
 */
export const dmrBudgetRequest = defineType({
  name: 'dmrBudgetRequest',
  title: 'DMR · Budget Request',
  type: 'document',
  readOnly: ({ currentUser }) => !currentUser?.roles?.some((r) => r.name === 'administrator'),
  fields: [
    defineField({ name: 'clientName', title: 'Client', type: 'string' }),
    defineField({ name: 'currentSpend', title: 'Current monthly spend', type: 'number' }),
    defineField({ name: 'requestedSpend', title: 'Requested monthly spend', type: 'number' }),
    defineField({ name: 'baselineMonth', title: 'Projection based on', type: 'date' }),
    defineField({
      name: 'projection',
      title: 'Dashboard projection',
      type: 'object',
      fields: [
        defineField({ name: 'leads', type: 'number' }),
        defineField({ name: 'cpl', title: 'Cost per lead', type: 'number' }),
        defineField({ name: 'roi', title: 'Est. ROI (0.4 = 40%)', type: 'number' }),
        defineField({ name: 'commission', title: 'Est. commission', type: 'number' }),
      ],
    }),
    defineField({ name: 'note', title: 'Note from client', type: 'text', rows: 3 }),
    defineField({ name: 'requestedBy', title: 'Requested by', type: 'string' }),
    defineField({ name: 'requestedByEmail', title: 'Requester email', type: 'string' }),
    defineField({
      name: 'status',
      type: 'string',
      initialValue: 'requested',
      options: { list: ['requested', 'confirmed', 'declined'], layout: 'radio' },
    }),
    defineField({ name: 'emailedAt', title: 'Emailed to DMR at', type: 'datetime', readOnly: true }),
  ],
  orderings: [{ title: 'Newest', name: 'newest', by: [{ field: '_createdAt', direction: 'desc' }] }],
  preview: {
    select: { from: 'currentSpend', to: 'requestedSpend', status: 'status', by: 'requestedBy' },
    prepare: ({ from, to, status, by }) => ({
      title: `$${Math.round(from ?? 0).toLocaleString()} → $${Math.round(to ?? 0).toLocaleString()}/mo`,
      subtitle: [status, by].filter(Boolean).join(' · '),
    }),
  },
})

export const dmrSchemaTypes = [dmrClientSettings, dmrMonthlyReport, dmrBudgetRequest]
