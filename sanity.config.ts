import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { dmrDashboard, dmrSchemaTypes, dmrStructureItems, dmrTheme, DmrIcon } from './sanity/dmr-dashboard'

/**
 * Sanity Studio for Alexa Devaney.
 *
 * This site keeps its content in `content/site.ts`, not in Sanity. The Studio
 * exists for one job: the DMR client dashboard (reporting + the ad spend
 * planner), so the only document types are the DMR ones. If site content ever
 * moves into Sanity, add those schemas alongside `dmrSchemaTypes`.
 *
 * `dmrDashboard()` is listed first, which makes the dashboard the landing
 * screen after sign-in.
 */
export default defineConfig({
  name: 'default',
  title: 'Alexa Devaney',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'yy80nmbb',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  icon: DmrIcon,
  theme: dmrTheme,

  plugins: [
    dmrDashboard(),
    structureTool({
      structure: (S) => S.list().title('Content').items([...dmrStructureItems(S)]),
    }),
  ],

  schema: { types: [...dmrSchemaTypes] },
})
