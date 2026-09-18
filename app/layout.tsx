import type { Metadata } from "next";
import Analytics from "@/components/Analytics";
import { site } from "@/content/site";
import "./globals.css";

export const metadata: Metadata = {
  title: site.meta.title,
  description: site.meta.description,
  icons: { icon: "data:," },
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
        <Analytics />
        {children}
      </body>
    </html>
  );
}
