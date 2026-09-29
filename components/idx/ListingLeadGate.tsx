"use client";

import { useEffect, useRef, useState } from "react";
import Honeypot from "@/components/leads/Honeypot";
import { useLeadSubmit } from "@/lib/leads/useLeadSubmit";
import {
  LISTING_VIEWS_STORAGE,
  hasCapturedFlag,
  markCapturedLocally,
  readDismissals,
  recordDismissal,
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

/*
 * Milliseconds before the way out appears, indexed by how many times this
 * visitor has already used it. "Not now" sitting next to the button the
 * instant the modal lands is the cheapest click on the screen and almost
 * everyone takes it; making it arrive after the ask has been read costs an
 * interested browser a few seconds and costs a determined one nothing.
 * null = no way out at all: by the third ask they have seen it twice.
 */
const SKIP_DELAY_MS: (number | null)[] = [6000, 12000, null];

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
  listingUrl,
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
  /** Path to this home's page, for the alert email. */
  listingUrl?: string;
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
  /* Read once per mount: reading it during render would flip the escape hatch
     on mid-modal if another tab wrote to storage. */
  const dismissals = useRef(0);
  const [skipReady, setSkipReady] = useState(false);

  useEffect(() => {
    dismissals.current = readDismissals();
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

  /* Hold the escape hatch back until the ask has had time to land, and drop
     it entirely once they have used it twice. A heart-triggered modal always
     gets one eventually: they clicked to save a home, and an accidental click
     needs a way back out. */
  useEffect(() => {
    if (!open) return;
    setSkipReady(false);
    const delay = SKIP_DELAY_MS[Math.min(dismissals.current, SKIP_DELAY_MS.length - 1)];
    if (delay === null && !pending) return;
    const timer = window.setTimeout(() => setSkipReady(true), delay ?? SKIP_DELAY_MS[0]!);
    return () => window.clearTimeout(timer);
  }, [open, pending]);

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
      listingUrl: pending?.url ?? listingUrl,
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

          {/* Removing the easy way out only works paired with a reason to
              stay: the ask has to say what registering buys. */}
          <ul className="gate__perks">
            <li>Every photo and price change</li>
            <li>Saved homes on any device</li>
            <li>Alerts for homes like this</li>
          </ul>

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
            <p className="gate__trust">Your details stay with {agentName}. Never sold, never shared.</p>
          </form>

          {(dismissible || pending) && skipReady && (
            <button
              type="button"
              className="gate__skip"
              onClick={() => {
                dismissals.current = recordDismissal();
                discardPendingCapture();
                setPending(null);
                setOpen(false);
              }}
            >
              {pending
                ? "Cancel"
                : "No thanks \u2014 browse without saved homes or price alerts"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
