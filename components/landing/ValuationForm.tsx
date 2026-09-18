"use client";

import { useState } from "react";
import AddressAutocomplete from "@/components/landing/AddressAutocomplete";
import Honeypot from "@/components/leads/Honeypot";
import { site } from "@/content/site";
import { getAttribution } from "@/lib/attribution";
import { qualify } from "@/lib/leads/qualify";
import { LEAD_VALUES, setUserData, trackEvent } from "@/lib/analytics";

const VALUE_BANDS = [
  "Under $1.5M", "$1.5M – $2M", "$2M – $3M", "$3M – $5M", "$5M+", "Not sure",
];

/* Asked on the last step, not the first. It is the question a seller is most
   guarded about, and asking it before they have invested anything costs
   completions; asked after the address, it reads as qualifying, not screening. */
const AGENT_STATUS = [
  "No, not working with an agent",
  "Interviewing agents now",
  "Yes, I have an agent",
  "My listing recently expired",
];

/** Two-step home-value capture: property first, contact second. */
export default function ValuationForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [fields, setFields] = useState({
    firstName: "",
    phone: "",
    email: "",
    address: "",
    address2: "",
    city: "",
    zip: "",
    estimatedValue: "",
    agentStatus: "",
  });

  const phone = site.contact?.phone ?? "";
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Capture honeypot values synchronously; the synthetic event is pooled
    // and e.currentTarget is null after the first await.
    const formEl = e.currentTarget;
    const company = (formEl.elements.namedItem("company") as HTMLInputElement | null)?.value || "";
    const website = (formEl.elements.namedItem("website") as HTMLInputElement | null)?.value || "";

    if (step === 1) {
      trackEvent("lead_step", { form_type: "home-value", step: 1, city: fields.city });
      setStep(2);
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "home-value",
          ...fields,
          company,
          website,
          page: window.location.pathname + window.location.search,
          // Carries the gclid into the CRM so a closing can be reported back
          attribution: getAttribution(),
        }),
      });
      if (!res.ok) throw new Error("request failed");
      // Enhanced conversions: set the identifiers before the event fires
      setUserData({ email: fields.email, phone: fields.phone });
      // Qualified and disqualified leads are worth very different amounts;
      // reporting the same value for both teaches bidding the wrong thing.
      const q = qualify({ formType: "home-value", ...fields } as Record<string, unknown>);
      trackEvent("generate_lead", {
        form_type: "home-value",
        qualified: q.qualified,
        value: q.qualified ? LEAD_VALUES["home-value"] : Math.round(LEAD_VALUES["home-value"] / 6),
        currency: "USD",
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="lp-card lp-card--done">
        <p className="lp-card__done-title">Thank you.</p>
        <p className="lp-card__done-body">
          {site.footer.agentName.split(" ")[0]} will personally review your property
          details and reach out with your home value analysis. For anything immediate,
          call <a href={phoneHref}>{phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="lp-card" data-clarity-mask="true">
      <Honeypot idSuffix="valuation" />

      <p className="lp-card__step">Step {step} of 2</p>
      <h2 className="lp-card__title">
        {step === 1 ? "Tell us about the property." : "Where can we reach you?"}
      </h2>

      <div className="lp-card__fields">
        {step === 1 ? (
          <>
            <AddressAutocomplete
              className="lp-input"
              placeholder="Street Address"
              value={fields.address}
              onChange={(v) => setFields((f) => ({ ...f, address: v }))}
              onResolved={({ address, city, zip }) =>
                setFields((f) => ({ ...f, address, city: city || f.city, zip: zip || f.zip }))
              }
              required
            />
            <input
              className="lp-input"
              placeholder="Address Line 2 (optional)"
              value={fields.address2}
              onChange={set("address2")}
              autoComplete="address-line2"
            />
            <div className="lp-card__row">
              <input
                className="lp-input"
                placeholder="City"
                value={fields.city}
                onChange={set("city")}
                required
                autoComplete="address-level2"
              />
              <input
                className="lp-input"
                placeholder="ZIP"
                value={fields.zip}
                onChange={set("zip")}
                required
                autoComplete="postal-code"
              />
            </div>
            <select
              className="lp-input"
              style={fields.estimatedValue ? undefined : { color: "rgba(255,255,255,.55)" }}
              value={fields.estimatedValue}
              onChange={(e) => setFields((f) => ({ ...f, estimatedValue: e.target.value }))}
              required
            >
              <option value="" disabled>What do you think it&apos;s worth?</option>
              {VALUE_BANDS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <input
              className="lp-input"
              placeholder="First Name"
              value={fields.firstName}
              onChange={set("firstName")}
              required
              autoComplete="given-name"
            />
            <input
              className="lp-input"
              type="tel"
              placeholder="Phone Number"
              value={fields.phone}
              onChange={set("phone")}
              required
              autoComplete="tel"
            />
            <input
              className="lp-input"
              type="email"
              placeholder="Email (optional)"
              value={fields.email}
              onChange={set("email")}
              autoComplete="email"
            />
            <select
              className="lp-input"
              style={fields.agentStatus ? undefined : { color: "rgba(255,255,255,.55)" }}
              value={fields.agentStatus}
              onChange={(e) => setFields((f) => ({ ...f, agentStatus: e.target.value }))}
              required
            >
              <option value="" disabled>Are you working with an agent?</option>
              {AGENT_STATUS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </>
        )}
      </div>

      <button type="submit" disabled={status === "submitting"} className="lp-submit">
        {status === "submitting" ? "Sending..." : step === 1 ? "Continue" : "Get My Home Value"}
      </button>

      {status === "error" && (
        <p className="lp-card__error">
          Something went wrong. Please try again or call {phone}.
        </p>
      )}

      {step === 2 && (
        <button type="button" onClick={() => setStep(1)} className="lp-back">
          &larr; Back
        </button>
      )}

      <p className="lp-card__consent">
        By submitting, you consent to receive calls, texts, or emails from{" "}
        {site.footer.agentName} regarding your home value request. Consent is not a
        condition of any purchase or sale. Message and data rates may apply. You may
        opt out at any time.
      </p>
    </form>
  );
}
