import { NextResponse } from "next/server";
import { getPreviewClient } from "@/lib/dmr/sanity";
import { studioCors as cors } from "@/lib/dmr/studioCors";
import { recordSync, SETTINGS_ID, syncGoogleAds, type SyncResult, type SyncSettings } from "@/lib/dmr/googleAdsSync";

/**
 * Runs the Google Ads sync when someone presses "Sync Google Ads" in the
 * Studio dashboard.
 *
 * Same trust model as /api/dmr/budget-request: the Studio first stamps
 * `syncRequestedAt` on the Report Settings doc (only signed-in Studio users
 * can write it), then POSTs here. We sync only when that stamp is recent and
 * newer than the last sync, so each press runs once and the endpoint can't be
 * used to hammer the Google Ads API.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AGE_MS = 2 * 60 * 1000;

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  const headers = cors(request.headers.get("origin"));
  const client = getPreviewClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Dashboard is not configured" }, { status: 503, headers });
  }

  const settings = await client.fetch<(SyncSettings & { syncRequestedAt?: string; lastSync?: SyncResult }) | null>(
    `*[_id == $id][0]{clientName, dataSource, googleAdsCustomerId, dmrStartDate, syncRequestedAt, lastSync}`,
    { id: SETTINGS_ID },
  );
  const requestedAt = settings?.syncRequestedAt ? new Date(settings.syncRequestedAt).getTime() : 0;
  if (!requestedAt || Date.now() - requestedAt > MAX_AGE_MS) {
    return NextResponse.json({ ok: false, message: "No recent sync request" }, { status: 403, headers });
  }
  if (settings?.lastSync?.at && new Date(settings.lastSync.at).getTime() >= requestedAt) {
    return NextResponse.json(settings.lastSync, { headers });
  }

  let result: SyncResult;
  try {
    result = await syncGoogleAds(client, settings);
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 600) : "Google Ads sync failed";
    result = { ok: false, at: new Date().toISOString(), message };
  }
  await recordSync(client, result).catch((err) => console.error("[DMR sync] could not record result", err));
  if (!result.ok) console.error("[DMR sync]", result.message);

  return NextResponse.json(result, { status: result.ok ? 200 : 502, headers });
}
