import { defineCliConfig } from 'sanity/cli'
import { DMR_CLIENT, SANITY_DATASET, SANITY_PROJECT_ID } from './sanity/dmr-client'

/**
 * `studioHost` is the hosted Studio address: https://alexa-devaney.sanity.studio
 * Deploy with `npm run sanity:deploy` (pushing code does not update it).
 */
export default defineCliConfig({
  api: {
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
  },
  studioHost: DMR_CLIENT.studioHost,
  // Auto-updates keep the hosted Studio on the latest Sanity without a
  // redeploy. Left off because the version check crashes the build on this
  // dependency set; turn it back on once that is fixed upstream.
  deployment: {
    // Pinned so a deploy never prompts for the application id.
    appId: 'w5jo3vblg0fcngyg779btk6s',
    autoUpdates: false,
  },
})
