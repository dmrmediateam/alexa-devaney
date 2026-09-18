import type { Metadata } from "next";
import { Suspense } from "react";
import SiteChrome from "@/components/SiteChrome";
import ListingsBrowser from "@/components/idx/ListingsBrowser";
import ListingsGrid from "@/components/ListingsGrid";
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
    title: `Property Search – ${site.brand.name}`,
    description: `Search every MLS listing in our market with ${site.brand.name}: filter by price, beds, baths, and neighborhood.`,
  };
  // Filtered permutations stay crawlable but out of the index
  if (hasFilters) return { ...base, robots: { index: false, follow: true } };
  return base;
}

export default async function ListingsPage({ searchParams }: Params) {
  const params = await searchParams;
  const initialFilters = filtersFromParams(toUrlSearchParams(params));

  if (!idxConfigured()) {
    // Demo/unconnected state: config fallback listings + explainer
    const fallback = site.featured?.listings ?? [];
    return (
      <SiteChrome content={site}>
        <section className="idx-page-head">
          <div className="lp-container">
            <h1 className="lp-h2">Property Search</h1>
            <p className="idx-page-head__sub">MLS search goes live once this site is connected to IDX Broker.</p>
          </div>
        </section>
        {fallback.length > 0 && (
          <section className="solid-section">
            <div className="featured-band lp-vertical-paddings" style={{ paddingTop: 20 }}>
              <div className="lp-container">
                <ListingsGrid listings={fallback} />
              </div>
            </div>
          </section>
        )}
      </SiteChrome>
    );
  }

  const initialResponse = await searchListings(initialFilters).catch(() => null);

  return (
    <SiteChrome content={site}>
      <section className="idx-page-head">
        <div className="lp-container">
          <h1 className="lp-h2">Property Search</h1>
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
