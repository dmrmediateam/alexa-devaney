"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";

/**
 * Agent name over the brokerage wordmark (brokerage slightly wider), the same
 * co-branded lockup the main site header uses. `tone` picks the wordmark file.
 */
export function LandingLockup({ tone = "light" }: { tone?: "light" | "dark" }) {
  const wordmark = site.brand.brokerageLogo?.[tone];
  return (
    <span className={`lp-lockup lp-lockup--${tone}`}>
      <span className="lp-lockup__name">{site.brand.name}</span>
      {wordmark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="lp-lockup__brokerage" src={wordmark} alt={site.brand.tagline} />
      ) : (
        <span className="lp-lockup__tag">{site.brand.tagline}</span>
      )}
    </span>
  );
}

/**
 * Squeeze-page header: intentionally no navigation links. Lockup + phone only,
 * transparent over the hero and frosted once scrolled. A landing page that
 * offers ten ways to leave converts worse than one that offers a form.
 */
export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const phoneHref = `tel:${site.contact?.phone?.replace(/[^+\d]/g, "") ?? ""}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`lp-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="lp-header__inner">
        <a className="lp-header__logo" href="/" aria-label={site.brand.name}>
          <LandingLockup tone={scrolled ? "dark" : "light"} />
        </a>
        {site.contact?.phone && (
          <a className="lp-header__phone" href={phoneHref}>{site.contact.phone}</a>
        )}
      </div>
    </header>
  );
}

/** Full compliance footer. Ad landing pages need the disclosures too. */
export function LandingFooter({ advertisement = false }: { advertisement?: boolean }) {
  const year = new Date().getFullYear();
  const landing = site.landing;
  const phoneHref = `tel:${site.contact?.phone?.replace(/[^+\d]/g, "") ?? ""}`;
  const license = site.legal?.licenseNumber ? `DRE# ${site.legal.licenseNumber}` : null;
  const state = site.legal?.governingLaw?.replace(/^the State of /, "") ?? "California";

  return (
    <footer className="lp-footer">
      <div className="lp__wrap">
        <div className="lp-footer__grid">
          <div>
            <div className="lp-footer__logo">
              <LandingLockup tone="light" />
            </div>
            {landing?.tagline && <p className="lp-footer__tagline">{landing.tagline}</p>}
            <p className="lp-footer__meta">
              {site.footer.agentName}, {landing?.designations.join(" · ")}
              <br />
              {site.footer.addressLines.join(" · ")}
              <br />
              {landing?.designationsLong}
            </p>
          </div>

          <div>
            <h2 className="lp-footer__heading">Communities</h2>
            <ul className="lp-footer__list">
              {landing?.communities.map((c) => (
                <li key={c.label}>{c.href ? <a href={c.href}>{c.label}</a> : c.label}</li>
              ))}
              <li style={{ opacity: 0.55 }}>Serving All of {landing?.serviceArea}</li>
            </ul>
          </div>

          <div>
            <h2 className="lp-footer__heading">Contact</h2>
            <ul className="lp-footer__list">
              {site.contact?.phone && (
                <li>Phone: <a href={phoneHref}>{site.contact.phone}</a></li>
              )}
              {site.contact?.email && (
                <li>Email: <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a></li>
              )}
              <li>Office: {site.footer.addressLines.join(", ")}</li>
            </ul>
            <div style={{ marginTop: "1.5rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/equal-housing.png"
                alt="Equal Housing Opportunity"
                style={{ height: 44, width: 44, filter: "invert(1)", opacity: 0.7 }}
              />
            </div>
          </div>
        </div>

        <div className="lp-footer__legal">
          <p>
            The information contained on this website is derived from sources deemed
            reliable but is not guaranteed. All property information should be
            independently verified. All measurements and square footages are
            approximate. The data relating to real estate displayed on this site may
            be subject to the terms of the applicable MLS rules and regulations.
            Listings held by brokerage firms other than {site.footer.brokerage} are
            marked accordingly. Nothing on this site should be construed as legal,
            accounting, or other professional advice. If your property is currently
            listed with another broker, this is not intended as a solicitation of
            that listing.
          </p>
          <p>
            {site.footer.agentName} is a licensed real estate salesperson in the State
            of {state} affiliated with {site.footer.brokerage}
            {site.landing?.brokerageLicense ? ` (DRE# ${site.landing.brokerageLicense})` : ""}.
            {license ? ` ${license}.` : ""} REALTOR® is a federally registered collective
            membership mark which identifies a real estate professional who is a member
            of the National Association of REALTORS® and subscribes to its strict Code
            of Ethics.
          </p>
          <p>
            We are committed to providing an accessible website. If you have
            difficulty accessing content or notice any accessibility problems, please
            contact us at{" "}
            <a href={`mailto:${site.contact?.email}`}>{site.contact?.email}</a> so we
            may assist you. We are committed to and abide by the Fair Housing Act and
            equal opportunity in housing.
          </p>
          {advertisement && (
            <p>
              This is an advertisement. By submitting the form on this page you consent to
              be contacted by phone, email, or text. Message and data rates may apply.
              Reply STOP to opt out at any time.
            </p>
          )}
          <div className="lp-footer__colophon">
            <p>
              © {year} {site.footer.agentName} · {site.footer.brokerage} · Licensed in{" "}
              {state}{license ? ` · ${license}` : ""} · Equal Housing Opportunity ·{" "}
              <a href="/legal/privacy-policy">Privacy Policy</a> ·{" "}
              <a href="/legal/terms-and-conditions">Terms</a>
            </p>
            <p>
              Website by{" "}
              <a href="https://dmrmedia.org" target="_blank" rel="noopener noreferrer">
                DMR Media
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
