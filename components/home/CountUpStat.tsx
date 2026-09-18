"use client";

import { useEffect, useRef, useState } from "react";

/* ==========================================================================
   Animated stat: parses "$275M+", "40+", "Top 7%" into prefix/number/suffix
   and counts the number up when the element scrolls into view.
   ========================================================================== */

function parseStat(value: string): { prefix: string; num: number; suffix: string } | null {
  const match = value.match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
  if (!match) return null;
  const num = parseFloat(match[2].replace(/,/g, ""));
  if (!Number.isFinite(num)) return null;
  return { prefix: match[1], num, suffix: match[3] };
}

export default function CountUpStat({ value, durationMs = 1600 }: { value: string; durationMs?: number }) {
  const parsed = parseStat(value);
  const ref = useRef<HTMLSpanElement | null>(null);
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!parsed || !ref.current) return;
    const el = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      setProgress(1);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || startedRef.current) return;
        startedRef.current = true;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          // ease-out quart
          setProgress(1 - Math.pow(1 - t, 4));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!parsed) return <span>{value}</span>;

  const isInt = Number.isInteger(parsed.num);
  const current = parsed.num * progress;
  const shown = isInt ? Math.round(current).toLocaleString("en-US") : current.toFixed(1);

  return (
    <span ref={ref} aria-label={value}>
      {parsed.prefix}
      {shown}
      {parsed.suffix}
    </span>
  );
}
