import { NextResponse } from "next/server";

/**
 * Server-side proxy for Google Places autocomplete so the API key is never
 * exposed to the browser. Requires GOOGLE_MAPS_API_KEY in the environment
 * (Places API (New) enabled); without it the endpoint returns empty results
 * and the address field behaves as a plain input.
 *
 * GET ?input=123 Main     -> { suggestions: [{ placeId, text }] }
 * GET ?placeId=ChIJ...    -> { address, city, zip }
 */

/* Bias suggestions toward North County San Diego (centered on Carlsbad) */
const MARKET_BIAS = {
  circle: { center: { latitude: 33.1581, longitude: -117.3506 }, radius: 45000 },
};

export async function GET(request: Request) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input")?.trim() ?? "";
  const placeId = searchParams.get("placeId")?.trim() ?? "";
  const sessionToken = searchParams.get("sessionToken")?.slice(0, 64) ?? "";

  if (!key) return NextResponse.json(placeId ? {} : { suggestions: [] });

  try {
    if (placeId) {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
          (sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : ""),
        {
          headers: {
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "addressComponents",
          },
        },
      );
      if (!res.ok) return NextResponse.json({});
      const data = await res.json();
      const components: Array<{ types: string[]; longText?: string; shortText?: string }> =
        data.addressComponents ?? [];
      const get = (type: string) =>
        components.find((c) => c.types.includes(type))?.longText ?? "";
      const streetNumber = get("street_number");
      const route = get("route");
      return NextResponse.json({
        address: [streetNumber, route].filter(Boolean).join(" "),
        city: get("locality") || get("sublocality") || get("postal_town"),
        zip: get("postal_code"),
      });
    }

    if (input.length < 3) return NextResponse.json({ suggestions: [] });

    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["us"],
        includedPrimaryTypes: ["street_address", "premise", "subpremise"],
        locationBias: MARKET_BIAS,
        ...(sessionToken ? { sessionToken } : {}),
      }),
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });
    const data = await res.json();
    const suggestions = (data.suggestions ?? [])
      .map((s: { placePrediction?: { placeId: string; text?: { text: string } } }) => ({
        placeId: s.placePrediction?.placeId ?? "",
        text: s.placePrediction?.text?.text ?? "",
      }))
      .filter((s: { placeId: string; text: string }) => s.placeId && s.text)
      .slice(0, 5);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(placeId ? {} : { suggestions: [] });
  }
}
