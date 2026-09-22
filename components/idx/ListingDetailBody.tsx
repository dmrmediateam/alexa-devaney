import type { SiteContent } from "@/content/site";
import ListingInquiryForm from "@/components/leads/ListingInquiryForm";
import ListingStickyCta from "@/components/idx/ListingStickyCta";
import type { ListingDetail } from "@/lib/idx/types";
import { formatPrice, formatSqFt } from "@/lib/idx/display";
import ListingGallery from "@/components/idx/ListingGallery";

const STATUS_LABEL: Record<string, string> = {
  active: "For Sale",
  pending: "Pending",
  sold: "Sold",
  comingSoon: "Coming Soon",
};

/* ==========================================================================
   Listing detail: gallery, address block, description, grouped features,
   and a sticky agent rail. Reads as a brochure, not a database record, so
   status is small-caps text rather than a colored pill and the photography
   carries the page.
   ========================================================================== */

export default function ListingDetailBody({
  listing,
  content,
}: {
  listing: ListingDetail;
  content: SiteContent;
}) {
  const status = STATUS_LABEL[listing.status] ?? "For Sale";
  const lotSize = listing.features.lotSizeAcres
    ? `${listing.features.lotSizeAcres} acres`
    : undefined;

  // "At a glance": only what the feed actually carries. San Diego MLS does not
  // return tax figures, so no tax row is invented here.
  const glance: Array<[string, string]> = [
    ["Price", formatPrice(listing.price)],
    ["Status", status],
    ["Property Type", listing.features.propertyType],
    ...(listing.features.yearBuilt ? ([["Year Built", String(listing.features.yearBuilt)]] as Array<[string, string]>) : []),
    ...(lotSize ? ([["Lot Size", lotSize]] as Array<[string, string]>) : []),
    ...(listing.daysOnMarket ? ([["Days on Market", String(listing.daysOnMarket)]] as Array<[string, string]>) : []),
    ["MLS®", listing.mlsNumber],
  ];

  const keyFacts = [
    listing.beds ? { value: String(listing.beds), label: listing.beds === 1 ? "Bedroom" : "Bedrooms" } : null,
    listing.baths ? { value: String(listing.baths), label: listing.baths === 1 ? "Bathroom" : "Bathrooms" } : null,
    listing.sqFt ? { value: formatSqFt(listing.sqFt), label: "Sq. Ft." } : null,
    { value: formatPrice(listing.price), label: status },
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  return (
    <article className="ld">
      <ListingGallery photos={listing.photos} alt={listing.address.full} />

      <div className="lp-container ld__layout">
        <div className="ld__main">
          <header className="ld__head">
            <p className="ld__mls">MLS® {listing.mlsNumber} · {status}</p>
            <h1 className="ld__address">{listing.address.street}</h1>
            <p className="ld__locality">
              {[listing.address.city, listing.address.state, listing.address.postalCode]
                .filter(Boolean)
                .join(", ")}
            </p>

            <dl className="ld__facts">
              {keyFacts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.value}</dt>
                  <dd>{fact.label}</dd>
                </div>
              ))}
            </dl>
          </header>

          {listing.description && (
            <section className="ld__section">
              <h2 className="ld__h2">About This Home</h2>
              <p className="ld__description">{listing.description}</p>
            </section>
          )}

          {listing.features.groups.length > 0 && (
            <section className="ld__section">
              <h2 className="ld__h2">Features &amp; Details</h2>
              {listing.features.groups.map((group, i) => (
                <details className="ld__group" key={group.title} open={i === 0}>
                  <summary>
                    <span>{group.title}</span>
                    <span className="ld__chevron" aria-hidden="true" />
                  </summary>
                  <dl className="ld__group-list">
                    {group.items.map((item) => (
                      <div key={`${group.title}-${item.label}`}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </section>
          )}

          <section className="ld__disclosures">
            {/* Attribution and disclaimer come from the feed's own fields */}
            <p>{listing.attribution}</p>
            {listing.disclosures.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </section>
        </div>

        <aside className="ld__rail">
          <div className="ld__rail-inner">
            <div className="ld__glance">
              <h2 className="ld__glance-title">At a Glance</h2>
              <dl>
                {glance.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="ld__agent">
              {content.about.avatar || content.about.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="ld__agent-photo"
                  src={content.about.avatar ?? content.about.image}
                  alt={content.footer.agentName}
                  width={96}
                  height={96}
                  loading="lazy"
                />
              ) : null}
              <div>
                <p className="ld__agent-name">{content.footer.agentName}</p>
                <p className="ld__agent-title">
                  {content.landing?.designations?.[0] ?? "Realtor"} · {content.footer.brokerage}
                </p>
                {content.contact?.phone && (
                  <a className="ld__agent-phone" href={`tel:${content.contact.phone.replace(/[^+\d]/g, "")}`}>
                    {content.contact.phone}
                  </a>
                )}
              </div>
            </div>

            <ListingInquiryForm
              address={listing.address.full}
              listingId={listing.mlsNumber}
              consent={content.footer.newsletter.consent}
            />
          </div>
        </aside>
      </div>

      <ListingStickyCta phone={content.contact?.phone} />
    </article>
  );
}
