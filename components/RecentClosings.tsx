import Image from "next/image";
import type { Listing } from "@/content/site";

/**
 * Recent closings grid.
 *
 * On a seller page the addresses alone prove current, verifiable activity and
 * the sale prices are left to the conversation. On the portfolio page the
 * prices are the point, so `showPrices` puts them on the card.
 */
export default function RecentClosings({
  listings,
  kicker = "Recently Sold",
  heading = "Recent Closings",
  intro,
  showPrices = false,
}: {
  listings: Listing[];
  kicker?: string;
  heading?: string;
  intro?: string;
  showPrices?: boolean;
}) {
  if (listings.length === 0) return null;

  return (
    <section className="solid-section">
      <div className="closings lp-vertical-paddings">
        <div className="lp-container">
          <div className="closings__head reveal">
            <span className="featured-band__kicker">{kicker}</span>
            <h2 className="lp-h2">{heading}</h2>
            {intro && <p className="closings__intro">{intro}</p>}
          </div>
          <ul
            className={`closings__grid${showPrices ? " closings__grid--priced" : ""}${
              listings.length <= 3 ? " closings__grid--few" : ""
            }`}
          >
            {listings.map((listing, i) => (
              <li className="closings__card reveal" data-delay={i * 60} key={`${listing.mls}-${i}`}>
                <a href={listing.href}>
                  <span className="closings__media">
                    <Image
                      src={listing.image}
                      alt={listing.address}
                      fill
                      sizes="(max-width: 380px) 100vw, (max-width: 768px) 50vw, 25vw"
                      quality={78}
                    />
                    <span className="closings__tag">{listing.status ?? "Sold"}</span>
                  </span>
                  {showPrices && listing.price && (
                    <span className="closings__price">{listing.price}</span>
                  )}
                  <span className="closings__address">{listing.address}</span>
                  {(listing.beds || listing.baths || listing.sqft) && (
                    <span className="closings__meta">
                      {[
                        listing.beds && `${listing.beds} bd`,
                        listing.baths && `${listing.baths} ba`,
                        // The API already returns "1,234"; Number() on that is NaN,
                        // so normalise first and fall back to the raw string.
                        listing.sqft &&
                          `${
                            Number(String(listing.sqft).replace(/[^\d.]/g, "")).toLocaleString() ||
                            listing.sqft
                          } sq ft`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                  <span className="closings__cue">View Property</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
