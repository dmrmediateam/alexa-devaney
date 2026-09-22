"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import IdxListingCard from "@/components/idx/IdxListingCard";
import LocationAutocomplete, { freeTextSelection } from "@/components/idx/LocationAutocomplete";
import FilterSelect from "@/components/idx/FilterSelect";
import { PROPERTY_TYPES } from "@/lib/idx/propertyTypes";
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
          setError(
          (err as Error).message?.includes("429")
            ? "Live MLS data is busy right now."
            : "We could not load listings just now.",
        );
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
      {error && (
        <p className="idx-browser__notice idx-browser__notice--error" role="status">
          {error}{" "}
          <button type="button" className="idx-browser__retry" onClick={() => fetchResults(filters)}>
            Try again
          </button>{" "}
          or <a href="/connect">ask Alexa to search for you</a>.
        </p>
      )}

      <p className="idx-browser__count" aria-live="polite">
        {/* Always announce the search while it runs: a cold city query takes a
            few seconds, and leaving the previous count on screen reads as if
            nothing happened. */}
        {loading
          ? "Searching the MLS…"
          : totalCount > 0
            ? `Showing ${first}–${last} of ${totalCount.toLocaleString()} homes`
            : "No listings match these filters yet. Adjust the filters or reach out and we will search the full MLS for you."}
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
  const [location, setLocation] = useState(
    filters.subdivision ?? filters.city ?? filters.address ?? "",
  );

  useEffect(() => {
    setLocation(filters.subdivision ?? filters.city ?? filters.address ?? "");
  }, [filters.subdivision, filters.city, filters.address]);

  /** Replace the whole location group so a new pick never stacks on the old */
  const applyLocation = (next: Partial<SearchFilters>) =>
    onApply({ address: undefined, city: undefined, cityId: undefined, subdivision: undefined, ...next });

  return (
    <div className="idx-filters">
      <div className="idx-filters__location">
        <LocationAutocomplete
          value={location}
          onChange={setLocation}
          onSelect={(sel) =>
            applyLocation({ cityId: sel.cityId, city: sel.city, subdivision: sel.subdivision, address: sel.address })
          }
          onSubmit={(raw) => {
            const sel = freeTextSelection(raw);
            applyLocation({ city: sel.city, address: sel.address });
          }}
        />
        <button
          type="button"
          onClick={() => {
            const sel = freeTextSelection(location);
            applyLocation({ city: sel.city, address: sel.address });
          }}
          aria-label="Search"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        </button>
      </div>

      <FilterSelect
        label="Minimum price"
        placeholder="Min Price"
        value={filters.minPrice ? String(filters.minPrice) : ""}
        options={[250000, 500000, 750000, 1000000, 2000000, 3000000, 5000000, 10000000].map((v) => ({
          value: String(v),
          label: priceLabel(v),
        }))}
        onChange={(v) => onApply({ minPrice: v ? Number(v) : undefined })}
      />

      <FilterSelect
        label="Maximum price"
        placeholder="Max Price"
        value={filters.maxPrice ? String(filters.maxPrice) : ""}
        options={[500000, 750000, 1000000, 2000000, 3000000, 5000000, 10000000, 20000000].map((v) => ({
          value: String(v),
          label: priceLabel(v),
        }))}
        onChange={(v) => onApply({ maxPrice: v ? Number(v) : undefined })}
      />

      <FilterSelect
        label="Minimum bedrooms"
        placeholder="Beds"
        value={filters.minBeds ? String(filters.minBeds) : ""}
        options={[1, 2, 3, 4, 5, 6].map((v) => ({ value: String(v), label: `${v}+ Beds` }))}
        onChange={(v) => onApply({ minBeds: v ? Number(v) : undefined })}
      />

      <FilterSelect
        label="Minimum bathrooms"
        placeholder="Baths"
        value={filters.minBaths ? String(filters.minBaths) : ""}
        options={[1, 2, 3, 4, 5].map((v) => ({ value: String(v), label: `${v}+ Baths` }))}
        onChange={(v) => onApply({ minBaths: v ? Number(v) : undefined })}
      />

      <FilterSelect
        label="Property type"
        placeholder="Property Type"
        value={filters.propertyTypes?.[0] ?? ""}
        options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))}
        onChange={(v) => onApply({ propertyTypes: v ? [v] : undefined })}
      />

      <FilterSelect
        label="Listing status"
        placeholder="For Sale"
        value={filters.status && filters.status !== "active" ? filters.status : ""}
        options={[
          { value: "active", label: "For Sale" },
          { value: "pending", label: "Pending" },
          { value: "sold", label: "Sold" },
        ]}
        onChange={(v) => onApply({ status: (v || "active") as SearchFilters["status"] })}
      />

      <FilterSelect
        label="Sort order"
        placeholder="Sort"
        value={filters.sort ?? ""}
        options={[
          { value: "newest", label: "Newest First" },
          { value: "priceDesc", label: "Price: High to Low" },
          { value: "priceAsc", label: "Price: Low to High" },
          { value: "sqftDesc", label: "Largest First" },
        ]}
        onChange={(v) => onApply({ sort: (v || undefined) as SearchFilters["sort"] })}
      />
    </div>
  );
}

/** $2.5M, $750K */
function priceLabel(value: number): string {
  return value >= 1000000 ? `$${value / 1000000}M` : `$${value / 1000}K`;
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
