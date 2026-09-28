"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getVisitorId, readHearts, writeHearts } from "@/lib/tracking/visitor";
import { hasCapturedFlag } from "@/lib/leads/captured";
import type { TrackedListing } from "@/lib/tracking/store";

/**
 * The single client-side path for listing activity, the way `useLeadSubmit`
 * is the single path for lead forms. Components call these; nothing else
 * should be calling fetch("/api/track") directly, or the next gap will be
 * one surface quietly missing a piece.
 */

/** Fire and forget. The caller never waits and never sees a failure. */
function beacon(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  // Ensures the visitor cookie exists before the server tries to read it.
  getVisitorId();
  /* Store listing links absolute. The dashboard that reads these runs on
     sanity.studio, where a relative /listing/... path points at nothing. */
  const listing = payload.listing as { url?: string } | undefined;
  if (listing?.url && listing.url.startsWith("/")) {
    listing.url = window.location.origin + listing.url;
  }
  try {
    const body = JSON.stringify(payload);
    // sendBeacon survives the page being closed mid-navigation, which is
    // exactly when a "viewed this listing then left" event happens.
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* tracking is never worth an exception in a render path */
  }
}

/* --------------------------------------------------------------------------
   Saving a home is the strongest signal a visitor gives us, so it is also the
   natural moment to ask who they are. The heart asks the registration gate to
   open, and only saves once it says the visitor has registered.

   The request is a CANCELABLE event: the gate calls preventDefault() to claim
   it. If no gate is mounted, or the client has gating switched off, nothing
   cancels and the heart just saves. A save must never silently do nothing
   because a modal happened not to be on the page.
   -------------------------------------------------------------------------- */

export const CAPTURE_REQUEST_EVENT = "dmr:require-capture";

let pendingHeart: TrackedListing | null = null;

function applyHeart(listing: TrackedListing, on: boolean): void {
  const current = readHearts();
  const next = on
    ? [listing.listingId, ...current.filter((x) => x !== listing.listingId)]
    : current.filter((x) => x !== listing.listingId);
  writeHearts(next);
  beacon({ type: on ? "heart" : "unheart", listing });
}

/** True when a gate claimed the request and will handle registration. */
function requestCapture(listing: TrackedListing): boolean {
  if (typeof window === "undefined") return false;
  const event = new CustomEvent(CAPTURE_REQUEST_EVENT, { detail: listing, cancelable: true });
  window.dispatchEvent(event);
  if (event.defaultPrevented) {
    pendingHeart = listing;
    return true;
  }
  return false;
}

/** Called by the gate once the visitor has registered. */
export function flushPendingCapture(): void {
  const listing = pendingHeart;
  pendingHeart = null;
  if (listing) applyHeart(listing, true);
}

/** Called by the gate when the visitor dismisses it without registering. */
export function discardPendingCapture(): void {
  pendingHeart = null;
}

export function trackView(listing: TrackedListing): void {
  beacon({ type: "view", listing });
}

export function trackSearch(filters: Record<string, unknown>, label?: string): void {
  beacon({ type: "search", filters, label });
}

/**
 * Records a listing view once per mount.
 *
 * Guarded with a ref because React 18 Strict Mode runs effects twice in dev,
 * which would otherwise log every view in duplicate and make the portal lie.
 */
export function useTrackView(listing: TrackedListing | null): void {
  const sent = useRef<string | null>(null);
  useEffect(() => {
    if (!listing?.listingId) return;
    if (sent.current === listing.listingId) return;
    sent.current = listing.listingId;
    trackView(listing);
  }, [listing]);
}

/**
 * Heart state for one listing.
 *
 * Reads localStorage on mount rather than during render: the server has no
 * hearts, so rendering a filled heart on the first pass would be a hydration
 * mismatch. Every heart starts empty and fills in immediately after mount.
 */
export function useHeart(listing: TrackedListing | null) {
  const [hearted, setHearted] = useState(false);
  const id = listing?.listingId;

  useEffect(() => {
    if (!id) return;
    const sync = () => setHearted(readHearts().includes(id));
    sync();
    window.addEventListener("dmr:hearts", sync);
    return () => window.removeEventListener("dmr:hearts", sync);
  }, [id]);

  const toggle = useCallback(() => {
    if (!listing?.listingId) return;
    const isOn = readHearts().includes(listing.listingId);

    // Removing a heart never asks for anything: they already registered to
    // put it there, and making someone register to UNDO something is hostile.
    if (!isOn && !hasCapturedFlag() && requestCapture(listing)) return;

    applyHeart(listing, !isOn);
    setHearted(!isOn);
  }, [listing]);

  return { hearted, toggle };
}

/** The visitor's hearted listing ids, for a "saved homes" view. */
export function useHearts(): string[] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setIds(readHearts());
    sync();
    window.addEventListener("dmr:hearts", sync);
    return () => window.removeEventListener("dmr:hearts", sync);
  }, []);
  return ids;
}
