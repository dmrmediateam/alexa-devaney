import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/** Home-screen install metadata: name, brand colours, and the app icons. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.brand.name} · ${site.footer.brokerage}`,
    short_name: site.meta.shortName ?? site.brand.name,
    description: site.meta.description,
    start_url: "/",
    display: "standalone",
    background_color: site.theme.background,
    theme_color: site.theme.primary,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
