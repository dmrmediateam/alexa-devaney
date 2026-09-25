import { defineCliConfig } from 'sanity/cli'

/**
 * `studioHost` is the hosted Studio address: https://alexa-devaney.sanity.studio
 * Deploy with `npm run sanity:deploy` (pushing code does not update it).
 */
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'yy80nmbb',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  },
  studioHost: 'alexa-devaney',
  // Auto-updates keep the hosted Studio on the latest Sanity without a
  // redeploy. Left off because the version check crashes the build on this
  // dependency set; turn it back on once that is fixed upstream.
  deployment: {
    // Pinned so a deploy never prompts for the application id.
    appId: 'w5jo3vblg0fcngyg779btk6s',
    autoUpdates: false,
  },
})
