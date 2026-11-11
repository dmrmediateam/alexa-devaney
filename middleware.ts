/**
 * Per-IP rate limiting for form endpoints only.
 *
 * In-memory sliding window: 15 POSTs per IP per 60s (multi-step lead flow),
 * then 429. NOTE: on serverless hosts (Vercel/Lambda) the counter is per
 * function instance, so the effective global limit is (instances × limit);
 * fine as burst throttling; use Redis/Upstash or a WAF rule for a hard cap.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FORM_POST_ENDPOINTS = new Set<string>(["/api/lead", "/api/dmr/budget-request"]);
/* Activity beacons, not submissions: a visitor working through a results page
   fires these far faster than any form, so they get their own, looser bucket. */
const TRACK_POST_ENDPOINTS = new Set<string>(["/api/track"]);

const RATE_LIMIT_MAX = 15;
const TRACK_RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;
const formSubmissions = new Map<string, number[]>();
const trackBeacons = new Map<string, number[]>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isRateLimited(bucket: Map<string, number[]>, ip: string, max: number): boolean {
  const now = Date.now();
  const history = (bucket.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  history.push(now);
  bucket.set(ip, history);

  if (bucket.size > 2_000) {
    bucket.forEach((stamps, key) => {
      if (stamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) bucket.delete(key);
    });
  }

  return history.length > max;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "POST" && FORM_POST_ENDPOINTS.has(pathname)) {
    if (isRateLimited(formSubmissions, getClientIp(request), RATE_LIMIT_MAX)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a moment and try again." },
        { status: 429 },
      );
    }
  }

  /* A throttled beacon is dropped, never surfaced: the page it came from is
     already on screen and an error here would be noise the visitor cannot act on. */
  if (request.method === "POST" && TRACK_POST_ENDPOINTS.has(pathname)) {
    if (isRateLimited(trackBeacons, getClientIp(request), TRACK_RATE_LIMIT_MAX)) {
      return new NextResponse(null, { status: 204 });
    }
  }

  return NextResponse.next();
}

export const config = {
  // /api is excluded from the default matcher; form endpoints must be listed
  // explicitly or the limiter never runs.
  matcher: ["/api/lead", "/api/track", "/api/dmr/budget-request"],
};
