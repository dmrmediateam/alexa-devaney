/**
 * DMR Media brand constants. Surface colors come from the Studio theme (see theme.ts);
 * the dashboard adds DMR's blue (#3c88c0) for data and Instrument Serif for numbers.
 */
export const DMR_EMAIL = 'team@dmrmedia.org'
export const DMR_SITE = 'https://dmrmedia.org'

/** The client's website, which hosts /api/dmr/budget-request (sends the email via SendGrid). */
export const SITE_URL = (process.env.SANITY_STUDIO_SITE_URL || 'https://www.eaganluxury.com').replace(/\/$/, '')
