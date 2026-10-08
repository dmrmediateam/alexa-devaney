"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { goToNeighborhood, type CommunityLink } from "./communities";

/* ==========================================================================
   Desktop "Communities" dropdown: a full-width panel under the navbar with
   one card per town, and the neighborhoods of any town that has a guide.

   Opens on hover (with a short intent delay each way so it neither flickers
   nor snaps shut when the pointer drifts) and on click/Enter for touch and
   keyboard. Escape, an outside click, or scrolling the page closes it.
   ========================================================================== */

const OPEN_DELAY = 70;
const CLOSE_DELAY = 220;

export default function CommunitiesMenu({
  label,
  href,
  communities,
}: {
  label: string;
  href: string;
  communities: CommunityLink[];
}) {
  const [open, setOpen] = useState(false);
  const itemRef = useRef<HTMLLIElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const hoverOpenedAt = useRef(0);
  const solidifiedNav = useRef(false);
  const panelId = useId();

  const schedule = useCallback((next: boolean, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (next) hoverOpenedAt.current = Date.now();
      setOpen(next);
    }, delay);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /* Over the hero the navbar is transparent; a white panel hanging under
     white nav text reads as a glitch, so the bar turns solid while open. */
  useEffect(() => {
    const nav = document.getElementById("global-navbar");
    if (!nav) return;
    if (open) {
      if (!nav.classList.contains("scrolled")) {
        nav.classList.add("scrolled");
        solidifiedNav.current = true;
      }
      nav.classList.add("mega-open");
    } else {
      nav.classList.remove("mega-open");
      if (solidifiedNav.current) {
        solidifiedNav.current = false;
        if (window.scrollY < 110) nav.classList.remove("scrolled");
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!itemRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 60) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  return (
    <li
      ref={itemRef}
      className={`navigation__item navigation__item--mega${open ? " is-open" : ""}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && schedule(true, OPEN_DELAY)}
      onPointerLeave={(e) => e.pointerType === "mouse" && schedule(false, CLOSE_DELAY)}
      onBlur={(e) => {
        if (!itemRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="navigation__link navigation__link--button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          window.clearTimeout(timer.current);
          // A hover just opened it; the click that follows is the same intent.
          if (open && Date.now() - hoverOpenedAt.current < 600) return;
          setOpen((v) => !v);
        }}
      >
        <span>{label}</span>
        <svg className="navigation__caret" viewBox="0 0 10 6" width="9" height="6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div id={panelId} className="mega" role="region" aria-label={label} inert={!open}>
        <div className="mega__inner">
          <div className="mega__head">
            <span className="mega__kicker">North County San Diego</span>
            <a className="mega__all" href={href} onClick={() => setOpen(false)}>
              View all communities <span aria-hidden="true">→</span>
            </a>
          </div>
          <ul className="mega__grid">
            {communities.map((c, i) => (
              <li key={c.href} className="mega__col" style={{ "--i": i } as React.CSSProperties}>
                <a className="mega__card" href={c.href}>
                  <span className="mega__media">
                    <Image src={c.image} alt="" fill sizes="(max-width: 1600px) 22vw, 320px" />
                  </span>
                  <span className="mega__title">
                    {c.title}
                    <span className="mega__arrow" aria-hidden="true">→</span>
                  </span>
                  {c.description && <span className="mega__desc">{c.description}</span>}
                </a>
                {c.neighborhoods.length > 0 && (
                  <div className="mega__hoods">
                    <span className="mega__hoods-label">Neighborhood guide</span>
                    <ul>
                      {c.neighborhoods.map((n) => (
                        <li key={n.id}>
                          <a
                            href={n.href}
                            onClick={(e) => {
                              if (goToNeighborhood(e, c.href, n.id)) setOpen(false);
                            }}
                          >
                            {n.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
