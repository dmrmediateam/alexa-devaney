import SitePage from "@/components/SitePage";
import { site } from "@/content/site";
import { getFeaturedListings } from "@/lib/idxbroker";

export default async function Home() {
  const liveListings = await getFeaturedListings();
  return <SitePage content={site} liveListings={liveListings} />;
}
