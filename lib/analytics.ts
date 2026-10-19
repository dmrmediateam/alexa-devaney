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
    /* Read by the Google tag's "Extract data from your page" settings in
       Google Ads (JavaScript variable mode). Renaming them breaks that setup. */
    dmr_conversion_value?: number;
    dmr_transaction_id?: string;
    dmr_currency?: string;
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
  | "listing_registration"   // browsing intent: tracked, never an ad conversion
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
  "listing-registration": 10,
  contact: 40,
  // An event enquiry is a qualified, high-ticket conversation and it is the
  // only lead on the site that is not real estate, so it is worth its own
  // value rather than being folded into `contact`.
  "experience-inquiry": 90,
  newsletter: 5,
};

/* ==========================================================================
   The one Google Ads lead conversion.

   Every paid lead on the site reports to a single conversion action, valued by
   what the lead is plausibly worth in commission:
     home price x 3% commission x 80% agent split x the lead's close rate.
   A contact form carries no home, so it gets a flat value instead. Forms not
   listed here (newsletter) are tracked as events but are not Ads conversions.
   ========================================================================== */

const COMMISSION_RATE = 0.03;
const AGENT_SPLIT = 0.8;

const LEAD_CONVERSIONS: Record<string, { flat: number } | { closeRate: number }> = {
  contact: { flat: 250 },
  "listing-registration": { closeRate: 0.015 }, // IDX forced conversion
  "listing-inquiry": { closeRate: 0.03 },
  "home-value": { closeRate: 0.03 },
  buyer: { closeRate: 0.03 }, // /buyers price-band form
};

/**
 * A price band as one home value: "$1.5M – $2M" -> 1750000, "$5M+" -> 5000000.
 * "Under $X" has no midpoint, so it takes the market fallback capped at X
 * (an under-$300K pick must not be valued at a $400K median).
 * Undefined for "Not sure" or anything unparseable, which means "use the fallback".
 */
export function parsePriceBand(text: string | undefined): number | undefined {
  if (!text || /not sure/i.test(text)) return undefined;
  if (/under/i.test(text)) {
    const ceiling = parsePriceBand(text.replace(/under/i, ""));
    const fallback = site.analytics?.defaultHomeValue;
    if (ceiling === undefined) return undefined;
    return fallback ? Math.min(ceiling, fallback) : ceiling;
  }
  const amounts = [...text.matchAll(/\$?\s*([\d.,]+)\s*([KkMm])?/g)]
    .map(([, n, unit]) => {
      const num = parseFloat(n.replace(/,/g, ""));
      const mult = unit?.toLowerCase() === "m" ? 1e6 : unit?.toLowerCase() === "k" ? 1e3 : 1;
      return num * mult;
    })
    .filter((n) => n >= 10000);
  if (amounts.length === 0) return undefined;
  return amounts.reduce((a, b) => a + b, 0) / amounts.length;
}

/** The conversion value for a lead, or null when this form is not an Ads conversion. */
export function leadConversionValue(formType: string, homeValue?: number): number | null {
  const rule = LEAD_CONVERSIONS[formType];
  if (!rule) return null;
  if ("flat" in rule) return rule.flat;
  const price = homeValue && homeValue > 0 ? homeValue : site.analytics?.defaultHomeValue ?? 0;
  return Math.round(price * COMMISSION_RATE * AGENT_SPLIT * rule.closeRate * 100) / 100;
}

/**
 * Fire the lead conversion for a completed form. The value, transaction id and
 * currency are written to window globals first, so the Google tag's page-data
 * extraction reads the same numbers the explicit conversion call sends. The
 * transaction id also lets Google drop a duplicate if the conversion fires twice.
 */
export function fireLeadConversion(formType: string, homeValue?: number): number | null {
  const value = leadConversionValue(formType, homeValue);
  if (value === null || typeof window === "undefined") return value;
  const transactionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    window.dmr_conversion_value = value;
    window.dmr_transaction_id = transactionId;
    window.dmr_currency = "USD";

    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || site.analytics?.googleAdsId;
    const label = site.analytics?.leadConversionLabel;
    if (adsId && label && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: `${adsId}/${label}`,
        value,
        currency: "USD",
        transaction_id: transactionId,
      });
    }
  } catch {
    // Analytics must never take a form down with it
  }
  return value;
}

export function trackEvent(event: ConversionEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const payload = { event, ...params };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);

    if (typeof window.gtag === "function") {
      const { event: _event, ...rest } = payload;
      window.gtag("event", event, rest);
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
