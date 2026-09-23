import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SiteChrome from "@/components/SiteChrome";
import IdxListingCard from "@/components/idx/IdxListingCard";
import ListingDetailBody from "@/components/idx/ListingDetailBody";
import ListingLeadGate from "@/components/idx/ListingLeadGate";
import { site } from "@/content/site";
import { getListingDetail, parseListingSlug } from "@/lib/idx/listingDetail";
import { searchListings } from "@/lib/idx/search";
import { idxConfigured } from "@/lib/idx/config";

export const revalidate = 900;

type Params = { params: Promise<{ slug: string }> };

const siteUrl = site.meta.siteUrl ?? "https://example.com";

async function loadListing(slug: string) {
  if (!idxConfigured()) return null;
  const parsed = parseListingSlug(slug);
  if (!parsed) return null;
  return getListingDetail(parsed.idxId, parsed.listingId).catch(() => null);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const listing = await loadListing(slug);
  if (!listing) return { title: "Listing", robots: { index: false } };
  const title = listing.address.full;
  const description = listing.description
    ? listing.description.slice(0, 155)
    : `${listing.beds} bed, ${listing.baths} bath ${listing.features.propertyType} in ${listing.address.city}.`;
  const url = `${siteUrl}/listing/${slug}`;
  const image = listing.photos[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function ListingPage({ params }: Params) {
  const { slug } = await params;
  const listing = await loadListing(slug);
  if (!listing) notFound();

  const url = `${siteUrl}/listing/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: listing.address.full,
    description: listing.description || undefined,
    url,
    image: listing.photos.map((photo) => photo.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address.street,
      addressLocality: listing.address.city,
      addressRegion: listing.address.state,
      postalCode: listing.address.postalCode,
      addressCountry: "US",
    },
    numberOfRooms: listing.beds || undefined,
    numberOfBathroomsTotal: listing.baths || undefined,
    floorSize: listing.sqFt ? { "@type": "QuantitativeValue", value: listing.sqFt, unitCode: "FTK" } : undefined,
  };
  const offerLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    url,
    price: listing.price,
    priceCurrency: "USD",
    availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    itemOffered: { "@type": "Residence", name: listing.address.full },
    offeredBy: { "@type": "RealEstateAgent", name: site.footer.agentName, worksFor: site.footer.brokerage },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Listings", item: `${siteUrl}/listings` },
      { "@type": "ListItem", position: 3, name: listing.address.full, item: url },
    ],
  };

  return (
    <SiteChrome content={site}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ListingDetailBody listing={listing} content={site} />
      {site.listingGate?.enabled && (
        <ListingLeadGate
          address={listing.address.full}
          mlsNumber={listing.mlsNumber}
          consent={site.footer.newsletter.consent}
          agentName={site.footer.agentName}
          photo={listing.photos[0]?.url}
          freeViews={site.listingGate.freeViews}
          dismissible={site.listingGate.dismissible}
          heading={site.listingGate.heading}
          subheading={site.listingGate.subheading}
        />
      )}
      <Suspense>
        <SimilarListings
          city={listing.address.city}
          subdivision={listing.address.subdivision}
          price={listing.price}
          excludeKey={`${listing.idxId}-${listing.listingId}`}
        />
      </Suspense>
    </SiteChrome>
  );
}

async function SimilarListings({
  city,
  excludeKey,
  price,
  subdivision,
}: {
  city: string;
  excludeKey: string;
  price: number;
  subdivision?: string;
}) {
  /* Same community first; if that is thin, homes in the same price band. */
  const byCommunity = subdivision
    ? await searchListings({ subdivision, pageSize: 6, status: "active" }).catch(() => null)
    : null;
  let pool = (byCommunity?.listings ?? []).filter(
    (listing) => `${listing.idxId}-${listing.listingId}` !== excludeKey,
  );

  if (pool.length < 3) {
    const band = await searchListings({
      city,
      minPrice: price ? Math.round(price * 0.7) : undefined,
      maxPrice: price ? Math.round(price * 1.3) : undefined,
      pageSize: 8,
      status: "active",
    }).catch(() => null);
    const seen = new Set(pool.map((l) => `${l.idxId}-${l.listingId}`));
    for (const listing of band?.listings ?? []) {
      const key = `${listing.idxId}-${listing.listingId}`;
      if (key === excludeKey || seen.has(key)) continue;
      seen.add(key);
      pool.push(listing);
    }
  }

  const similar = pool.slice(0, 3);
  if (similar.length === 0) return null;
  return (
    <section className="solid-section">
      <div className="featured-band lp-vertical-paddings">
        <div className="lp-container">
          <div className="featured-band__head">
            <span className="featured-band__kicker">{subdivision ? `More in ${subdivision}` : `More in ${city}`}</span>
            <h2 className="lp-h2">Similar Listings</h2>
          </div>
          <div className="listings-grid">
            {similar.map((listing) => (
              <IdxListingCard listing={listing} key={`${listing.idxId}-${listing.listingId}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
