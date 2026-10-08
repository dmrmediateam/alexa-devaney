"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountUpStat from "@/components/home/CountUpStat";
import ContactForm from "@/components/leads/ContactForm";
import type { AreaGuide as AreaGuideData, GuidePlace } from "@/content/guides/types";
import type { MapCamera } from "./GuideMap";
import RevealNow from "./RevealNow";

/* ==========================================================================
   Interactive area guide: overview + stats, then the neighborhood/place
   explorer (one map shared by both filters).

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
  const askRef = useRef<HTMLButtonElement | null>(null);
  const firstName = agent.name.split(" ")[0];

  const sideRef = useRef<HTMLDivElement | null>(null);
  const chipsRef = useRef<HTMLDivElement | null>(null);

  /* Opening the drawer moves the button to the top of whatever scrolls (the
     side column on desktop, the page on mobile) in step with the expansion,
     so the whole form lands in view instead of opening past the fold. */
  const toggleAsk = useCallback(() => {
    setAskOpen((open) => {
      if (!open) {
        const side = sideRef.current;
        const button = askRef.current;
        const smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        if (side && button) {
          if (getComputedStyle(side).overflowY === "auto") {
            side.scrollTo({ top: button.offsetTop - 16, behavior: smooth });
          } else {
            const top = button.getBoundingClientRect().top + window.scrollY - 96;
            window.scrollTo({ top, behavior: smooth });
          }
        }
      }
      return !open;
    });
  }, []);

  const hood = guide.neighborhoods.find((n) => n.id === hoodId) ?? null;
  const hoodIndex = hood ? guide.neighborhoods.indexOf(hood) : -1;
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
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    inHood.forEach((p) => p.categories.forEach((id) => (c[id] = (c[id] ?? 0) + 1)));
    return c;
  }, [inHood]);

  const tabsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const tabs = tabsRef.current;
    const active = tabs?.querySelector<HTMLElement>(".ag-tab.is-active");
    if (tabs && active && tabs.scrollWidth > tabs.clientWidth) {
      tabs.scrollTo({ left: active.offsetLeft - 16, behavior: "smooth" });
    }
  }, [hoodId]);

  /* A category with nothing in this neighborhood would leave an empty list
     and a bare map; fall back to everything instead. */
  useEffect(() => {
    if (categoryId && !counts[categoryId]) setCategoryId(null);
  }, [categoryId, counts]);

  const chooseHood = useCallback(
    (id: string | null) => {
      setHoodId(id);
      setSelectedId(null);
      setAskOpen(false);
      // Frame the neighborhood's own pins, so every screen size shows all of them.
      setCamera(id ? frame(guide.places.filter((p) => p.neighborhood === id)) ?? townView : townView);
    },
    [guide, townView],
  );

  const selectPlace = useCallback(
    (place: GuidePlace, fromMap = false) => {
      setSelectedId(place.id);
      if (place.coords) setCamera({ center: place.coords, zoom: Math.max("zoom" in camera ? camera.zoom : 0, 14.6) });
      if (fromMap) {
        // Only scroll the side column itself (desktop, where it has its own
        // scroll); on mobile it is in page flow and a jump would lose the map.
        const side = sideRef.current;
        const card = side?.querySelector<HTMLElement>(`[data-place="${place.id}"]`);
        if (side && card && side.scrollHeight > side.clientHeight + 4) {
          const chips = chipsRef.current?.offsetHeight ?? 0;
          side.scrollTo({ top: card.offsetTop - chips - 10, behavior: "smooth" });
        }
      }
    },
    [camera],
  );

  const onMapSelect = useCallback(
    (id: string) => {
      const place = guide.places.find((p) => p.id === id);
      if (!place) return;
      // A pin outside the current filters can't be clicked (it's hidden),
      // so the card is always in the list.
      selectPlace(place, true);
    },
    [guide.places, selectPlace],
  );


  const placeByName = useMemo(() => {
    const m = new Map<string, GuidePlace>();
    guide.places.forEach((p) => m.set(normalize(p.name), p));
    return m;
  }, [guide.places]);

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

          <div className="ag-explorer__body">
            <div className="ag-map">
              <GuideMap
                places={guide.places}
                categoryLabels={categoryLabel}
                visibleIds={visibleIds}
                activeId={hoverId ?? selectedId}
                camera={camera}
                onSelect={onMapSelect}
              />
              <div className="ag-map__legend" aria-hidden="true">
                <span className="ag-map__count">{visible.filter((p) => p.coords).length}</span>
                <span>places {hood ? `in ${hood.name}` : `across ${areaTitle}`}</span>
              </div>
            </div>

            <div className="ag-side" ref={sideRef}>
              {/* ---- neighborhood panel ---- */}
              <div className="ag-panel" key={hoodId ?? "all"}>
                {hood ? (
                  <>
                    <div className="ag-panel__top">
                      <span className="ag-kicker">{hood.character}</span>
                      <span className="ag-panel__index">
                        {String(hoodIndex + 1).padStart(2, "0")} / {String(guide.neighborhoods.length).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="ag-panel__title">{hood.name}</h3>
                    <p className="ag-panel__centered">Centered on {hood.centeredOn}</p>
                    <p className="ag-panel__desc">{hood.description}</p>
                    <ul className="ag-anchors" aria-label="Local anchors">
                      {hood.anchors.map((a) => {
                        const place = placeByName.get(normalize(a));
                        return (
                          <li key={a}>
                            {place ? (
                              <button type="button" className="ag-anchor ag-anchor--link" onClick={() => selectPlace(place, true)}>
                                {a}
                              </button>
                            ) : (
                              <span className="ag-anchor">{a}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <button
                      type="button"
                      ref={askRef}
                      className={`ag-ask${askOpen ? " is-open" : ""}`}
                      aria-expanded={askOpen}
                      aria-controls="ag-ask-form"
                      onClick={toggleAsk}
                    >
                      {agent.photo && (
                        <span className="ag-ask__avatar">
                          <Image src={agent.photo} alt="" fill sizes="48px" />
                        </span>
                      )}
                      <span className="ag-ask__text">
                        <span className="ag-ask__title">Ask {firstName} about {hood.name}</span>
                        <span className="ag-ask__sub">{askOpen ? "Tell her what you're looking for" : "Homes, streets and pricing"}</span>
                      </span>
                      <span className="ag-ask__icon" aria-hidden="true">
                        <svg className="ag-ask__arrow" viewBox="0 0 16 16" width="14" height="14"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <svg className="ag-ask__close" viewBox="0 0 16 16" width="12" height="12"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                      </span>
                    </button>
                    {/* Always mounted so it can animate both ways; the grid-row
                        trick animates to the form's real height. */}
                    <div id="ag-ask-form" className={`ag-ask__drawer${askOpen ? " is-open" : ""}`} inert={!askOpen}>
                      <div className="ag-ask__clip">
                        <RevealNow className="ag-ask__form">
                          <ContactForm
                            key={hood.id}
                            consent={consent}
                            message={`I'd love to hear about homes in ${hood.name}, ${areaTitle}.`}
                          />
                        </RevealNow>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="ag-kicker">{guide.neighborhoods.length} neighborhoods · {guide.places.length} local favorites</span>
                    <h3 className="ag-panel__title">All of {areaTitle}</h3>
                    <p className="ag-panel__desc">
                      Choose a neighborhood above to see its character and landmarks, or filter by what matters to you.
                      Tap any pin for the details.
                    </p>
                  </>
                )}
              </div>

              {/* ---- category chips ---- */}
              <div className="ag-chips" role="group" aria-label="Filter places" ref={chipsRef}>
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

              {/* ---- places ---- */}
              <ul className="ag-places" aria-live="polite">
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
                      <span className="ag-place__meta">
                        <span className="ag-place__dot" aria-hidden="true" />
                        {categoryLabel[place.categories[0]]}
                        {!hoodId && <> · {hoodName[place.neighborhood]}</>}
                      </span>
                      <span className="ag-place__name">{place.name}</span>
                      {place.note && <span className="ag-place__note">{place.note}</span>}
                      {place.schedule && <span className="ag-place__when">{place.schedule}</span>}
                    </button>
                    {(place.address || place.coords) && (
                      <div className="ag-place__foot">
                        {place.address && <span className="ag-place__address">{place.address}</span>}
                        <a
                          className="ag-place__dir"
                          href={directionsUrl(place, areaTitle)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Directions <span aria-hidden="true">↗</span>
                        </a>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

/** Bounds around a set of places; null when none of them has a pin. */
function frame(places: GuidePlace[]): MapCamera | null {
  const pts = places.flatMap((p) => (p.coords ? [p.coords] : []));
  if (!pts.length) return null;
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
