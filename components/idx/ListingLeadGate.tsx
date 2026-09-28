"use client";

import { useEffect, useRef, useState } from "react";
import Honeypot from "@/components/leads/Honeypot";
import { useLeadSubmit } from "@/lib/leads/useLeadSubmit";
import {
  LISTING_VIEWS_STORAGE,
  hasCapturedFlag,
  markCapturedLocally,
} from "@/lib/leads/captured";
import {
  CAPTURE_REQUEST_EVENT,
  discardPendingCapture,
  flushPendingCapture,
} from "@/lib/tracking/useTracking";
import type { TrackedListing } from "@/lib/tracking/store";

/* ==========================================================================
   Listing registration gate.

   The listing itself is server-rendered underneath and never hidden: gating
   the content would make the page unindexable and read as cloaking. This only
   overlays a modal asking who is browsing.

   Crawlers never see it. Registered visitors never see it again, decided by a
   server-set cookie first (Safari deletes script-written storage after 7 days)
   with a localStorage mirror as backup.
   ========================================================================== */

const CRAWLER =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|lighthouse|adsbot|mediapartners/i;

function readViews(): number {
  try {
    return Number(window.localStorage.getItem(LISTING_VIEWS_STORAGE) ?? "0") || 0;
  } catch {
    /*
     * Storage blocked. Default PAST the free allowance so the modal still
     * shows: defaulting to 0 would mean it silently never appears for anyone
     * browsing with site data blocked.
     */
    return Number.MAX_SAFE_INTEGER;
  }
}

function writeViews(value: number): void {
  try {
    window.localStorage.setItem(LISTING_VIEWS_STORAGE, String(value));
  } catch {
    /* nothing to persist to; the modal simply shows again */
  }
}

/** Announce open/close so floating widgets can stand down. */
function announceModal(open: boolean) {
  if (open) document.documentElement.dataset.modalOpen = "true";
  else delete document.documentElement.dataset.modalOpen;
  window.dispatchEvent(new CustomEvent("site:modal", { detail: { open, source: "listing-gate" } }));
}

export default function ListingLeadGate({
  address,
  mlsNumber,
  consent,
  agentName,
  photo,
  freeViews = 0,
  dismissible = false,
  heading,
  subheading,
  submitLabel = "View Property",
  autoOpen = true,
}: {
  address: string;
  mlsNumber: string;
  consent: string;
  /** Eyebrow over the heading, so the ask is clearly from a person */
  agentName: string;
  /** The listing's own hero photo: the visitor registers to see THIS home */
  photo?: string;
  freeViews?: number;
  dismissible?: boolean;
  heading: string;
  subheading: string;
  submitLabel?: string;
  /**
   * Whether browsing alone opens this. False on pages that only carry it so a
   * saved home has something to ask with, such as the results grid, where the
   * view counter does not apply.
   */
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  /* Set when a heart opened this rather than the view counter: the modal then
     shows the home they just tried to save, not whatever page they are on. */
  const [pending, setPending] = useState<TrackedListing | null>(null);
  const { status, submit } = useLeadSubmit("listing-registration", "listing_registration");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (CRAWLER.test(navigator.userAgent)) return;
    if (hasCapturedFlag()) return;
    if (!autoOpen) return;

    const views = readViews() + 1;
    writeViews(views);
    if (views > freeViews) setOpen(true);
    // freeViews is config, fixed for the life of the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * A visitor tried to save a home before telling us who they are. Claim the
   * request with preventDefault so the heart waits, and open on that listing.
   * Not claiming it (already registered, or a crawler) lets the heart save
   * itself, which is the right fallback.
   */
  useEffect(() => {
    const onRequest = (event: Event) => {
      if (hasCapturedFlag()) return;
      if (CRAWLER.test(navigator.userAgent)) return;
      event.preventDefault();
      setPending((event as CustomEvent<TrackedListing>).detail ?? null);
      setOpen(true);
    };
    window.addEventListener(CAPTURE_REQUEST_EVENT, onRequest);
    return () => window.removeEventListener(CAPTURE_REQUEST_EVENT, onRequest);
  }, []);

  // Body scroll lock, restored exactly as found, plus the open/close signal
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    announceModal(true);
    dialogRef.current?.querySelector<HTMLInputElement>("input[name='name']")?.focus();
    return () => {
      document.body.style.overflow = previous;
      announceModal(false);
    };
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const ok = await submit({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      address: pending?.address ?? address,
      mlsNumber: pending?.listingId ?? mlsNumber,
      company: String(data.get("company") ?? ""),
      website: String(data.get("website") ?? ""),
    });
    if (!ok) return;
    /*
     * Save the answer BEFORE announcing the close. The listener that decides
     * whether to reopen reads the flag, and announcing first means it still
     * sees "unanswered" and puts the modal straight back up.
     */
    markCapturedLocally();
    /* Finish the save they came here to make. Without this they register and
       the heart they clicked stays empty, which reads as a broken button. */
    flushPendingCapture();
    setPending(null);
    setOpen(false);
  }

  if (!open) return null;

  const shownPhoto = pending?.photo ?? photo;
  const shownAddress = pending?.address ?? address;
  // Saving a home is a different ask from "you have read enough listings",
  // so the copy changes when a heart opened this.
  const shownHeading = pending ? "Save This Home" : heading;
  const shownSub = pending
    ? "Register once to keep your saved homes and get a note when something like this comes up."
    : subheading;
  const shownSubmit = pending ? "Save Home" : submitLabel;

  return (
    <div className="gate" role="presentation">
      <div
        className="gate__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-heading"
        ref={dialogRef}
      >
        {shownPhoto && (
          <div className="gate__media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownPhoto} alt="" />
            <span className="gate__address">{shownAddress}</span>
          </div>
        )}

        <div className="gate__panel">
          <p className="gate__eyebrow">{agentName}</p>
          <h2 className="gate__heading" id="gate-heading">{shownHeading}</h2>
          <p className="gate__sub">{shownSub}</p>

          <form className="gate__form" onSubmit={handleSubmit}>
            <Honeypot idSuffix="listing-gate" />
            <input name="name" type="text" placeholder="Full Name" autoComplete="name" required />
            <input name="email" type="email" placeholder="Email" autoComplete="email" required />
            <input name="phone" type="tel" placeholder="Phone" autoComplete="tel" required />
            <label className="gate__consent">
              <input type="checkbox" name="termsAccepted" required />
              <span>{consent}</span>
            </label>
            <button type="submit" className="gate__submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Just a moment…" : shownSubmit}
            </button>
            {status === "error" && (
              <p className="gate__error">Something went wrong. Please try again.</p>
            )}
          </form>

          {(dismissible || pending) && (
            <button
              type="button"
              className="gate__skip"
              onClick={() => {
                discardPendingCapture();
                setPending(null);
                setOpen(false);
              }}
            >
              Not now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
