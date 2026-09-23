import type { SiteContent } from "@/content/site";

/* ==========================================================================
   Site-wide structured data: who this agent is, where they work, and which
   profiles belong to them. This is what a local pack listing is built from,
   so every value has to be one the client can stand behind - the address and
   licence from `site.legal`/`footer`, the towns from `site.localSeo`.

   Listing and property pages emit their own Residence/Offer graphs on top of
   this; nothing here duplicates them.
   ========================================================================== */

export default function SiteJsonLd({ content }: { content: SiteContent }) {
  const siteUrl = content.meta.siteUrl ?? "https://example.com";
  const agentId = `${siteUrl}/#agent`;
  const phone = content.contact?.phone;
  const [street, cityLine] = content.footer.addressLines;
  // "La Jolla, CA 92037" -> city / region / postal code
  const localityMatch = cityLine?.match(/^(.*),\s*([A-Z]{2})\s*(\d{5})?/);
  /** Structured data needs absolute URLs; the config stores site-root paths */
  const absolute = (path: string | undefined) =>
    path ? (path.startsWith("http") ? path : `${siteUrl}${path}`) : undefined;
  const licenseValue = (value: string) => ({
    "@type": "PropertyValue",
    name: `${content.legal?.licenseState ?? "DRE"} License`,
    value,
  });

  const agent = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": agentId,
    name: content.footer.agentName,
    description: content.meta.description,
    url: siteUrl,
    image: absolute(content.about?.avatar ?? content.about?.image),
    logo: absolute(content.brand.brokerageLogo?.dark),
    ...(phone ? { telephone: phone } : {}),
    ...(content.contact?.email ? { email: content.contact.email } : {}),
    ...(street
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: street,
            addressLocality: localityMatch?.[1] ?? undefined,
            addressRegion: localityMatch?.[2] ?? undefined,
            postalCode: localityMatch?.[3] ?? undefined,
            addressCountry: "US",
          },
        }
      : {}),
    ...(content.localSeo?.areaServed
      ? {
          areaServed: [
            ...content.localSeo.areaServed.map((name) => ({
              "@type": "City",
              name,
              containedInPlace: content.localSeo?.region
                ? { "@type": "AdministrativeArea", name: content.localSeo.region }
                : undefined,
            })),
          ],
        }
      : {}),
    ...(content.localSeo?.sameAs?.length ? { sameAs: content.localSeo.sameAs } : {}),
    ...(content.footer.brokerage
      ? {
          parentOrganization: {
            "@type": "RealEstateOrganization",
            name: content.footer.brokerage,
            ...(content.landing?.brokerageLicense
              ? { identifier: licenseValue(content.landing.brokerageLicense) }
              : {}),
          },
        }
      : {}),
    ...(content.legal?.licenseNumber ? { identifier: licenseValue(content.legal.licenseNumber) } : {}),
    knowsLanguage: "en-US",
    ...(content.landing?.designations?.[0] ? { jobTitle: content.landing.designations[0] } : {}),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: content.brand.name,
    description: content.meta.description,
    publisher: { "@id": agentId },
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/listings?city={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agent) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
