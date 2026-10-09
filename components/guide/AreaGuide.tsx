"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountUpStat from "@/components/home/CountUpStat";
import type { AreaGuide as AreaGuideData, GuidePlace } from "@/content/guides/types";
import type { MapCamera } from "./GuideMap";
import AskModal from "./AskModal";
import { GUIDE_NEIGHBORHOOD_EVENT } from "@/components/nav/communities";

/* ==========================================================================
   Interactive area guide: overview + stats, then the explorer.

   The explorer is one full-width map with everything else layered on it:
   the neighborhood panel (with the Ask button) floats over the left side,
   a selected place opens in a card in the bottom-right corner, and the
   places run in a rail directly under the map that expands to a full grid.
   Nothing on the page scrolls inside anything else.

   Everything is driven by the area's `guide` config, so another town is a
   data file, not a component.
   ========================================================================== */

// MapLibre touches `window` on import; keep it out of the server render.
const GuideMap = dynamic(() => import("./GuideMap"), {
  ssr: false,
  loading: () => <div className="ag-map__canvas ag-map__canvas--loading" />,
});

export default function AreaGuide({
  guide,
  areaTitle,
  consent,
  agent,
}: {
  guide: AreaGuideData;
  areaTitle: string;
  consent: string;
  /** Who the neighborhood enquiry goes to; the photo sits on the button */
  agent: { name: string; photo?: string };
}) {
  const [hoodId, setHoodId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  // Every guide has pinned places, so the town always has a frame.
  const townView = useMemo(() => frame(guide.places)!, [guide.places]);
  const [camera, setCamera] = useState<MapCamera>(townView);
  const [askOpen, setAskOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [railEdge, setRailEdge] = useState({ start: true, end: false });
  const firstName = agent.name.split(" ")[0];

  const mapRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLUListElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);

  const hood = guide.neighborhoods.find((n) => n.id === hoodId) ?? null;
  const hoodIndex = hood ? guide.neighborhoods.indexOf(hood) : -1;
  const askPlace = hood?.name ?? areaTitle;
  const hoodName = useMemo(
    () => Object.fromEntries(guide.neighborhoods.map((n) => [n.id, n.name])),
    [guide.neighborhoods],
  );
  const categoryLabel = useMemo(
    () => Object.fromEntries(guide.categories.map((c) => [c.id, c.label])),
    [guide.categories],
  );

  const inHood = useMemo(
    () => guide.places.filter((p) => !hoodId || p.neighborhood === hoodId),
    [guide.places, hoodId],
  );
  const visible = useMemo(
    () => inHood.filter((p) => !categoryId || p.categories.includes(categoryId)),
    [inHood, categoryId],
  );
  const visibleIds = useMemo(() => new Set(visible.map((p) => p.id)), [visible]);
  const selected = visible.find((p) => p.id === selectedId) ?? null;
  const pinCount = visible.filter((p) => p.coords).length;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    inHood.forEach((p) => p.categories.forEach((id) => (c[id] = (c[id] ?? 0) + 1)));
    return c;
  }, [inHood]);

  useEffect(() => {
    const tabs = tabsRef.current;
    const active = tabs?.querySelector<HTMLElement>(".ag-tab.is-active");
    if (tabs && active && tabs.scrollWidth > tabs.clientWidth) {
      tabs.scrollTo({ left: active.offsetLeft - 16, behavior: "smooth" });
    }
  }, [hoodId]);

  /* A category with nothing in this neighborhood would leave an empty rail
     and a bare map; fall back to everything instead. */
  useEffect(() => {
    if (categoryId && !counts[categoryId]) setCategoryId(null);
  }, [categoryId, counts]);

  /* ---- rail: arrow state, and back to the start when the set changes ---- */
  const updateEdges = useCallback(() => {
    const r = railRef.current;
    if (!r) return;
    setRailEdge({ start: r.scrollLeft < 4, end: r.scrollLeft + r.clientWidth >= r.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    railRef.current?.scrollTo({ left: 0 });
    updateEdges();
  }, [hoodId, categoryId, showAll, updateEdges]);
  useEffect(() => {
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  const slide = (dir: 1 | -1) => {
    const r = railRef.current;
    if (!r) return;
    r.scrollBy({ left: dir * Math.max(r.clientWidth * 0.8, 300), behavior: "smooth" });
  };

  const chooseHood = useCallback(
    (id: string | null) => {
      setHoodId(id);
      setSelectedId(null);
      // Frame the neighborhood's own pins, so every screen size shows all of them.
      const n = guide.neighborhoods.find((x) => x.id === id);
      const pinned = n ? frame(guide.places.filter((p) => p.neighborhood === n.id)) : null;
      setCamera(pinned ?? (n?.focus ? { center: n.focus.center, zoom: n.focus.zoom } : townView));
    },
    [guide, townView],
  );

  /* Deep links from the Communities menus: `?neighborhood=<id>` on load, or
     an event when the link is clicked on this page (no reload). */
  useEffect(() => {
    const valid = (id: unknown): id is string =>
      typeof id === "string" && guide.neighborhoods.some((n) => n.id === id);
    const fromUrl = new URLSearchParams(window.location.search).get("neighborhood");
    if (valid(fromUrl)) chooseHood(fromUrl);
    const onPick = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (valid(id)) chooseHood(id);
    };
    window.addEventListener(GUIDE_NEIGHBORHOOD_EVENT, onPick);
    return () => window.removeEventListener(GUIDE_NEIGHBORHOOD_EVENT, onPick);
  }, [guide.neighborhoods, chooseHood]);

  /* A pin opens its place in the map's corner card and slides the rail to
     that card, without moving the page. A card in the rail (or the grid,
     when it's below the fold) brings the map back into view and flies to
     its pin. */
  const selectPlace = useCallback(
    (place: GuidePlace, source: "map" | "list" = "list") => {
      setSelectedId(place.id);
      if (place.coords) setCamera({ center: place.coords, zoom: Math.max("zoom" in camera ? camera.zoom : 0, 14.6) });
      const smooth: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      if (source === "map") {
        const rail = railRef.current;
        const card = rail?.querySelector<HTMLElement>(`[data-place="${place.id}"]`);
        if (rail && card && !showAll) rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft - 8, behavior: smooth });
      } else if (place.coords) {
        const m = mapRef.current?.getBoundingClientRect();
        if (m && (m.top < 80 || m.bottom > window.innerHeight)) {
          window.scrollTo({ top: window.scrollY + m.top - 110, behavior: smooth });
        }
      }
    },
    [camera, showAll],
  );

  const onMapSelect = useCallback(
    (id: string) => {
      const place = guide.places.find((p) => p.id === id);
      if (place) selectPlace(place, "map");
    },
    [guide.places, selectPlace],
  );

  const placeByName = useMemo(() => {
    const m = new Map<string, GuidePlace>();
    guide.places.forEach((p) => m.set(normalize(p.name), p));
    return m;
  }, [guide.places]);

  /* The stage never clips the floating panel: on a short screen, or for a
     neighborhood with a long description, the map grows to fit it. */
  useEffect(() => {
    const stage = mapRef.current;
    const panel = stage?.querySelector<HTMLElement>(".ag-panel");
    if (!stage || !panel || !("ResizeObserver" in window)) return;
    const fit = () => {
      const floating = getComputedStyle(panel).position === "absolute";
      stage.style.minHeight = floating ? `${panel.offsetHeight + 40}px` : "";
    };
    const ro = new ResizeObserver(fit);
    ro.observe(panel);
    window.addEventListener("resize", fit);
    fit();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [hoodId]);

  const closeAsk = useCallback(() => setAskOpen(false), []);

  /* The panel floats over the map's left side on desktop: frame pins in the
     open area to its right. On mobile the panel sits below the map. */
  const mapPadding = useCallback(() => {
    const stage = mapRef.current?.getBoundingClientRect();
    const panel = mapRef.current?.querySelector<HTMLElement>(".ag-panel");
    if (!stage || !panel || getComputedStyle(panel).position !== "absolute") return {};
    const p = panel.getBoundingClientRect();
    return { left: Math.round(p.right - stage.left + 50), top: 90, bottom: 60, right: 60 };
  }, []);

  return (
    <div className="ag">
      {/* ============ OVERVIEW ============ */}
      <section className="ag-overview">
        <div className="lp-container">
          <div className="ag-overview__grid">
            <div className="reveal">
              <span className="featured-band__kicker">The {areaTitle} Guide</span>
              <h2 className="lp-h2">{guide.tagline}</h2>
            </div>
            <p className="ag-overview__lede reveal" data-delay="120">{guide.lede}</p>
          </div>
          <dl className="ag-stats">
            {guide.stats.map((stat, i) => (
              <div className="ag-stats__item reveal" data-delay={String(80 * i)} key={stat.label}>
                <dt className="ag-stats__label">{stat.label}</dt>
                <dd className="ag-stats__value"><CountUpStat value={stat.value} /></dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============ EXPLORER ============ */}
      <section className="ag-explorer" id="explore">
        <div className="lp-container">
          <header className="ag-explorer__head reveal">
            <span className="ag-kicker">Explore the Neighborhoods</span>
            <h2 className="ag-h2">Find your corner of {areaTitle}</h2>
          </header>

          <div className="ag-tabs reveal" ref={tabsRef} role="tablist" aria-label={`${areaTitle} neighborhoods`}>
            <button
              type="button"
              role="tab"
              aria-selected={hoodId === null}
              className={`ag-tab${hoodId === null ? " is-active" : ""}`}
              onClick={() => chooseHood(null)}
            >
              <span className="ag-tab__num">00</span>
              All {areaTitle}
            </button>
            {guide.neighborhoods.map((n, i) => (
              <button
                type="button"
                role="tab"
                key={n.id}
                aria-selected={hoodId === n.id}
                className={`ag-tab${hoodId === n.id ? " is-active" : ""}`}
                onClick={() => chooseHood(n.id)}
              >
                <span className="ag-tab__num">{String(i + 1).padStart(2, "0")}</span>
                {n.name}
              </button>
            ))}
          </div>

          {/* ---- the map, with the panel and place card layered on it ---- */}
          <div className="ag-stage" ref={mapRef}>
            <div className="ag-map">
              <GuideMap
                places={guide.places}
                categoryLabels={categoryLabel}
                visibleIds={visibleIds}
                activeId={hoverId ?? selectedId}
                camera={camera}
                onSelect={onMapSelect}
                getPadding={mapPadding}
              />
            </div>

            <div className="ag-map__legend" aria-hidden="true">
              <span className="ag-map__count">{pinCount}</span>
              <span>{pinCount === 1 ? "place" : "places"} on the map</span>
            </div>

            <aside className="ag-panel" key={hoodId ?? "all"} aria-live="polite">
              {hood ? (
                <>
                  <div className="ag-panel__top">
                    <span className="ag-kicker">{hood.character}</span>
                    <span className="ag-panel__index">
                      {String(hoodIndex + 1).padStart(2, "0")} / {String(guide.neighborhoods.length).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="ag-panel__title">{hood.name}</h3>
                  <p className="ag-panel__desc">{hood.description}</p>
                  <ul className="ag-anchors" aria-label="Local anchors">
                    {hood.anchors.map((a) => {
                      const place = placeByName.get(normalize(a));
                      return (
                        <li key={a}>
                          {place ? (
                            <button type="button" className="ag-anchor ag-anchor--link" onClick={() => selectPlace(place)}>
                              {a}
                            </button>
                          ) : (
                            <span className="ag-anchor">{a}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <>
                  <span className="ag-kicker">
                    {guide.neighborhoods.length} neighborhoods · {guide.places.length} local favorites
                  </span>
                  <h3 className="ag-panel__title">All of {areaTitle}</h3>
                  <p className="ag-panel__desc">
                    Pick a neighborhood above to see its character and landmarks, or tap any pin for the details.
                  </p>
                </>
              )}

              <button type="button" className="ag-ask" aria-haspopup="dialog" onClick={() => setAskOpen(true)}>
                {agent.photo && (
                  <span className="ag-ask__avatar">
                    <Image src={agent.photo} alt="" fill sizes="48px" />
                  </span>
                )}
                <span className="ag-ask__text">
                  <span className="ag-ask__title">Ask {firstName}</span>
                  <span className="ag-ask__sub">Homes, streets and pricing in {askPlace}</span>
                </span>
                <span className="ag-ask__icon" aria-hidden="true">
                  <svg className="ag-ask__arrow" viewBox="0 0 16 16" width="14" height="14"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </button>
            </aside>

            {selected && (
              <div className="ag-map__card" data-category={selected.categories[0]} key={selected.id} role="dialog" aria-label={selected.name}>
                <button type="button" className="ag-map__close" aria-label="Close" onClick={() => setSelectedId(null)}>×</button>
                <PlaceBody place={selected} categoryLabel={categoryLabel} hoodName={hood ? undefined : hoodName} />
                <PlaceFoot place={selected} town={areaTitle} />
              </div>
            )}
          </div>

          {/* ---- places: a rail right under the map, expandable to a grid ---- */}
          <div className="ag-browse">
            <div className="ag-browse__bar">
              <div className="ag-chips" role="group" aria-label="Filter places" hidden={inHood.length === 0}>
                <button
                  type="button"
                  className={`ag-chip${categoryId === null ? " is-active" : ""}`}
                  aria-pressed={categoryId === null}
                  onClick={() => setCategoryId(null)}
                >
                  Everything <span className="ag-chip__count">{inHood.length}</span>
                </button>
                {guide.categories.map((c) =>
                  counts[c.id] ? (
                    <button
                      type="button"
                      key={c.id}
                      data-category={c.id}
                      className={`ag-chip${categoryId === c.id ? " is-active" : ""}`}
                      aria-pressed={categoryId === c.id}
                      onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
                    >
                      <span className="ag-chip__dot" aria-hidden="true" />
                      {c.label} <span className="ag-chip__count">{counts[c.id]}</span>
                    </button>
                  ) : null,
                )}
              </div>
              {visible.length > 0 && (
                <div className="ag-browse__nav">
                  {!showAll && (
                    <>
                      <button type="button" className="ag-round" aria-label="Previous places" disabled={railEdge.start} onClick={() => slide(-1)}>
                        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M13 8H3M7 4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <button type="button" className="ag-round" aria-label="More places" disabled={railEdge.end} onClick={() => slide(1)}>
                        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </>
                  )}
                  <button type="button" className="ag-showall" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show as a row" : `Show all ${visible.length}`}
                  </button>
                </div>
              )}
            </div>

            {visible.length === 0 && hood && (
              <p className="ag-places__empty">
                {hood.name} is mostly homes rather than hotspots, so nothing from the guide is pinned here.
                Ask {firstName} what day-to-day life in {hood.name} looks like.
              </p>
            )}
            <ul
              className={`ag-places ${showAll ? "is-grid" : "is-rail"}`}
              ref={railRef}
              onScroll={updateEdges}
              aria-live="polite"
            >
              {visible.map((place) => (
                <li
                  key={place.id}
                  data-place={place.id}
                  data-category={place.categories[0]}
                  className={`ag-place${selectedId === place.id ? " is-selected" : ""}`}
                  onMouseEnter={() => setHoverId(place.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <button type="button" className="ag-place__main" onClick={() => selectPlace(place)}>
                    <PlaceBody place={place} categoryLabel={categoryLabel} hoodName={hoodId ? undefined : hoodName} />
                  </button>
                  <PlaceFoot place={place} town={areaTitle} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <AskModal
        open={askOpen}
        onClose={closeAsk}
        title={`Ask ${firstName} about ${askPlace}`}
        agentPhoto={agent.photo}
        consent={consent}
        formKey={hoodId ?? "all"}
        message={hood ? `I'd love to hear about homes in ${hood.name}, ${areaTitle}.` : `I'd love to hear about homes in ${areaTitle}.`}
      />
    </div>
  );
}

/** Category line, name, note and schedule: shared by the rail cards and the
 *  card that opens on the map. */
function PlaceBody({
  place,
  categoryLabel,
  hoodName,
}: {
  place: GuidePlace;
  categoryLabel: Record<string, string>;
  /** Pass to show the neighborhood after the category (whole-town view) */
  hoodName?: Record<string, string>;
}) {
  return (
    <>
      <span className="ag-place__meta">
        <span className="ag-place__dot" aria-hidden="true" />
        {categoryLabel[place.categories[0]]}
        {hoodName && place.neighborhood && <> · {hoodName[place.neighborhood]}</>}
      </span>
      <span className="ag-place__name">{place.name}</span>
      {place.note && <span className="ag-place__note">{place.note}</span>}
      {place.schedule && <span className="ag-place__when">{place.schedule}</span>}
    </>
  );
}

function PlaceFoot({ place, town }: { place: GuidePlace; town: string }) {
  if (!place.address && !place.coords) return null;
  return (
    <div className="ag-place__foot">
      {place.address && <span className="ag-place__address">{place.address}</span>}
      <a className="ag-place__dir" href={directionsUrl(place, town)} target="_blank" rel="noopener noreferrer">
        Directions <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}

/** Bounds around a set of places; null when none of them has a pin. */
function frame(places: GuidePlace[]): MapCamera | null {
  const pts = places.flatMap((p) => (p.coords ? [p.coords] : []));
  if (!pts.length) return null;
  // One pin: show it in its surroundings, not at street level
  if (pts.length === 1) return { center: pts[0], zoom: 13.4 };
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return { bounds: [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]] };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function directionsUrl(place: GuidePlace, town: string) {
  const destination = place.address
    ? `${place.name}, ${place.address}, ${town}, CA`
    : `${place.coords![1]},${place.coords![0]}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
