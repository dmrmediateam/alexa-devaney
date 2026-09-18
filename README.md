# Luxury Real Estate Template

A Next.js (App Router, TypeScript) recreation of the Nadler Real Estate Advisory preview
site , matching its layout, UI/UX, and motion exactly.

## New client site

Spawn a repo from this template (GitHub "Use this template"), then:

```bash
npm install
npm run new-client -- --slug carole-tierney --name "Carole Tierney" --variant estate
```

One homepage variant stays, everything template-only is stripped, and
`content/site.ts` becomes the client's config. See CLAUDE.md for the
full playbook.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000/ — `npm run build && npm start` for production.

## Files

- `content/site.ts` — **all content lives here**: brand, nav, hero, cards, copy, footer,
  every image URL. Typed (`SiteContent`), so mistakes surface at build time. To make a
  site for a new client, edit only this file.
- `app/page.tsx` — the page (hero → cards → intro → areas → about → CTA → footer),
  rendered entirely from `content/site.ts`
- `app/layout.tsx` — metadata (from the config) + font loading
- `app/globals.css` — design system; all colors/fonts are CSS variables in `:root`
- `components/SiteEffects.tsx` — all motion behaviors (client component, cleanly torn down on unmount)

The default config ships with neutral demo content ("Meridian Real Estate Advisory") and
picsum.photos placeholder images — no client branding or Luxury Presence assets. The hero
supports either a background video (`hero.video`) or a still image (`hero.image` alone);
gallery sections take any number of cards in 2- or 3-column layouts.

## Design tokens (top of `app/globals.css`)

| Token | Value | Role |
|---|---|---|
| `--navy` | `#004F71` | headings, buttons, accents |
| `--taupe` | `#88786A` | body text, hero overlay |
| `--cream` | `#FBF9F7` | page background |
| `--heading-font` | Futura → Jost | headings, nav, card titles |
| `--body-font` | Avenir LT Std → Montserrat | body copy, buttons |

The original uses licensed Futura / Avenir LT Std; Google Fonts Jost and Montserrat are
loaded as free equivalents (the original site loads these same fallbacks). If the client
has the licensed fonts, add `@font-face` rules and they take over automatically.

## Motion inventory (replicated from the original)

1. **Hero** — autoplaying looped background video with taupe overlay `rgba(136,120,106,.4)`,
   content pinned bottom-left.
2. **Navbar** — transparent white-text over the hero; after scrolling past ~55% of the hero
   it slides down as a solid white bar with dark text (original uses a `translateY(-100px)`
   reveal — same effect).
3. **Sticky search bar** — navy `rgba(0,79,113,.9)` bar sticks to the top on scroll;
   "Request a Call" arrow slides right on hover.
4. **Gallery cards** — image zooms to `scale(1.07)` over `0.75s ease-out` on hover (exact
   original transition), overlay darkens, "Learn More" underline grows.
5. **Scroll reveals** — fade-in-up on entry (WOW.js/fadeInUp equivalent, done with
   IntersectionObserver; respects `prefers-reduced-motion`).
6. **CTA parallax** — fixed-background section with dark gradient overlay; JS transform
   fallback for iOS where `background-attachment: fixed` is unsupported.
7. **Floating "Let's Connect" pill** — fades in after leaving the hero.
8. **Hamburger side menu** — right slide-in panel with dim overlay, Escape/overlay closes.

## Swapping content for a new client

Edit `content/site.ts` only:

- **Brand**: `brand.name` / `brand.tagline` drive the header wordmark, footer wordmark,
  and page metadata. Swap the text wordmark for an `<img>` in `app/page.tsx` if the
  client has a logo file.
- **Images/video**: every image URL is a config field (picsum placeholders by default).
  Set `hero.video = { webm, mp4 }` to use a background video; omit it for a still hero.
- **Copy**: hero, intro paragraphs, about blocks, CTA, consent text — all config fields.
- **Cards**: `services` (3-column) and `areas` (2-column) accept any number of cards;
  `preTitle`/`cta` lines are optional per card.
- **Forms**: the search input and newsletter form are front-end only; wire them to your
  backend or CRM.
