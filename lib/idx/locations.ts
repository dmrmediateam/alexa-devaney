import 'server-only';
import { unstable_cache } from 'next/cache';
import { idxRequest } from './request';

/* ==========================================================================
   The MLS's own location index: cities (with IDs) and neighborhoods.

   This is a location list, not listing data, so it is small, stable and
   cached for a day. City IDs matter: the search endpoint expects `city[]`
   IDs, and passing a city NAME where an ID belongs silently returns the
   wrong set rather than an error.
   ========================================================================== */

const LOCATION_REVALIDATE_SECONDS = 60 * 60 * 24; // 24h

export interface CityOption {
  id: string;
  name: string;
  state?: string;
}

export interface LocationIndex {
  cities: CityOption[];
  neighborhoods: string[];
}

interface RawCity {
  id?: string | number;
  cityID?: string | number;
  name?: string;
  cityName?: string;
  stateAbrv?: string;
}

function normalizeCities(raw: unknown): CityOption[] {
  const items: RawCity[] = Array.isArray(raw)
    ? raw
    : Object.values((raw ?? {}) as Record<string, RawCity>);
  const seen = new Set<string>();
  const cities: CityOption[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.id ?? item.cityID ?? '').trim();
    const name = String(item.name ?? item.cityName ?? '').trim();
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    cities.push({ id, name, state: item.stateAbrv });
  }
  return cities.sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeNeighborhoods(raw: unknown): string[] {
  const items: unknown[] = Array.isArray(raw) ? raw : Object.values((raw ?? {}) as object);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const value = typeof item === 'string' ? item : String((item as { name?: string })?.name ?? '');
    const name = value.trim();
    // Feed values carry an MLS code suffix, e.g. "Olde Carlsbad (OCB)"
    const cleaned = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (!cleaned || cleaned.length < 3 || seen.has(cleaned.toLowerCase())) continue;
    seen.add(cleaned.toLowerCase());
    out.push(cleaned);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

async function fetchLocationIndex(idxId: string): Promise<LocationIndex> {
  const [cities, neighborhoods] = await Promise.all([
    idxRequest<unknown>('/clients/cities/combinedActiveMLS', {
      revalidateSeconds: LOCATION_REVALIDATE_SECONDS,
      retries: 1,
    }).catch(() => []),
    idxRequest<unknown>(`/mls/searchfieldvalues/${idxId}`, {
      query: { mlsPtID: 1, name: 'subdivision' },
      revalidateSeconds: LOCATION_REVALIDATE_SECONDS,
      retries: 1,
    }).catch(() => []),
  ]);

  return {
    cities: normalizeCities(cities),
    neighborhoods: normalizeNeighborhoods(neighborhoods),
  };
}

const cachedLocationIndex = unstable_cache(fetchLocationIndex, ['idx-location-index-v1'], {
  revalidate: LOCATION_REVALIDATE_SECONDS,
  tags: ['idx-locations'],
});

/** Approved MLS id for this account (d010 for San Diego MLS). */
export async function primaryIdxId(): Promise<string> {
  try {
    const approved = await idxRequest<Array<{ id?: string }>>('/mls/approvedmls', {
      revalidateSeconds: LOCATION_REVALIDATE_SECONDS,
      retries: 1,
    });
    return approved?.[0]?.id ?? 'd010';
  } catch {
    return 'd010';
  }
}

export async function getLocationIndex(): Promise<LocationIndex> {
  return cachedLocationIndex(await primaryIdxId());
}
