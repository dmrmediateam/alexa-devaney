import { createClient, type SanityClient } from '@sanity/client'

/**
 * Sanity clients for the website (the Studio uses its own signed-in client).
 *
 * Built lazily on purpose: `createClient` throws at import time on a bad
 * config, and an unconfigured dashboard must never fail the whole build. Same
 * rule the IDX integration follows: a missing key degrades one feature.
 *
 * The project id is baked in (it is public, and it ships in the browser
 * bundle regardless), so production needs exactly one secret for the
 * dashboard: SANITY_API_TOKEN.
 *
 * `getPreviewClient()` carries the API token and is what the DMR
 * budget-request route reads and stamps with. Server-side only: never import
 * it into a client component, or the token ships to the browser.
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'yy80nmbb'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-01-01'

/** True once the deployment actually has a Sanity project wired up. */
export const sanityConfigured = Boolean(projectId)

let preview: SanityClient | null = null

export function getPreviewClient(): SanityClient | null {
  if (!sanityConfigured) return null
  if (!preview) {
    preview = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
      perspective: 'raw',
    })
  }
  return preview
}
