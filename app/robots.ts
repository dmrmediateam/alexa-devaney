import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = site.meta.siteUrl ?? "https://example.com";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
