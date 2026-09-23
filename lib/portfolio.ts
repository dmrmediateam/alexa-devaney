import type { Listing, SiteContent } from "@/content/site";
import { site } from "@/content/site";
import { mlsDisclaimerFor } from "@/lib/legal";
import type { ListingDetail, ListingStatus } from "@/lib/idx/types";

/* ==========================================================================
   The config-driven property pages behind /property/<slug>.

   IDX Broker drops a listing from the client feed the moment it closes, so
   the sold portfolio can never come from the API. These pages render it from
   `featured.listings` instead, in the same shape the live IDX detail page
   uses, so both routes share one design.

   `href` in the config is the single source of truth for the slug: the
   routes are generated from it, which makes a slug typo impossible.
   ========================================================================== */

const PROPERTY_PREFIX = "/property/";

export function portfolioListings(content: SiteContent = site): Listing[] {
  return (content.featured?.listings ?? []).filter((l) => l.href.startsWith(PROPERTY_PREFIX));
}

export function portfolioSlugs(content: SiteContent = site): string[] {
  return portfolioListings(content).map((l) => l.href.slice(PROPERTY_PREFIX.length));
}

export function findPortfolioListing(slug: string, content: SiteContent = site): Listing | null {
  return portfolioListings(content).find((l) => l.href === `${PROPERTY_PREFIX}${slug}`) ?? null;
}

/** "$1,598,000" -> 1598000; "" -> 0 (formatPrice renders "Price on request") */
function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const digits = value.replace(/[^\d.]/g, "");
  return digits ? Math.round(Number(digits)) : 0;
}

function toStatus(status: string | undefined): ListingStatus {
  const value = (status ?? "").toLowerCase();
  if (/sold|closed/.test(value)) return "sold";
  if (/pending|contingent/.test(value)) return "pending";
  if (/coming/.test(value)) return "comingSoon";
  if (value) return "active";
  return "unknown";
}

/** "4462 Fallsbrae Rd, Fallbrook" -> street + locality */
function splitAddress(address: string) {
  const [street, ...rest] = address.split(",");
  return { street: street.trim(), city: rest.join(",").trim() };
}

function titleCase(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Property types as they read mid-sentence, not as filter values */
const PROSE_TYPE: Record<string, string> = {
  "single-family": "single-family home",
  condominium: "condominium",
  condo: "condominium",
  townhouse: "townhome",
  land: "parcel",
};

/**
 * Fallback copy for a property the client has not written about yet. It only
 * restates facts already in the config (never invented features), so a home
 * with one photo and no write-up still reads as a page rather than a stub.
 */
export function summaryFor(listing: Listing, content: SiteContent = site): string {
  const { street, city } = splitAddress(listing.address);
  const specs = [
    listing.beds && `${listing.beds} bedroom`,
    listing.baths && `${listing.baths} bathroom`,
  ]
    .filter(Boolean)
    .join(", ");
  const type = PROSE_TYPE[(listing.propertyType ?? "").toLowerCase()] ?? "home";
  const size = listing.sqft ? ` of ${listing.sqft} square feet` : "";
  const where = city ? ` in ${city}` : "";
  const sold = /sold|closed/i.test(listing.status ?? "");
  const price = listing.price
    ? sold
      ? ` It closed at ${listing.price}.`
      : ` It is offered at ${listing.price}.`
    : "";

  return (
    `${street} is a ${specs ? `${specs} ` : ""}${type}${size}${where}, ` +
    `represented by ${content.footer.agentName} of ${content.footer.brokerage}.${price} ` +
    `Reach out for photos, disclosures, and comparable sales in the neighborhood.`
  );
}

/**
 * Config listing -> the normalized detail shape the IDX pages already render.
 * Only facts the config actually carries are mapped; nothing is inferred, so
 * a property with no description simply has no description section.
 */
export function toListingDetail(
  listing: Listing,
  content: SiteContent = site,
  state = "CA",
): ListingDetail {
  const { street, city } = splitAddress(listing.address);
  const slug = listing.href.slice(PROPERTY_PREFIX.length);
  const propertyType = listing.propertyType ? titleCase(listing.propertyType) : "Residential";
  const photos = [listing.image, ...(listing.gallery ?? [])]
    .filter(Boolean)
    .map((url) => ({ url, caption: listing.address }));

  // Beds, baths, sq ft, type, status and MLS already render in the key-fact
  // row and the At a Glance rail, so the accordion carries only the extras a
  // client adds (year built, lot size, HOA and the like).
  const details = listing.facts ?? [];

  return {
    idxId: "",
    listingId: listing.mls ?? slug,
    mlsNumber: listing.mls ?? "",
    slug,
    status: toStatus(listing.status),
    price: toNumber(listing.price),
    beds: toNumber(listing.beds),
    baths: toNumber(listing.baths),
    sqFt: listing.sqft ? toNumber(listing.sqft) : null,
    address: {
      full: listing.address,
      street,
      city,
      state,
      postalCode: "",
      slug,
    },
    primaryPhoto: photos[0] ?? null,
    propertyType,
    waterfront: false,
    featured: true,
    detailUrl: listing.href,
    photos,
    description: listing.description ?? summaryFor(listing, content),
    features: {
      waterfront: false,
      propertyType,
      groups: details.length > 0 ? [{ title: "Property Details", items: details }] : [],
    },
    attribution: `Represented by ${content.footer.agentName} · ${content.footer.brokerage}`,
    disclosures: [mlsDisclaimerFor(content)],
  };
}
