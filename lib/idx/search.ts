import 'server-only';
import { unstable_cache } from 'next/cache';
import { idxRequest } from './request';
import { normalizeListingSummary, RawIdxListing } from './normalize';
import { AddressSuggestion, IdxApiError, ListingSummary, SearchFilters, SearchResponse } from './types';
import { CORE_MARKET_CITIES, MARKET_CITIES } from './config';

const SEARCH_REVALIDATE_SECONDS = 900;
const POOL_REVALIDATE_SECONDS = 3600;
const DEFAULT_PAGE_SIZE = 21;
const IDX_RESULT_CAP = 250;

function statusParam(status: SearchFilters['status']): string | undefined {
  switch (status) {
    case 'active':     return 'Active';
    case 'pending':    return 'Pending';
    case 'sold':       return 'Sold';
    case 'comingSoon': return 'Coming Soon';
    default:           return undefined;
  }
}

function isListingRecord(value: unknown): value is RawIdxListing {
  return !!value && typeof value === 'object' && 'listingID' in value && 'idxID' in value;
}

function rawToListings(raw: Record<string, unknown>): ListingSummary[] {
  return Object.values(raw ?? {}).filter(isListingRecord).map(normalizeListingSummary);
}

function isRateLimitedError(error: unknown): boolean {
  return error instanceof IdxApiError
    ? error.kind === 'rateLimited'
    : !!error && typeof error === 'object' && 'kind' in error && error.kind === 'rateLimited';
}

async function fetchCity(
  city: string,
  propStatus: string | undefined,
): Promise<ListingSummary[]> {
  const raw = await idxRequest<Record<string, unknown>>('/clients/searchquery', {
    query: { aw_cityName: city, propStatus, limit: IDX_RESULT_CAP },
    revalidateSeconds: SEARCH_REVALIDATE_SECONDS,
    retries: 1,
  });
  return rawToListings(raw);
}

function deduplicate(lists: ListingSummary[][]): ListingSummary[] {
  const seen = new Set<string>();
  const result: ListingSummary[] = [];
  for (const list of lists) {
    for (const l of list) {
      const key = `${l.idxId}!${l.listingId}`;
      if (!seen.has(key)) { seen.add(key); result.push(l); }
    }
  }
  return result;
}

// Throttled fetch: max CONCURRENCY simultaneous requests, DELAY_MS between
// batches — keeps cold-start refreshes bounded.
const POOL_CONCURRENCY = 3;
const POOL_BATCH_DELAY_MS = 350;
const POOL_CACHE_CHUNK_SIZE = 10;
const POOL_CACHE_CHUNK_COUNT = Math.ceil(MARKET_CITIES.length / POOL_CACHE_CHUNK_SIZE);

async function fetchPoolChunkThrottled(cities: readonly string[]): Promise<ListingSummary[]> {
  const all: ListingSummary[][] = [];
  for (let i = 0; i < cities.length; i += POOL_CONCURRENCY) {
    const batch = cities.slice(i, i + POOL_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((city) =>
        fetchCity(city, 'Active').catch((error) => {
          if (isRateLimitedError(error)) throw error;
          return [] as ListingSummary[];
        }),
      ),
    );
    all.push(...batchResults);
    if (i + POOL_CONCURRENCY < cities.length) {
      await new Promise((r) => setTimeout(r, POOL_BATCH_DELAY_MS));
    }
  }
  return deduplicate(all);
}

// Keep the existing production cache key so deployments can continue serving
// the already-warm listing feed even while IDX is temporarily rate limited.
const getActivePoolChunk = unstable_cache(
  async (chunkIndex: number) => {
    const start = chunkIndex * POOL_CACHE_CHUNK_SIZE;
    const cities = (MARKET_CITIES as readonly string[]).slice(start, start + POOL_CACHE_CHUNK_SIZE);
    return fetchPoolChunkThrottled(cities);
  },
  ['idx-active-pool-chunk-v1'],
  { revalidate: POOL_REVALIDATE_SECONDS, tags: ['idx-active-pool-chunks'] },
);

async function getActivePool(): Promise<ListingSummary[]> {
  const chunks: ListingSummary[][] = [];
  for (let index = 0; index < POOL_CACHE_CHUNK_COUNT; index++) {
    chunks.push(await getActivePoolChunk(index));
  }
  return deduplicate(chunks);
}

/** Called by the warmup cron to keep the initial listings feed pre-built. */
export async function warmListingPool(): Promise<number> {
  const listings = await getActivePool();
  return listings.length;
}

function addressSuggestionsFrom(listings: ListingSummary[]): AddressSuggestion[] {
  const seen = new Set<string>();
  return listings.flatMap((listing) => {
    const { street, city, state, postalCode } = listing.address;
    const label = [street, city, state, postalCode].filter(Boolean).join(', ');
    const key = label.toLowerCase();
    if (!street || seen.has(key) || seen.size >= 8) return [];
    seen.add(key);
    return [{ address: street, city, state, postalCode, label }];
  });
}

/**
 * MLS search.
 *
 * Specific location (address/city/county/zip): single targeted API query.
 * No location / active status: serve the cached broad service-area feed.
 * No location / other status: live parallel fetch across service-area cities.
 *
 * All price/beds/type filters are applied in memory after the fetch so every
 * filter combination shares the same cached pool with no extra API calls.
 */
export async function searchListings(filters: SearchFilters): Promise<SearchResponse> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  const hasLocationFilter =
    !!filters.address || !!filters.city || !!filters.county || !!filters.postalCode ||
    !!filters.subdivision || !!filters.mlsArea;

  let listings: ListingSummary[];

  try {
    if (hasLocationFilter) {
      // One targeted request powers both the results and autocomplete. Next's
      // data cache also deduplicates repeated searches for the same term.
      const raw = await idxRequest<Record<string, unknown>>('/clients/searchquery', {
        query: {
          aw_address: filters.address,
          aw_cityName: filters.city,
          aw_countyName: filters.county,
          aw_zipcode: filters.postalCode,
          aw_subdivision: filters.subdivision,
          aw_areaName: filters.mlsArea,
          propStatus: statusParam(filters.status),
          lp: filters.minPrice,
          hp: filters.maxPrice,
          bd: filters.minBeds,
          tb: filters.minBaths,
          limit: IDX_RESULT_CAP,
        },
        revalidateSeconds: SEARCH_REVALIDATE_SECONDS,
        retries: 1,
      });
      listings = rawToListings(raw);
    } else if (!filters.status || filters.status === 'active') {
      // Preserve the warm broad feed. If a cold chunk takes too long, cached
      // core-market queries provide a fast first-page fallback.
      const serviceAreaFallback = async () => {
        const results = await Promise.all(
          CORE_MARKET_CITIES.map((city) =>
            fetchCity(city, 'Active').catch(() => [] as ListingSummary[]),
          ),
        );
        return deduplicate(results);
      };
      if (MARKET_CITIES.length === 0) {
        // No market cities configured: one broad active query for the account's MLS
        const raw = await idxRequest<Record<string, unknown>>('/clients/searchquery', {
          query: { propStatus: 'Active', limit: IDX_RESULT_CAP },
          revalidateSeconds: SEARCH_REVALIDATE_SECONDS,
          retries: 1,
        });
        listings = rawToListings(raw);
      } else {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('pool_timeout')), 3000),
        );
        listings = await Promise.race([getActivePool(), timeout]).catch(serviceAreaFallback);
      }
    } else {
      // Non-active status (sold/pending) — live parallel fetch
      const results = await Promise.all(
        CORE_MARKET_CITIES.map((city) =>
          fetchCity(city, statusParam(filters.status)).catch(() => [] as ListingSummary[]),
        ),
      );
      listings = deduplicate(results);
    }

    // In-memory filters — applied on all paths so the cached pool is shared
    if (filters.minPrice)        listings = listings.filter((l) => l.price >= filters.minPrice!);
    if (filters.maxPrice)        listings = listings.filter((l) => l.price <= filters.maxPrice!);
    if (filters.minBeds)         listings = listings.filter((l) => (l.beds ?? 0) >= filters.minBeds!);
    if (filters.minBaths)        listings = listings.filter((l) => (l.baths ?? 0) >= filters.minBaths!);
    if (filters.minSqFt)         listings = listings.filter((l) => (l.sqFt ?? 0) >= filters.minSqFt!);
    if (filters.officeIds?.length) {
      const offices = new Set(filters.officeIds.map((id) => id.toLowerCase()));
      listings = listings.filter((l) => !!l.listingOfficeId && offices.has(l.listingOfficeId.toLowerCase()));
    }
    if (filters.propertyTypes?.length) {
      const wanted = new Set(filters.propertyTypes.map((t) => t.toLowerCase()));
      listings = listings.filter((l) => wanted.has(l.propertyType.toLowerCase()));
    }
    if (filters.keywords) {
      const needle = filters.keywords.toLowerCase();
      listings = listings.filter(
        (l) =>
          l.address.full.toLowerCase().includes(needle) ||
          l.propertyType.toLowerCase().includes(needle),
      );
    }

    switch (filters.sort) {
      case 'priceAsc':  listings = listings.sort((a, b) => a.price - b.price); break;
      case 'priceDesc': listings = listings.sort((a, b) => b.price - a.price); break;
      case 'sqftDesc':  listings = listings.sort((a, b) => (b.sqFt ?? 0) - (a.sqFt ?? 0)); break;
    }

    const totalCount = listings.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const start = (page - 1) * pageSize;
    const addressSuggestions = filters.address ? addressSuggestionsFrom(listings) : undefined;

    return {
      listings: listings.slice(start, start + pageSize),
      totalCount,
      page,
      pageSize,
      totalPages,
      addressQuery: filters.address,
      addressSuggestions,
    };
  } catch (err) {
    if (isRateLimitedError(err)) {
      return {
        listings: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 1,
        addressQuery: filters.address,
        addressSuggestions: [],
        rateLimited: true,
      };
    }
    throw err;
  }
}
