/**
 * The "this visitor already gave us their details" flag.
 *
 * Two copies on purpose: a cookie set by the server (survives Safari's 7-day
 * script-storage eviction) and a localStorage mirror (survives a cookie the
 * visitor clears). Either one counts as captured.
 */
export const LEAD_CAPTURED_COOKIE = "lead_captured";
export const LEAD_CAPTURED_STORAGE = "lead_captured";
export const LISTING_VIEWS_STORAGE = "listing_views";

/** Reads the cookie first: it is the copy that lasts. */
export function hasCapturedFlag(): boolean {
  if (typeof document === "undefined") return false;
  if (document.cookie.split("; ").some((c) => c.startsWith(`${LEAD_CAPTURED_COOKIE}=`))) return true;
  try {
    return window.localStorage.getItem(LEAD_CAPTURED_STORAGE) === "1";
  } catch {
    // Storage blocked (private mode, blocked site data): the cookie is the
    // only signal, and it already said no.
    return false;
  }
}

export function markCapturedLocally(): void {
  try {
    window.localStorage.setItem(LEAD_CAPTURED_STORAGE, "1");
  } catch {
    /* cookie already carries this; nothing to do */
  }
}
