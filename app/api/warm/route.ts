import { NextResponse } from "next/server";
import { warmListingPool } from "@/lib/idx/search";
import { idxConfigured } from "@/lib/idx/config";

/*
 * Keeps the browse pool warm.
 *
 * Assembling every market city takes longer than a visitor should wait, so
 * the search page races the pool against a short timeout and falls back to
 * the core cities if it loses. Cold, that fallback is what everyone sees:
 * the full market only appears once the cache is built. This endpoint builds
 * it on a schedule (see vercel.json) so the first visitor after a cache
 * expiry gets the whole market, not the first few cities.
 *
 * Vercel's scheduler calls it with an x-vercel-cron header; anything else
 * needs CRON_SECRET, so the endpoint cannot be used to burn API quota.
 */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const isVercelCron = request.headers.get("x-vercel-cron") !== null;
  const secret = process.env.CRON_SECRET;
  const authorized =
    isVercelCron || (secret && request.headers.get("authorization") === `Bearer ${secret}`);

  if (!authorized) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  if (!idxConfigured()) return NextResponse.json({ warmed: 0, idx: false });

  const started = Date.now();
  try {
    const count = await warmListingPool();
    return NextResponse.json({ warmed: count, ms: Date.now() - started });
  } catch (error) {
    console.error("[warm] pool refresh failed", { error: String(error) });
    return NextResponse.json({ warmed: 0, error: "refresh_failed" }, { status: 200 });
  }
}
