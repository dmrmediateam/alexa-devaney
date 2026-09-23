import Image from "next/image";
import type { Listing } from "@/content/site";

/* ==========================================================================
   Active-listing spotlight.

   A three-across card grid needs three cards. With one or two active homes
   the grid leaves a hole the width of the page, so those listings get an
   editorial split instead: photography at full column width, the facts and
   both calls to action in a panel beside it. Three or more go back to the
   standard grid (see SubPageView).
   ========================================================================== */

/** "4462 Fallsbrae Rd, Fallbrook" -> ["4462 Fallsbrae Rd", "Fallbrook"] */
function splitAddress(address: string): [string, string | undefined] {
  const parts = address.split(",");
  const street = parts.shift()?.trim() ?? address;
  const locality = parts.join(",").trim();
  return [street, locality || undefined];
}

export default function PortfolioSpotlight({
  listings,
  ctaHref,
  ctaLabel = "Request a Showing",
}: {
  listings: Listing[];
  ctaHref: string;
  ctaLabel?: string;
}) {
  if (listings.length === 0) return null;

  return (
    <div className={`spotlights${listings.length > 1 ? " spotlights--pair" : ""}`}>
      {listings.map((listing, i) => {
        const [street, locality] = splitAddress(listing.address);
        const specs = [
          listing.beds && `${listing.beds} Beds`,
          listing.baths && `${listing.baths} Baths`,
          listing.sqft && `${listing.sqft} Sq.Ft.`,
        ].filter(Boolean) as string[];

        return (
          <article className="spotlight reveal" data-delay={i ? i * 120 : undefined} key={listing.mls ?? listing.address}>
            <a className="spotlight__media" href={listing.href} aria-label={`View ${listing.address}`}>
              <Image
                src={listing.image}
                alt={listing.address}
                fill
                sizes="(max-width: 1000px) 100vw, 55vw"
                quality={80}
              />
              {listing.status && <span className="spotlight__tag">{listing.status}</span>}
            </a>

            <div className="spotlight__panel">
              {listing.mls && <p className="spotlight__mls">MLS&reg; {listing.mls}</p>}
              <p className="spotlight__price">{listing.price}</p>
              <h3 className="spotlight__address">
                <a href={listing.href}>{street}</a>
                {locality && <span>{locality}</span>}
              </h3>

              {specs.length > 0 && (
                <ul className="spotlight__specs">
                  {specs.map((spec) => (
                    <li key={spec}>{spec}</li>
                  ))}
                </ul>
              )}

              <div className="spotlight__actions">
                <a className="lp-btn btn--primary-light" href={listing.href}>
                  View Property
                </a>
                <a className="spotlight__link" href={ctaHref}>
                  {ctaLabel}
                </a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
