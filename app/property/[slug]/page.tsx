import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteChrome from "@/components/SiteChrome";
import ListingDetailBody from "@/components/idx/ListingDetailBody";
import RecentClosings from "@/components/RecentClosings";
import { site } from "@/content/site";
import { findPortfolioListing, portfolioListings, portfolioSlugs, toListingDetail } from "@/lib/portfolio";

/* ==========================================================================
   /property/<slug> — detail pages for the homes in content/site.ts.

   Closed sales leave the IDX feed, so these are the only detail pages the
   portfolio's sold homes can have. Same body component as the live IDX
   listing pages, so the two routes look and behave identically.
   ========================================================================== */

type Params = { params: Promise<{ slug: string }> };

const siteUrl = site.meta.siteUrl ?? "https://example.com";

export function generateStaticParams() {
  return portfolioSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const listing = findPortfolioListing(slug);
  if (!listing) return { title: "Property", robots: { index: false } };

  const sold = /sold|closed/i.test(listing.status ?? "");
  const specs = [
    listing.beds && `${listing.beds} bed`,
    listing.baths && `${listing.baths} bath`,
    listing.sqft && `${listing.sqft} sq ft`,
  ]
    .filter(Boolean)
    .join(", ");
  const title = `${listing.address}${sold ? " · Sold" : ""}`;
  const description =
    listing.description ??
    `${specs ? `${specs} home` : "Home"} at ${listing.address}, ${sold ? "sold" : "listed"} at ${listing.price} and represented by ${site.footer.agentName} of ${site.footer.brokerage}.`;
  const url = `${siteUrl}${listing.href}`;
  // 1200x630 crop of the property photo: the listing images themselves are
  // portrait-ish webp, which several scrapers letterbox or skip.
  const image = `/og/property/${slug}.jpg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: listing.address }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PropertyPage({ params }: Params) {
  const { slug } = await params;
  const listing = findPortfolioListing(slug);
  if (!listing) notFound();

  const detail = toListingDetail(listing);
  const url = `${siteUrl}${listing.href}`;
  const sold = detail.status === "sold";

  const residenceLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: listing.address,
    description: listing.description || undefined,
    url,
    image: detail.photos.map((photo) => `${siteUrl}${photo.url}`),
    address: {
      "@type": "PostalAddress",
      streetAddress: detail.address.street,
      addressLocality: detail.address.city,
      addressRegion: detail.address.state,
      addressCountry: "US",
    },
    numberOfRooms: detail.beds || undefined,
    numberOfBathroomsTotal: detail.baths || undefined,
    floorSize: detail.sqFt ? { "@type": "QuantitativeValue", value: detail.sqFt, unitCode: "FTK" } : undefined,
  };
  const offerLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    url,
    price: detail.price,
    priceCurrency: "USD",
    availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    itemOffered: { "@type": "Residence", name: listing.address },
    offeredBy: { "@type": "RealEstateAgent", name: site.footer.agentName, worksFor: site.footer.brokerage },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Portfolio", item: `${siteUrl}/portfolio` },
      { "@type": "ListItem", position: 3, name: listing.address, item: url },
    ],
  };

  // Three other homes from the portfolio, sold first: the closings are what
  // this page is proving, and it keeps visitors moving through the work.
  const more = portfolioListings()
    .filter((other) => other.href !== listing.href)
    .sort((a, b) => Number(/sold|closed/i.test(b.status ?? "")) - Number(/sold|closed/i.test(a.status ?? "")))
    .slice(0, 3);

  return (
    <SiteChrome content={site}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(residenceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="property-crumbs lp-container" aria-label="Breadcrumb">
        <a href="/portfolio">Portfolio</a>
        <span aria-hidden="true">·</span>
        <span>{listing.address}</span>
      </nav>

      <ListingDetailBody listing={detail} content={site} />

      {listing.mlsHref && (
        <div className="property-mls-link lp-container">
          <a href={listing.mlsHref} target="_blank" rel="noopener noreferrer">
            View the full MLS record
          </a>
        </div>
      )}

      {more.length > 0 && (
        <RecentClosings
          listings={more}
          kicker="Keep Looking"
          heading="More From the Portfolio"
          showPrices
        />
      )}
    </SiteChrome>
  );
}
