"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import IdxListingCard from "@/components/idx/IdxListingCard";
import { filtersFromParams, paramsFromFilters } from "@/lib/idx/filterParams";
import type { SearchFilters, SearchResponse } from "@/lib/idx/types";

/* ==========================================================================
   Search results browser. The page SSRs the first response for SEO; this
   component takes over for filter changes, syncing filters to the URL with
   pushState so every search is shareable and the back button works.
   ========================================================================== */

export default function ListingsBrowser({
  initialFilters,
  initialResponse,
}: {
  initialFilters: SearchFilters;
  initialResponse: SearchResponse | null;
}) {
  const pathname = usePathname();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [response, setResponse] = useState<SearchResponse | null>(initialResponse);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipInitialFetchRef = useRef(initialResponse !== null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (next: SearchFilters) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings?${paramsFromFilters(next).toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data: SearchResponse = await res.json();
      setResponse(data);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("We could not load listings just now. Please try again shortly.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    fetchResults(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = useCallback(
    (next: Partial<SearchFilters>, resetPage = true) => {
      const merged: SearchFilters = { ...filters, ...next, page: resetPage ? 1 : next.page ?? 1 };
      setFilters(merged);
      window.history.pushState(null, "", `${pathname}?${paramsFromFilters(merged).toString()}`);
      fetchResults(merged);
    },
    [filters, pathname, fetchResults],
  );

  // back/forward restores the URL's filters
  useEffect(() => {
    const onPop = () => {
      const restored = filtersFromParams(new URLSearchParams(window.location.search));
      setFilters(restored);
      fetchResults(restored);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [fetchResults]);

  const totalCount = response?.totalCount ?? 0;
  const page = response?.page ?? 1;
  const pageSize = response?.pageSize ?? 21;
  const first = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalCount);

  return (
    <div className="idx-browser">
      <SearchFiltersBar filters={filters} onApply={applyFilters} />

      {response?.rateLimited && (
        <p className="idx-browser__notice">
          Live listing data is briefly unavailable. Showing the most recent results; please refresh in a minute.
        </p>
      )}
      {error && <p className="idx-browser__notice idx-browser__notice--error">{error}</p>}

      <p className="idx-browser__count" aria-live="polite">
        {totalCount > 0 ? `Showing ${first}–${last} of ${totalCount.toLocaleString()} homes` : loading ? "Searching…" : "No listings match these filters yet. Adjust the filters or reach out and we will search the full MLS for you."}
      </p>

      <div className={`listings-grid${loading ? " listings-grid--loading" : ""}`}>
        {response?.listings.map((listing) => (
          <IdxListingCard listing={listing} key={`${listing.idxId}-${listing.listingId}`} />
        ))}
      </div>

      {response && response.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={response.totalPages}
          onPage={(p) => {
            applyFilters({ page: p }, false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      <p className="idx-browser__disclaimer">
        Listing information is deemed reliable but not guaranteed and should be independently verified. IDX
        information is provided exclusively for consumers&apos; personal, non-commercial use and may not be used for
        any purpose other than to identify prospective properties consumers may be interested in purchasing.
      </p>
    </div>
  );
}

function SearchFiltersBar({
  filters,
  onApply,
}: {
  filters: SearchFilters;
  onApply: (next: Partial<SearchFilters>) => void;
}) {
  const [location, setLocation] = useState(filters.city ?? filters.address ?? "");

  useEffect(() => {
    setLocation(filters.city ?? filters.address ?? "");
  }, [filters.city, filters.address]);

  const submitLocation = () => {
    const value = location.trim();
    // Digits usually mean an address search; otherwise treat as a city
    const isAddress = /\d/.test(value);
    onApply({ address: isAddress ? value : undefined, city: !isAddress && value ? value : undefined });
  };

  return (
    <div className="idx-filters">
      <div className="idx-filters__location">
        <input
          type="text"
          value={location}
          placeholder="City or Address"
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitLocation()}
          aria-label="Search by city or address"
        />
        <button type="button" onClick={submitLocation} aria-label="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        </button>
      </div>

      <select
        value={filters.minPrice ?? ""}
        onChange={(e) => onApply({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
        aria-label="Minimum price"
      >
        <option value="">Min Price</option>
        {[250000, 500000, 750000, 1000000, 2000000, 3000000, 5000000, 10000000].map((v) => (
          <option value={v} key={v}>${(v / 1000000 >= 1 ? `${v / 1000000}M` : `${v / 1000}K`)}</option>
        ))}
      </select>

      <select
        value={filters.maxPrice ?? ""}
        onChange={(e) => onApply({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
        aria-label="Maximum price"
      >
        <option value="">Max Price</option>
        {[500000, 750000, 1000000, 2000000, 3000000, 5000000, 10000000, 20000000].map((v) => (
          <option value={v} key={v}>${(v / 1000000 >= 1 ? `${v / 1000000}M` : `${v / 1000}K`)}</option>
        ))}
      </select>

      <select
        value={filters.minBeds ?? ""}
        onChange={(e) => onApply({ minBeds: e.target.value ? Number(e.target.value) : undefined })}
        aria-label="Minimum bedrooms"
      >
        <option value="">Beds</option>
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <option value={v} key={v}>{v}+</option>
        ))}
      </select>

      <select
        value={filters.minBaths ?? ""}
        onChange={(e) => onApply({ minBaths: e.target.value ? Number(e.target.value) : undefined })}
        aria-label="Minimum bathrooms"
      >
        <option value="">Baths</option>
        {[1, 2, 3, 4, 5].map((v) => (
          <option value={v} key={v}>{v}+</option>
        ))}
      </select>

      <select
        value={filters.status ?? "active"}
        onChange={(e) => onApply({ status: e.target.value as SearchFilters["status"] })}
        aria-label="Listing status"
      >
        <option value="active">For Sale</option>
        <option value="pending">Pending</option>
        <option value="sold">Sold</option>
      </select>

      <select
        value={filters.sort ?? ""}
        onChange={(e) => onApply({ sort: (e.target.value || undefined) as SearchFilters["sort"] })}
        aria-label="Sort order"
      >
        <option value="">Sort</option>
        <option value="priceDesc">Price: High to Low</option>
        <option value="priceAsc">Price: Low to High</option>
        <option value="sqftDesc">Largest First</option>
      </select>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const pages: (number | "...")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return (
    <nav className="idx-pagination" aria-label="Search results pages">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="idx-pagination__gap">&hellip;</span>
        ) : (
          <button
            type="button"
            key={p}
            className={p === page ? "is-current" : undefined}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
    </nav>
  );
}
