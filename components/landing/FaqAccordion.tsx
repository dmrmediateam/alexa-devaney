"use client";

import { useState } from "react";

/** One-open-at-a-time FAQ list. Also rendered as FAQPage JSON-LD by the page. */
export default function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="lp-faq">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div className="lp-faq__item" key={item.q}>
            <h3>
              <button
                type="button"
                className="lp-faq__btn"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-btn-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {item.q}
                <span className="lp-faq__icon" aria-hidden="true">{isOpen ? "×" : "+"}</span>
              </button>
            </h3>
            <div
              className="lp-faq__panel"
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-btn-${i}`}
              hidden={!isOpen}
            >
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
