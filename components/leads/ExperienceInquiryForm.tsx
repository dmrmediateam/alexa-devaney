"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import Honeypot from "@/components/leads/Honeypot";
import { useLeadSubmit } from "@/lib/leads/useLeadSubmit";

/**
 * The experiences page enquiry form.
 *
 * This is the whole point of the page: the partnership is Alexa's to broker,
 * so the page offers a form rather than a way through to the partner. The
 * qualifying answers (what, when, how many, budget) are what let her take a
 * real brief to the partner's team instead of going back and forth first.
 */
export default function ExperienceInquiryForm({
  consent,
  agentName,
  interests,
  featuredInterests = [],
  budgets,
  note,
}: {
  consent: string;
  /** Who the visitor is told will follow up; defaults to the site's agent */
  agentName?: string;
  /** The partner's access categories */
  interests: string[];
  /** The showcase experiences, offered above the categories */
  featuredInterests?: string[];
  budgets?: string[];
  note?: string;
}) {
  const { status, submit } = useLeadSubmit("experience-inquiry");
  const [interest, setInterest] = useState("");

  /*
   * The "Enquire about this" link on each showcase card is a plain anchor to
   * #enquire, so the browser does the scrolling and the link still works
   * without JS. All this listener adds is preselecting the experience that
   * was clicked, which is the difference between Alexa reading "Sport" and
   * reading "The Masters".
   */
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const trigger = target?.closest?.("[data-experience]");
      const value = trigger?.getAttribute("data-experience");
      if (!value) return;
      setInterest(value);
      /*
       * Scroll ourselves as well as letting the anchor do it. If the visitor
       * already used one card's CTA the hash is still #enquire, and a browser
       * does not re-navigate to the hash it is already on: without this, the
       * second card they try would silently change the dropdown and never
       * move the page. No behavior argument, so CSS scroll-behavior (and the
       * reduced-motion override) still decides whether it animates.
       */
      document.getElementById("enquire")?.scrollIntoView();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await submit({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      experienceInterest: String(data.get("experienceInterest") ?? "").trim(),
      experienceDates: String(data.get("experienceDates") ?? "").trim(),
      partySize: String(data.get("partySize") ?? "").trim(),
      experienceBudget: String(data.get("experienceBudget") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      company: String(data.get("company") ?? ""),
      website: String(data.get("website") ?? ""),
    });
  }

  if (status === "done") {
    return (
      <div className="xp-form xp-form--done">
        <h3>Thank you</h3>
        <p>
          Your request is with {agentName ?? site.footer.agentName}. She will come back to you
          personally with what is possible for your dates, usually the same day.
        </p>
      </div>
    );
  }

  const options = featuredInterests.length > 0 && (
    <>
      <optgroup label="Featured experiences">
        {featuredInterests.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </optgroup>
      <optgroup label="Or a category">
        {interests.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </optgroup>
    </>
  );

  return (
    <form className="xp-form reveal" data-delay="100" onSubmit={handleSubmit}>
      <Honeypot idSuffix="experiences" />
      <div className="xp-form__fields">
        <input type="text" name="name" placeholder="Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="tel" name="phone" placeholder="Phone" />
        <select
          name="experienceInterest"
          value={interest}
          onChange={(event) => setInterest(event.target.value)}
          required
          aria-label="What interests you"
        >
          <option value="" disabled>
            What interests you?
          </option>
          {options || (
            <>
              {interests.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </>
          )}
        </select>
        <input type="text" name="experienceDates" placeholder="Dates or timeframe" />
        <input type="text" name="partySize" placeholder="Number of guests" inputMode="numeric" />
        {budgets && budgets.length > 0 && (
          <select
            name="experienceBudget"
            defaultValue=""
            aria-label="Approximate budget"
            className="xp-form__wide"
          >
            <option value="">Approximate budget (optional)</option>
            {budgets.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </select>
        )}
        <textarea name="message" placeholder="Tell me about the occasion" rows={4} />
      </div>
      <label className="newsletter__consent">
        <input type="checkbox" name="termsAccepted" required />
        <span>{consent}</span>
      </label>
      <button type="submit" className="lp-btn btn--primary-light" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send Request"}
      </button>
      {status === "error" && (
        <p className="form-error">Something went wrong. Please try again, or call directly.</p>
      )}
      {note && <p className="xp-form__note">{note}</p>}
    </form>
  );
}
