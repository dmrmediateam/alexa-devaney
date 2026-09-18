import HomeNoir from "@/components/home/HomeNoir";
import type { Listing, SiteContent } from "@/content/site";

/* This client uses the "noir" homepage design (locked by new-client). */

export default function SitePage({
  content,
  liveListings,
}: {
  content: SiteContent;
  liveListings?: Listing[] | null;
}) {
  return <HomeNoir content={content} liveListings={liveListings} />;
}
