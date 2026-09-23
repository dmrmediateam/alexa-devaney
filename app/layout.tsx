import type { Metadata, Viewport } from "next";
import Analytics from "@/components/Analytics";
import SiteJsonLd from "@/components/seo/SiteJsonLd";
import { site } from "@/content/site";
import "./globals.css";

const siteUrl = site.meta.siteUrl ?? "https://example.com";
const ogImage = site.meta.ogImage ?? site.hero.image;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.meta.title,
    // Interior pages pass only their own title; the brand is appended here so
    // no page has to repeat it (and none can forget it).
    template: `%s | ${site.brand.name}`,
  },
  description: site.meta.description,
  applicationName: site.brand.name,
  authors: [{ name: site.footer.agentName, url: siteUrl }],
  creator: site.footer.agentName,
  publisher: site.footer.brokerage,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: `${site.brand.name} · ${site.footer.brokerage}`,
    locale: "en_US",
    url: siteUrl,
    title: site.meta.title,
    description: site.meta.description,
    images: [{ url: ogImage, width: 1200, height: 630, alt: `${site.footer.agentName}, ${site.footer.brokerage}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.meta.title,
    description: site.meta.description,
    images: [ogImage],
  },
  // Phone numbers are already marked up as tel: links; iOS Safari's own
  // detection double-styles them.
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: site.theme.primary,
  colorScheme: "light",
};

/** Convert "#RRGGBB" to "r, g, b" for rgba() variants */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

const themeVars = {
  "--navy": site.theme.primary,
  "--navy-90": `rgba(${hexToRgb(site.theme.primary)}, 0.9)`,
  "--taupe": site.theme.secondary,
  "--taupe-overlay": `rgba(${hexToRgb(site.theme.primary)}, 0.45)`, // O Group: rich-black photo overlay, not red
  "--cream": site.theme.background,
} as React.CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={themeVars}>
      <head>
        {/* Montserrat is the only typeface The Oppenheim Group brand guide allows */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteJsonLd content={site} />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
