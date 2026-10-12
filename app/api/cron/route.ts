import { NextResponse } from "next/server";
import { checkDashboard, checkGoogleAds, cronAuthorized } from "@/lib/dmr/healthChecks";
import { DMR_PORTAL_VERSION } from "@/sanity/dmr-dashboard/version";

/**
 * Scheduled API health check (see vercel.json "crons").
 *
 * Vercel calls this with `Authorization: Bearer $CRON_SECRET`. The DMR checks
 * (dashboard data, Google Ads sync) live in lib/dmr/healthChecks.ts, which
 * the portal sync keeps up to date. This route belongs to the client repo:
 * add site-specific checks (IDX, listing search, ...) to `checks` below. See
 * carole-tierney for an example with IDX.
 *
 * Returns 200 when every check passes, 503 otherwise, so a failure shows up
 * as a failed cron invocation in the Vercel logs.
 *
 * Test locally: npm run test:cron
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // The Ads check reads the customer id and sync mode from the dashboard settings.
  const { result: dashboard, settings } = await checkDashboard();
  const googleAds = await checkGoogleAds(settings);

  const checks = [dashboard, googleAds];
  const ok = checks.every((c) => c.ok);
  const result = { ok, ranAt: new Date().toISOString(), portalVersion: DMR_PORTAL_VERSION, checks };

  if (!ok) console.error("[cron] health check failed", checks.filter((c) => !c.ok));
  return NextResponse.json(result, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
