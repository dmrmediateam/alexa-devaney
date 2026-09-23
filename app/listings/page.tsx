import type { Metadata } from "next";
import { Suspense } from "react";
import SiteChrome from "@/components/SiteChrome";
import ListingsBrowser from "@/components/idx/ListingsBrowser";
import ListingsSearchPlaceholder from "@/components/ListingsSearchPlaceholder";
import { site } from "@/content/site";
import { filtersFromParams } from "@/lib/idx/filterParams";
import { searchListings } from "@/lib/idx/search";
import { idxConfigured } from "@/lib/idx/config";

export const revalidate = 60;

type Params = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function toUrlSearchParams(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") searchParams.set(key, value);
    else if (Array.isArray(value) && value[0]) searchParams.set(key, value[0]);
  }
  return searchParams;
}

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.keys(params).length > 0;
  const base: Metadata = {
    title: "North County San Diego Homes for Sale · MLS Search",
    description: `Search every active MLS listing from Encinitas and Carlsbad to Oceanside and Fallbrook with ${site.brand.name}: filter by price, beds, baths, and neighborhood.`,
    // Every filter permutation canonicalises to the clean page, or Google
    // indexes thousands of near-duplicates of the same grid.
    alternates: { canonical: "/listings" },
  };
  // Filtered permutations stay crawlable but out of the index
  if (hasFilters) return { ...base, robots: { index: false, follow: true } };
  return base;
}

export default async function ListingsPage({ searchParams }: Params) {
  const params = await searchParams;
  const initialFilters = filtersFromParams(toUrlSearchParams(params));

  if (!idxConfigured()) {
    // Pre-IDX placeholder: native search UI over the agent's own portfolio
    const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
    return (
      <SiteChrome content={site}>
        <section className="idx-page-head">
          <div className="lp-container">
            <span className="idx-page-head__eyebrow">{site.landing?.serviceArea ?? "Property Search"}</span>
            <h1>Find a home that feels like yours.</h1>
            <p className="idx-page-head__sub">
              From coastal Encinitas and Carlsbad to Oceanside and the rolling hills of Fallbrook,
              explore homes {site.footer.agentName} has represented, with full MLS search coming soon.
            </p>
          </div>
        </section>
        <section className="solid-section">
          <div className="lp-container adv-search-wrap">
            <ListingsSearchPlaceholder
              listings={site.featured?.listings ?? []}
              initial={{
                city: one("city"), minPrice: one("minPrice"), maxPrice: one("maxPrice"),
                propertyTypes: one("propertyTypes"), minBeds: one("minBeds"),
                minBaths: one("minBaths"), minSqFt: one("minSqFt"), status: one("status"),
              }}
            />
          </div>
        </section>
      </SiteChrome>
    );
  }

  const initialResponse = await searchListings(initialFilters).catch(() => null);

  return (
    <SiteChrome content={site}>
      <section className="idx-page-head">
        <div className="lp-container">
          <span className="idx-page-head__eyebrow">{site.landing?.serviceArea ?? "Property Search"}</span>
          <h1>Find a home that feels like yours.</h1>
          <p className="idx-page-head__sub">
            Search every active listing from coastal Encinitas and Carlsbad to Oceanside and
            the rolling hills of Fallbrook.
          </p>
        </div>
      </section>
      <section className="solid-section">
        <div className="lp-container lp-vertical-paddings" style={{ paddingTop: 24 }}>
          <Suspense>
            <ListingsBrowser initialFilters={initialFilters} initialResponse={initialResponse} />
          </Suspense>
        </div>
      </section>
    </SiteChrome>
  );
}
