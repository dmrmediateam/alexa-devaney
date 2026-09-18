import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SubPageView from "@/components/SubPageView";
import { getFeaturedListings } from "@/lib/idxbroker";
import { idxConfigured } from "@/lib/idx/config";
import { site } from "@/content/site";

export function generateStaticParams() {
  // /listings is the native IDX search route; the config's "listings" page
  // remains available in client-slug scopes only
  return site.pages.filter((page) => page.slug !== "listings").map((page) => ({ slug: page.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = site.pages.find((p) => p.slug === slug);
  return {
    title: page ? `${page.title} – ${site.brand.name}` : site.meta.title,
    description: page?.intro?.[0] ?? site.meta.description,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = site.pages.find((p) => p.slug === slug);
  if (!page) notFound();
  const liveListings = page.type === "listings" || page.showListings ? await getFeaturedListings() : null;
  return <SubPageView idxEnabled={idxConfigured()} liveListings={liveListings} content={site} page={page} />;
}
