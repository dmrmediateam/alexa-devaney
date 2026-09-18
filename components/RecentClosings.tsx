import type { Listing } from "@/content/site";

/**
 * Recent closings grid for seller pages: addresses and specs, no prices.
 * The addresses prove current, verifiable activity in the market; sale
 * prices are left to the conversation (and some are other agents' data).
 */
export default function RecentClosings({
  listings,
  kicker = "Recently Sold",
  heading = "Recent Closings",
  intro,
}: {
  listings: Listing[];
  kicker?: string;
  heading?: string;
  intro?: string;
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
          <ul className="closings__grid">
            {listings.map((listing, i) => (
              <li className="closings__card reveal" data-delay={i * 60} key={`${listing.mls}-${i}`}>
                <a href={listing.href}>
                  <span className="closings__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={listing.image} alt={listing.address} loading="lazy" />
                    <span className="closings__tag">Sold</span>
                  </span>
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
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
