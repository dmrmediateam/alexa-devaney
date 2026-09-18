import SiteChrome from "@/components/SiteChrome";
import ContactForm from "@/components/leads/ContactForm";
import ListingsGrid from "@/components/ListingsGrid";
import PropertySearchExperience from "@/components/PropertySearchExperience";
import ValuationWizard from "@/components/ValuationWizard";
import type { Listing, SiteContent, SubPage } from "@/content/site";

/** Interior page: banner hero + editorial sections, or search/connect/listings variants */
export default function SubPageView({
  content,
  page,
  liveListings,
  idxEnabled = false,
}: {
  content: SiteContent;
  page: SubPage;
  liveListings?: Listing[] | null;
  /** True when the deployment has an IDX Broker key configured */
  idxEnabled?: boolean;
}) {
  const listings = liveListings ?? content.featured?.listings ?? [];
  const searchHref = content.pages.find((p) => p.type === "search")
    ? `${content.brand.homeHref === "/" || !content.brand.homeHref ? "" : content.brand.homeHref}/listings`
    : "/listings";
  const wizardIsHero = !!page.valuation;

  return (
    <SiteChrome content={content}>
      {/* ============ BANNER HERO (skipped when the wizard carries the hero) ============ */}
      {!wizardIsHero && (
      <section className="video-section video-section--banner">
        <div className="video-wrapper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.heroImage} alt="" />
        </div>
        <div className="overlay-component"></div>
        <div className="middle-content-wrapper">
          <div className="text-section">
            {page.preTitle && <h5 className="pre-title">{page.preTitle}</h5>}
            <h1 className="lp-h1">{page.title}</h1>
          </div>
        </div>
      </section>
      )}

      {/* ============ VALUATION WIZARD (doubles as the hero on sell pages) ============ */}
      {page.valuation && (
        <ValuationWizard
          image={page.valuationImage ?? page.heroImage}
          title={page.title}
          preTitle={page.preTitle}
          consent={content.footer.newsletter.consent}
          areaNames={content.areas.map((area) => area.title)}
          idxEnabled={idxEnabled}
        />
      )}

      {/* ============ INTRO ============ */}
      {page.intro && (
        <section className="solid-section">
          <div className="boxed-text lp-vertical-paddings">
            <div className="lp-container">
              <div className="boxed-text__description reveal">
                {page.intro.map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ BODY ============ */}
      {page.type === "search" ? (
        <SearchBody content={content} />
      ) : page.type === "connect" ? (
        <ConnectBody content={content} />
      ) : page.type === "listings" ? (
        <ListingsBody listings={listings} />
      ) : page.type === "team" ? (
        <TeamBody content={content} page={page} />
      ) : (
        <>
          {page.search && (
            <PropertySearchExperience
              idxEnabled={idxEnabled}
              fallbackListings={listings}
              searchHref={searchHref}
            />
          )}
          {page.sections?.map((section, i) => (
            <section className="solid-section" key={section.heading}>
              <div className={`split-section lp-vertical-paddings${i % 2 === 1 ? " split-section--flip" : ""}`}>
                <div className="lp-container split-section__row">
                  {section.image && (
                    <div className="split-section__media reveal">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={section.image} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="split-section__text reveal" data-delay="100">
                    <h2 className="lp-h2">{section.heading}</h2>
                    <p>{section.text}</p>
                  </div>
                </div>
              </div>
            </section>
          ))}
          {page.showListings && listings.length > 0 && (
            <section className="solid-section">
              <div className="featured-band lp-vertical-paddings">
                <div className="lp-container">
                  <div className="featured-band__head reveal">
                    <span className="featured-band__kicker">Active Listings</span>
                    <h2 className="lp-h2">Currently Represented</h2>
                  </div>
                  <ListingsGrid listings={listings} />
                </div>
              </div>
            </section>
          )}
          {page.cta && (
            <section className="solid-section">
              <div className="boxed-text lp-vertical-paddings" style={{ textAlign: "center" }}>
                <a href={page.cta.href} className="lp-btn lp-btn--outline">{page.cta.label}</a>
              </div>
            </section>
          )}
        </>
      )}
    </SiteChrome>
  );
}

/** Quick-search form feeding the native /listings MLS search (no embeds) */
function SearchBody({ content }: { content: SiteContent }) {
  void content;
  return (
    <section className="solid-section">
      <div className="quick-search lp-vertical-paddings">
        <div className="lp-container quick-search__inner reveal">
          <form action="/listings" method="get" className="quick-search__form">
            <input type="text" name="city" placeholder="City or Neighborhood" aria-label="City" />
            <select name="minPrice" aria-label="Minimum price" defaultValue="">
              <option value="">Min Price</option>
              <option value="500000">$500K</option>
              <option value="1000000">$1M</option>
              <option value="2000000">$2M</option>
              <option value="5000000">$5M</option>
            </select>
            <select name="minBeds" aria-label="Bedrooms" defaultValue="">
              <option value="">Beds</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
            <button type="submit" className="lp-btn btn--primary-light">Search the MLS</button>
          </form>
          <p className="quick-search__note">Full MLS search with live listing data, price and size filters, and every active property in the market.</p>
        </div>
      </div>
    </section>
  );
}

/** Contact page: details + message form (front-end only; wire to CRM later) */
function ConnectBody({ content }: { content: SiteContent }) {
  return (
    <section className="solid-section">
      <div className="connect-grid lp-container lp-vertical-paddings">
        <div className="connect-grid__details reveal">
          <h2 className="lp-h2">{content.footer.agentName}</h2>
          <p className="connect-grid__brokerage">{content.footer.brokerage}</p>
          <address>
            {content.footer.addressLines.map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </address>
          {content.contact?.phone && <p><a href={`tel:${content.contact.phone.replace(/[^+\d]/g, "")}`}>{content.contact.phone}</a></p>}
          {content.contact?.email && <p><a href={`mailto:${content.contact.email}`}>{content.contact.email}</a></p>}
        </div>
        <ContactForm consent={content.footer.newsletter.consent} />
      </div>
    </section>
  );
}


/** Exclusive listings grid page */
function ListingsBody({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <section className="solid-section">
        <div className="boxed-text lp-vertical-paddings" style={{ textAlign: "center" }}>
          <div className="lp-container">
            <h2 className="lp-h2">Portfolio Coming Soon</h2>
            <div className="boxed-text__description">
              <p>Our current listings are being connected. Reach out and we will share what is available and what is coming to market quietly.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="solid-section">
      <div className="featured-band lp-vertical-paddings" style={{ paddingTop: 0 }}>
        <div className="lp-container">
          <ListingsGrid listings={listings} />
        </div>
      </div>
    </section>
  );
}


/** Team roster: tagline + member cards (Vignette/Legendary roster pattern) */
function TeamBody({ content, page }: { content: SiteContent; page: SubPage }) {
  const team = content.team;
  if (!team || team.members.length === 0) {
    return (
      <section className="solid-section">
        <div className="boxed-text lp-vertical-paddings" style={{ textAlign: "center" }}>
          <div className="lp-container">
            <h2 className="lp-h2">Meet the Team</h2>
            <div className="boxed-text__description">
              <p>Team profiles are on their way. In the meantime, reach out and we will introduce you directly.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <>
      <section className="solid-section">
        <div className="team-roster lp-vertical-paddings">
          <div className="lp-container">
            {team.tagline && <p className="team-roster__tagline reveal">{team.tagline}</p>}
            <div className="team-roster__grid">
              {team.members.map((member, i) => {
                const card = (
                  <>
                    <div className="team-card__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={member.image} alt={member.name} loading="lazy" />
                    </div>
                    <div className="team-card__body">
                      <span className="team-card__role">{member.role}</span>
                      <h3 className="team-card__name">{member.name}</h3>
                      {member.bio && <p className="team-card__bio">{member.bio}</p>}
                      <div className="team-card__contact">
                        {member.phone && <a href={`tel:${member.phone.replace(/[^+\d]/g, "")}`}>{member.phone}</a>}
                        {member.email && <a href={`mailto:${member.email}`}>{member.email}</a>}
                      </div>
                      {member.license && <span className="team-card__license">{member.license}</span>}
                      {member.href && <span className="team-card__more">View Profile</span>}
                    </div>
                  </>
                );
                return member.href ? (
                  <a className="team-card reveal" data-delay={(i % 3) * 100 || undefined} href={member.href} key={member.name}>{card}</a>
                ) : (
                  <div className="team-card reveal" data-delay={(i % 3) * 100 || undefined} key={member.name}>{card}</div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      {page.sections?.map((section, i) => (
        <section className="solid-section" key={section.heading}>
          <div className={`split-section lp-vertical-paddings${i % 2 === 1 ? " split-section--flip" : ""}`}>
            <div className="lp-container split-section__row">
              {section.image && (
                <div className="split-section__media reveal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={section.image} alt="" loading="lazy" />
                </div>
              )}
              <div className="split-section__text reveal" data-delay="100">
                <h2 className="lp-h2">{section.heading}</h2>
                <p>{section.text}</p>
              </div>
            </div>
          </div>
        </section>
      ))}
      {page.cta && (
        <section className="solid-section">
          <div className="boxed-text lp-vertical-paddings" style={{ textAlign: "center" }}>
            <a href={page.cta.href} className="lp-btn lp-btn--outline">{page.cta.label}</a>
          </div>
        </section>
      )}
    </>
  );
}
