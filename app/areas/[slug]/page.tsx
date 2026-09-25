import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import SiteChrome from "@/components/SiteChrome";
import IdxListingCard from "@/components/idx/IdxListingCard";
import ContactForm from "@/components/leads/ContactForm";
import { site } from "@/content/site";
import { searchListings } from "@/lib/idx/search";
import { idxConfigured } from "@/lib/idx/config";

/* ==========================================================================
   /areas/<slug> — one page per service area.

   Two rules make an area page worth having: the homes shown are that town's
   (via the MLS city ID, never a city name, which the search endpoint
   silently mis-matches), and the photography is that town. A hero shot of
   another city is the fastest way to lose a local buyer's trust.
   ========================================================================== */

export const revalidate = 900;
const PAGE_SIZE = 9;

type Params = { params: Promise<{ slug: string }> };

const areas = () => site.areas.filter((area) => area.slug);

export function generateStaticParams() {
  return areas().map((area) => ({ slug: area.slug! }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const area = areas().find((a) => a.slug === slug);
  if (!area) return { title: "Area", robots: { index: false } };

  const title = `${area.title} Homes for Sale`;
  const description =
    area.intro?.[0]?.slice(0, 155) ??
    `${area.title} real estate with ${site.footer.agentName} of ${site.footer.brokerage}: current listings, neighborhoods, and local guidance.`;
  const url = `/areas/${slug}`;
  const image = area.heroImage ?? area.image;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${title} | ${site.brand.name}`,
      description,
      images: [{ url: image, alt: `${area.title}, California` }],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${site.brand.name}`, description, images: [image] },
  };
}

export default async function AreaPage({ params }: Params) {
  const { slug } = await params;
  const area = areas().find((a) => a.slug === slug);
  if (!area) notFound();

  // Newest first, same as the main search: a wall of the priciest homes in
  // town tells most buyers the page is not for them.
  const response =
    idxConfigured() && area.cityId
      ? await searchListings({
          cityId: area.cityId,
          status: "active",
          sort: "newest",
          pageSize: PAGE_SIZE,
        }).catch(() => null)
      : null;

  const listings = response?.listings ?? [];
  const searchHref = `/listings?cityId=${area.cityId}&city=${encodeURIComponent(area.title)}`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.meta.siteUrl },
      { "@type": "ListItem", position: 2, name: "Areas", item: `${site.meta.siteUrl}/listings` },
      { "@type": "ListItem", position: 3, name: area.title, item: `${site.meta.siteUrl}/areas/${slug}` },
    ],
  };

  return (
    <SiteChrome content={site}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section className="video-section video-section--banner">
        <div className="video-wrapper">
          <Image
            src={area.heroImage ?? area.image}
            alt={`${area.title}, California`}
            fill
            sizes="100vw"
            priority
            quality={78}
            style={area.heroFocus ? { objectPosition: area.heroFocus } : undefined}
          />
        </div>
        <div className="overlay-component" />
        <div className="middle-content-wrapper">
          <div className="text-section">
            <h5 className="pre-title">{site.landing?.serviceArea ?? "North County San Diego"}</h5>
            <h1 className="lp-h1">{area.title}</h1>
          </div>
        </div>
      </section>

      {area.intro && area.intro.length > 0 && (
        <section className="solid-section">
          <div className="boxed-text lp-vertical-paddings">
            <div className="lp-container">
              <div className="boxed-text__description reveal">
                {area.intro.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="solid-section">
        <div className="featured-band lp-vertical-paddings">
          <div className="lp-container">
            <div className="featured-band__head reveal">
              <span className="featured-band__kicker">On the Market</span>
              <h2 className="lp-h2">Homes for Sale in {area.title}</h2>
            </div>

            {listings.length > 0 ? (
              <>
                <div className="listings-grid">
                  {listings.map((listing) => (
                    <IdxListingCard key={`${listing.idxId}-${listing.listingId}`} listing={listing} />
                  ))}
                </div>
                <p className="area-page__more reveal">
                  <a href={searchHref}>
                    See all {response?.totalCount ?? ""} {area.title} listings
                  </a>
                </p>
              </>
            ) : (
              /* A quiet week in a small market is normal; an empty grid with
                 no explanation looks broken. */
              <p className="area-page__empty reveal">
                Nothing is active in {area.title} at this moment, which happens in a market this
                size. <a href="/connect">Tell me what you are looking for</a> and I will send
                homes as they come on, including the ones that sell before they hit the portals.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="solid-section">
        <div className="area-page__cta lp-vertical-paddings">
          <div className="lp-container area-page__cta-grid">
            <div className="reveal">
              <span className="featured-band__kicker">Buying or Selling in {area.title}?</span>
              <h2 className="lp-h2">Ask someone who works this market every week.</h2>
              <p>
                I can tell you what a street is really worth, which listings are overpriced, and
                what is coming before it is public. No pressure, no drip campaign.
              </p>
            </div>
            <div className="reveal" data-delay="120">
              <ContactForm
                consent={site.footer.newsletter.consent}
                message={`I'm interested in ${area.title}.`}
              />
            </div>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
