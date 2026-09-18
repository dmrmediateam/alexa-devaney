import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { legalDocs } from "@/lib/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = site.meta.siteUrl ?? "https://example.com";
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/listings`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    ...site.pages
      .filter((page) => page.slug !== "listings")
      .map((page) => ({
        url: `${siteUrl}/${page.slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ...legalDocs(site).map((doc) => ({
      url: `${siteUrl}/legal/${doc.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
