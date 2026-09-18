"use client";

import { useEffect, useRef } from "react";

/* ==========================================================================
   Scroll-linked "flight" from the hero emblem (bottom-right) to the large
   background decal in the statement section. The two static images stay in
   the markup as anchors (and as the no-JS / reduced-motion fallback); while
   this runs they are hidden and a single floating mark interpolates between
   their positions, scale, rotation, and opacity, crossfading emblem -> decal.
   ========================================================================== */

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Box = { cx: number; cy: number; w: number };

export default function EmblemFlight({ emblem, decal }: { emblem: string; decal: string }) {
  const flyer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = flyer.current?.parentElement;
    const start = root?.querySelector<HTMLElement>(".hn-hero__emblem");
    const end = root?.querySelector<HTMLElement>(".hn-statement__decal");
    const el = flyer.current;
    if (!root || !start || !end || !el) return;

    let from: Box | null = null;
    let to: Box | null = null;
    let endRot = -12;
    let endOpacity = 0.16;

    // Center + unrotated width of an anchor, in root coordinates
    const measure = (node: HTMLElement): Box => {
      const r = node.getBoundingClientRect();
      const base = root.getBoundingClientRect();
      return { cx: r.left + r.width / 2 - base.left, cy: r.top + r.height / 2 - base.top, w: node.offsetWidth };
    };

    const layout = () => {
      from = measure(start);
      to = measure(end);
      const cs = getComputedStyle(end);
      endOpacity = parseFloat(cs.opacity) || 0.16;
      const m = cs.transform.match(/matrix\(([^)]+)\)/);
      if (m) {
        const [a, b] = m[1].split(",").map(Number);
        endRot = (Math.atan2(b, a) * 180) / Math.PI;
      }
      el.style.width = `${to.w}px`;
      el.style.height = `${to.w}px`;
      render();
    };

    let frame = 0;
    const render = () => {
      frame = 0;
      if (!from || !to) return;
      // 0 at the top of the page, 1 once the decal's center reaches mid-viewport
      const rootTop = root.getBoundingClientRect().top + window.scrollY;
      const travel = rootTop + to.cy - window.innerHeight * 0.5;
      const t = ease(clamp(window.scrollY / Math.max(1, travel)));
      const inFlight = t > 0.001 && t < 0.999;

      root.classList.toggle("hn--emblem-flying", inFlight);
      root.classList.toggle("hn--emblem-landed", t >= 0.999);

      const cx = lerp(from.cx, to.cx, t);
      const cy = lerp(from.cy, to.cy, t);
      const scale = lerp(from.w, to.w, t) / to.w;
      el.style.opacity = inFlight ? String(lerp(1, endOpacity, t)) : "0";
      el.style.transform = `translate(${cx - to.w / 2}px, ${cy - to.w / 2}px) scale(${scale}) rotate(${lerp(0, endRot, t)}deg)`;
      el.style.setProperty("--mix", String(clamp((t - 0.25) / 0.5)));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    root.classList.add("hn--emblem-flight");
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    [start, end].forEach((img) => img instanceof HTMLImageElement && !img.complete && img.addEventListener("load", layout, { once: true }));

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
      root.classList.remove("hn--emblem-flight", "hn--emblem-flying", "hn--emblem-landed");
    };
  }, []);

  return (
    <div className="hn-emblem-flyer" ref={flyer} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hn-emblem-flyer__emblem" src={emblem} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hn-emblem-flyer__decal" src={decal} alt="" />
    </div>
  );
}
