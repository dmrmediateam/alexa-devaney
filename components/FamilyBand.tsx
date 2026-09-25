import Image from "next/image";
import type { SiteContent } from "@/content/site";

/* ==========================================================================
   Family / life-outside-work band.

   The layout adapts to however many photos exist (one reads as an editorial
   spread, several as a gallery strip), so the client can send more family
   photos later and they drop straight into the config with no code change.
   ========================================================================== */

export default function FamilyBand({
  family,
  tone = "light",
  showCta = true,
}: {
  family: NonNullable<SiteContent["family"]>;
  /** "dark" for the noir homepage, "light" for interior pages */
  tone?: "light" | "dark";
  /** Off where the page already ends with the same call to action */
  showCta?: boolean;
}) {
  const photos = family.photos.filter((photo) => photo.image);
  if (photos.length === 0 && family.paragraphs.length === 0) return null;

  return (
    <section className={`solid-section${tone === "dark" ? " family--dark" : ""}`}>
      <div className="family lp-vertical-paddings">
        <div className="lp-container family__grid">
          <div className="family__text reveal">
            {family.kicker && <span className="featured-band__kicker">{family.kicker}</span>}
            <h2 className="lp-h2">{family.title}</h2>
            {family.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            {showCta && family.cta && (
              <a className="lp-btn btn--primary-light family__cta" href={family.cta.href}>
                {family.cta.label}
              </a>
            )}
          </div>

          {photos.length > 0 && (
            <div className={`family__photos family__photos--${Math.min(photos.length, 5)} reveal`} data-delay="120">
              {photos.map((photo, i) => (
                <figure className="family__photo" key={photo.image}>
                  <Image
                    src={photo.image}
                    alt={photo.caption ?? ""}
                    fill
                    sizes={
                      photos.length === 1
                        ? "(max-width: 900px) 100vw, 45vw"
                        : "(max-width: 900px) 50vw, 25vw"
                    }
                    quality={78}
                  />
                  {photo.caption && i === 0 && <figcaption>{photo.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
