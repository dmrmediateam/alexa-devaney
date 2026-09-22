"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ListingPhoto } from "@/lib/idx/types";

/* ==========================================================================
   Full-bleed listing gallery with a full-screen viewer.

   The first photo is the page's LCP element: next/image gives it priority
   (which emits the preload) and resizes it for the viewport; everything else
   is lazy. Fixed aspect ratios mean nothing shifts as images arrive.
   ========================================================================== */

export default function ListingGallery({
  photos,
  alt,
}: {
  photos: ListingPhoto[];
  alt: string;
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

  return (
    <>
      <section className="lg" aria-label="Property photos">
        <div className="lg__stage">
          <button
            type="button"
            className="lg__main"
            onClick={() => setViewer(true)}
            aria-label={`Open photo ${index + 1} of ${count} full screen`}
            onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStart.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStart.current;
              if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
              touchStart.current = null;
            }}
          >
            {/* next/image resizes the MLS original and emits the preload for
                the first photo, which is this page's LCP element */}
            <Image
              src={current.url}
              alt={current.caption || alt}
              fill
              sizes="(max-width: 1200px) 100vw, 1400px"
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
              quality={78}
            />
          </button>

          {count > 1 && (
            <>
              <button type="button" className="lg__nav lg__nav--prev" aria-label="Previous photo" onClick={() => step(-1)}>&#8249;</button>
              <button type="button" className="lg__nav lg__nav--next" aria-label="Next photo" onClick={() => step(1)}>&#8250;</button>
              <span className="lg__counter" aria-hidden="true">{index + 1} / {count}</span>
            </>
          )}
        </div>

        {count > 1 && (
          <div className="lg__thumbs" role="tablist" aria-label="Photo thumbnails">
            {photos.slice(0, 14).map((photo, i) => (
              <button
                type="button"
                key={photo.url}
                role="tab"
                aria-selected={i === index}
                aria-label={`Photo ${i + 1}`}
                className={`lg__thumb${i === index ? " is-current" : ""}`}
                onClick={() => setIndex(i)}
              >
                <Image src={photo.url} alt="" fill sizes="140px" quality={60} loading="lazy" />
              </button>
            ))}
          </div>
        )}
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
              style={{ width: "auto", height: "auto", maxWidth: "94vw", maxHeight: "88vh" }}
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
