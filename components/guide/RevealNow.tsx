"use client";

import { useEffect, useRef } from "react";

/** Forms carry the site's `.reveal` class, which only animates elements
 *  present at first paint; anything mounted later is shown immediately. */
export default function RevealNow({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.querySelectorAll(".reveal").forEach((el) => el.classList.add("animated"));
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
