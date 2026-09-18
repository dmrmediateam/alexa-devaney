import type { CSSProperties, ReactNode } from "react";
import NewsletterForm from "@/components/leads/NewsletterForm";
import SiteEffects from "@/components/SiteEffects";
import type { SiteContent } from "@/content/site";
import { FAIR_HOUSING_PLEDGE, REALTOR_MARK_NOTICE, mlsDisclaimerFor } from "@/lib/legal";

/** Convert "#RRGGBB" to "r, g, b" for rgba() variants */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Shared shell: theme vars, nav, side menu, footer, floating connect button */
export default function SiteChrome({
  content,
  children,
  animateIn = false,
}: {
  content: SiteContent;
  children: ReactNode;
  /** Play the logo/nav/hero load-in sequence (homepage only) */
  animateIn?: boolean;
}) {
  const themeVars = {
    "--navy": content.theme.primary,
    "--navy-90": `rgba(${hexToRgb(content.theme.primary)}, 0.9)`,
    "--taupe": content.theme.secondary,
    "--taupe-overlay": `rgba(${hexToRgb(content.theme.secondary)}, 0.4)`,
    "--cream": content.theme.background,
    background: content.theme.background,
  } as CSSProperties;

  return (
    <div style={themeVars} className={animateIn ? "load-anim" : undefined}>
      <SiteEffects />

      {/* ============ HEADER / NAV ============ */}
      <nav id="global-navbar" className="navbar">
        <div className="header">
          <div className="header__left">
            <ul className="navigation">
              {content.nav.left.map((link) => (
                <li className="navigation__item" key={link.label}>
                  <a href={link.href} className="navigation__link"><span>{link.label}</span></a>
                </li>
              ))}
            </ul>
          </div>
          <a href={content.brand.homeHref ?? "/"} className="header__logo" aria-label="Home">
            {content.brand.logo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.brand.logo.light} alt={content.brand.name} className="logo-img--light" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.brand.logo.dark} alt={content.brand.name} className="logo-img--dark" />
              </>
            ) : (
              <span className="logo-mark">
                <span className="logo-name">{content.brand.name}</span>
                <span className="logo-tag">{content.brand.tagline}</span>
              </span>
            )}
          </a>
          <div className="header__right">
            <ul className="navigation">
              {content.nav.right.map((link) => (
                <li className="navigation__item" key={link.label}>
                  <a href={link.href} className="navigation__link"><span>{link.label}</span></a>
                </li>
              ))}
            </ul>
            <button className="hamburger" id="hamburger" aria-label="Open menu"><span></span></button>
          </div>
        </div>
      </nav>

      {/* ============ SIDE MENU ============ */}
      <div className="sidemenu" id="sidemenu" aria-hidden="true">
        <button className="sidemenu__close" id="sidemenu-close" aria-label="Close menu">&times;</button>
        <ul className="sidemenu__nav">
          {content.nav.menu.map((link) => (
            <li key={link.label}><a href={link.href}>{link.label}</a></li>
          ))}
        </ul>
      </div>
      <div className="sidemenu-overlay" id="sidemenu-overlay"></div>

      {children}

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="footer">
          <div className="footer__layout container">
            <div className="footer__col footer__col--brand">
              <h2 className="footer__wordmark">{content.brand.name}</h2>
              <div className="footer__agent">
                <p>{content.footer.agentName}<br /><strong>{content.footer.brokerage}</strong></p>
              </div>
            </div>
            <div className="footer__col footer__col--nav">
              <div className="footer__nav">
                {content.footer.links.map((link) => (
                  <a href={link.href} key={link.label}>{link.label}</a>
                ))}
              </div>
              <ul className="socials">
                {content.footer.socials.map((social) => (
                  <li key={social.platform}>
                    <a href={social.href} aria-label={social.platform}>
                      <SocialIcon platform={social.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer__col footer__col--contact">
              <h5>Address</h5>
              <p>
                {content.footer.addressLines.map((line, i) => (
                  <span key={i}>{line}{i < content.footer.addressLines.length - 1 && <br />}</span>
                ))}
              </p>
              <h5 className="footer__join">{content.footer.newsletter.heading}</h5>
              <p className="footer__tagline">{content.footer.newsletter.tagline}</p>
<NewsletterForm consent={content.footer.newsletter.consent} />
            </div>
          </div>
          <div className="footer__legal container">
            <nav className="footer__legal-links" aria-label="Legal">
              <a href="/legal/privacy-policy">Privacy Policy</a>
              <a href="/legal/terms-and-conditions">Terms &amp; Conditions</a>
              <a href="/legal/accessibility">Accessibility</a>
              <a href="/legal/fair-housing">Fair Housing</a>
            </nav>
            <details className="footer__legal-panel">
              <summary>MLS Disclaimer &amp; IDX Information</summary>
              <p>{mlsDisclaimerFor(content)}</p>
            </details>
            <details className="footer__legal-panel">
              <summary>Fair Housing &amp; Equal Opportunity</summary>
              <div className="footer__eho">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a href="/legal/fair-housing" aria-label="Read our Fair Housing commitment"><img src="/equal-housing.png" alt="Equal Housing Opportunity" /></a>
                <p>{FAIR_HOUSING_PLEDGE}</p>
              </div>
            </details>
            <details className="footer__legal-panel">
              <summary>Professional Licensing &amp; REALTOR&reg; Information</summary>
              <p>
                {content.footer.agentName} &middot; {content.footer.brokerage}
                {content.legal?.licenseNumber ? ` · License #${content.legal.licenseNumber}` : ""}
                {content.legal?.licenseState ? ` · ${content.legal.licenseState}` : ""}
              </p>
              <p>{REALTOR_MARK_NOTICE}</p>
              <p>All information provided is deemed reliable but is not guaranteed and should be independently verified.</p>
            </details>
          </div>
          <div className="footer__bottom container">
            <span>{content.footer.copyright}&nbsp;|&nbsp;Equal Housing Opportunity</span>
            {content.footer.compliance && (
              <span className="footer__compliance">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.footer.compliance.image} alt="Equal Housing Opportunity" />
                <span>{content.footer.compliance.text}</span>
              </span>
            )}
            <span className="footer__credit">
              Pipeline Supplied By <a href="https://dmrmedia.org" target="_blank" rel="noopener">DMR Media</a>
            </span>
          </div>
        </div>
      </footer>

      {/* ============ FLOATING CONNECT BUTTON ============ */}
      <a href={content.cta.buttonHref} className="connect-btn" id="connect-btn">{content.cta.buttonLabel}</a>
    </div>
  );
}

export function SocialIcon({ platform }: { platform: "instagram" | "facebook" | "linkedin" }) {
  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" /></svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 8.5h3V20h-3V8.5zM6 4a1.75 1.75 0 110 3.5A1.75 1.75 0 016 4zm4.5 4.5h2.9v1.6c.4-.8 1.5-1.8 3.2-1.8 3 0 3.9 1.9 3.9 4.5V20h-3v-6.1c0-1.5-.3-2.5-1.7-2.5-1.5 0-2.3 1-2.3 2.5V20h-3V8.5z" /></svg>
      );
  }
}
