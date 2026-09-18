"use client";

import { useState } from "react";
import type { ListingPhoto } from "@/lib/idx/types";

/** Hero photo + thumbnail strip; click-through, no external dependencies */
export default function ListingGallery({ photos, alt }: { photos: ListingPhoto[]; alt: string }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return null;
  const current = photos[Math.min(index, photos.length - 1)];

  return (
    <div className="listing-gallery lp-container">
      <div className="listing-gallery__hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.caption || alt} />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="listing-gallery__nav listing-gallery__nav--prev"
              aria-label="Previous photo"
              onClick={() => setIndex((index - 1 + photos.length) % photos.length)}
            >
              &#8249;
            </button>
            <button
              type="button"
              className="listing-gallery__nav listing-gallery__nav--next"
              aria-label="Next photo"
              onClick={() => setIndex((index + 1) % photos.length)}
            >
              &#8250;
            </button>
            <span className="listing-gallery__count">{index + 1} / {photos.length}</span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="listing-gallery__thumbs">
          {photos.slice(0, 12).map((photo, i) => (
            <button
              type="button"
              key={photo.url}
              className={i === index ? "is-current" : undefined}
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
