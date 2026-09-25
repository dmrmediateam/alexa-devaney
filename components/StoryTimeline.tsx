import type { SiteContent } from "@/content/site";

/* ==========================================================================
   Career timeline.

   Trust in this business is built on continuity: the same person, the same
   market, year after year. A timeline shows that better than a paragraph of
   adjectives can. Milestones without a confirmed year simply render without
   one, so nothing here depends on inventing a date.
   ========================================================================== */

export default function StoryTimeline({ story }: { story: NonNullable<SiteContent["story"]> }) {
  if (story.milestones.length === 0) return null;

  return (
    <section className="solid-section">
      <div className="story lp-vertical-paddings">
        <div className="lp-container">
          <div className="story__head reveal">
            {story.kicker && <span className="featured-band__kicker">{story.kicker}</span>}
            <h2 className="lp-h2">{story.title}</h2>
            {story.intro && <p className="story__intro">{story.intro}</p>}
          </div>

          <ol className="story__list">
            {story.milestones.map((milestone, i) => (
              <li className="story__item reveal" data-delay={Math.min(i * 80, 320)} key={milestone.title}>
                <div className="story__marker" aria-hidden="true" />
                <div className="story__body">
                  {milestone.year && <span className="story__year">{milestone.year}</span>}
                  <h3 className="story__title">{milestone.title}</h3>
                  <p className="story__text">{milestone.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
