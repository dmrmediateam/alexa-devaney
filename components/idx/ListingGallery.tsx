"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ListingPhoto } from "@/lib/idx/types";

/* ==========================================================================
   Listing gallery: a mosaic plate (one large photo, two stacked beside it)
   over a full-screen viewer.

   The mosaic rather than a carousel-plus-thumbnail-strip is deliberate: it
   is capped in height, so the address and price that follow it stay inside
   the first screen on load. Any tile opens the viewer at that photo, which
   is where stepping, swiping and keyboard control live.

   The first photo is the page's LCP element: next/image gives it priority
   (which emits the preload) and resizes it for the viewport; everything else
   is lazy.
   ========================================================================== */

export default function ListingGallery({
  photos,
  alt,
  overlay,
}: {
  photos: ListingPhoto[];
  alt: string;
  /** Rendered over the top-right of the plate: the save-this-home control. */
  overlay?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const touchStart = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const count = photos.length;

  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  const open = useCallback((at: number) => {
    setIndex(at);
    setViewer(true);
  }, []);

  // Keyboard control while the viewer is open, and scroll lock behind it
  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(false);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [viewer, step]);

  if (count === 0) return null;
  const current = photos[Math.min(index, count - 1)];

  // The mosaic shows at most three photos; the rest live behind the counter.
  const tiles = photos.slice(0, 3);

  return (
    <>
      <section className="lg" aria-label="Property photos">
        <div className={`lg__mosaic lg__mosaic--${Math.min(count, 3)}`}>
          {tiles.map((photo, i) => (
            <button
              type="button"
              key={photo.url}
              className={`lg__tile${i === 0 ? " lg__tile--main" : ""}`}
              onClick={() => open(i)}
              aria-label={`Open photo ${i + 1} of ${count} full screen`}
              onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStart.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStart.current;
                touchStart.current = null;
                // a swipe on the plate steps the lead photo rather than opening
                if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
              }}
            >
              <Image
                src={i === 0 ? current.url : photo.url}
                alt={i === 0 ? current.caption || alt : ""}
                fill
                sizes={i === 0 ? "(max-width: 900px) 100vw, 850px" : "(max-width: 900px) 50vw, 520px"}
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                quality={i === 0 ? 78 : 70}
              />
            </button>
          ))}

          {overlay}

          {count > 1 && (
            <button
              type="button"
              className="lg__more"
              onClick={() => open(0)}
              aria-label={`View all ${count} photos`}
            >
              <span>{count}</span> Photos
            </button>
          )}
        </div>
      </section>

      {viewer && (
        <div className="lgv" role="dialog" aria-modal="true" aria-label={`Photo ${index + 1} of ${count}`}>
          <button ref={closeRef} type="button" className="lgv__close" onClick={() => setViewer(false)} aria-label="Close photo viewer">&times;</button>
          <span className="lgv__counter">{index + 1} / {count}</span>
          <div
            className="lgv__stage"
            onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStart.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStart.current;
              if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
              touchStart.current = null;
            }}
          >
            <Image
              src={current.url}
              alt={current.caption || alt}
              width={2000}
              height={1333}
              sizes="94vw"
              quality={82}
            />
          </div>
          {count > 1 && (
            <>
              <button type="button" className="lgv__nav lgv__nav--prev" aria-label="Previous photo" onClick={() => step(-1)}>&#8249;</button>
              <button type="button" className="lgv__nav lgv__nav--next" aria-label="Next photo" onClick={() => step(1)}>&#8250;</button>
            </>
          )}
          {current.caption && <p className="lgv__caption">{current.caption}</p>}
        </div>
      )}
    </>
  );
}
