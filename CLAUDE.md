> CLIENT REPO: **Alexa Devaney** · homepage variant: **noir** · scaffolded by new-client.
> This repo serves ONE client. Customize content/site.ts per the playbook below;
> the other homepage variants have been removed by design - do not re-add them.

# Client Customization Playbook

This repo is a reusable luxury real estate template. When a user gives you client
material (logo, colors, service areas, Zillow/realtor.com/Google Business links,
photos), your job is to customize this template for that client. **All content edits
happen in `content/site.ts` — do not restructure components or CSS unless asked.**

## How this template works

- `content/site.ts` — the `SiteContent` type + neutral demo config: every word, link,
  image URL, brand color, logo, interior page, and IDX setting. Build fails on missing
  fields.
- `content/clients/<slug>.ts` — one config per client (see carole-tierney.ts). The
  homepage renders at `/<slug>`, interior pages at `/<slug>/<page>`, via the dynamic
  route in `app/<slug>/[slug]/page.tsx` (copy the carole-tierney folder to add a client).
- When a client graduates to their own repo/Vercel project: copy the repo, point
  `app/page.tsx` and `app/[slug]/page.tsx` at their config, delete other clients.
- `app/globals.css` — the design system. Colors flow from `site.theme` (injected as CSS
  variables in `app/layout.tsx`), so **never hardcode brand colors in CSS**.
- `app/page.tsx` — renders the config. Only touch it for structural changes
  (adding/removing whole sections).
- `components/SiteEffects.tsx` — scroll/hover motion. Don't change during customization.
- `public/` — put downloaded client assets here (logo, photos) and reference them as
  `/filename.ext` in the config.

## Homepage variants

Interior pages are identical across clients; the homepage carries the visual
identity. Pick one per client via `homeVariant` in their config:

- `"classic"` (default) - light; centered serif hero over photo/video,
  floating search card, editorial cards, stats band, overlay area cards
- `"noir"` - dark cinematic gallery; Ken Burns hero, serif statement,
  count-up stats, horizontal listings rail, full-width alternating area rows
- `"estate"` - bright architectural split-screen; type panel + clip-path
  image hero with inline stats, marquee ticker, hover-swap service showcase,
  staggered area collage, framed portrait with drop cap, split CTA

All three read the same config fields, so switching is a one-line change.
Compare them at /templates/classic, /templates/noir, /templates/estate
(noindexed). Variant code lives in components/home/; do not fork variants
per client - improve them for everyone.

## Teams vs individual agents

The template serves both; the reference team sites (Vignette Realty, The
Florio Team, Eagan Luxury, Legendary) all follow the same pattern:

- **Voice**: teams write "we" sitewide; `footer.agentName` holds the team
  name ("The Florio Team") and TCPA consent text names the team.
- **Homepage about stays a founder/lead spotlight** - every reference team
  site does this rather than cramming the roster onto the homepage. Set
  `about.imageStyle: "photo"` for a wide team photo instead of the circular
  headshot when the client prefers.
- **Roster page**: fill `team.members` (name, role, photo, phone, email,
  license, 1-2 sentence bio) and add a `type: "team"` page. Link it from
  the side menu and footer.
- **Per-agent profile pages** (the Vignette pattern) are just standard
  SubPages; point a member's `href` at one. Only build these when the
  client's agents each have real bios, testimonials, or listings to show.
- Individual agents simply omit `team` and the roster page.

## Intake checklist

Collect from the user (ask once for anything missing, then proceed with what you have):

1. **Logo** — files or a URL. Need a light (white) version for the hero nav and a dark
   version for the scrolled nav. If only one color exists, set it as both and note it.
2. **Brand colors** — primary + secondary. If not given, extract from the logo or their
   existing site; confirm your picks with swatches before applying.
3. **Agent/team name, brokerage, tagline** — drives wordmark, footer, metadata.
   For teams also collect: each member's name, role, headshot, phone, email,
   license number, and a short bio (see Teams section).
4. **Service areas** — becomes the `areas` gallery (any count works; 4 looks best).
5. **Zillow / realtor.com profile URL** — fetch it; mine for: agent bio, years of
   experience, sales stats, specialties, team members, reviews. Rewrite (never copy
   verbatim) into the `about.blocks` and `intro.paragraphs`.
6. **Google Business profile** — address (footer), phone, hours, review themes.
7. **Photos** — see the photo workflow below.

## Applying the customization

Work through `content/site.ts` top to bottom:

| Config field | Source |
|---|---|
| `theme.primary/secondary/background` | brand colors (keep background near-white; it's the page canvas) |
| `brand.name/tagline`, `brand.logo` | logo + name. Logo files go in `public/` |
| `meta` | "[Main service] [City] – [Team Name]" pattern, ~60 chars title |
| `hero` | strongest wide image or video; preTitle = geographic hook |
| `nav`, `footer.links` | keep structure; rename to match the client's actual pages |
| `services` | keep Buy/Sell/New Development unless the client's focus differs |
| `stats` | 3 proof points (years, sales volume, ranking) — omit if the client has weak numbers |
| `intro`, `about` | rewritten from Zillow/realtor.com/GBP material — their voice, their stats |
| `areas` | one card per service area; write a 1-sentence `description` (shown on hover) |
| `pages` | listings (Featured Listings), buy (search: true), sell (valuation: true, wizard doubles as the page hero), search, connect. Add niche pages (e.g. new construction) only when the client actually specializes there, as Carole does |
| `featured.listings` | placeholder properties shown until IDX is connected. Mark them clearly (DEMO- MLS ids) and replace before launch |
| `idx` | client's IDX Broker subdomain (see IDX section) |
| `contact` | phone + email for the connect page |
| `cta`, `footer` | address from GBP; socials from their profiles |

Rules:
- Rewrite all copy in the client's voice — never leave "Meridian"/"Alex Morgan" text.
- Search the repo for `Meridian`, `Alex Morgan`, and `picsum` at the end; zero hits
  outside this file means you're done.
- Don't invent stats, awards, or credentials. Only use what the source material supports.
- Never use em dashes in site copy. Use commas, colons, periods, or a middle dot.

## Photo workflow (Envato Elements)

The team has an Envato Elements subscription. There is no public download API, so use
the **Claude in Chrome** connector (the user's real browser, already logged in):

1. Confirm the Chrome connector is available and elements.envato.com is logged in.
2. Search terms that match the client's market, e.g. "luxury condo interior",
   "[city] skyline aerial", "modern waterfront home", "real estate agent lifestyle".
3. Before downloading, show the user a shortlist (item pages/thumbnails) for approval.
4. Download with a license for the client's project (Elements asks which project to
   license to — create/select the client's name), saving to `public/photos/`.
5. Prefer: hero = wide horizontal (≥1920px), service cards = vertical/portrait,
   area cards = horizontal cityscape/neighborhood, about = agent's real headshot
   (never stock), CTA = wide skyline.
6. If the Chrome connector isn't available, ask the user to download the shortlist
   manually and drop the files in `public/photos/`.

Real photos beat stock: if the client's Zillow/GBP/website has quality original
photography the user can license, prefer it for listings/areas.

## IDX Broker: native search + listing pages (no embeds)

The template has a full native IDX integration (adapted from the
Legendary-Real-Estate production build) - server-rendered, SEO-indexed, no
iframes:

- `/listings` - MLS search: SSR'd first page, filter bar (location, price,
  beds, baths, status, sort), URL-synced filters (shareable searches),
  pagination, rate-limit fallbacks. Filtered URLs are `noindex, follow`.
- `/listing/[idxId]-[listingId]-[address]` - listing detail: gallery, facts,
  features accordion, agent rail with inquiry form, MLS attribution pulled
  from the API's own disclaimer fields, JSON-LD (Residence + Offer +
  BreadcrumbList), canonical/OG/Twitter metadata, similar listings.
- Homepage featured band / exclusive listings pull the client's own listings
  from `/clients/featured`.
- Buy page carries a working search (`search: true`): filters query
  /api/listings when IDX is connected, and filter the config's placeholder
  listings in memory when it is not, so search works in either state.
- Sell page carries the 3-step valuation wizard (`valuation: true`, optional
  `valuationImage`): address with MLS-backed autocomplete, property details,
  contact + TCPA consent. Front-end only; wire the submit to the client CRM.
- Data layer lives in `lib/idx/` - `request.ts` is the ONLY file that may
  call api.idxbroker.com. Components consume normalized types from
  `lib/idx/types.ts` only, never raw IDX shapes.

### Portfolio detail pages (/property/<slug>)

IDX drops a listing from the client feed the moment it closes, so sold homes
can never have an IDX detail page. `featured.listings` entries whose `href`
starts with `/property/` get a config-driven detail page instead, rendered by
the same `ListingDetailBody` as the live IDX pages (gallery, key facts, At a
Glance, agent rail + inquiry form, sticky CTA, JSON-LD, sitemap entry).

- Point every config listing's `href` at `/property/<slug>`; never at the
  brokerage's own site. Put the brokerage/MLS page in `mlsHref` and it is
  linked from the bottom of the detail page.
- `href` is the only source of truth for the slug; routes are generated from it.
- Optional per-listing fields: `gallery` (extra photos), `description` (real
  copy; a factual summary is generated from the specs when it is missing),
  `facts` (year built, lot size, HOA - rendered in the details accordion).
- Active listings that IDX does carry are replaced by the live feed on the
  page grids, so those cards link to `/listing/...` instead. Both routes look
  identical.

Per-client setup is env vars in Vercel (never in the repo):

```
IDX_API_KEY=...            # required for live data
IDX_ANCILLARY_KEY=...      # optional partner key (higher limits, detail access)
IDX_MARKET_CITIES=Naples,Bonita Springs,Marco Island   # cached browse pool
IDX_OFFICE_IDS=abc123      # marks "our listings" vs full MLS
```

Without a key, /listings shows the config fallback listings and a note; the
site still builds and deploys. Set `meta.siteUrl` in the client config for
correct canonicals/sitemap/JSON-LD.

## Area pages (/areas/<slug>)

Each entry in `areas` with a `slug` gets a page: banner, local intro, that
town's live MLS results, and a prefilled enquiry form. Two rules:

- **`cityId`, never a city name.** The IDX search endpoint silently returns
  the wrong set for a name. Get IDs from `GET /api/locations` (the same index
  the search autocomplete uses) and paste them into the config.
- **Photography must be that town.** Use destination imagery (a recognisable
  landmark or coastline) consistently across the area cards rather than
  mixing in listing photos, and verify the location before shipping - stock
  libraries are full of "Oceanside" that is Oceanside, New York, and the
  local buyer this page is for will spot it immediately. `heroFocus` sets the
  banner crop when the landmark sits low in the frame.

Area pages carry `changeFrequency: daily` in the sitemap; they are the local
SEO surface of the site.

## Search defaults

`searchListings` sorts **newest first** when no sort is given (`filters.sort ??
'newest'`), and the filter bar shows that as the active option. The feed's own
order is roughly price-descending, which opens the search on the most
expensive homes in the market and tells an ordinary buyer the site is not for
them. Do not "fix" the default back to price.

## Stats, story and family blocks

- `stats[].pending: true` marks a number the client has estimated but the MLS
  has not confirmed. It renders normally and is greppable
  (`grep -n "pending: true" content/site.ts`). Never source these from Zillow
  or realtor.com, which under-count most agents badly.
- `story` is the career timeline (`showStory` on a page). `year` is optional
  precisely so nobody invents one; a milestone with an unconfirmed detail
  carries `pending: true` until the client supplies it.
- `family` is the life-outside-work band (`showFamily` on a page, and it
  renders on the noir homepage automatically). `photos` takes one to five and
  the layout adapts, so new family photos are a config edit. Its CTA hides
  itself when the page already ends with one.

## Portfolio page layout

The portfolio page (`showListings` + `recentClosings`) splits active homes
from closed ones. One or two active listings render as an editorial spotlight
(photo + facts panel + both CTAs) rather than an orphan card in a three-across
grid; three or more fall back to the grid automatically. `showStats: true`
drops the `site.stats` proof points under the intro, and
`recentClosings.showPrices` puts sale prices on the closing cards (right for a
portfolio, wrong for the seller page, where prices belong in the conversation).

## Lead handling (ships wired)

All four lead forms (footer newsletter, connect, listing enquiry, valuation
wizard) post to `/api/lead`, which spam-filters and fans out to SendGrid,
Twilio and a CRM webhook. Per client this is three env vars in Vercel and
nothing else:

```
SENDGRID_API_KEY      the agency key
SENDGRID_FROM_EMAIL   the agency's verified sender (no client DNS needed)
LEAD_NOTIFY_EMAIL     recipient(s), comma-separated
```

With nothing set the site still builds and submits; leads are logged as
`[Lead] NOT DELIVERED` with the full payload. Never leave a client on that at
launch: it means every lead they paid for is lost.

Add new forms with the `useLeadSubmit` hook, never a fresh `fetch("/api/lead")`
— it carries attribution, enhanced-conversion identifiers and the analytics
event. See docs/lead-handling.md.

## Split-section photography

Editorial split sections frame their photo 4:3 by default, which beheads a
full-length shot of a person. Set `imageShape: "portrait"` on those sections
(3:4, capped at 470px wide) and `imageFocus` when the subject sits off-centre.
Check every section photo of the agent after a client's photos land: a
portrait source in a landscape frame is the most common thing to miss.

## SEO, icons and social previews

Set `meta.siteUrl` to the live origin **before launch** (the www host if the
apex redirects there). It feeds canonicals, the sitemap, OG urls and every
JSON-LD `@id`; left on the placeholder, the whole site canonicalises to
example.com.

- **Titles**: the root layout owns `title.template` (`%s | <brand>`), so a
  page sets only its own half. Interior pages take `metaTitle` /
  `metaDescription` in the config: write them for the query ("Buy a Home in
  North County San Diego"), ~60 and ~155 characters, and never repeat the
  brand name.
- **Canonicals + OG**: `app/[slug]` emits canonical, OpenGraph and Twitter
  tags from the page's own fields, falling back to `heroImage` then
  `meta.ogImage`. Listing and property pages do the same with the property
  photo.
- **Icons**: the brokerage's brush ring on the brand black, at 84% of the
  tile so the stroke survives a 16px favicon. `app/icon.png` (tab),
  `app/apple-icon.png` + `public/brand/icon-{192,512}.png`,
  `public/favicon.ico` for legacy requests, and `app/manifest.ts`. Regenerate
  by compositing `public/brand/og-emblem.webp` onto a 1024px black square and
  downsampling; never ship `icons: { icon: "data:," }`, which is a
  deliberately blank favicon.
- **Social card**: `public/og/alexa-devaney.jpg` (1200x630) is built from
  `scripts/og/og-card.html` - serve it from `public/`, screenshot the `#og`
  element, save as JPEG. Property pages get their own 1200x630 crops in
  `public/og/property/<slug>.jpg`. Social scrapers still want JPEG, so these
  stay JPEG even though the site's own photography is WebP.
- **Local SEO**: `site.localSeo` (areaServed, region, sameAs) plus the footer
  address and `site.legal` licence numbers drive the RealEstateAgent +
  WebSite structured data in `components/seo/SiteJsonLd.tsx`. Only list towns
  the client actually works; `areaServed` is a claim. No geo coordinates
  unless the client confirms them.

## Images and video (performance budget)

The site's photography is **WebP**, capped at 1920px for full-bleed art (page
hero banners, the CTA band) and 1400px for anything in a column. Convert new
client photos before committing them; a 600KB JPEG hero is the single easiest
way to lose a mobile visitor.

Local photos render through **next/image** (`fill` + a real `sizes`) in the
hero banner, split sections, area rows, about block, and every card grid, so
Vercel serves AVIF at the size the box actually paints. The wrapper carries
`position: relative` and the aspect ratio; the `<img>` keeps `object-fit:
cover`. Add new `quality` values to `images.qualities` in next.config or the
build throws. Plain `<img>` is still right for logos, the emblem and the CSS
background on the CTA band.

Hero video: 1440px wide, 24fps, h264 CRF 32, no audio track, `+faststart`
(`ffmpeg -vf "scale=1440:-2,fps=24" -c:v libx264 -preset slow -crf 32 -an`).
VP9/WebM was tried and came out larger than h264 on this footage, so there is
no webm; `hero.video.webm` stays empty unless a future encode actually wins.
The poster is a WebP at the same width as the video.

Rough budget, measured on a cold cache: homepage under 2.6MB fully scrolled
(1.4MB of that is the hero video), interior pages a few hundred KB.

## Regulatory / compliance (ships by default)

- `/legal/privacy-policy`, `/legal/terms-and-conditions`,
  `/legal/accessibility` (WCAG 2.1 AA), `/legal/fair-housing` - generated
  from parameterized boilerplate in `lib/legal.ts` + the client's
  `site.legal` values (license, MLS name, governing law, state civil rights
  agency, last-updated date).
- Footer: legal links row + compliance accordion (MLS/IDX disclaimer, Fair
  Housing pledge with Equal Housing Opportunity logo, licensing + REALTOR
  mark notice). MLS disclaimer uses `site.legal.mlsDisclaimer` (paste the
  client MLS's required text) with a generic fallback.
- Listing pages render the MLS-supplied attribution/disclaimer from the API.
- TCPA consent checkboxes on all lead forms; robots.ts + sitemap.ts include
  legal routes.
- Fill in `site.legal` per client; never remove the compliance accordion or
  listing disclosures.

## Verify before handing off## Verify before handing off

1. `npm run build` — must pass.
2. Run dev server, screenshot every section at desktop and mobile widths.
3. Check: no placeholder text/images remain; logo legible in both nav states; brand
   colors applied (buttons, headings, search bar); all links point somewhere real.
4. Push to the client's repo when the user confirms.

## The 1-hour client setup (own repo per client)

Each client gets their own repo and Vercel project, spawned from this
template with ONE homepage variant baked in:

1. (2 min) Create the client repo from this template
   (GitHub "Use this template" -> private repo named after the client;
   requires the Template repository flag in this repo's settings), clone it.
2. (1 min) Lock the design and strip the rest:
   `npm install && npm run new-client -- --slug <slug> --name "<Client Name>" --variant classic|noir|estate`
   This deletes the other two homepage variants, the /templates previews,
   and all demo-client scaffolding, marks content/site.ts as the client's
   config, and typechecks. Commit the result.
3. (5 min) Collect intake: logo, colors, name, areas, Zillow/GBP links,
   IDX subdomain (see Intake checklist).
4. (25 min) Open the repo in VS Code, run `claude`, hand it the intake
   material. Fill content/site.ts top to bottom: theme, brand, hero, copy
   rewritten from Zillow/GBP, areas with descriptions, pages, stats,
   footer, team (if a team), legal.
5. (15 min) Photos via Envato workflow (or client's own), video hero if
   footage exists (crossfade + compress: 1600px/24fps h264 CRF30 + webm
   + poster).
6. (10 min) Verify (build, screenshots, link check), push. Create the
   Vercel project on the repo; set meta.siteUrl and the IDX env vars.

Never customize a client inside this template repo. This repo keeps all
three variants, the demo config, and the preview routes; client repos
keep exactly one variant and one config.

## Deploy

Standard Next.js: Vercel/Cloudflare/Netlify auto-detect it. Static export is possible
(`output: 'export'`) since the page prerenders fully static.
