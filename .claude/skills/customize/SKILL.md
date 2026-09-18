---
name: customize
description: >
  Customize THIS real estate site for its client: work through intake material (logo,
  brand colors, service areas, Zillow/realtor.com and Google Business links, photos,
  IDX subdomain) and fill content/site.ts per the repo playbook, then verify and ship.
  Use this whenever the user provides client branding or profile links, asks to
  customize, brand, personalize, or "fill in" the site, says "here's the client's
  info/logo/colors", or wants to swap placeholder content for real content - even if
  they never say "customize". Also use it for partial passes like "update the areas"
  or "wire up her IDX".
---

# Customize This Client Site

CLAUDE.md in the repo root is the complete playbook - intake checklist, the config
field mapping table, teams guidance, the Envato photo workflow, IDX setup, legal
fields, and the verification pass. This skill is the execution order; consult the
playbook section named at each step for the details.

## Order of work

1. **Intake** - collect against the playbook's "Intake checklist". Ask once for
   what's missing, then proceed with what exists.
2. **Theme + brand** - colors and logo first (`theme`, `brand`); confirm color picks
   with swatches if you extracted them yourself. The whole site restyles from these.
3. **Copy** - `meta`, `hero`, `intro`, `about`, `stats`, and `pages` rewritten from
   the client's Zillow/GBP material, in their voice. Teams: see the playbook's
   "Teams vs individual agents" section (`team`, roster page, "we" voice).
4. **Areas** - one card per service area with a 1-sentence hover `description`.
5. **Photos** - playbook's "Photo workflow (Envato Elements)". Real client photos
   beat stock; the headshot is never stock.
6. **Listings + IDX** - placeholder listings get DEMO- MLS ids until the client's
   IDX_API_KEY is set (playbook: "IDX Broker" section). Never invent real-looking
   listings.
7. **Legal** - fill `site.legal` (license, MLS name + disclaimer, governing law,
   state civil rights agency, last-updated).
8. **Verify + ship** - playbook's "Verify before handing off": build, desktop and
   mobile screenshots of every section, link check, placeholder grep
   (Meridian / Alex Morgan / picsum / DEMO-), then push and report what's still
   blocked on the client.

Work in passes, not files: a color pass, a copy pass, a photo pass. Commit after each
coherent pass so the client can review progressively.
