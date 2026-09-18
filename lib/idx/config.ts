import 'server-only';

/* ==========================================================================
   Per-client IDX market configuration, sourced from env vars so a new client
   deployment needs zero code edits:

   IDX_API_KEY        - client's IDX Broker access key (required for live data)
   IDX_ANCILLARY_KEY  - optional partner key (raises rate limit, unlocks detail)
   IDX_MARKET_CITIES  - comma-separated city names forming the cached browse
                        pool (e.g. "Naples,Bonita Springs,Marco Island")
   IDX_OFFICE_IDS     - comma-separated office ids marking "our listings"
   ========================================================================== */

function csvEnv(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export const MARKET_CITIES: readonly string[] = csvEnv("IDX_MARKET_CITIES");

/** First few market cities: the fast-fallback set when the pool is cold */
export const CORE_MARKET_CITIES: readonly string[] = MARKET_CITIES.slice(0, 6);

export const OUR_OFFICE_IDS: readonly string[] = csvEnv("IDX_OFFICE_IDS");

export function idxConfigured(): boolean {
  return !!process.env.IDX_API_KEY;
}
