/* ==========================================================================
   Cookie consent.

   Two different jobs, deliberately kept apart:

   1. Google tags run on "implied consent" outside the EEA/UK/CH, because
      denying ad_storage by default would silently halve measured conversions
      for US traffic that never touches the banner. Inside those regions the
      tags start denied and only move on an explicit Accept.
   2. Session replay (Clarity) is the higher-risk one: it reconstructs what the
      visitor did. A Decline stops it loading at all, on this and every later
      page, rather than dropping it to a cookieless mode that still records.

   The choice is stored by the SERVER as a cookie. Safari deletes cookies and
   storage written by scripts after 7 days, which would re-prompt a returning
   visitor who already answered.
   ========================================================================== */

export type ConsentChoice = "granted" | "denied";

export const CONSENT_COOKIE = "dmr_consent";
export const GEO_COOKIE = "dmr_geo";

/** EEA + UK + Switzerland: opt-in required before anything non-essential runs. */
export const OPT_IN_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO",
  "SK", "SI", "ES", "SE", "GB", "CH",
];

function cookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** The visitor's answer, or null if they have not answered yet. */
export function readConsent(): ConsentChoice | null {
  const value = cookie(CONSENT_COOKIE);
  if (value === "granted" || value === "denied") return value;
  try {
    const stored = window.localStorage.getItem(CONSENT_COOKIE);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    return null;
  }
}

/** True where consent must be given before non-essential tags may run. */
export function requiresOptIn(): boolean {
  const country = (cookie(GEO_COOKIE) || "").toUpperCase();
  // Unknown country: treat as opt-out (US default). The middleware sets this on
  // every request, so "unknown" means a crawler or a local request, not an
  // EEA visitor being mishandled.
  return !!country && OPT_IN_COUNTRIES.includes(country);
}

/**
 * May a tag run right now? Granted always yes, denied always no, and an
 * unanswered banner depends on where the visitor is.
 */
export function mayRun(choice: ConsentChoice | null = readConsent()): boolean {
  if (choice === "granted") return true;
  if (choice === "denied") return false;
  return !requiresOptIn();
}

/** Tell Google and Clarity about a decision made in this page view. */
export function applyConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  const state = choice === "granted" ? "granted" : "denied";
  // Typed locally rather than through global declarations, so this file
  // compiles on sites that load neither tag.
  const { gtag, clarity } = window as {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  };
  try {
    gtag?.("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    });
  } catch {
    /* analytics must never take the page down */
  }
  try {
    // Clarity's own spelling: capital S on both keys.
    clarity?.("consentv2", { ad_Storage: state, analytics_Storage: state });
    // A decline also clears what Clarity already stored on this device.
    if (choice === "denied") clarity?.("consent", false);
  } catch {
    /* noop */
  }
}

/**
 * Persist the answer. The POST lets the server set the cookie, which is what
 * makes it survive Safari's 7-day purge; localStorage is a same-page fallback
 * so the banner never reappears if that request fails.
 */
export async function storeConsent(choice: ConsentChoice): Promise<void> {
  try {
    window.localStorage.setItem(CONSENT_COOKIE, choice);
  } catch {
    /* private mode */
  }
  try {
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice }),
    });
  } catch {
    /* the localStorage copy still holds for this browser */
  }
}
