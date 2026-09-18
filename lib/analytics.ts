/* ==========================================================================
   Conversion events.

   The site pushes SEMANTIC events ("a lead was submitted, of this kind, worth
   roughly this much") to the dataLayer. Whoever runs the ad account maps those
   to Google Ads conversion actions inside GTM. That split matters: the tag
   configuration changes far more often than the site does, and it should never
   need a deploy or a developer.

   Falls back to calling gtag directly when GTM is not in use, so the same
   trackEvent() calls work either way.
   ========================================================================== */

import { site } from "@/content/site";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** The conversion surfaces on this site. Keep names stable: GTM triggers key off them. */
export type ConversionEvent =
  | "generate_lead"      // any lead form completed
  | "lead_step"          // a multi-step form advanced (micro-conversion)
  | "phone_click"
  | "email_click"
  | "listing_view"
  | "listing_inquiry"
  | "search_performed";

/**
 * Rough lead values, so Ads can bid toward the leads that are actually worth
 * more rather than treating a newsletter signup like a seller valuation.
 * These are relative weights for bidding, not revenue claims.
 */
export const LEAD_VALUES: Record<string, number> = {
  "home-value": 120, // seller intent: highest value to a listing agent
  buyer: 80,
  "listing-inquiry": 60,
  contact: 40,
  newsletter: 5,
};

export function trackEvent(event: ConversionEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const payload = { event, ...params };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);

    if (typeof window.gtag === "function") {
      const { event: _event, ...rest } = payload;
      window.gtag("event", event, rest);

      /*
       * Fire the Google Ads conversion directly when this event maps to one.
       * Doing it here rather than in GTM means Smart Bidding gets a signal
       * without waiting on a container to be built; a GTM container can still
       * be layered on later, since both read the same dataLayer.
       */
      const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || site.analytics?.googleAdsId;
      const label = site.analytics?.conversions?.[event];
      if (adsId && label) {
        window.gtag("event", "conversion", {
          send_to: `${adsId}/${label}`,
          value: params.value,
          currency: params.currency ?? "USD",
        });
      }
    }
  } catch {
    // Analytics must never take a form down with it
  }
}

/**
 * Enhanced conversions: Google matches a hashed email/phone back to a signed-in
 * user, which recovers conversions that cookies alone miss. gtag does the
 * hashing itself, so plain values are correct here; they are sent to Google
 * only, never logged or exposed.
 */
export function setUserData(data: { email?: string; phone?: string }): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const userData: Record<string, string> = {};
  if (data.email) userData.email = data.email.trim().toLowerCase();
  // Enhanced conversions require E.164; a bare 10-digit US number is rejected
  if (data.phone) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length === 10) userData.phone_number = `+1${digits}`;
    else if (digits.length === 11 && digits.startsWith("1")) userData.phone_number = `+${digits}`;
  }
  if (Object.keys(userData).length === 0) return;
  try {
    window.gtag("set", "user_data", userData);
  } catch {
    /* noop */
  }
}
