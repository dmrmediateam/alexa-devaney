"use client";

import { useEffect } from "react";

/* ==========================================================================
   Replicates the original site's motion (ported unchanged from js/main.js):
   1. Navbar: transparent over hero → solid white slide-down after scrolling
   2. Scroll-reveal (WOW.js fadeInUp equivalent) via IntersectionObserver
   3. Parallax CTA background fallback for iOS / small screens
   4. Floating "Let's Connect" button appears after leaving the hero
   5. Hamburger side-menu slide-in
   ========================================================================== */

export default function SiteEffects() {
  useEffect(() => {
    const navbar = document.getElementById("global-navbar");
    const connectBtn = document.getElementById("connect-btn");
    const hero = document.querySelector<HTMLElement>(".video-section");
    if (!navbar || !connectBtn) return;

    /* ---------- 1. Navbar state ---------- */
    function updateNav() {
      if (!navbar || !connectBtn) return;
      // No hero on this page: the navbar stays solid from the first paint
      if (!hero) {
        navbar.classList.add("scrolled");
        connectBtn.classList.add("visible");
        return;
      }
      const y = window.scrollY;
      const threshold = hero.offsetHeight * 0.55;

      if (y > threshold) {
        if (!navbar.classList.contains("scrolled")) {
          // slide-down entrance, mirroring the original translateY(-100px) reveal
          navbar.classList.add("hidden-up");
          navbar.classList.add("scrolled");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => navbar.classList.remove("hidden-up"));
          });
        }
        connectBtn.classList.add("visible");
      } else {
        navbar.classList.remove("scrolled", "hidden-up");
        connectBtn.classList.remove("visible");
      }
    }

    window.addEventListener("scroll", updateNav, { passive: true });
    updateNav();

    /* ---------- 2. Scroll reveal ---------- */
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");

    reveals.forEach((el) => {
      const delay = el.getAttribute("data-delay");
      if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
    });

    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animated");
              io!.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      reveals.forEach((el) => io!.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add("animated"));
    }

    /* ---------- 3. Parallax fallback for iOS / small screens ---------- */
    const parallaxSection = document.querySelector<HTMLElement>(
      ".image-section.parallax-enabled"
    );
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    let parallaxHandler: (() => void) | undefined;

    if (
      parallaxSection &&
      (isIOS || window.matchMedia("(max-width: 768px)").matches)
    ) {
      let ticking = false;

      const applyParallax = () => {
        const rect = parallaxSection.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          const progress =
            (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
          const offset = (progress - 0.5) * rect.height * 0.3;
          parallaxSection.style.backgroundPosition =
            "center calc(50% + " + offset.toFixed(1) + "px)";
        }
        ticking = false;
      };

      parallaxHandler = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(applyParallax);
        }
      };

      window.addEventListener("scroll", parallaxHandler, { passive: true });
      applyParallax();
    }

    /* ---------- 4. Side menu ---------- */
    const sidemenu = document.getElementById("sidemenu");
    const overlay = document.getElementById("sidemenu-overlay");
    const openBtn = document.getElementById("hamburger");
    const closeBtn = document.getElementById("sidemenu-close");

    function openMenu() {
      sidemenu?.classList.add("open");
      overlay?.classList.add("visible");
      sidemenu?.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeMenu() {
      sidemenu?.classList.remove("open");
      overlay?.classList.remove("visible");
      sidemenu?.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }

    openBtn?.addEventListener("click", openMenu);
    closeBtn?.addEventListener("click", closeMenu);
    overlay?.addEventListener("click", closeMenu);
    document.addEventListener("keydown", onKeydown);

    /* ---------- 5. Hero video autoplay guard ---------- */
    const video = document.querySelector<HTMLVideoElement>(".video-section video");
    if (video) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          /* poster remains visible */
        });
      }
    }

    /* ---------- cleanup ---------- */
    return () => {
      window.removeEventListener("scroll", updateNav);
      if (parallaxHandler) window.removeEventListener("scroll", parallaxHandler);
      io?.disconnect();
      openBtn?.removeEventListener("click", openMenu);
      closeBtn?.removeEventListener("click", closeMenu);
      overlay?.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = "";
    };
  }, []);

  return null;
}
