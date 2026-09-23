import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SubPageView from "@/components/SubPageView";
import { getFeaturedListings, mergeFeatured } from "@/lib/idxbroker";
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
  if (!page) return { title: { absolute: site.meta.title }, description: site.meta.description };

  // metaTitle is written for the search result; the layout template appends
  // the brand, so a page-specific title never has to repeat it.
  const title = page.metaTitle ?? page.title;
  const description = page.metaDescription ?? page.intro?.[0] ?? site.meta.description;
  const url = `/${page.slug}`;
  const image = page.ogImage ?? page.heroImage ?? site.meta.ogImage;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${title} | ${site.brand.name}`,
      description,
      ...(image ? { images: [{ url: image, alt: page.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.brand.name}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = site.pages.find((p) => p.slug === slug);
  if (!page) notFound();
  const liveListings =
    page.type === "listings" || page.showListings
      ? mergeFeatured(await getFeaturedListings(), site.featured?.listings)
      : null;
  return <SubPageView idxEnabled={idxConfigured()} liveListings={liveListings} content={site} page={page} />;
}
