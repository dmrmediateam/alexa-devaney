import { NextResponse } from "next/server";
import { VISITOR_COOKIE } from "@/lib/tracking/visitor";
import {
  recordHeart,
  recordSearch,
  recordView,
  trackingConfigured,
  type TrackedListing,
} from "@/lib/tracking/store";

/**
 * Listing activity intake: views, hearts and searches.
 *
 * Deliberately quiet. It always answers 204 - to the browser this is a
 * beacon, not a transaction, and a visitor must never see a listing page
 * misbehave because the reporting backend is down or unconfigured. Failures
 * are logged server-side instead.
 *
 * The visitor id is read from the cookie the SERVER can see, not from the
 * request body. A body-supplied id would let anyone write activity into
 * someone else's record just by guessing it.
 */
export const runtime = "nodejs";

/** Obvious non-humans. Crawlers hitting every listing would drown the real data. */
const BOT = /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python-requests/i;

const NO_CONTENT = new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  // Nothing configured: accept and drop. The site works without a dashboard.
  if (!trackingConfigured()) return NO_CONTENT;

  const ua = request.headers.get("user-agent") || "";
  if (!ua || BOT.test(ua)) return NO_CONTENT;

  const visitorId = readVisitorCookie(request);
  if (!visitorId) return NO_CONTENT;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NO_CONTENT;
  }

  const type = typeof body.type === "string" ? body.type : "";

  try {
    switch (type) {
      case "view": {
        const listing = readListing(body.listing);
        if (listing) await recordView(visitorId, listing);
        break;
      }
      case "heart":
      case "unheart": {
        const listing = readListing(body.listing);
        if (listing) await recordHeart(visitorId, listing, type === "heart");
        break;
      }
      case "search": {
        const filters = isRecord(body.filters) ? body.filters : null;
        if (filters) {
          await recordSearch(
            visitorId,
            filters,
            typeof body.label === "string" ? body.label : undefined,
          );
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    // Never surface this: the page is already rendered and the visitor does
    // not care that our analytics write failed.
    console.error("[Track] failed", { type, error: String(error) });
  }

  return NO_CONTENT;
}

function readVisitorCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const hit = header
    .split("; ")
    .find((c) => c.startsWith(`${VISITOR_COOKIE}=`));
  if (!hit) return null;
  const raw = decodeURIComponent(hit.slice(VISITOR_COOKIE.length + 1));
  return /^[a-zA-Z0-9._-]{8,64}$/.test(raw) ? raw : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Only the fields the portal displays; anything else the client sends is dropped. */
function readListing(value: unknown): TrackedListing | null {
  if (!isRecord(value)) return null;
  const listingId = typeof value.listingId === "string" ? value.listingId.slice(0, 64) : "";
  if (!listingId) return null;
  return {
    listingId,
    address: str(value.address, 160),
    city: str(value.city, 80),
    url: str(value.url, 300),
    price: typeof value.price === "number" && Number.isFinite(value.price) ? value.price : undefined,
  };
}

function str(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}
