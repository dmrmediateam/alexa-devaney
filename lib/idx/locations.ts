import 'server-only';
import { unstable_cache } from 'next/cache';
import { idxRequest } from './request';
import { MARKET_CITIES, MARKET_NEIGHBORHOODS } from './config';

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

/** `value` is what the search query matches on, `label` is what is shown. */
export interface NeighborhoodOption {
  label: string;
  value: string;
}

export interface LocationIndex {
  cities: CityOption[];
  neighborhoods: NeighborhoodOption[];
}

/** What the MLS fetch produces before scoping and display formatting. */
interface RawLocationIndex {
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

/*
 * The MLS's subdivision dictionary is 2,700+ names spanning the whole state,
 * and it mixes two populations that are easy to tell apart:
 *
 *   "LA COSTA", "CARLSBAD EAST"      - San Diego MLS areas (110 of them)
 *   "Agoura (850)", "Del Cabo (DC)"  - out-of-area legacy names, mixed case
 *                                      and carrying an MLS code in brackets
 *
 * Only the first population belongs in a San Diego agent's search box; the
 * second is where "random places" came from. Everything else is dropped here.
 */
function normalizeNeighborhoods(raw: unknown): string[] {
  const items: unknown[] = Array.isArray(raw) ? raw : Object.values((raw ?? {}) as object);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const value = typeof item === 'string' ? item : String((item as { name?: string })?.name ?? '');
    const name = value.trim();
    if (!name || name.length < 3) continue;
    if (name.includes('(')) continue;          // carries an out-of-area MLS code
    if (name !== name.toUpperCase()) continue; // mixed case marks the same set
    if (name === 'OUT OF AREA') continue;      // the feed's own catch-all bucket
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/*
 * Of those 110, keep the ones this agent actually sells in. An area belongs to
 * a served city when stripping the MLS's directional wrapper leaves that
 * city's name: "CARLSBAD EAST" and "SOUTH ESCONDIDO" and "LAKE SAN MARCOS" are
 * in, while "CHULA VISTA" is not - which a plain "contains VISTA" test would
 * have got wrong. Neighborhoods whose name carries no town at all (La Costa,
 * Leucadia, Aviara) come from IDX_MARKET_NEIGHBORHOODS.
 */
const DIRECTIONAL = /^(north|south|east|west|northeast|northwest|southeast|southwest|lake|old|olde|downtown)\s+|\s+(north|south|east|west|northeast|northwest|southeast|southwest)$/gi;

function scopeNeighborhoods(names: string[]): string[] {
  if (!MARKET_CITIES.length) return names;
  const served = new Set(MARKET_CITIES.map((c) => c.toLowerCase()));
  const extra = new Set(MARKET_NEIGHBORHOODS.map((n) => n.toLowerCase()));
  return names.filter((name) => {
    const lower = name.toLowerCase();
    // An area named exactly after a served city is already offered as a city,
    // and the city carries an MLS id, so it is the better of the two.
    if (served.has(lower)) return false;
    if (extra.has(lower)) return true;
    return served.has(lower.replace(DIRECTIONAL, '').trim());
  });
}

/** The feed shouts every area name; titles read better in a menu. */
function displayCase(name: string): string {
  const small = new Set(['of', 'the', 'at', 'on', 'by', 'de', 'del', 'la', 'las', 'los', 'el']);
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => (i > 0 && small.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

async function fetchLocationIndex(idxId: string): Promise<RawLocationIndex> {
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

/*
 * The combined-MLS city feed is the whole state: typing "enci" offered Encino
 * and Valencia, neither of which this agent sells in, and a search for either
 * returns nothing. Suggestions are scoped to the cities the site actually
 * serves (IDX_MARKET_CITIES). Free-typed text still searches anywhere, so
 * nothing is blocked, it is just no longer suggested.
 */
function scopeToMarket(cities: CityOption[]): CityOption[] {
  if (!MARKET_CITIES.length) return cities;
  const served = new Set(MARKET_CITIES.map((c) => c.toLowerCase()));
  const scoped = cities.filter((c) => served.has(c.name.toLowerCase()));
  // A market list that matches nothing is a misconfiguration, not a reason to
  // ship an empty autocomplete.
  return scoped.length ? scoped : cities;
}

export async function getLocationIndex(): Promise<LocationIndex> {
  const index = await cachedLocationIndex(await primaryIdxId());
  return {
    cities: scopeToMarket(index.cities),
    neighborhoods: scopeNeighborhoods(index.neighborhoods).map((name) => ({
      label: displayCase(name),
      // the feed's exact string: aw_subdivision matches on it, not on the label
      value: name,
    })),
  };
}
