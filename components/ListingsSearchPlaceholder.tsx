"use client";

import { useMemo, useState } from "react";
import ListingsGrid from "@/components/ListingsGrid";
import type { Listing } from "@/content/site";

/* ==========================================================================
   Pre-IDX search (placeholder). Same fields and layout as the native MLS
   search Carole's site runs, but it filters the agent's own portfolio in
   memory until IDX Broker is connected. Filters live in the URL
   (?city=&minPrice=...) so shareable links keep working after the swap.
   `compact` renders the short form used on /buy, which hands off to
   /listings instead of filtering in place.
   ========================================================================== */

const PRICES: Array<[string, string]> = [
  ["1000000", "$1M"],
  ["1500000", "$1.5M"],
  ["2000000", "$2M"],
  ["2500000", "$2.5M"],
  ["3000000", "$3M"],
  ["5000000", "$5M"],
  ["7500000", "$7.5M"],
  ["10000000", "$10M"],
];

/* Values are the IDX property-type names (lib/idx/propertyTypes), so the same
   URL filters live MLS results; matching below normalises for the config's
   lowercase placeholder values. */
const TYPES: Array<[string, string]> = [
  ["Residential", "Residential"],
  ["Residential Income", "Multi-Family / Income"],
  ["Land", "Land"],
];

const SQFT: Array<[string, string]> = [
  ["1500", "1,500+"],
  ["2000", "2,000+"],
  ["2500", "2,500+"],
  ["3000", "3,000+"],
  ["4000", "4,000+"],
  ["5000", "5,000+"],
];

const PAGE_SIZE = 12;

/* Field names match lib/idx/filterParams so a search built here keeps working
   verbatim once IDX Broker is connected and /listings switches to live data. */
export type PlaceholderFilters = {
  city: string;
  minPrice: string;
  maxPrice: string;
  propertyTypes: string;
  minBeds: string;
  minBaths: string;
  minSqFt: string;
  status: string;
};

const EMPTY: PlaceholderFilters = {
  city: "", minPrice: "", maxPrice: "", propertyTypes: "", minBeds: "", minBaths: "", minSqFt: "", status: "",
};

const num = (v?: string) => (v ? parseFloat(v.replace(/[^0-9.]/g, "")) || 0 : 0);

function matches(l: Listing, f: PlaceholderFilters): boolean {
  if (f.city && !l.address.toLowerCase().includes(f.city.trim().toLowerCase())) return false;
  const price = num(l.price);
  if (f.minPrice && price < num(f.minPrice)) return false;
  if (f.maxPrice && price > num(f.maxPrice)) return false;
  const normType = (v?: string) => (v ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (f.propertyTypes && normType(l.propertyType) !== normType(f.propertyTypes)) return false;
  if (f.minBeds && num(l.beds) < num(f.minBeds)) return false;
  if (f.minBaths && num(l.baths) < num(f.minBaths)) return false;
  if (f.minSqFt && num(l.sqft) < num(f.minSqFt)) return false;
  const sold = /sold|closed/i.test(l.status ?? "");
  if (f.status === "active" && sold) return false;
  if (f.status === "sold" && !sold) return false;
  return true;
}

export default function ListingsSearchPlaceholder({
  listings,
  initial,
  compact = false,
}: {
  listings: Listing[];
  initial?: Partial<PlaceholderFilters>;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState<PlaceholderFilters>({ ...EMPTY, ...initial });
  const [applied, setApplied] = useState<PlaceholderFilters>({ ...EMPTY, ...initial });
  const [page, setPage] = useState(1);

  const set = (key: keyof PlaceholderFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const towns = useMemo(
    () => Array.from(new Set(listings.map((l) => l.address.split(",").pop()?.trim()).filter(Boolean))) as string[],
    [listings],
  );

  const results = useMemo(() => listings.filter((l) => matches(l, applied)), [listings, applied]);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(draft).forEach(([k, v]) => v && params.set(k, v));
    if (compact) {
      window.location.href = `/listings${params.size ? `?${params}` : ""}`;
      return;
    }
    setApplied(draft);
    setPage(1);
    window.history.replaceState(null, "", `/listings${params.size ? `?${params}` : ""}`);
  }

  function reset() {
    setDraft(EMPTY);
    setApplied(EMPTY);
    setPage(1);
    window.history.replaceState(null, "", "/listings");
  }

  const field = (id: keyof PlaceholderFilters, label: string, options: Array<[string, string]>, any: string) => (
    <div className="adv-search__field">
      <label htmlFor={`adv-${id}`}>{label}</label>
      <select id={`adv-${id}`} value={draft[id]} onChange={set(id)}>
        <option value="">{any}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  const counts: Array<[string, string]> = ["1", "2", "3", "4", "5"].map((n) => [n, `${n}+`]);

  return (
    <>
      <form className={`adv-search${compact ? " adv-search--compact" : ""}`} onSubmit={submit} role="search">
        <div className="adv-search__grid">
          <div className="adv-search__field adv-search__field--wide">
            <label htmlFor="adv-city">Location</label>
            <input
              id="adv-city"
              type="text"
              list="adv-towns"
              placeholder="City, neighborhood, or address"
              value={draft.city}
              onChange={set("city")}
            />
            <datalist id="adv-towns">{towns.map((t) => <option key={t} value={t} />)}</datalist>
          </div>
          {field("minPrice", "Min Price", PRICES, "No Min")}
          {field("maxPrice", "Max Price", PRICES, "No Max")}
          {field("propertyTypes", "Property Type", TYPES, "Any Type")}
          {field("minBeds", "Bedrooms", counts, "Any")}
          {field("minBaths", "Bathrooms", counts, "Any")}
          {!compact && field("minSqFt", "Min Sq Ft", SQFT, "Any Size")}
          {!compact && field("status", "Status", [["active", "Active"], ["sold", "Sold"]], "Active & Sold")}
        </div>
        <div className="adv-search__foot">
          {!compact && (
            <button type="button" className="adv-search__reset" onClick={reset}>Clear filters</button>
          )}
          <button type="submit" className="adv-search__submit">Search Listings</button>
        </div>
      </form>

      {!compact && (
        <div className="adv-results">
          <div className="adv-results__head">
            <div>
              <span className="adv-results__eyebrow">Alexa&apos;s Active &amp; Recently Sold Homes</span>
              <p className="adv-results__count">
                {results.length} {results.length === 1 ? "property" : "properties"}
              </p>
            </div>
            {results.length > 0 && (
              <span className="adv-results__range">
                Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + shown.length}
              </span>
            )}
          </div>
          {shown.length > 0 ? (
            <ListingsGrid listings={shown} />
          ) : (
            <div className="adv-results__empty">
              <p>No homes in this portfolio match those filters yet.</p>
              <button type="button" className="adv-search__reset" onClick={reset}>Clear filters</button>
            </div>
          )}
          {pages > 1 && (
            <div className="adv-results__pager">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page} of {pages}</span>
              <button type="button" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
          <p className="adv-results__note">
            Full MLS search across North County San Diego is coming soon. Looking for something
            specific? <a href="/connect">Tell Alexa what you want</a> and she&apos;ll send matches,
            including homes before they reach the portals.
          </p>
        </div>
      )}
    </>
  );
}
