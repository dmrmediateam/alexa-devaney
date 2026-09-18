"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FieldMenu from "@/components/ui/FieldMenu";
import type { Listing } from "@/content/site";
import type { ListingSummary, SearchResponse } from "@/lib/idx/types";

/* ==========================================================================
   Buy page search: one compact search bar over a live results grid.

   Location, type, beds and baths sit inline; price and living-area ranges
   live in a dropdown so the bar stays a single row. With IDX connected it
   queries /api/listings; otherwise the same filters run in memory against
   the config's placeholder listings, so search works in either state.
   ========================================================================== */

interface Filters {
  location: string;
  propertyType: string;
  minBeds: string;
  minBaths: string;
  minPrice: string;
  maxPrice: string;
  minSqFt: string;
  maxSqFt: string;
}

const EMPTY: Filters = {
  location: "",
  propertyType: "",
  minBeds: "",
  minBaths: "",
  minPrice: "",
  maxPrice: "",
  minSqFt: "",
  maxSqFt: "",
};

const PRICE_MAX = 20000000;
const SQFT_MAX = 10000;

function money(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `$${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
  }
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

/** Accepts "$2.5M", "2,500,000", "750k" */
function parseMoney(text: string): number {
  const cleaned = text.trim().toLowerCase().replace(/[$,\s]/g, "");
  const value = parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  if (cleaned.endsWith("m")) return Math.round(value * 1000000);
  if (cleaned.endsWith("k")) return Math.round(value * 1000);
  return Math.round(value);
}

/** Placeholder listings store display strings; pull the number back out. */
function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const digits = value.replace(/[^0-9.]/g, "");
  return digits ? parseFloat(digits) : 0;
}

function fallbackToSummary(listing: Listing, index: number): ListingSummary {
  return {
    idxId: "demo",
    listingId: String(index),
    mlsNumber: listing.mls ?? "",
    slug: "",
    status: (listing.status ?? "").toLowerCase().includes("pend") ? "pending" : "active",
    price: toNumber(listing.price),
    beds: toNumber(listing.beds),
    baths: toNumber(listing.baths),
    sqFt: toNumber(listing.sqft) || null,
    address: {
      full: listing.address,
      street: listing.address.split(",")[0] ?? listing.address,
      city: listing.address.split(",")[1]?.trim() ?? "",
      state: "",
      postalCode: "",
      slug: "",
    },
    primaryPhoto: { url: listing.image },
    propertyType: listing.propertyType ?? "Residential",
    waterfront: false,
    featured: true,
    detailUrl: listing.href,
  };
}

export default function PropertySearchExperience({
  idxEnabled,
  fallbackListings,
  searchHref,
}: {
  idxEnabled: boolean;
  fallbackListings: Listing[];
  /** Where "View all results" links (the full MLS search page) */
  searchHref: string;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [results, setResults] = useState<ListingSummary[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangesOpen, setRangesOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const rangesRef = useRef<HTMLDivElement | null>(null);

  const demoListings = useMemo(
    () => fallbackListings.map((listing, i) => fallbackToSummary(listing, i)),
    [fallbackListings],
  );

  const runLocalSearch = useCallback(
    (next: Filters) => {
      const needle = next.location.trim().toLowerCase();
      const filtered = demoListings.filter((listing) => {
        if (needle && !listing.address.full.toLowerCase().includes(needle)) return false;
        if (next.minPrice && listing.price < Number(next.minPrice)) return false;
        if (next.maxPrice && listing.price > Number(next.maxPrice)) return false;
        if (next.minBeds && listing.beds < Number(next.minBeds)) return false;
        if (next.minBaths && listing.baths < Number(next.minBaths)) return false;
        if (next.minSqFt && (listing.sqFt ?? 0) < Number(next.minSqFt)) return false;
        if (next.maxSqFt && (listing.sqFt ?? 0) > Number(next.maxSqFt)) return false;
        if (next.propertyType && listing.propertyType.toLowerCase() !== next.propertyType) return false;
        return true;
      });
      setResults(filtered);
      setTotal(filtered.length);
    },
    [demoListings],
  );

  const runSearch = useCallback(
    async (next: Filters) => {
      if (!idxEnabled) {
        runLocalSearch(next);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const location = next.location.trim();
        if (location) params.set(/\d/.test(location) ? "address" : "city", location);
        if (next.minPrice) params.set("minPrice", next.minPrice);
        if (next.maxPrice) params.set("maxPrice", next.maxPrice);
        if (next.minBeds) params.set("minBeds", next.minBeds);
        if (next.minBaths) params.set("minBaths", next.minBaths);
        if (next.minSqFt) params.set("minSqFt", next.minSqFt);
        if (next.propertyType) params.set("propertyTypes", next.propertyType);
        params.set("pageSize", "6");
        const res = await fetch(`/api/listings?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error("search failed");
        const data: SearchResponse = await res.json();
        setResults(data.listings);
        setTotal(data.totalCount);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Search is unavailable right now. Please try again shortly.");
        }
      } finally {
        setLoading(false);
      }
    },
    [idxEnabled, runLocalSearch],
  );

  // Show something on first paint
  useEffect(() => {
    runSearch(EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the range dropdown on outside click or Escape
  useEffect(() => {
    if (!rangesOpen) return;
    const onDown = (event: MouseEvent) => {
      if (rangesRef.current && !rangesRef.current.contains(event.target as Node)) setRangesOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setRangesOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [rangesOpen]);

  const commitRange = (loKey: keyof Filters, hiKey: keyof Filters, lo: number, hi: number) => {
    const ceiling = loKey === "minPrice" ? PRICE_MAX : SQFT_MAX;
    const next = {
      ...filters,
      [loKey]: lo > 0 ? String(lo) : "",
      [hiKey]: hi > 0 && hi < ceiling ? String(hi) : "",
    } as Filters;
    setFilters(next);
    runSearch(next);
  };

  const update = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (key !== "location") runSearch(next);
  };

  const fullSearchUrl = () => {
    const params = new URLSearchParams();
    const location = filters.location.trim();
    if (location) params.set(/\d/.test(location) ? "address" : "city", location);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.minBeds) params.set("minBeds", filters.minBeds);
    if (filters.minBaths) params.set("minBaths", filters.minBaths);
    if (filters.minSqFt) params.set("minSqFt", filters.minSqFt);
    const query = params.toString();
    return query ? `${searchHref}?${query}` : searchHref;
  };

  const rangeLabel = () => {
    const lo = filters.minPrice ? money(Number(filters.minPrice)) : null;
    const hi = filters.maxPrice ? money(Number(filters.maxPrice)) : null;
    if (lo && hi) return `${lo} – ${hi}`;
    if (lo) return `${lo}+`;
    if (hi) return `Up to ${hi}`;
    if (filters.minSqFt || filters.maxSqFt) return "Size set";
    return "Any Price";
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <section className="solid-section">
      <div className="property-search lp-container lp-vertical-paddings">
        <form
          className="searchbar"
          onSubmit={(e) => {
            e.preventDefault();
            setRangesOpen(false);
            runSearch(filters);
          }}
        >
          <div className="searchbar__field searchbar__field--location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            <input
              type="text"
              value={filters.location}
              placeholder="City, Neighborhood, or Address"
              onChange={(e) => update("location", e.target.value)}
              aria-label="Search by city, neighborhood, or address"
            />
          </div>

          <span className="searchbar__divider" aria-hidden="true" />

          <div className="searchbar__field">
            <FieldMenu
              ariaLabel="Property type"
              placeholder="Any Type"
              value={filters.propertyType}
              onChange={(next) => update("propertyType", next)}
              options={[
                { value: "", label: "Any Type" },
                { value: "single-family", label: "Single Family" },
                { value: "condominium", label: "Condominium" },
                { value: "townhouse", label: "Townhouse" },
                { value: "land", label: "Land" },
              ]}
            />
          </div>

          <span className="searchbar__divider" aria-hidden="true" />

          <div className="searchbar__field searchbar__field--tight">
            <FieldMenu
              ariaLabel="Minimum bedrooms"
              placeholder="Beds"
              value={filters.minBeds}
              onChange={(next) => update("minBeds", next)}
              options={[{ value: "", label: "Any Beds" }, ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n}+ Beds` }))]}
            />
          </div>

          <span className="searchbar__divider" aria-hidden="true" />

          <div className="searchbar__field searchbar__field--tight">
            <FieldMenu
              ariaLabel="Minimum bathrooms"
              placeholder="Baths"
              value={filters.minBaths}
              onChange={(next) => update("minBaths", next)}
              options={[{ value: "", label: "Any Baths" }, ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+ Baths` }))]}
            />
          </div>

          <span className="searchbar__divider" aria-hidden="true" />

          <div className="searchbar__ranges" ref={rangesRef}>
            <button
              type="button"
              className={`searchbar__trigger${rangesOpen ? " is-open" : ""}`}
              onClick={() => setRangesOpen((open) => !open)}
              aria-expanded={rangesOpen}
            >
              {rangeLabel()}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {rangesOpen && (
              <div className="searchbar__popover">
                <RangeField
                  label="Price"
                  min={0}
                  max={PRICE_MAX}
                  step={100000}
                  minValue={filters.minPrice}
                  maxValue={filters.maxPrice}
                  format={money}
                  parse={parseMoney}
                  onCommit={(lo, hi) => commitRange("minPrice", "maxPrice", lo, hi)}
                />
                <RangeField
                  label="Living Area"
                  min={0}
                  max={SQFT_MAX}
                  step={100}
                  minValue={filters.minSqFt}
                  maxValue={filters.maxSqFt}
                  format={(v) => `${v.toLocaleString()} sqft`}
                  parse={(text) => Number(text.replace(/[^0-9]/g, "")) || 0}
                  onCommit={(lo, hi) => commitRange("minSqFt", "maxSqFt", lo, hi)}
                />
              </div>
            )}
          </div>

          <button type="submit" className="searchbar__submit">Search</button>
        </form>

        <div className="property-search__results">
          <div className="property-search__meta">
            <p className="property-search__count" aria-live="polite">
              {loading
                ? "Searching…"
                : error
                  ? error
                  : total === 0
                    ? "No properties match these filters. Adjust your search or reach out and we will look across the full MLS for you."
                    : total !== null
                      ? `${total.toLocaleString()} ${total === 1 ? "property" : "properties"}${idxEnabled ? "" : " (sample portfolio)"}`
                      : ""}
            </p>
            {hasFilters && (
              <button
                type="button"
                className="property-search__reset"
                onClick={() => {
                  setFilters(EMPTY);
                  runSearch(EMPTY);
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className={`listings-grid${loading ? " listings-grid--loading" : ""}`}>
            {results?.map((listing) => (
              <SearchResultCard listing={listing} key={`${listing.idxId}-${listing.listingId}`} />
            ))}
          </div>

          {idxEnabled && (total ?? 0) > 6 && (
            <div className="property-search__more">
              <a href={fullSearchUrl()} className="lp-btn lp-btn--outline">View All {total?.toLocaleString()} Listings</a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Dual-handle slider with editable value inputs on both ends */
function RangeField({
  label,
  min,
  max,
  step,
  minValue,
  maxValue,
  format,
  parse,
  onCommit,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  minValue: string;
  maxValue: string;
  format: (value: number) => string;
  parse: (text: string) => number;
  onCommit: (lo: number, hi: number) => void;
}) {
  const lo = minValue ? Number(minValue) : min;
  const hi = maxValue ? Number(maxValue) : max;
  const [draft, setDraft] = useState<{ lo: string | null; hi: string | null }>({ lo: null, hi: null });

  const pct = (value: number) => ((value - min) / (max - min)) * 100;

  const commitText = (which: "lo" | "hi", text: string) => {
    const parsed = parse(text);
    if (which === "lo") {
      onCommit(Math.max(min, Math.min(parsed, hi)), hi);
    } else {
      onCommit(lo, parsed === 0 ? max : Math.min(max, Math.max(parsed, lo)));
    }
    setDraft({ lo: null, hi: null });
  };

  return (
    <div className="range-field">
      <div className="range-field__head">
        <span className="range-field__label">{label}</span>
        <div className="range-field__inputs">
          <input
            type="text"
            value={draft.lo ?? format(lo)}
            aria-label={`Minimum ${label}`}
            onChange={(e) => setDraft((d) => ({ ...d, lo: e.target.value }))}
            onBlur={(e) => commitText("lo", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          <span className="range-field__dash">to</span>
          <input
            type="text"
            value={draft.hi ?? (hi >= max ? `${format(max)}+` : format(hi))}
            aria-label={`Maximum ${label}`}
            onChange={(e) => setDraft((d) => ({ ...d, hi: e.target.value }))}
            onBlur={(e) => commitText("hi", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
        </div>
      </div>
      <div className="range-slider">
        <div className="range-slider__track" />
        <div className="range-slider__fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label={`${label} minimum slider`}
          onChange={(e) => onCommit(Math.min(Number(e.target.value), hi), hi)}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={`${label} maximum slider`}
          onChange={(e) => onCommit(lo, Math.max(Number(e.target.value), lo))}
        />
      </div>
    </div>
  );
}

function SearchResultCard({ listing }: { listing: ListingSummary }) {
  const price = listing.price
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(listing.price)
    : "Price on request";
  return (
    <a className="listing-card" href={listing.detailUrl || "#"}>
      <div className="listing-card__media">
        {listing.primaryPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.primaryPhoto.url} alt={listing.address.full} loading="lazy" />
        ) : (
          <div className="listing-card__nophoto">Photo Coming Soon</div>
        )}
        <div className="listing-card__badges">
          <span>{listing.status === "pending" ? "Pending" : listing.status === "sold" ? "Sold" : "For Sale"}</span>
          {listing.mlsNumber && <span>MLS&reg; {listing.mlsNumber}</span>}
        </div>
      </div>
      <div className="listing-card__body">
        <span className="listing-card__price">{price}</span>
        <span className="listing-card__address">{listing.address.full}</span>
        <span className="listing-card__meta">
          {[
            listing.beds ? `${listing.beds} Beds` : null,
            listing.baths ? `${listing.baths} Baths` : null,
            listing.sqFt ? `${listing.sqFt.toLocaleString()} Sq.Ft.` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
    </a>
  );
}
