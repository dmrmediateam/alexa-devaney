import SitePage from "@/components/SitePage";
import { site } from "@/content/site";
import { getFeaturedListings, mergeFeatured } from "@/lib/idxbroker";

export default async function Home() {
  const liveListings = mergeFeatured(await getFeaturedListings(), site.featured?.listings);
  return <SitePage content={site} liveListings={liveListings} />;
}
