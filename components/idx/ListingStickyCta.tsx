"use client";

import { useEffect, useState } from "react";

/* ==========================================================================
   Phone-only action bar for listing pages: Call and Request Info.

   It stands down when the inquiry form itself is on screen (otherwise it
   covers the very thing it points at) and whenever a modal is open, since a
   fixed bar in a higher layer will sit on top of the modal's submit button.
   The page reserves space for it so it never hides the last section.
   ========================================================================== */

export default function ListingStickyCta({ phone }: { phone?: string }) {
  const [hidden, setHidden] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const form = document.querySelector("#listing-inquiry");
    if (!form) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setModalOpen(document.documentElement.dataset.modalOpen === "true");
    sync();
    window.addEventListener("site:modal", sync);
    return () => window.removeEventListener("site:modal", sync);
  }, []);

  if (modalOpen) return null;

  return (
    <div className={`ld-bar${hidden ? " is-hidden" : ""}`} aria-hidden={hidden}>
      {phone && (
        <a className="ld-bar__call" href={`tel:${phone.replace(/[^+\d]/g, "")}`}>
          Call
        </a>
      )}
      <a
        className="ld-bar__cta"
        href="#listing-inquiry"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector("#listing-inquiry")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      >
        Request Info
      </a>
    </div>
  );
}
