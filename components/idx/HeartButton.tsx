"use client";

import { useHeart } from "@/lib/tracking/useTracking";
import type { TrackedListing } from "@/lib/tracking/store";

/**
 * Save-this-home control, on listing cards and the detail page.
 *
 * No sign-in: the heart is kept against the visitor's own browser and mirrored
 * server-side, so a buyer can start saving homes before they have given us
 * anything. When they later fill in a lead form the two records are stitched
 * together and the agent inherits the whole list.
 */
export default function HeartButton({
  listing,
  size = "md",
}: {
  listing: TrackedListing;
  size?: "sm" | "md";
}) {
  const { hearted, toggle } = useHeart(listing);
  const label = hearted ? "Remove from saved homes" : "Save this home";

  return (
    <button
      type="button"
      className={`heart heart--${size}${hearted ? " is-on" : ""}`}
      aria-pressed={hearted}
      aria-label={label}
      title={label}
      onClick={(e) => {
        // Cards wrap the whole tile in a link; without this the page navigates
        // away the instant the heart is clicked.
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 20.7 4.6 13.3a4.8 4.8 0 0 1 0-6.8 4.8 4.8 0 0 1 6.8 0l.6.6.6-.6a4.8 4.8 0 0 1 6.8 0 4.8 4.8 0 0 1 0 6.8Z" />
      </svg>
    </button>
  );
}
