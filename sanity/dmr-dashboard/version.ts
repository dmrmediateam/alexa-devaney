/**
 * The portal version. Bump it in client-portal (and add a CHANGELOG.md entry)
 * whenever a change goes out to clients; `tools/sync.mjs` stamps it into each
 * client repo's `.dmr-portal.json`.
 *
 * The dashboard shows it at the bottom next to the website's version (from
 * /api/dmr/version). The two drift apart because a git push redeploys the
 * site but not the hosted Studio, which needs `npm run sanity:deploy`.
 */
export const DMR_PORTAL_VERSION = '1.1.1'
