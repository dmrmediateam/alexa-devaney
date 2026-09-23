import type { Metadata } from "next";
import ValuationForm from "@/components/landing/ValuationForm";
import FaqAccordion from "@/components/landing/FaqAccordion";
import Reveal from "@/components/landing/Reveal";
import { LandingFooter, LandingHeader } from "@/components/landing/LandingChrome";
import { site } from "@/content/site";
import "../landing.css";

/*
 * Seller ad landing page. Deliberately `noindex, follow`: it targets the same
 * intent as /sell, and two pages competing for "North County home value" split
 * the signal. Google Ads does not require indexation.
 */
export const metadata: Metadata = {
  title: "What's Your North County Home Worth?",
  description: `Request a personal home value analysis from ${site.footer.agentName} of ${site.footer.brokerage}, grounded in current North County San Diego sales.`,
  robots: { index: false, follow: true },
  alternates: { canonical: "/home-value" },
};

const FAQS = [
  {
    q: "How is this different from an online estimate?",
    a: "Automated estimates can't see your renovation quality, ocean or canyon views, lot size and usability, school boundaries, or how close you are to the beach and village. Alexa evaluates your home the way buyers do and prices it against what is actually selling in North County right now.",
  },
  {
    q: "What if I'm not selling right away?",
    a: "That's perfectly fine. Many homeowners simply want to understand their position in the market. There's no obligation, and an early conversation often leads to better timing and preparation decisions.",
  },
  {
    q: "I need to sell and buy at the same time. Can you help?",
    a: "Yes. Alexa has guided families through contingent moves where both sides had moving parts, coordinating timelines, inspections, and negotiations so both transactions stay on track.",
  },
  {
    q: "Is my information kept confidential?",
    a: "Completely. Your details are shared with no one, and discretion is standard practice.",
  },
  {
    q: "How quickly will I hear back?",
    a: "Alexa personally reviews every request and typically responds the same day with next steps or your completed analysis.",
  },
  {
    q: "What if I'd rather just talk it through?",
    a: `Call or text ${site.contact?.phone} any time. A short conversation about your home, the current market, and your goals is often the best starting point.`,
  },
];

export default function HomeValuePage() {
  const landing = site.landing;
  const [years, volume, closings] = site.stats ?? [];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <LandingHeader />

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero__bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/fallsbrae-sunset.webp" alt="North County San Diego estate at sunset" />
        </div>
        <div className="lp-hero__scrim" />
        <div className="lp-hero__inner">
          <div className="lp-hero__copy">
            <p className="lp-hero__eyebrow">{landing?.serviceArea}</p>
            <h1 className="lp-hero__title">Find Out What Your North County Home Is Worth Today</h1>
            <p className="lp-hero__lede">
              A personal valuation from a local specialist, shaped by real buyer demand,
              recent comparable sales, and the details that make your home stand out. Not a
              generic algorithm.
            </p>
            <p className="lp-hero__tagline">{landing?.tagline}</p>
          </div>
          <div className="lp-hero__form">
            <ValuationForm />
          </div>
        </div>
      </section>

      {/* Agent profile */}
      <section className="lp__section lp__section--cream">
        <div className="lp__wrap">
          <div className="lp-agent">
            <Reveal>
              <div className="lp-agent__frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/photos/alexa-devaney-headshot.webp" alt={`${site.footer.agentName}, Senior Realtor Associate`} />
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h2 className="lp-agent__name">{site.footer.agentName}</h2>
              <p className="lp-agent__creds">
                Senior Realtor Associate · {site.footer.brokerage} · DRE# {site.legal?.licenseNumber}
              </p>
              <p className="lp-agent__body">
                Pricing grounded in current comparables, presentation that earns showings,
                and steady communication from the first walkthrough to closing, backed by
                the marketing reach of {site.footer.brokerage}.
              </p>
              <div className="lp-agent__stats">
                {[years, volume, closings].filter(Boolean).map((stat) => (
                  <div className="lp-agent__stat" key={stat.label}>
                    <p>{stat.value}</p>
                    <p>{stat.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="lp__section lp__section--white">
        <div className="lp__wrap">
          <Reveal className="lp-prose">
            <h2 className="lp-prose__title">
              A valuation shaped by <em>real buyer demand</em>, not a generic algorithm.
            </h2>
            <div className="lp-prose__body">
              <p>
                In North County, value lives in the details: ocean breezes and canyon views,
                walkable village streets, top-rated school boundaries, a usable yard, and
                how quickly you can get to the beach. Two homes on the same street can sell
                very differently, and no automated estimate can see why.
              </p>
              <p>
                With more than ten years in San Diego real estate and sales across Carlsbad,
                Oceanside, Vista, Fallbrook, and beyond, Alexa recognizes what makes your home
                exceptional, prices it against what buyers are paying right now, and
                positions it to draw competition.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQs */}
      <section className="lp__section lp__section--cream">
        <div className="lp__wrap">
          <Reveal>
            <h2 className="lp-prose__title" style={{ textAlign: "center" }}>
              Before you request <em>your number</em>.
            </h2>
            <FaqAccordion items={FAQS} />
          </Reveal>
        </div>
      </section>

      {/* Social proof band */}
      <section className="lp-band">
        <div className="lp__wrap">
          <Reveal className="lp-band__grid">
            <div>
              <p className="lp-band__stat">{volume?.value} Closed</p>
              <p className="lp-band__label">In closed sales across San Diego County</p>
            </div>
            <div>
              <p className="lp-band__stat">{years?.value} Years</p>
              <p className="lp-band__label">Helping San Diego families buy and sell with confidence</p>
            </div>
            <div>
              <p className="lp-band__stat">{site.footer.brokerage}</p>
              <p className="lp-band__label">Offices in Los Angeles, Newport Beach, La Jolla, Cabo, and Dubai</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Communities */}
      <section className="lp__section--white">
        <div className="lp__wrap">
          <Reveal className="lp-communities">
            <h2 className="lp-communities__eyebrow">North County Communities</h2>
            <p className="lp-communities__list">
              {landing?.communities.map((c) => (
                <span key={c.label}>{c.label}</span>
              ))}
            </p>
            <p className="lp-communities__foot">Serving All of {landing?.serviceArea}</p>
          </Reveal>
        </div>
      </section>

      <LandingFooter advertisement />
    </div>
  );
}
