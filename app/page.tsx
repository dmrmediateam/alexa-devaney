import SitePage from "@/components/SitePage";
import { site } from "@/content/site";
import { getFeaturedListings, mergeFeatured } from "@/lib/idxbroker";

/*
 * Daily regeneration so the SDMLS compilation copyright year in the footer
 * rolls over on its own. SDMLS requires that year to track the current year,
 * and a fully static build freezes it at whatever year the site was last
 * deployed, which silently breaks compliance every January.
 */
export const revalidate = 86400;


export default async function Home() {
  const liveListings = mergeFeatured(await getFeaturedListings(), site.featured?.listings);
  return <SitePage content={site} liveListings={liveListings} />;
}
