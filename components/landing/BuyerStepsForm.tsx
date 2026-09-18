"use client";

import { useState } from "react";
import Honeypot from "@/components/leads/Honeypot";
import { site } from "@/content/site";
import { getAttribution } from "@/lib/attribution";
import { LEAD_VALUES, setUserData, trackEvent } from "@/lib/analytics";

/*
 * Two-step buyer capture for /buyers: one tap on a price band, then contact.
 * Asking the easy question first gets people invested before the form asks
 * for anything personal. Bands start at $1M: Alexa's floor for buyer work.
 */
const PRICE_POINTS = ["$1M – $1.5M", "$1.5M – $2M", "$2M – $3M", "$3M+"];
/* Bands at or above her typical sale price count as qualified for bidding */
const QUALIFIED = new Set(["$1.5M – $2M", "$2M – $3M", "$3M+"]);

export default function BuyerStepsForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [fields, setFields] = useState({ pricePoint: "", name: "", email: "", phone: "" });
  const first = site.footer.agentName.split(" ")[0];
  const phone = site.contact?.phone ?? "";
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;

  const set = (key: "name" | "email" | "phone") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  function pickPrice(pricePoint: string) {
    setFields((f) => ({ ...f, pricePoint }));
    trackEvent("lead_step", { form_type: "buyer", step: 1, price_point: pricePoint });
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Capture honeypot values synchronously; the synthetic event is pooled
    // and e.currentTarget is null after the first await.
    const formEl = e.currentTarget;
    const company = (formEl.elements.namedItem("company") as HTMLInputElement | null)?.value || "";
    const website = (formEl.elements.namedItem("website") as HTMLInputElement | null)?.value || "";

    setStatus("submitting");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "buyer",
          ...fields,
          company,
          website,
          page: window.location.pathname + window.location.search,
          // Carries the gclid into the CRM so a closing can be reported back
          attribution: getAttribution(),
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setUserData({ email: fields.email, phone: fields.phone });
      const qualified = QUALIFIED.has(fields.pricePoint);
      trackEvent("generate_lead", {
        form_type: "buyer",
        qualified,
        price_point: fields.pricePoint,
        value: qualified ? LEAD_VALUES.buyer : Math.round(LEAD_VALUES.buyer / 6),
        currency: "USD",
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="bq-card bq-done">
        <p className="bq-eyebrow">Request received</p>
        <p className="bq-done__title" style={{ marginTop: "0.75rem" }}>Thank you.</p>
        <p className="bq-done__body">
          {first} personally reviews every request and will reach out to talk through
          neighborhoods, timing, and the homes that fit. If you would rather not wait,
          call or text <a href={phoneHref}>{phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bq-card" data-clarity-mask="true">
      <Honeypot idSuffix="buyer-steps" />
      <div className="bq-card__top">
        <span className="bq-eyebrow">Buyer Consultation</span>
        <span className="bq-card__step">Step {step} of 2</span>
      </div>
      <div className="bq-progress" aria-hidden="true">
        <span className="is-on" />
        <span className={step === 2 ? "is-on" : undefined} />
      </div>

      {step === 1 ? (
        <>
          <h2 className="bq-card__title">What&apos;s your ideal price point?</h2>
          <p className="bq-card__sub">Select one to continue.</p>
          <div className="bq-prices">
            {PRICE_POINTS.map((p) => (
              <button type="button" className="bq-price" key={p} onClick={() => pickPrice(p)}>
                {p}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="bq-card__title">Where should {first} reach you?</h2>
          <button type="button" className="bq-back" onClick={() => setStep(1)}>
            ← Budget: <strong>{fields.pricePoint}</strong> · <u>change</u>
          </button>
          <div className="bq-fields">
            <input className="bq-input" name="name" placeholder="Full name" autoComplete="name"
              required value={fields.name} onChange={set("name")} />
            <input className="bq-input" name="email" type="email" placeholder="Email" autoComplete="email"
              required value={fields.email} onChange={set("email")} />
            <input className="bq-input" name="phone" type="tel" placeholder="Phone" autoComplete="tel"
              required maxLength={20} value={fields.phone} onChange={set("phone")} />
          </div>
          <button type="submit" className="bq-submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Sending…" : "Start My Home Search →"}
          </button>
          {status === "error" && (
            <p className="bq-error">Something went wrong. Please try again or call {phone}.</p>
          )}
          <p className="bq-consent">
            By submitting, you agree to be contacted by {site.footer.agentName} of{" "}
            {site.footer.brokerage} by phone, email, or text about your home search.
            Consent is not a condition of purchase. Message and data rates may apply. You may
            opt out at any time. See our{" "}
            <a href="/legal/terms-and-conditions" target="_blank" rel="noopener">Terms &amp; Conditions</a>.
          </p>
        </>
      )}
    </form>
  );
}
