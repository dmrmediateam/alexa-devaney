"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

/* ==========================================================================
   Location field for MLS search.

   The index (cities + neighborhoods) loads on first focus rather than page
   load, so the search page costs nothing extra to render. Selecting a city
   passes its MLS ID; selecting a neighborhood passes the subdivision name;
   free-typed text still searches as an address or city name.

   Keyboard: Down/Up move, Enter selects (or submits raw text), Escape closes.
   Markup follows the combobox pattern so screen readers announce the count
   and the active option.
   ========================================================================== */

export interface LocationSelection {
  label: string;
  cityId?: string;
  city?: string;
  subdivision?: string;
  address?: string;
}

interface CityOption { id: string; name: string; state?: string }
interface Suggestion { kind: "city" | "neighborhood"; label: string; cityId?: string }

const MAX_PER_GROUP = 6;

let indexPromise: Promise<{ cities: CityOption[]; neighborhoods: string[] }> | null = null;
function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch("/api/locations")
      .then((r) => (r.ok ? r.json() : { cities: [], neighborhoods: [] }))
      .catch(() => ({ cities: [], neighborhoods: [] }));
  }
  return indexPromise;
}

/** Free text: digits usually mean a street address, otherwise a city name. */
export function freeTextSelection(value: string): LocationSelection {
  const trimmed = value.trim();
  const isAddress = /\d/.test(trimmed);
  return {
    label: trimmed,
    address: isAddress ? trimmed : undefined,
    city: isAddress || !trimmed ? undefined : trimmed,
  };
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  onSubmit,
  placeholder = "City, neighborhood, or address",
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: LocationSelection) => void;
  /** Enter with no highlighted option: search the raw text */
  onSubmit: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const reactId = useId();
  const inputId = id ?? `loc-${reactId}`;
  const listId = `${inputId}-listbox`;
  const [index, setIndex] = useState<{ cities: CityOption[]; neighborhoods: string[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => { setQuery(value); }, [value]);

  // Debounce what we filter on, not what the field shows
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebounced(query), 140);
    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  const warm = useCallback(() => {
    if (index) return;
    loadIndex().then(setIndex);
  }, [index]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const term = debounced.trim().toLowerCase();
    if (!index || term.length < 2) return [];
    const startsFirst = (a: string, b: string) => {
      const aStarts = a.toLowerCase().startsWith(term) ? 0 : 1;
      const bStarts = b.toLowerCase().startsWith(term) ? 0 : 1;
      return aStarts - bStarts || a.localeCompare(b);
    };
    const cities = index.cities
      .filter((c) => c.name.toLowerCase().includes(term))
      .sort((a, b) => startsFirst(a.name, b.name))
      .slice(0, MAX_PER_GROUP)
      .map<Suggestion>((c) => ({
        kind: "city",
        label: c.state ? `${c.name}, ${c.state}` : c.name,
        cityId: c.id,
      }));
    const neighborhoods = index.neighborhoods
      .filter((n) => n.toLowerCase().includes(term))
      .sort(startsFirst)
      .slice(0, MAX_PER_GROUP)
      .map<Suggestion>((n) => ({ kind: "neighborhood", label: n }));
    return [...cities, ...neighborhoods];
  }, [index, debounced]);

  useEffect(() => { setActive(-1); }, [debounced]);

  // Close when focus or a click leaves the field
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function choose(s: Suggestion) {
    const label = s.kind === "city" ? s.label.split(",")[0] : s.label;
    onChange(label);
    setQuery(label);
    setOpen(false);
    setActive(-1);
    onSelect(
      s.kind === "city"
        ? { label, cityId: s.cityId, city: label }
        : { label, subdivision: s.label },
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!open && suggestions.length) { setOpen(true); return; }
      if (!suggestions.length) return;
      e.preventDefault();
      setActive((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        if (next < 0) return suggestions.length - 1;
        if (next >= suggestions.length) return 0;
        return next;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && suggestions[active]) choose(suggestions[active]);
      else { setOpen(false); onSubmit(query); }
      return;
    }
    if (e.key === "Escape") { setOpen(false); setActive(-1); }
  }

  const cityCount = suggestions.filter((s) => s.kind === "city").length;
  const showList = open && suggestions.length > 0;

  return (
    <div className="loc" ref={wrapRef}>
      <input
        id={inputId}
        type="text"
        className="loc__input"
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${inputId}-opt-${active}` : undefined}
        aria-label="Search by city, neighborhood, or address"
        onFocus={() => { warm(); setOpen(true); }}
        onChange={(e) => { onChange(e.target.value); setQuery(e.target.value); setOpen(true); }}
        onKeyDown={onKeyDown}
      />

      <span className="visually-hidden" aria-live="polite">
        {showList ? `${suggestions.length} location suggestions available` : ""}
      </span>

      {showList && (
        <ul className="loc__menu" id={listId} role="listbox" aria-label="Locations">
          {cityCount > 0 && <li className="loc__group" role="presentation">Cities</li>}
          {suggestions.map((s, i) =>
            s.kind === "neighborhood" && i === cityCount ? (
              <li key="nb-head-and-first" role="presentation" className="loc__group-wrap">
                <span className="loc__group" role="presentation">Neighborhoods</span>
                <button
                  type="button"
                  id={`${inputId}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`loc__option${i === active ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s)}
                >
                  {s.label}
                </button>
              </li>
            ) : (
              <li key={`${s.kind}-${s.label}`} role="presentation">
                <button
                  type="button"
                  id={`${inputId}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`loc__option${i === active ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s)}
                >
                  {s.label}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
