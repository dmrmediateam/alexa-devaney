import SiteChrome from "@/components/SiteChrome";
import CountUpStat from "@/components/home/CountUpStat";
import type { Listing, SiteContent } from "@/content/site";

/* ==========================================================================
   Home variant "noir": dark cinematic gallery. Ken Burns full-bleed hero,
   serif statement, count-up stats over hairlines, horizontal listings rail,
   full-width alternating area rows, split about, fixed-background CTA.
   The dark canvas is scoped to this page; nav, footer, and interior pages
   keep the shared light chrome.
   ========================================================================== */

export default function HomeNoir({
  content,
  liveListings,
}: {
  content: SiteContent;
  liveListings?: Listing[] | null;
}) {
  const featuredListings = liveListings ?? content.featured?.listings ?? [];

  return (
    <SiteChrome content={content} animateIn>
      <div className="hn">
        {/* ============ HERO: full-bleed, slow Ken Burns drift ============ */}
        <section className="video-section hn-hero">
          <div className="hn-hero__media">
            {content.hero.video ? (
              <video poster={content.hero.image} loop muted autoPlay playsInline>
                {content.hero.video.webm && <source src={content.hero.video.webm} type="video/webm" />}
                {content.hero.video.mp4 && <source src={content.hero.video.mp4} type="video/mp4" />}
              </video>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.hero.image} alt="" />
            )}
          </div>
          <div className="hn-hero__shade"></div>
          <div className="hn-hero__content lp-container">
            <h5 className="pre-title">{content.hero.preTitle}</h5>
            <h1 className="lp-h1 hn-hero__title">{content.hero.title}</h1>
            <div className="hn-hero__actions">
              <a href={content.intro.ctaHref} className="hn-btn">{content.intro.ctaLabel}</a>
              <a href={content.cta.buttonHref} className="hn-btn hn-btn--ghost">{content.cta.buttonLabel}</a>
            </div>
          </div>
          <div className="hn-hero__scroll" aria-hidden="true">
            <span></span>
          </div>
        </section>

        {/* ============ STATEMENT ============ */}
        <section className="hn-statement">
          <div className="lp-container">
            <span className="hn-kicker reveal">{content.brand.tagline}</span>
            <h2 className="hn-statement__text reveal" data-delay="100">{content.intro.paragraphs[0]}</h2>
          </div>
        </section>

        {/* ============ STATS: count-up over hairlines ============ */}
        {content.stats && (
          <section className="hn-stats">
            <div className="lp-container hn-stats__row">
              {content.stats.map((stat, i) => (
                <div className="hn-stats__item reveal" data-delay={i * 100 || undefined} key={stat.label}>
                  <span className="hn-stats__value"><CountUpStat value={stat.value} /></span>
                  <span className="hn-stats__label">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ LISTINGS RAIL: horizontal scroll-snap ============ */}
        {content.featured && featuredListings.length > 0 && (
          <section className="hn-rail">
            <div className="lp-container hn-rail__head reveal">
              <div>
                {content.featured.subtitle && <span className="hn-kicker">{content.featured.subtitle}</span>}
                <h2 className="hn-h2">{content.featured.title}</h2>
              </div>
              <a href={content.intro.ctaHref} className="hn-link">View All</a>
            </div>
            <div className="hn-rail__track" tabIndex={0} aria-label="Featured properties carousel">
              {featuredListings.map((listing, i) => (
                <a className="hn-rail__card reveal" data-delay={(i % 4) * 80 || undefined} href={listing.href} key={listing.mls ?? listing.address}>
                  <div className="hn-rail__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={listing.image} alt={listing.address} loading="lazy" />
                    {listing.status && <span className="hn-rail__status">{listing.status}</span>}
                  </div>
                  <div className="hn-rail__body">
                    <span className="hn-rail__price">{listing.price}</span>
                    <span className="hn-rail__address">{listing.address}</span>
                    <span className="hn-rail__meta">
                      {[
                        listing.beds && `${listing.beds} Beds`,
                        listing.baths && `${listing.baths} Baths`,
                        listing.sqft && `${listing.sqft} Sq.Ft.`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ============ AREAS: full-width alternating gallery rows ============ */}
        <section className="hn-areas">
          {content.areas.map((area, i) => (
            <a className={`hn-area${i % 2 === 1 ? " hn-area--flip" : ""}`} href={area.href} key={area.title}>
              <div className="hn-area__media reveal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={area.image} alt="" loading="lazy" />
              </div>
              <div className="hn-area__text reveal" data-delay="100">
                <h3 className="hn-area__title">{area.title}</h3>
                {area.description && <p>{area.description}</p>}
                <span className="hn-link">Explore</span>
              </div>
            </a>
          ))}
        </section>

        {/* ============ ABOUT: split with portrait ============ */}
        <section className="hn-about">
          <div className="lp-container hn-about__grid">
            <div className="hn-about__media reveal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={content.about.image} alt={content.about.title} />
            </div>
            <div className="hn-about__text reveal" data-delay="100">
              <span className="hn-kicker">{content.about.subtitle}</span>
              <h2 className="hn-h2">{content.about.title}</h2>
              {content.about.blocks.slice(0, 2).map((block, i) => (
                <p key={i}>{block.text}</p>
              ))}
              <a href={content.cta.buttonHref} className="hn-btn hn-btn--ghost">{content.cta.buttonLabel}</a>
            </div>
          </div>
        </section>

        {/* ============ CTA: fixed background ============ */}
        <section
          className="image-section parallax-enabled hn-cta"
          style={{
            ["--sectionBackground" as string]: `linear-gradient(rgba(8,8,8,0.66), rgba(8,8,8,0.66)), url('${content.cta.image}')`,
          }}
        >
          <div className="work-with-us">
            <div className="container">
              <h2 className="reveal">{content.cta.title}</h2>
              <div className="description reveal" data-delay="100">{content.cta.description}</div>
              <div className="btn-container reveal" data-delay="200">
                <a href={content.cta.buttonHref} className="hn-btn">{content.cta.buttonLabel}</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteChrome>
  );
}
