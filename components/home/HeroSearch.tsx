"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LocationAutocomplete, {
  freeTextSelection,
  type LocationSelection,
} from "@/components/idx/LocationAutocomplete";
import { paramsFromFilters } from "@/lib/idx/filterParams";
import type { SearchFilters } from "@/lib/idx/types";

/* ==========================================================================
   Homepage MLS search.

   One field and one row of buttons, because a hero is not the place for six
   filters. It reuses the results page's own autocomplete, so it suggests the
   cities and neighborhoods this agent actually serves and a search started
   here lands on exactly the filters /listings understands.

   The old hero carried a "Search Homes" link beside "Let's Connect"; the bar
   replaces the first, so the second moves inside it. Two ways to start the
   same journey, sitting side by side, is a choice nobody wants to make.

   It is a real <form>: Enter submits natively, and a submit button survives a
   re-render mid-click in a way an onClick handler does not.

   The quick links underneath are the client's service areas: most visitors
   have a town in mind and never type at all.
   ========================================================================== */

export interface HeroSearchArea {
  label: string;
  cityId?: string;
}

export default function HeroSearch({
  areas = [],
  placeholder = "Search by city or neighborhood",
  connectLabel,
  connectHref,
}: {
  areas?: HeroSearchArea[];
  placeholder?: string;
  connectLabel?: string;
  connectHref?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  /*
   * The hero clips its own overflow (the Ken Burns drift would otherwise
   * spill down the page), which silently cut the bottom off the suggestion
   * menu. Measure the nearest clipping ancestor and hand the menu the height
   * it can actually use; it scrolls inside whatever is left.
   */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const bar = el.querySelector(".hs__bar");
      if (!bar) return;
      let clip: HTMLElement | null = el.parentElement;
      while (clip && getComputedStyle(clip).overflow === "visible") clip = clip.parentElement;
      const box = clip?.getBoundingClientRect();
      const barBox = bar.getBoundingClientRect();
      const floor = Math.min(box?.bottom ?? Infinity, window.innerHeight);
      const ceiling = Math.max(box?.top ?? 0, 0);
      const below = Math.round(floor - barBox.bottom - 22);
      const above = Math.round(barBox.top - ceiling - 22);
      /* This hero is bottom-aligned, so there is usually far more room above
         the bar than under it. Flip upward when that is true rather than
         squeezing nine suggestions into a 170px slot. */
      const up = above > below && below < 260;
      el.dataset.menuUp = up ? "1" : "0";
      el.style.setProperty("--hs-menu-max", `${Math.max(150, Math.min(340, up ? above : below))}px`);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, []);

  function go(filters: Partial<SearchFilters>) {
    const params = paramsFromFilters({ ...filters, status: "active" } as SearchFilters);
    router.push(`/listings?${params.toString()}`);
  }

  function search(selection: LocationSelection) {
    go({
      cityId: selection.cityId,
      city: selection.city,
      subdivision: selection.subdivision,
      address: selection.address,
    });
  }

  return (
    <div className="hs" ref={wrapRef}>
      <form
        className="hs__bar"
        onSubmit={(e) => {
          e.preventDefault();
          search(freeTextSelection(value));
        }}
      >
        <svg className="hs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" strokeLinecap="round" />
        </svg>

        <LocationAutocomplete
          id="hero-search"
          value={value}
          onChange={setValue}
          onSelect={search}
          onSubmit={(raw) => search(freeTextSelection(raw))}
          placeholder={placeholder}
        />

        <div className="hs__actions">
          <button type="submit" className="hs__btn">Search Homes</button>
          {connectLabel && connectHref && (
            <a href={connectHref} className="hs__btn hs__btn--ghost">{connectLabel}</a>
          )}
        </div>
      </form>

      {areas.length > 0 && (
        <div className="hs__quick">
          <span className="hs__quick-label">Popular</span>
          {areas.map((a) => (
            <button
              key={a.label}
              type="button"
              className="hs__chip"
              onClick={() => go(a.cityId ? { cityId: a.cityId, city: a.label } : { city: a.label })}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
