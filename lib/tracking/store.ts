/**
 * Server-side writes for listing activity.
 *
 * One document per VISITOR, never one per event. A document per view would
 * put a listing site past Sanity's document ceiling within weeks and cost
 * real money; a document per visitor tops out at the client's lead count,
 * which is hundreds, and each one is exactly what the portal wants to show:
 * everything this person has done, in one place.
 *
 * Talks to Sanity over plain HTTP rather than @sanity/client, so the template
 * carries no Sanity dependency and a client repo without the dashboard still
 * builds. With the env vars unset every function here is a no-op that returns
 * false, the same way leads behave without SendGrid: the visitor's experience
 * never depends on the reporting backend being wired up.
 */
import { SANITY_DATASET, SANITY_PROJECT_ID } from "@/sanity/dmr-client";

const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";
const TIMEOUT_MS = 5000;

/** How much history a visitor document keeps. Oldest entries fall off. */
const MAX_VIEWED = 100;
const MAX_SEARCHES = 25;

export type TrackedListing = {
  listingId: string;
  address?: string;
  city?: string;
  price?: number;
  url?: string;
  /* Shown by the registration gate when a heart triggers it. The track route
     whitelists what it stores, so this never reaches Sanity. */
  photo?: string;
};

type SanityConfig = { projectId: string; dataset: string; token: string };

function config(): SanityConfig | null {
  // The project id is public and baked in, so production needs exactly one
  // secret for the dashboard: SANITY_API_TOKEN. Without the token this stays
  // null and every function here is a no-op.
  const projectId = SANITY_PROJECT_ID;
  const dataset = SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN;
  if (!projectId || !token) return null;
  return { projectId, dataset, token };
}

/** True when the dashboard backend is wired up. Callers use it to skip work. */
export function trackingConfigured(): boolean {
  return config() !== null;
}

function docId(visitorId: string): string {
  // Sanity ids allow [a-zA-Z0-9._-]; anything else in the cookie is dropped
  // rather than trusted, since this value reaches a URL path.
  return `visitor-${visitorId.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64)}`;
}

async function mutate(mutations: unknown[]): Promise<boolean> {
  const cfg = config();
  if (!cfg) return false;
  const url = `https://${cfg.projectId}.api.sanity.io/v${API_VERSION}/data/mutate/${cfg.dataset}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mutations }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("[Track] sanity rejected", {
        status: res.status,
        detail: (await res.text()).slice(0, 300),
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Track] sanity failed", { error: String(error) });
    return false;
  }
}

/** Creates the visitor document on first contact. Cheap and idempotent. */
function ensureDoc(visitorId: string, now: string) {
  return {
    createIfNotExists: {
      _id: docId(visitorId),
      _type: "dmrVisitor",
      visitorId,
      firstSeen: now,
      lastSeen: now,
    },
  };
}

/**
 * A listing view. Appended, then the array is trimmed from the front.
 *
 * Repeat views of the same listing are kept rather than deduped: "came back
 * to this one four times" is the single most useful signal on the page, and
 * collapsing it throws that away.
 */
export async function recordView(visitorId: string, listing: TrackedListing): Promise<boolean> {
  if (!trackingConfigured()) return false;
  const now = new Date().toISOString();
  const id = docId(visitorId);
  return mutate([
    ensureDoc(visitorId, now),
    {
      patch: {
        id,
        set: { lastSeen: now },
        setIfMissing: { viewed: [] },
        insert: {
          after: "viewed[-1]",
          items: [{ _type: "dmrActivity", _key: key(), at: now, ...listing }],
        },
      },
    },
    // Separate patch: a slice unset in the same patch as the insert races it.
    { patch: { id, unset: [`viewed[0:-${MAX_VIEWED}]`] } },
  ]);
}

/** Heart / unheart. Hearts are deduped by listing: it is a set, not a log. */
export async function recordHeart(
  visitorId: string,
  listing: TrackedListing,
  hearted: boolean,
): Promise<boolean> {
  if (!trackingConfigured()) return false;
  const now = new Date().toISOString();
  const id = docId(visitorId);

  if (!hearted) {
    return mutate([
      { patch: { id, unset: [`hearted[listingId=="${safe(listing.listingId)}"]`] } },
    ]);
  }

  return mutate([
    ensureDoc(visitorId, now),
    {
      patch: {
        id,
        set: { lastSeen: now },
        setIfMissing: { hearted: [] },
        // unset-then-insert so hearting twice cannot duplicate the entry
        unset: [`hearted[listingId=="${safe(listing.listingId)}"]`],
      },
    },
    {
      patch: {
        id,
        insert: {
          after: "hearted[-1]",
          items: [{ _type: "dmrActivity", _key: key(), at: now, ...listing }],
        },
      },
    },
  ]);
}

/** A saved/executed search, stored as the filter set the visitor chose. */
export async function recordSearch(
  visitorId: string,
  filters: Record<string, unknown>,
  label?: string,
): Promise<boolean> {
  if (!trackingConfigured()) return false;
  const now = new Date().toISOString();
  const id = docId(visitorId);
  return mutate([
    ensureDoc(visitorId, now),
    {
      patch: {
        id,
        set: { lastSeen: now },
        setIfMissing: { searches: [] },
        insert: {
          after: "searches[-1]",
          items: [
            {
              _type: "dmrSearch",
              _key: key(),
              at: now,
              label: label || describeFilters(filters),
              query: JSON.stringify(filters).slice(0, 600),
            },
          ],
        },
      },
    },
    { patch: { id, unset: [`searches[0:-${MAX_SEARCHES}]`] } },
  ]);
}

/**
 * Identity stitching: the moment a lead form is submitted, the anonymous
 * history this visitor already has becomes attributable to a real person.
 * That is the entire value of the feature, so it runs on every lead.
 */
export async function identify(
  visitorId: string,
  person: { email?: string; name?: string; phone?: string; formType?: string },
): Promise<boolean> {
  if (!trackingConfigured()) return false;
  if (!person.email && !person.phone) return false;
  const now = new Date().toISOString();
  const set: Record<string, unknown> = { lastSeen: now, identifiedAt: now };
  if (person.email) set.email = person.email.toLowerCase().trim();
  if (person.name) set.name = person.name;
  if (person.phone) set.phone = person.phone;
  if (person.formType) set.lastFormType = person.formType;

  return mutate([
    ensureDoc(visitorId, now),
    { patch: { id: docId(visitorId), set } },
  ]);
}

/* ---------------------------------------------------------------- helpers */

function key(): string {
  return Math.random().toString(36).slice(2, 12);
}

/** Escapes a value being interpolated into a GROQ array filter. */
function safe(value: string): string {
  return value.replace(/["\\]/g, "").slice(0, 64);
}

/** A human label for a filter set, so the portal is readable without parsing JSON. */
function describeFilters(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  const city = filters.city ?? filters.subdivision;
  if (city) parts.push(String(city));
  if (filters.minBeds) parts.push(`${filters.minBeds}+ bd`);
  if (filters.minBaths) parts.push(`${filters.minBaths}+ ba`);
  if (filters.propertyTypes && Array.isArray(filters.propertyTypes) && filters.propertyTypes.length) {
    parts.push(filters.propertyTypes.join("/"));
  }
  const min = Number(filters.minPrice) || 0;
  const max = Number(filters.maxPrice) || 0;
  if (min && max) parts.push(`$${compact(min)} to $${compact(max)}`);
  else if (max) parts.push(`under $${compact(max)}`);
  else if (min) parts.push(`over $${compact(min)}`);
  return parts.join(" · ") || "All listings";
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/**
 * One `dmrLead` per form submission: the real lead count the dashboard
 * reports, since Google Ads conversions only see whatever actions are tracked.
 * Takes the same payload the webhook and emails get. Only the named fields
 * are kept; the rest of the payload stays in the CRM.
 */
export async function recordLead(payload: Record<string, unknown>): Promise<boolean> {
  if (!trackingConfigured()) return false;
  const text = (key: string) => {
    const value = payload[key];
    return typeof value === "string" && value.trim() ? value.trim().slice(0, 2000) : undefined;
  };
  const submittedAt = text("submittedAt") ?? new Date().toISOString();
  // The month in Eastern time, matching the lead sheet's "Submitted (ET)".
  const et = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit" })
      .formatToParts(new Date(submittedAt))
      .map((part) => [part.type, part.value]),
  );
  const page = text("landingPage") ?? text("page");
  const campaignId = page?.match(/gad_campaignid=(\d+)/)?.[1] ?? text("utmCampaign");

  return mutate([
    {
      create: {
        _id: `lead-${crypto.randomUUID()}`,
        _type: "dmrLead",
        month: `${et.year}-${et.month}-01`,
        submittedAt,
        name: text("fullName") ?? text("name"),
        email: text("email"),
        phone: text("phone"),
        form: text("formLabel") ?? text("formType"),
        leadTag: text("leadTag"),
        qualified: payload.qualified === true,
        qualificationReason: text("qualificationReason"),
        paid: Boolean(text("gclid") || text("gbraid") || text("wbraid")),
        address: [text("address"), text("address2")].filter(Boolean).join(", ") || undefined,
        city: text("city"),
        zip: text("zip"),
        pricePoint: text("pricePoint"),
        estimatedValue: text("estimatedValue"),
        financing: text("financing"),
        agentStatus: text("agentStatus"),
        timeline: text("timeline"),
        mlsNumber: text("mlsNumber"),
        message: text("message"),
        page,
        gclid: text("gclid"),
        campaignId,
        source: "site",
      },
    },
  ]);
}
