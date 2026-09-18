import { NextRequest, NextResponse } from "next/server";
import { filtersFromParams } from "@/lib/idx/filterParams";
import { searchListings } from "@/lib/idx/search";
import { idxConfigured } from "@/lib/idx/config";

export async function GET(request: NextRequest) {
  if (!idxConfigured()) {
    return NextResponse.json(
      { listings: [], totalCount: 0, page: 1, pageSize: 21, totalPages: 1 },
      { status: 200 },
    );
  }
  const filters = filtersFromParams(request.nextUrl.searchParams);
  if (filters.address && filters.address.length > 120) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  try {
    const response = await searchListings(filters);
    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=900" },
    });
  } catch {
    return NextResponse.json({ error: "Search unavailable" }, { status: 502 });
  }
}
