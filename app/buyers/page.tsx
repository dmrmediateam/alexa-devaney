import type { Metadata } from "next";
import BuyerStepsForm from "@/components/landing/BuyerStepsForm";
import Reveal from "@/components/landing/Reveal";
import { LandingFooter, LandingLockup } from "@/components/landing/LandingChrome";
import { site } from "@/content/site";
import "../landing.css";

/*
 * Buyer ad landing page (squeeze page): no navigation, one form, proof below.
 * `noindex, follow` because it targets the same intent as /buy; Google Ads
 * does not need it indexed and AdsBot can still reach it.
 */
export const metadata: Metadata = {
  title: "Find Your North County San Diego Home | Alexa Devaney",
  description: `Tell ${site.footer.agentName} of ${site.footer.brokerage} what you're looking for and get a curated search across Encinitas, Carlsbad, Oceanside, and Fallbrook.`,
  robots: { index: false, follow: true },
  alternates: { canonical: "/buyers" },
};

const STEPS = [
  {
    title: "Tell Alexa What You're Looking For",
    body: "Budget, timeline, and the life you want: walk to the beach and village, top-rated schools, a big yard, room for family, or acreage with a view.",
  },
  {
    title: "Get a Curated, Insider Search",
    body: "Alexa narrows North County to genuinely strong matches, including homes before they hit the portals, and flags the details that matter: school boundaries, lot size, HOAs, and more.",
  },
  {
    title: "Tour and Offer With Confidence",
    body: "Private showings from Encinitas to Fallbrook, honest guidance on value, and offers structured to win in a competitive market without overpaying.",
  },
  {
    title: "Close With a Clear Plan",
    body: "Inspections scheduled fast, contingencies and timelines managed, and steady communication from contract to keys, so nothing surprises you at closing.",
  },
];

export default function BuyersPage() {
  const landing = site.landing;
  const phone = site.contact?.phone ?? "";
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;
  const [years, volume] = site.stats ?? [];
  const communities = landing?.communities.map((c) => c.label) ?? [];

  return (
    <div
      className="lp"
      style={
        {
          "--lp-accent": landing?.accent,
          "--lp-accent-light": landing?.accentLight,
          "--lp-accent-pale": landing?.accentPale,
        } as React.CSSProperties
      }
    >
      {/* Hero: lockup, pitch, two-step form, proof strip */}
      <section className="bq-hero">
        <div className="bq-hero__bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/aceituno-pool.jpg" alt="Hillside North County San Diego home with a pool at dusk" />
        </div>
        <div className="bq-hero__scrim" />
        <div className="bq-hero__inner">
          <div className="bq-hero__logo">
            <a href="/" aria-label={site.brand.name}><LandingLockup tone="light" /></a>
          </div>

          <div className="bq-hero__grid">
            <div>
              <p className="bq-eyebrow bq-eyebrow--light">{landing?.serviceArea}</p>
              <h1 className="bq-title">
                Find your place <em>on the coast.</em>
              </h1>
              <p className="bq-lede">
                Tell Alexa where to reach you. She&apos;ll match you with the right home in
                Encinitas, Carlsbad, Oceanside, or Fallbrook.
              </p>
              <ul className="bq-bullets">
                <li>Homes matched to your budget, must-haves, and the way your family lives</li>
                <li>Early access to homes before they reach the portals</li>
                <li>Clear next steps from first tour to closing, including relocations from out of state</li>
              </ul>
              <p className="bq-trust">
                <span aria-hidden="true">★★★★★</span>
                {site.brand.tagline} · Senior Realtor Associate
              </p>
            </div>
            <div className="bq-hero__form">
              <BuyerStepsForm />
            </div>
          </div>

          <div className="bq-stats">
            <div>
              <p className="bq-stat__value">{years?.value ?? "10+"}</p>
              <p className="bq-stat__label">Years in San Diego real estate</p>
            </div>
            <div>
              <p className="bq-stat__value">{volume?.value ?? "$60M+"}</p>
              <p className="bq-stat__label">In closed sales across San Diego County</p>
            </div>
            <div>
              <p className="bq-stat__value">{communities.length}</p>
              <p className="bq-stat__label">North County communities: {communities.join(" · ")}</p>
            </div>
            <div>
              <p className="bq-stat__value">Global</p>
              <p className="bq-stat__label">{site.footer.brokerage} network: LA · Newport · La Jolla · Cabo · Dubai</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the agent */}
      <section className="bq-agent">
        <div className="lp__wrap">
          <div className="bq-agent__grid">
            <Reveal>
              <div className="bq-portrait">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/photos/alexa-devaney.jpg" alt={`${site.footer.agentName}, Senior Realtor Associate`} />
              </div>
            </Reveal>
            <Reveal delay={120}>
              <p className="bq-eyebrow">Meet Your Agent</p>
              <h2 className="bq-agent__name">{site.footer.agentName}</h2>
              <p className="bq-agent__creds">
                Senior Realtor Associate, {site.footer.brokerage} · DRE# {site.legal?.licenseNumber}
              </p>
              <p className="bq-agent__body">
                For more than ten years Alexa has helped San Diego families buy and sell with
                confidence, pairing deep local market knowledge with strategic negotiation and
                close attention to detail. She has guided clients through contingent moves,
                competitive offers, and cross-country relocations.
              </p>
              <p className="bq-agent__body">
                Every search is personal. Alexa sets clear expectations about the market up
                front, moves fast when the right home appears, and stays a trusted resource
                long after closing.
              </p>
              <p className="bq-agent__tagline">High-level service. Family first. Your next home, found.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Brokerage authority */}
      <section className="bq-brand">
        <div className="bq-brand__bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/coast-sunset.jpg" alt="" />
        </div>
        {site.brand.decal && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="bq-brand__decal" src={site.brand.decal} alt="" aria-hidden="true" />
        )}
        <Reveal className="bq-brand__inner">
          <div className="bq-brand__bar" />
          <p className="bq-eyebrow bq-eyebrow--light">{site.footer.brokerage}</p>
          <h2 className="bq-brand__title">
            A globally recognized luxury brand, <em>rooted in North County.</em>
          </h2>
          <p className="bq-brand__sub">
            The reach of an international brokerage, with an agent who knows these streets.
          </p>
          <div className="bq-points">
            <div className="bq-point">
              <span className="bq-point__num">01</span>
              <div>
                <p className="bq-point__title">The Office</p>
                <p className="bq-point__body">
                  The Oppenheim Group&apos;s San Diego office on Girard Avenue in La Jolla,
                  serving buyers from Encinitas north through Oceanside and Fallbrook.
                </p>
              </div>
            </div>
            <div className="bq-point">
              <span className="bq-point__num">02</span>
              <div>
                <p className="bq-point__title">The Standard</p>
                <p className="bq-point__body">
                  A personalized, organized, proactive process: clear communication,
                  transparent advice, and offers structured to protect your interests.
                </p>
              </div>
            </div>
            <div className="bq-point">
              <span className="bq-point__num">03</span>
              <div>
                <p className="bq-point__title">The Advantage</p>
                <p className="bq-point__body">
                  A network with offices in Los Angeles, Newport Beach, La Jolla, Cabo San
                  Lucas, and Dubai, plus the relationships that surface homes early.
                </p>
              </div>
            </div>
          </div>
          <div className="bq-serving">
            <p className="bq-serving__label">Serving</p>
            <ul className="bq-serving__list">
              {communities.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Process */}
      <section className="bq-process">
        <div className="lp__wrap">
          <Reveal className="bq-process__head">
            <h2 className="bq-h2 bq-h2--dark">From first conversation to <em>keys in hand.</em></h2>
            <p className="bq-process__sub">
              A straightforward buying experience with clear advice at every decision, even
              if you are moving from out of state.
            </p>
          </Reveal>
          <div className="bq-steps">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 100} className="bq-step">
                <p className="bq-step__num">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="bq-step__title">{step.title}</h3>
                <p className="bq-step__body">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bq-cta">
        <Reveal className="bq-cta__inner">
          <h2 className="bq-h2">Ready to <em>get started?</em></h2>
          <p className="bq-cta__sub">Call or text Alexa directly, or send a message.</p>
          <div className="bq-cta__actions">
            <a className="bq-btn bq-btn--solid" href={phoneHref}>{phone}</a>
            <a className="bq-btn bq-btn--ghost" href={`mailto:${site.contact?.email}`}>Send a Message</a>
          </div>
          <p className="bq-cta__address">
            {site.footer.agentName} · {site.footer.brokerage} · {site.footer.addressLines.join(", ")} · DRE# {site.legal?.licenseNumber}
          </p>
        </Reveal>
      </section>

      <LandingFooter advertisement />
    </div>
  );
}
