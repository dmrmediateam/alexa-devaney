/**
 * Every per-client value the portal needs, in one place. CLIENT: fill these in.
 *
 * This file belongs to the client repo: the portal sync (client-portal's
 * `tools/sync.mjs`) never overwrites it. Everything under
 * `sanity/dmr-dashboard/`, `lib/dmr/`, `app/api/dmr/` and the other managed
 * paths reads from here instead of hardcoding a client, so those files stay
 * identical across clients and can be updated from the template.
 */
export const DMR_CLIENT = {
  /** Shown in the Studio's top bar. */
  name: 'Alexa Devaney',
  /** sanity.io/manage project id. NEXT_PUBLIC_SANITY_PROJECT_ID wins when set. */
  projectId: 'yy80nmbb',
  dataset: 'production',
  /** Hosted Studio: https://<studioHost>.sanity.studio */
  studioHost: 'alexa-devaney',
  /** The live site, which hosts /api/dmr/*. SANITY_STUDIO_SITE_URL wins when set. */
  siteUrl: 'https://www.alexadevaney.com',
}

export const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || DMR_CLIENT.projectId
export const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || DMR_CLIENT.dataset
export const STUDIO_ORIGIN = `https://${DMR_CLIENT.studioHost}.sanity.studio`
