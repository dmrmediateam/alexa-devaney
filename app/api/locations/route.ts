import { NextResponse } from "next/server";
import { getLocationIndex } from "@/lib/idx/locations";
import { idxConfigured } from "@/lib/idx/config";

/*
 * Location index for the search autocomplete: MLS cities (with the IDs the
 * search endpoint expects) and neighborhood names. Cached for a day upstream
 * and at the edge, because it changes about as often as the map does.
 */
export const revalidate = 86400;

export async function GET() {
  if (!idxConfigured()) {
    return NextResponse.json({ cities: [], neighborhoods: [] });
  }
  try {
    const index = await getLocationIndex();
    return NextResponse.json(index, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch {
    // An empty index degrades to a plain text field, never an error state
    return NextResponse.json({ cities: [], neighborhoods: [] }, { status: 200 });
  }
}
