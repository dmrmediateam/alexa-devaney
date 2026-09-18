"use client";

import { useEffect, useRef, useState } from "react";
import FieldMenu from "@/components/ui/FieldMenu";
import { useLeadSubmit } from "@/lib/leads/useLeadSubmit";

/* ==========================================================================
   "What's your property worth?" — three steps over a full-bleed image,
   modeled on the reference seller funnel.

   Step 1 address, step 2 property details, step 3 contact + TCPA consent.
   Address autocomplete queries the MLS through /api/listings when IDX is
   connected; it falls back to the client's service areas otherwise.
   ========================================================================== */

interface Suggestion {
  label: string;
}

export default function ValuationWizard({
  image,
  title,
  preTitle,
  consent,
  areaNames,
  idxEnabled,
}: {
  image: string;
  /** Page title, rendered as the h1 since this section doubles as the hero */
  title?: string;
  preTitle?: string;
  consent: string;
  /** Neighborhood names used for offline suggestions */
  areaNames: string[];
  idxEnabled: boolean;
}) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    address: "",
    propertyType: "",
    beds: "",
    baths: "",
    sqft: "",
    timeline: "",
    name: "",
    email: "",
    phone: "",
    consent: false,
  });
  const { status: leadStatus, submit: submitLead } = useLeadSubmit("home-value");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Debounced address autocomplete
  useEffect(() => {
    const query = form.address.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      if (idxEnabled) {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const res = await fetch(`/api/listings?address=${encodeURIComponent(query)}&pageSize=1`, {
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            const found: Suggestion[] = (data.addressSuggestions ?? []).map((s: { label: string }) => ({
              label: s.label,
            }));
            if (found.length > 0) {
              setSuggestions(found);
              return;
            }
          }
        } catch {
          /* fall through to area suggestions */
        }
      }
      const lower = query.toLowerCase();
      setSuggestions(
        areaNames
          .filter((area) => area.toLowerCase().includes(lower) || lower.length > 4)
          .slice(0, 5)
          .map((area) => ({ label: `${query}, ${area}` })),
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [form.address, areaNames, idxEnabled]);

  const next = () => {
    setError(null);
    if (step === 1 && !form.address.trim()) {
      setError("Enter the property address to continue.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.consent) {
      setError("Please agree to be contacted so we can send your valuation.");
      return;
    }
    setError(null);
    const { consent: _consent, name, ...rest } = form;
    await submitLead({ firstName: name, ...rest });
    /* The visitor sees the thank-you either way: their details are in hand, and
       a retry prompt on a completed multi-step form loses more leads than it
       saves. A delivery failure is logged server-side as NOT DELIVERED. */
    setSubmitted(true);
  };

  return (
    <section
      className="valuation-hero"
      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.34), rgba(0,0,0,0.62)), url('${image}')` }}
    >
      <div className="valuation-hero__inner lp-container">
        {title && (
          <header className="valuation-hero__masthead">
            {preTitle && <h5 className="pre-title">{preTitle}</h5>}
            <h1 className="lp-h1">{title}</h1>
          </header>
        )}
        {submitted ? (
          <div className="valuation-hero__done">
            <h2>Thank you</h2>
            <p>
              We are preparing a considered valuation for {form.address} and will be in touch shortly with
              comparable sales and current market positioning.
            </p>
          </div>
        ) : (
          <>
            <ol className="valuation-steps" aria-label="Valuation progress">
              {[1, 2, 3].map((n) => (
                <li key={n} className={n === step ? "is-current" : n < step ? "is-done" : undefined}>
                  <span>{n}</span>
                </li>
              ))}
            </ol>

            <h2 className="valuation-hero__title">What&rsquo;s Your Property Worth?</h2>

            <form className="valuation-form" onSubmit={submit}>
              {step === 1 && (
                <div className="valuation-form__step">
                  <div className="valuation-field valuation-field--autocomplete">
                    <label htmlFor="valuation-address">Property Address</label>
                    <input
                      id="valuation-address"
                      type="text"
                      autoComplete="off"
                      value={form.address}
                      onChange={(e) => {
                        set("address", e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          next();
                        }
                      }}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="valuation-suggestions">
                        {suggestions.map((s) => (
                          <li key={s.label}>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                set("address", s.label);
                                setShowSuggestions(false);
                              }}
                            >
                              {s.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button type="button" className="valuation-continue" onClick={next}>Continue</button>
                </div>
              )}

              {step === 2 && (
                <div className="valuation-form__step valuation-form__step--details">
                  <div className="valuation-field">
                    <span className="valuation-field__label">Property Type</span>
                    <FieldMenu
                      variant="dark"
                      ariaLabel="Property type"
                      placeholder="Select"
                      value={form.propertyType}
                      onChange={(next) => set("propertyType", next)}
                      options={["Single Family", "Condominium", "Townhouse", "Land"].map((o) => ({ value: o, label: o }))}
                    />
                  </div>
                  <div className="valuation-field">
                    <span className="valuation-field__label">Bedrooms</span>
                    <FieldMenu
                      variant="dark"
                      ariaLabel="Bedrooms"
                      placeholder="Select"
                      value={form.beds}
                      onChange={(next) => set("beds", next)}
                      options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: `${n}${n === 6 ? "+" : ""}`, label: `${n}${n === 6 ? "+" : ""}` }))}
                    />
                  </div>
                  <div className="valuation-field">
                    <span className="valuation-field__label">Bathrooms</span>
                    <FieldMenu
                      variant="dark"
                      ariaLabel="Bathrooms"
                      placeholder="Select"
                      value={form.baths}
                      onChange={(next) => set("baths", next)}
                      options={[1, 2, 3, 4, 5].map((n) => ({ value: `${n}${n === 5 ? "+" : ""}`, label: `${n}${n === 5 ? "+" : ""}` }))}
                    />
                  </div>
                  <div className="valuation-field">
                    <label htmlFor="valuation-sqft">Approx. Living Area</label>
                    <input id="valuation-sqft" type="text" inputMode="numeric" placeholder="Sq. Ft." value={form.sqft} onChange={(e) => set("sqft", e.target.value)} />
                  </div>
                  <div className="valuation-field valuation-field--full">
                    <span className="valuation-field__label">When are you thinking of selling?</span>
                    <FieldMenu
                      variant="dark"
                      ariaLabel="Selling timeline"
                      placeholder="Select"
                      value={form.timeline}
                      onChange={(next) => set("timeline", next)}
                      options={["Ready now", "Within 3 months", "3 to 6 months", "Just exploring value"].map((o) => ({ value: o, label: o }))}
                    />
                  </div>
                  <div className="valuation-form__nav">
                    <button type="button" className="valuation-back" onClick={() => setStep(1)}>Back</button>
                    <button type="button" className="valuation-continue" onClick={next}>Continue</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="valuation-form__step valuation-form__step--details">
                  <div className="valuation-field">
                    <label htmlFor="valuation-name">Name</label>
                    <input id="valuation-name" type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div className="valuation-field">
                    <label htmlFor="valuation-email">Email</label>
                    <input id="valuation-email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div className="valuation-field valuation-field--full">
                    <label htmlFor="valuation-phone">Phone</label>
                    <input id="valuation-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <label className="valuation-consent">
                    <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} />
                    <span>{consent} <a href="/legal/privacy-policy">Privacy Policy</a>.</span>
                  </label>
                  <div className="valuation-form__nav">
                    <button type="button" className="valuation-back" onClick={() => setStep(2)}>Back</button>
                    <button type="submit" className="valuation-continue">Get My Valuation</button>
                  </div>
                </div>
              )}

              {error && <p className="valuation-error">{error}</p>}
            </form>
          </>
        )}
      </div>
    </section>
  );
}
