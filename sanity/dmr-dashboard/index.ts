/**
 * DMR Client Dashboard — drop-in for any DMR client's Sanity Studio.
 *
 *   import { dmrDashboard, dmrSchemaTypes, dmrStructureItems } from './sanity/dmr-dashboard'
 *   plugins: [dmrDashboard(), structureTool(...)]   // first = landing page
 *   schema: { types: [...schemaTypes, ...dmrSchemaTypes] }
 *
 * See DMR-CLIENT-DASHBOARD-PLAN.md for the Google Ads hookup.
 */
import { definePlugin } from 'sanity'
import type { StructureBuilder } from 'sanity/structure'
import { DmrDashboard } from './DmrDashboard'
import { DmrIcon } from './DmrIcon'

export { dmrSchemaTypes } from './schemas'
export { dmrTheme } from './theme'
export { DmrIcon } from './DmrIcon'

/** Full-height Studio tool (not a widget grid) so it can mirror the Structure tool's panes. */
export const dmrDashboard = definePlugin({
  name: 'dmr-dashboard',
  tools: [{ name: 'dashboard', title: 'Dashboard', icon: DmrIcon, component: DmrDashboard }],
})

/** Desk items so the DMR team can enter/edit monthly numbers. */
export const dmrStructureItems = (S: StructureBuilder) => [
  S.listItem()
    .title('DMR Reports')
    .icon(DmrIcon)
    .child(
      S.list()
        .title('DMR Reports')
        .items([
          S.listItem()
            .title('Report Settings')
            .child(S.editor().id('dmr-client-settings').schemaType('dmrClientSettings').documentId('dmr-client-settings')),
          S.listItem()
            .title('Monthly Reports')
            .child(S.documentTypeList('dmrMonthlyReport').title('Monthly Reports').defaultOrdering([{ field: 'month', direction: 'desc' }])),
          S.listItem()
            .title('Budget Requests')
            .child(S.documentTypeList('dmrBudgetRequest').title('Budget Requests').defaultOrdering([{ field: '_createdAt', direction: 'desc' }])),
        ]),
    ),
]
