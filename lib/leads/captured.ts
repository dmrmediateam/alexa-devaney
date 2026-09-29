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

/**
 * How many times this visitor has waved the gate away.
 *
 * The escape hatch stays (a wall with no door reads as hostile, and the
 * listing underneath is indexable precisely because nothing is hidden), but it
 * gets harder to reach each time: later in the modal's life on the first two
 * passes, and gone on the third. Someone on their fourth listing is not
 * browsing idly.
 */
export const GATE_DISMISSALS_STORAGE = "listing_gate_dismissals";

export function readDismissals(): number {
  try {
    return Number(window.localStorage.getItem(GATE_DISMISSALS_STORAGE) ?? "0") || 0;
  } catch {
    // Storage blocked: treat every visit as the first, so the way out stays
    // reachable rather than trapping someone who cannot be counted.
    return 0;
  }
}

export function recordDismissal(): number {
  const next = readDismissals() + 1;
  try {
    window.localStorage.setItem(GATE_DISMISSALS_STORAGE, String(next));
  } catch {
    /* nothing to persist to; the gate simply stays as forgiving as it was */
  }
  return next;
}
