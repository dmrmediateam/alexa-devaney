/* ==========================================================================
   Click-ID capture.

   Google Ads optimises on whatever you report back to it. A luxury agent's
   form fill is not revenue: the sale lands 3-9 months later in the CRM. To
   ever tell Ads which CLICK produced a closing, the gclid has to travel with
   the lead into the CRM at capture time. There is no way to reconstruct it
   afterwards, so this runs on the very first pageview of a session and is
   read back when a form submits.

   gclid   standard Google Ads click id
   gbraid  iOS web-to-app, set when the cookie-based gclid is unavailable
   wbraid  iOS app-to-web equivalent
   msclkid Microsoft Ads, harmless to carry and free to capture
   ========================================================================== */

const STORAGE_KEY = "ct_attribution";
/* Google Ads click-through conversion windows run to 90 days, so a click id
   that expires sooner silently loses the long tail of a luxury sales cycle. */
const TTL_DAYS = 90;

const CLICK_IDS = ["gclid", "gbraid", "wbraid", "msclkid", "fbclid"] as const;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Attribution = Partial<Record<(typeof CLICK_IDS)[number], string>> &
  Partial<Record<(typeof UTM_KEYS)[number], string>> & {
    landingPage?: string;
    referrer?: string;
    capturedAt?: string;
  };

function readStore(): (Attribution & { expiresAt?: number }) | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution & { expiresAt?: number };
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    // Private mode, blocked storage, or corrupt JSON: attribution is a bonus,
    // never a reason to break a form.
    return null;
  }
}

/**
 * Records click ids and campaign params on first touch.
 *
 * Last-click wins: a visitor who returns through a NEW ad click should be
 * credited to that click, so a fresh click id overwrites the stored one. A
 * visit with no click id leaves an existing record alone, otherwise ordinary
 * internal navigation would erase the attribution of the ad that brought them.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: Attribution = {};

    for (const key of CLICK_IDS) {
      const value = params.get(key);
      if (value) incoming[key] = value.slice(0, 512);
    }
    const hasClickId = Object.keys(incoming).length > 0;

    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) incoming[key] = value.slice(0, 256);
    }

    const existing = readStore();
    if (!hasClickId && existing) return;
    if (!hasClickId && Object.keys(incoming).length === 0 && existing) return;

    const record = {
      ...(hasClickId ? {} : existing),
      ...incoming,
      landingPage: window.location.pathname + window.location.search,
      referrer: document.referrer || undefined,
      capturedAt: new Date().toISOString(),
      expiresAt: Date.now() + TTL_DAYS * 864e5,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage unavailable */
  }
}

/** Stored attribution for a lead payload. Always safe to call. */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const stored = readStore();
  if (!stored) return {};
  const { expiresAt: _expiresAt, ...rest } = stored;
  return rest;
}
