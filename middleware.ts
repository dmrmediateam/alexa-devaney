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

const FORM_POST_ENDPOINTS = new Set<string>(["/api/lead"]);

const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60_000;
const formSubmissions = new Map<string, number[]>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isFormRateLimited(ip: string): boolean {
  const now = Date.now();
  const history = (formSubmissions.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  history.push(now);
  formSubmissions.set(ip, history);

  if (formSubmissions.size > 2_000) {
    formSubmissions.forEach((stamps, key) => {
      if (stamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) formSubmissions.delete(key);
    });
  }

  return history.length > RATE_LIMIT_MAX;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "POST" && FORM_POST_ENDPOINTS.has(pathname)) {
    if (isFormRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a moment and try again." },
        { status: 429 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // /api is excluded from the default matcher; form endpoints must be listed
  // explicitly or the limiter never runs.
  matcher: ["/api/lead"],
};
