"use client";

import { useTrackView } from "@/lib/tracking/useTracking";
import type { TrackedListing } from "@/lib/tracking/store";

/**
 * Records a listing view. Renders nothing.
 *
 * Exists so the detail page can stay a server component: the page passes the
 * handful of fields the portal stores, and only this leaf ships to the browser.
 */
export default function ListingViewTracker({ listing }: { listing: TrackedListing }) {
  useTrackView(listing);
  return null;
}
