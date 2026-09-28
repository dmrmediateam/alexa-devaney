import ListingImage from "@/components/ListingImage";
import type { ListingSummary } from "@/lib/idx/types";
import { formatPrice, formatSqFt } from "@/lib/idx/display";
import HeartButton from "@/components/idx/HeartButton";

const STATUS_LABEL: Record<string, string> = {
  active: "For Sale",
  pending: "Pending",
  sold: "Sold",
  comingSoon: "Coming Soon",
};

/** MLS listing card: same anatomy as the static ListingsGrid card */
export default function IdxListingCard({ listing }: { listing: ListingSummary }) {
  return (
    <a className="listing-card" href={listing.detailUrl}>
      <div className="listing-card__media">
        {listing.primaryPhoto ? (
          <ListingImage
            src={listing.primaryPhoto.url}
            alt={listing.address.full}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
            quality={70}
            loading="lazy"
          />
        ) : (
          <div className="listing-card__nophoto">Photo Coming Soon</div>
        )}
        <HeartButton
          size="sm"
          listing={{
            listingId: listing.mlsNumber,
            address: listing.address.full,
            city: listing.address.city,
            price: listing.price,
            url: listing.detailUrl,
            photo: listing.primaryPhoto?.url,
          }}
        />
        <div className="listing-card__badges">
          <span>{STATUS_LABEL[listing.status] ?? "For Sale"}</span>
          {listing.mlsNumber && <span>MLS&reg; {listing.mlsNumber}</span>}
        </div>
      </div>
      <div className="listing-card__body">
        <span className="listing-card__price">{formatPrice(listing.price)}</span>
        <span className="listing-card__address">{listing.address.full}</span>
        <span className="listing-card__meta">
          {[
            listing.beds ? `${listing.beds} Beds` : null,
            listing.baths ? `${listing.baths} Baths` : null,
            listing.sqFt ? `${formatSqFt(listing.sqFt)} Sq.Ft.` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
    </a>
  );
}
