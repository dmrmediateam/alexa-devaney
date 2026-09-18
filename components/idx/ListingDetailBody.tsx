import type { SiteContent } from "@/content/site";
import ListingInquiryForm from "@/components/leads/ListingInquiryForm";
import type { ListingDetail } from "@/lib/idx/types";
import { formatPrice, formatSqFt } from "@/lib/idx/display";
import ListingGallery from "@/components/idx/ListingGallery";

const STATUS_LABEL: Record<string, string> = {
  active: "For Sale",
  pending: "Pending",
  sold: "Sold",
  comingSoon: "Coming Soon",
};

/** Listing detail: header, gallery, facts, description, features, agent rail */
export default function ListingDetailBody({ listing, content }: { listing: ListingDetail; content: SiteContent }) {
  const facts: Array<[string, string]> = [
    ["Price", formatPrice(listing.price)],
    ["Bedrooms", listing.beds ? String(listing.beds) : "–"],
    ["Bathrooms", listing.baths ? String(listing.baths) : "–"],
    ["Living Area", listing.sqFt ? `${formatSqFt(listing.sqFt)} Sq.Ft.` : "–"],
    ["Property Type", listing.features.propertyType],
    ["Year Built", listing.features.yearBuilt ? String(listing.features.yearBuilt) : "–"],
    ["MLS® Number", listing.mlsNumber],
    ["Status", STATUS_LABEL[listing.status] ?? listing.status],
  ];

  return (
    <article className="listing-detail">
      <header className="listing-detail__head lp-container">
        <div className="listing-detail__head-main">
          <span className="listing-detail__status">{STATUS_LABEL[listing.status] ?? "For Sale"}</span>
          <h1 className="listing-detail__address">{listing.address.full}</h1>
          <p className="listing-detail__meta">
            {[
              listing.beds ? `${listing.beds} Beds` : null,
              listing.baths ? `${listing.baths} Baths` : null,
              listing.sqFt ? `${formatSqFt(listing.sqFt)} Sq.Ft.` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="listing-detail__price">{formatPrice(listing.price)}</div>
      </header>

      <ListingGallery photos={listing.photos} alt={listing.address.full} />

      <div className="listing-detail__layout lp-container">
        <div className="listing-detail__main">
          {listing.description && (
            <section className="listing-detail__section">
              <h2 className="lp-h2">About This Home</h2>
              <p className="listing-detail__description">{listing.description}</p>
            </section>
          )}

          <section className="listing-detail__section">
            <h2 className="lp-h2">Property Facts</h2>
            <dl className="listing-detail__facts">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {listing.features.groups.length > 0 && (
            <section className="listing-detail__section">
              <h2 className="lp-h2">Features &amp; Details</h2>
              {listing.features.groups.map((group) => (
                <details className="listing-detail__group" key={group.title}>
                  <summary>{group.title}</summary>
                  <dl className="listing-detail__facts">
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

          <section className="listing-detail__disclosures">
            <p>{listing.attribution}</p>
            {listing.disclosures.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </section>
        </div>

        <aside className="listing-detail__rail">
          <div className="listing-detail__agent">
            {content.about.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.about.image} alt={content.footer.agentName} />
            )}
            <h3>{content.footer.agentName}</h3>
            <p>{content.footer.brokerage}</p>
            {content.contact?.phone && <a href={`tel:${content.contact.phone.replace(/[^+\d]/g, "")}`}>{content.contact.phone}</a>}
            {content.contact?.email && <a href={`mailto:${content.contact.email}`}>{content.contact.email}</a>}
          </div>
          <ListingInquiryForm
            address={listing.address.full}
            listingId={listing.mlsNumber}
            consent={content.footer.newsletter.consent}
          />
        </aside>
      </div>
    </article>
  );
}
