"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GuidePlace } from "@/content/guides/types";

/* ==========================================================================
   The guide's map. MapLibre over OpenFreeMap vector tiles: free, no API key,
   no usage cap, and the style can be recoloured to the brand at load, which
   a Google embed never allows.

   Pins are HTML markers so they take the site's CSS (and its brand
   variables) directly. Visibility and the active pin are driven by props;
   the map itself is created once.
   ========================================================================== */

const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

type PaintProp = Parameters<MapLibreMap["setPaintProperty"]>[1];

/** A fixed view, or "frame these points" (used for the whole-town view). */
export type MapCamera =
  | { center: [number, number]; zoom: number }
  | { bounds: [[number, number], [number, number]] };

const FIT_PADDING = { top: 80, bottom: 50, left: 50, right: 50 };
// A neighborhood with two pins would otherwise zoom to street level.
const FIT_MAX_ZOOM = 15;

export default function GuideMap({
  places,
  categoryLabels,
  visibleIds,
  activeId,
  camera,
  onSelect,
}: {
  places: GuidePlace[];
  categoryLabels: Record<string, string>;
  visibleIds: Set<string>;
  activeId: string | null;
  camera: MapCamera;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  /* ---- create once ---- */
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current) return;

      const m = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        ...("bounds" in camera
          ? { bounds: camera.bounds, fitBoundsOptions: { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM } }
          : { center: camera.center, zoom: camera.zoom }),
        minZoom: 10.5,
        maxZoom: 17,
        attributionControl: { compact: true },
        cooperativeGestures: true,
        pitchWithRotate: false,
        dragRotate: false,
      });
      map = m;
      mapRef.current = m;
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

      // Warm the near-black base toward the site's charcoal, and lift the
      // ocean so the coastline, which is the whole story here, reads first.
      m.on("style.load", () => {
        const paint = (layer: string, prop: string, value: string) => {
          if (m.getLayer(layer)) m.setPaintProperty(layer, prop as PaintProp, value);
        };
        paint("background", "background-color", "#16191b");
        paint("water", "fill-color", "#22303a");
        paint("waterway", "line-color", "#22303a");
        paint("landuse_park", "fill-color", "#1b2120");
        paint("landcover_wood", "fill-color", "#1b2120");
        paint("building", "fill-color", "#1d2023");
        paint("highway_minor", "line-color", "#24282b");
        paint("highway_major_inner", "line-color", "#2d3236");
        paint("highway_motorway_inner", "line-color", "#383d42");
        for (const id of ["place_suburb", "place_village", "place_town", "place_city", "place_other"]) {
          paint(id, "text-color", "#8d9296");
        }
        paint("highway_name_other", "text-color", "#5e6367");
        paint("water_name", "text-color", "#6f8796");
        paint("water_name", "text-halo-color", "rgba(0,0,0,0)");
      });

      places.forEach((place, index) => {
        if (!place.coords) return;
        const el = document.createElement("button");
        el.type = "button";
        el.className = "ag-pin";
        el.dataset.category = place.categories[0];
        el.setAttribute("aria-label", `${place.name}, ${categoryLabels[place.categories[0]] ?? ""}`);
        el.style.setProperty("--pin-delay", `${Math.min(index * 18, 600)}ms`);
        el.innerHTML = `<span class="ag-pin__dot"></span><span class="ag-pin__label">${escapeHtml(place.name)}</span>`;
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current(place.id);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(place.coords).addTo(m);
        markersRef.current.set(place.id, marker);
      });
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- visibility + active pin ---- */
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      el.classList.toggle("is-hidden", !visibleIds.has(id));
      el.classList.toggle("is-active", id === activeId);
      el.tabIndex = visibleIds.has(id) ? 0 : -1;
    });
  });

  /* ---- camera ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 0 : 1600;
    if ("bounds" in camera) map.fitBounds(camera.bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration, essential: true });
    else map.flyTo({ center: camera.center, zoom: camera.zoom, duration, essential: true });
  }, [camera]);

  return <div ref={containerRef} className="ag-map__canvas" />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
