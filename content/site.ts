/* ==========================================================================
   Site content — everything rendered on the page lives here.
   Swap this file's values per client; no component edits needed.
   ========================================================================== */

export interface NavLink {
  label: string;
  href: string;
}

export interface GalleryCard {
  /** Small letterspaced line above the title (omit to hide) */
  preTitle?: string;
  title: string;
  /** Underlined line below the title (omit to hide) */
  cta?: string;
  /** Longer text revealed on hover (overlay-style cards, e.g. areas) */
  description?: string;
  href: string;
  image: string;
  /**
   * Area cards only: fills out the /areas/<slug> page. `cityId` is the MLS
   * city ID (GET /api/locations lists them) - the search endpoint silently
   * returns the wrong set for a city NAME, so the ID is what makes an area
   * page show that area's homes and nobody else's.
   */
  slug?: string;
  cityId?: string;
  /** 1-2 paragraphs of genuinely local copy for the top of the area page */
  intro?: string[];
  /** Wide image for the area page banner; must be that town, not a lookalike */
  heroImage?: string;
  /** CSS object-position for the banner crop, e.g. "center 70%" */
  heroFocus?: string;
  /**
   * Search-result snippet for the area page, ~150 characters. Written by hand:
   * slicing the intro either cuts mid-sentence or wastes the space on one
   * short line.
   */
  metaDescription?: string;
}

export interface Listing {
  price: string;
  address: string;
  /** Matches the search filter values: single-family, condominium, townhouse, land */
  propertyType?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  /** e.g. "For Sale", "Pending", "Sold" */
  status?: string;
  mls?: string;
  image: string;
  /**
   * Where the card links. Point it at an on-site route (`/property/<slug>`
   * for the config-driven detail pages, `/listing/...` for live IDX ones);
   * external MLS links send hard-won traffic to someone else's site.
   */
  href: string;
  /** Brokerage/MLS page for the same home, linked from the detail page */
  mlsHref?: string;
  /** Extra photos for the detail page gallery; `image` leads the set */
  gallery?: string[];
  /** Property copy for the detail page (omit rather than invent one) */
  description?: string;
  /** Year built, lot size etc. shown in the detail page's fact rail */
  facts?: { label: string; value: string }[];
}

export interface TeamMember {
  name: string;
  /** e.g. "Founder & Lead Agent", "Buyer Specialist" */
  role: string;
  image: string;
  phone?: string;
  email?: string;
  license?: string;
  /** 1-2 sentence bio shown on the roster card */
  bio?: string;
  /** Optional link to a fuller profile (a standard SubPage works well) */
  href?: string;
}

export interface SubPage {
  /** URL segment, e.g. "buy" */
  slug: string;
  /** "standard" = editorial; "search" = IDX search; "connect" = contact; "listings" = listing grid; "team" = roster */
  type?: "standard" | "search" | "connect" | "listings" | "team";
  title: string;
  preTitle?: string;
  heroImage: string;
  /**
   * Search-result title. Write it for the query, not the nav ("Buy a Home in
   * North County San Diego"), and keep it near 60 characters. Falls back to
   * the page title plus the brand name.
   */
  metaTitle?: string;
  /** Search-result description, ~150-160 characters. Falls back to intro[0]. */
  metaDescription?: string;
  /** Social preview image for this page (defaults to heroImage) */
  ogImage?: string;
  intro?: string[];
  /**
   * Alternating image/text split sections.
   *
   * `imageShape` frames the photo: "landscape" (4:3, the default) suits rooms
   * and exteriors, "portrait" (3:4) suits a full-length shot of a person,
   * which a landscape crop beheads. `imageFocus` is a CSS object-position for
   * the rare photo whose subject sits off-centre.
   */
  sections?: {
    heading: string;
    text: string;
    image?: string;
    imageShape?: "landscape" | "portrait";
    imageFocus?: string;
  }[];
  cta?: { label: string; href: string };
  /** Append the client's listings grid to a standard page (e.g. buy) */
  showListings?: boolean;
  /** Render the working property search (filters + results) on this page */
  search?: boolean;
  /** Compact search form (hands off to /listings), e.g. on the buy page */
  searchPanel?: { kicker?: string; title?: string };
  /** Proof-point band (site.stats) under the intro, e.g. on the portfolio page */
  showStats?: boolean;
  /** Career timeline (site.story), e.g. on the about page */
  showStory?: boolean;
  /** Family band (site.family), e.g. on the about page */
  showFamily?: boolean;
  /**
   * Grid of the agent's sold listings, e.g. on the sell page. `showPrices`
   * puts the sale price on each card: right on a portfolio page, wrong on a
   * seller page, where the prices belong in the conversation.
   */
  recentClosings?: { intro?: string; kicker?: string; heading?: string; showPrices?: boolean };
  /** Override the heading over the showListings grid */
  listingsHeading?: { kicker?: string; title?: string };
  /** Prepend the 3-step "What's your property worth?" wizard (e.g. sell) */
  valuation?: boolean;
  /** Full-bleed background for the valuation wizard (defaults to heroImage) */
  valuationImage?: string;
}

export interface SiteContent {
  /**
   * Which homepage design this client uses. Interior pages are shared;
   * the homepage carries the visual identity.
   * "classic" - light, centered serif hero, floating search card (default)
   * "noir"    - dark cinematic gallery: Ken Burns hero, listings rail
   * "estate"  - bright architectural split hero, marquee, hover showcase
   */
  homeVariant?: "classic" | "noir" | "estate";
  /** Brand palette — injected as CSS variables, overrides the defaults in globals.css */
  theme: {
    /** Primary brand color: headings, buttons, accents (original: #004F71) */
    primary: string;
    /** Secondary/muted color: body text, hero overlay tint (original: #88786A) */
    secondary: string;
    /** Page background (original: #FBF9F7) */
    background: string;
  };
  brand: {
    /** Wordmark text in the header and footer (used when no logo images) */
    name: string;
    tagline: string;
    /**
     * Optional logo images. `light` shows over the transparent hero nav,
     * `dark` shows on the scrolled white nav and can be reused in the footer.
     */
    logo?: { light: string; dark: string };
    /**
     * Brokerage logo shown under the agent name in the header and footer,
     * sized slightly wider than the name so the brokerage leads.
     */
    brokerageLogo?: { light: string; dark: string };
    /** Brokerage emblem pinned to the bottom-right of the homepage hero */
    emblem?: string;
    /** Large faint mark used as a background decal on the homepage */
    decal?: string;
    /** Where the header logo links. Defaults to "/"; set per client scope. */
    homeHref?: string;
  };
  meta: {
    title: string;
    description: string;
    /** Production origin, no trailing slash (canonicals, sitemap, JSON-LD) */
    siteUrl?: string;
    /**
     * Social preview card, 1200x630, used for any page without its own image.
     * Regenerate it from scripts/og/og-card.html (see CLAUDE.md).
     */
    ogImage?: string;
    /** Short name for the PWA manifest and app icons (defaults to brand.name) */
    shortName?: string;
  };
  /**
   * Local-SEO facts for the RealEstateAgent structured data: the towns the
   * client actually works and the profiles Google should tie to the site.
   * Only list places they genuinely serve; areaServed is a claim.
   */
  localSeo?: {
    areaServed: string[];
    /** e.g. "San Diego County" - the wider region the towns sit in */
    region?: string;
    /** Google Business Profile URL, brokerage bio, Zillow profile, etc. */
    sameAs?: string[];
  };
  /**
   * Ad + analytics wiring. The Google Ads conversion id and labels are NOT
   * secrets (they ship in the page source of every site that uses them), so
   * they live here rather than in env and tracking works on deploy.
   * NEXT_PUBLIC_GTM_ID / _GA4_ID / _GOOGLE_ADS_ID still override.
   */
  analytics?: {
    /** Google Ads conversion id, e.g. "AW-17640808645" */
    googleAdsId?: string;
    /** GA4 measurement id, e.g. "G-XXXXXXXXXX" */
    ga4Id?: string;
    /** Maps our semantic events to Google Ads conversion labels */
    conversions?: Partial<Record<string, string>>;
  };
  hero: {
    preTitle: string;
    title: string;
    /** Optional background video; the image is used as poster/fallback */
    video?: {
      webm?: string;
      mp4?: string;
      /** Vertical cut served to portrait phones (sharper and lighter than cropping the landscape file) */
      mobileMp4?: string;
    };
    image: string;
  };
  searchBar: {
    placeholder: string;
    ctaLabel: string;
    ctaHref: string;
  };
  nav: {
    left: NavLink[];
    right: NavLink[];
    /** Hamburger side-menu links */
    menu: NavLink[];
  };
  /**
   * "Featured Properties" band on the homepage highlighting the client's own
   * active listings. Live data comes from IDX Broker when IDX_API_KEY is set
   * in the deployment env; `listings` here is the manual fallback. Hidden when
   * neither yields listings.
   */
  featured?: { title: string; subtitle?: string; listings?: Listing[] };
  /** Interior pages, rendered at /<slug> (or /<client>/<slug>) */
  pages: SubPage[];
  /**
   * IDX Broker hookup. Set the client's IDX subdomain (e.g. "eaganluxury" for
   * eaganluxury.idxbroker.com) and the search page embeds their hosted search.
   * Omit to show a "search coming soon" panel instead.
   */
  idx?: { subdomain?: string; searchPath?: string };
  /** Contact details for the connect page and footer */
  contact?: { phone?: string; email?: string };
  /**
   * Team roster, rendered by a page with type: "team". Individual agents
   * simply omit this. Team sites keep `about` as the founder/lead spotlight
   * (the pattern every reference team site uses) and link here for the
   * full roster.
   */
  team?: {
    /** Small line above the grid, e.g. "Nine specialists. One standard." */
    tagline?: string;
    members: TeamMember[];
  };
  /**
   * Regulatory/compliance values. Boilerplate legal pages (privacy, terms,
   * accessibility, fair housing) and the footer compliance accordion render
   * from these. MLS disclaimer text should be the client's MLS-required
   * paragraph; a generic "deemed reliable" fallback ships by default.
   */
  legal?: {
    licenseNumber?: string;
    licenseState?: string;
    mlsName?: string;
    mlsDisclaimer?: string;
    governingLaw?: string;
    stateCivilRightsAgency?: string;
    lastUpdated?: string;
  };
  /**
   * Ad landing pages (/home-value, /buyers). Stripped header with no nav links,
   * because a landing page that offers ten ways to leave converts worse than one
   * that offers a form. Accents are injected as CSS variables on the wrapper.
   */
  landing?: {
    /** Accent used for eyebrows, rules, and the submit button */
    accent: string;
    /** Lighter accent for hero eyebrows and outlines on dark ground */
    accentLight: string;
    /** Palest accent for small caps on glass */
    accentPale: string;
    /** Marketing line for the landing hero and footer */
    tagline: string;
    /** Title / credentials shown under the agent's name */
    designations: string[];
    /** Spelled-out credentials for the landing footer */
    designationsLong: string;
    /** Communities listed on landing pages; href links to a real page */
    communities: { label: string; href?: string }[];
    /** How the market is described in eyebrows, e.g. "North County San Diego" */
    serviceArea: string;
    /** Brokerage license number for the landing footer disclosure */
    brokerageLicense?: string;
  };
  /**
   * Registration gate on listing detail pages. The listing still renders (and
   * indexes) underneath; only a modal overlays it. freeViews 0 asks on the
   * first listing; dismissible adds a "Not now" link.
   */
  listingGate?: {
    enabled: boolean;
    freeViews: number;
    dismissible: boolean;
    heading: string;
    subheading: string;
  };
  /** Elfsight All-in-One Reviews widget, loaded site-wide (layout is set in the Elfsight dashboard) */
  reviews?: { elfsightAppId: string };
  /**
   * Proof-point band rendered after the intro (e.g. "40+ / Years").
   *
   * `pending: true` marks a number that has NOT been verified against the MLS
   * yet. Those are the client's own estimates, they render normally, and they
   * are greppable so nobody has to remember which ones still need checking:
   * `grep -n "pending: true" content/site.ts`. Clear the flag when the MLS
   * export confirms the figure; correct the value first if it disagrees.
   */
  stats?: { value: string; label: string; pending?: boolean }[];
  /**
   * Career/personal timeline, rendered on the page that sets `showStory`.
   * Milestones carry an optional `year`: leave it out rather than guessing,
   * and never add an award or a date the client has not confirmed.
   */
  story?: {
    kicker?: string;
    title: string;
    intro?: string;
    milestones: {
      /** Year or span, e.g. "2015" or "2015-2019". Omit when unconfirmed. */
      year?: string;
      title: string;
      text: string;
      /** Awaiting the client's detail; see the stats note on `pending` */
      pending?: boolean;
    }[];
  };
  /**
   * Family / life-outside-work band. Real estate is a trust business and this
   * is the block that earns it, so it takes real photos rather than stock.
   * Any number of photos works; the layout handles 1-5.
   */
  family?: {
    kicker?: string;
    title: string;
    paragraphs: string[];
    photos: { image: string; caption?: string }[];
    cta?: { label: string; href: string };
  };
  services: GalleryCard[];
  intro: {
    title: string;
    paragraphs: string[];
    ctaLabel: string;
    ctaHref: string;
  };
  areas: GalleryCard[];
  about: {
    title: string;
    subtitle: string;
    image: string;
    /** "portrait" (default) = circular headshot; "photo" = wide team photo */
    imageStyle?: "portrait" | "photo";
    /** Optional square headshot shown beside the homepage statement, linking down to #about */
    avatar?: string;
    /** Alternate plain paragraphs and bolded lead-ins */
    blocks: { heading?: string; text: string }[];
  };
  cta: {
    title: string;
    description: string;
    buttonLabel: string;
    buttonHref: string;
    image: string;
  };
  footer: {
    agentName: string;
    brokerage: string;
    links: NavLink[];
    socials: { platform: "instagram" | "facebook" | "linkedin"; href: string }[];
    addressLines: string[];
    newsletter: {
      heading: string;
      tagline: string;
      consent: string;
    };
    copyright: string;
    /** Optional compliance row: Equal Housing logo + license/brokerage line */
    compliance?: { image: string; text: string };
  };
}

/* --------------------------------------------------------------------------
   CLIENT: Alexa Devaney (alexa-devaney) - homepage variant "noir"
   Fill every field below for this client; see CLAUDE.md for the playbook.
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   CLIENT: Alexa Devaney (alexa-devaney) - homepage variant "noir"
   Source: Typeform intake (Sep 17, 2026), ogroup.com/agents/alexa-devaney,
   and her content folder (headshots, lifestyle, listing photography/film).
   Brand follows The Oppenheim Group: black, white, crimson accent.
   -------------------------------------------------------------------------- */

const OG_LISTING = "https://search.ogroup.com/idx/details/listing/d010";

export const site: SiteContent = {
  homeVariant: "noir",
  theme: {
    primary: "#151A1C",
    secondary: "#B71F37",
    background: "#F7F6F4",
  },
  brand: {
    name: "Alexa Devaney",
    tagline: "The Oppenheim Group",
    brokerageLogo: { light: "/brand/og-wordmark-light.webp", dark: "/brand/og-wordmark-dark.webp" },
    emblem: "/brand/og-emblem.webp",
    decal: "/brand/og-ring-decal.webp",
  },
  meta: {
    siteUrl: "https://www.alexadevaney.com",
    ogImage: "/og/alexa-devaney.jpg",
    shortName: "Alexa Devaney",
    title: "North County San Diego Luxury Homes – Alexa Devaney",
    description:
      "Alexa Devaney, Senior Realtor Associate with The Oppenheim Group, helps families buy and sell luxury homes from Encinitas and Carlsbad to Oceanside and Fallbrook.",
  },
  localSeo: {
    areaServed: [
      "Encinitas",
      "Carlsbad",
      "Oceanside",
      "Fallbrook",
      "La Jolla",
      "Del Mar",
      "Vista",
      "San Diego",
    ],
    region: "San Diego County",
    sameAs: [
      "https://www.instagram.com/alexadevaneyrealtor/",
      "https://www.facebook.com/alexa.walker.9822",
      "https://www.ogroup.com/agents/alexa-devaney",
    ],
  },
  hero: {
    preTitle: "North County San Diego · The Oppenheim Group",
    title: "A Family-First Realtor for North County",
    video: { mp4: "/video/hero.mp4", mobileMp4: "/video/hero-mobile.mp4" },
    image: "/video/hero-poster.webp",
  },
  searchBar: {
    placeholder: "Search by Address or Neighborhood",
    ctaLabel: "Request a Call",
    ctaHref: "/connect",
  },
  nav: {
    left: [
      { label: "Buy", href: "/buy" },
      { label: "Sell", href: "/sell" },
      { label: "Portfolio", href: "/portfolio" },
    ],
    right: [
      { label: "Search Homes", href: "/listings" },
      { label: "About", href: "/about" },
      { label: "Let’s Connect", href: "/connect" },
    ],
    menu: [
      { label: "Home", href: "/" },
      { label: "Buy a Home", href: "/buy" },
      { label: "Sell Your Home", href: "/sell" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Search Homes", href: "/listings" },
      { label: "About Alexa", href: "/about" },
      { label: "Let's Connect", href: "/connect" },
    ],
  },
  contact: { phone: "(760) 705-0968", email: "alexa@ogroup.com" },
  legal: {
    licenseNumber: "02031174",
    licenseState: "California DRE",
    mlsName: "San Diego MLS",
    governingLaw: "the State of California",
    stateCivilRightsAgency: "California Civil Rights Department",
    lastUpdated: "September 2026",
  },
  /*
   * ACTIVE listings come from IDX automatically and replace their entry here
   * by MLS number, so nothing needs maintaining while a home is on the market.
   * CLOSED sales do not: this MLS/IDX subscription returns nothing for
   * propStatus=Sold (verified against the API), so every closing below is
   * entered by hand and its /property/<slug> page is generated from it. If
   * IDX Broker ever enables sold data on this account, `searchListings({
   * status: "sold", officeIds })` can replace this list wholesale.
   *
   * Order here is the order shown on the portfolio page (highest sale first);
   * it is independent of the buyer-facing search, which sorts newest first.
   */
  featured: {
    title: "Featured Properties",
    subtitle: "Active and Recently Sold",
    listings: [
      {
        price: "$1,598,000",
        address: "4462 Fallsbrae Rd, Fallbrook",
        propertyType: "single-family",
        beds: "4",
        baths: "4",
        sqft: "3,930",
        status: "For Sale",
        mls: "260002637",
        image: "/photos/fallsbrae-estate.webp",
        href: "/property/4462-fallsbrae-rd-fallbrook",
        gallery: [
          "/photos/fallsbrae-aerial.webp",
          "/photos/fallsbrae-veranda.webp",
          "/photos/fallsbrae-sunset.webp",
        ],
        mlsHref: `${OG_LISTING}/260002637/4462-Fallsbrae-Rd-Fallbrook-CA-92028`,
      },
      {
        price: "$6,955,734",
        address: "5115 Gordon Ln, San Diego",
        propertyType: "single-family",
        beds: "5",
        baths: "6",
        sqft: "5,179",
        status: "Sold",
        mls: "230020240",
        image: "/photos/gordon-exterior.webp",
        href: "/property/5115-gordon-ln-san-diego",
        gallery: [
          "/photos/gordon-ocean-view.webp",
          "/photos/gordon-kitchen.webp",
          "/photos/gordon-deck-view.webp",
          "/photos/gordon-rooftop-sunset.webp",
        ],
        mlsHref: `${OG_LISTING}/230020240/5115-Gordon-Ln-San-Diego-CA-92109`,
      },
      {
        price: "$6,900,000",
        address: "6591 Avenida Wilfredo, La Jolla",
        beds: "3",
        baths: "3",
        sqft: "4,530",
        status: "Sold",
        mls: "250028692",
        image: "/listings/6591-avenida-wilfredo.webp",
        href: "/property/6591-avenida-wilfredo-la-jolla",
        mlsHref: `${OG_LISTING}/250028692/6591-Avenida-Wilfredo-La-Jolla-CA-92037`,
      },
      {
        price: "$3,750,000",
        address: "18787 Aceituno St, San Diego",
        propertyType: "single-family",
        beds: "5",
        baths: "7",
        sqft: "6,834",
        status: "Sold",
        mls: "250039914",
        image: "/photos/aceituno-aerial-dusk.webp",
        href: "/property/18787-aceituno-st-san-diego",
        gallery: [
          "/photos/aceituno-great-room.webp",
          "/photos/aceituno-living.webp",
          "/photos/aceituno-pool.webp",
        ],
        mlsHref: `${OG_LISTING}/250039914/18787-Aceituno-St-San-Diego-CA-92128`,
      },
      {
        price: "$3,500,000",
        address: "11764 Big Canyon Ln, Scripps Ranch",
        propertyType: "single-family",
        beds: "5",
        baths: "6",
        sqft: "4,835",
        status: "Sold",
        mls: "260007518",
        image: "/listings/11764-big-canyon.webp",
        href: "/property/11764-big-canyon-ln-scripps-ranch",
        mlsHref: `${OG_LISTING}/260007518/11764-Big-Canyon-Ln-Scripps-Ranch-CA-92131`,
      },
      {
        price: "$3,050,000",
        address: "364 San Elijo St, Point Loma",
        propertyType: "single-family",
        beds: "4",
        baths: "5",
        sqft: "3,187",
        status: "Sold",
        mls: "230022226",
        image: "/listings/364-san-elijo.webp",
        href: "/property/364-san-elijo-st-point-loma",
        mlsHref: `${OG_LISTING}/230022226/364-San-Elijo-St-Point-Loma-CA-92106`,
      },
      {
        price: "$2,560,000",
        address: "15840 Caminito Cantaras, Del Mar",
        beds: "4",
        baths: "3",
        sqft: "2,353",
        status: "Sold",
        mls: "NDP2605193",
        image: "/listings/15840-caminito-cantaras.webp",
        href: "/property/15840-caminito-cantaras-del-mar",
        mlsHref: `${OG_LISTING}/NDP2605193/15840-Caminito-Cantaras-Del-Mar-CA-92014`,
      },
      {
        price: "$1,974,000",
        address: "7212 Columbine Dr, Carlsbad",
        propertyType: "single-family",
        beds: "4",
        baths: "3",
        sqft: "2,473",
        status: "Sold",
        mls: "250041353",
        image: "/listings/7212-columbine.webp",
        href: "/property/7212-columbine-dr-carlsbad",
        mlsHref: `${OG_LISTING}/250041353/7212-Columbine-Dr-Carlsbad-CA-92011`,
      },
      {
        price: "$1,780,000",
        address: "2511 San Clemente Ave, Vista",
        propertyType: "single-family",
        beds: "4",
        baths: "4",
        sqft: "3,287",
        status: "Sold",
        mls: "250029080",
        image: "/listings/2511-san-clemente.webp",
        href: "/property/2511-san-clemente-ave-vista",
        mlsHref: `${OG_LISTING}/250029080/2511-San-Clemente-Ave-Vista-CA-92084`,
      },
      {
        price: "$1,600,000",
        address: "571 Anchorage Ave, Carlsbad",
        propertyType: "single-family",
        beds: "4",
        baths: "3",
        sqft: "1,868",
        status: "Sold",
        mls: "240011803",
        image: "/listings/571-anchorage.webp",
        href: "/property/571-anchorage-ave-carlsbad",
        mlsHref: `${OG_LISTING}/240011803/571-Anchorage-Ave-Carlsbad-CA-92011`,
      },
      {
        price: "$1,465,000",
        address: "3831 Silverleaf Ln, Vista",
        propertyType: "single-family",
        beds: "3",
        baths: "5",
        sqft: "2,569",
        status: "Sold",
        mls: "230013267",
        image: "/listings/3831-silverleaf.webp",
        href: "/property/3831-silverleaf-ln-vista",
        mlsHref: `${OG_LISTING}/230013267/3831-Silverleaf-Ln-Vista-CA-92084`,
      },
    ],
  },
  pages: [
    {
      slug: "portfolio",
      title: "Portfolio",
      metaTitle: "North County San Diego Home Sales & Listings",
      metaDescription:
        "Active listings and recent closings across San Diego County, from Fallbrook and Carlsbad to La Jolla and Point Loma, represented by Alexa Devaney.",
      preTitle: "Active and Recently Sold",
      heroImage: "/photos/aceituno-aerial-dusk.webp",
      intro: [
        "A look at the homes I have represented across San Diego County, from Fallbrook acreage to coastal Carlsbad and La Jolla.",
      ],
      showStats: true,
      showListings: true,
      listingsHeading: { kicker: "On the Market", title: "Available Now" },
      recentClosings: {
        kicker: "The Track Record",
        heading: "Recent Closings",
        intro:
          "A selection of homes recently closed across San Diego County, from Carlsbad and Vista to La Jolla and Point Loma.",
        showPrices: true,
      },
      cta: { label: "Ask About a Property", href: "/connect" },
    },
    {
      slug: "about",
      title: "About Alexa",
      metaTitle: "About Your North County San Diego Realtor",
      metaDescription:
        "Ten years helping San Diego families buy and sell, from Encinitas and Carlsbad to Fallbrook. Senior Realtor Associate with The Oppenheim Group in La Jolla.",
      preTitle: "Senior Realtor Associate · The Oppenheim Group",
      heroImage: "/photos/alexa-kitchen.webp",
      showStory: true,
      showFamily: true,
      intro: [
        "For more than ten years I have helped San Diego families buy and sell with confidence, pairing deep local market knowledge with strategic negotiation and close attention to detail.",
        "Every client gets a personalized plan, honest guidance, and a clear line of communication. Whether you are a first-time buyer, a seasoned investor, or selling a luxury home, I anticipate challenges before they become problems and structure offers that win.",
      ],
      sections: [
        {
          heading: "Organized, Proactive, Committed",
          text: "Clients describe the experience as organized and proactive. From cross-country relocations to competitive negotiations, I act as advisor, advocate, and problem solver long after the transaction is complete.",
          image: "/photos/alexa-devaney.webp",
          imageShape: "portrait",
          imageFocus: "center 22%",
        },
        {
          heading: "Family First",
          text: "Family comes first for me, and buying or selling a home is a family decision. Schools, space to grow, a yard for the dog, time at the beach: I listen for what matters most to your family and keep the process calm, transparent, and personal.",
          image: "/photos/alexa-family.webp",
        },
        {
          heading: "The Reach of The Oppenheim Group",
          text: "My clients benefit from the marketing and buyer network of The Oppenheim Group, with offices from Los Angeles and Newport Beach to La Jolla, Cabo San Lucas, and Dubai.",
          image: "/photos/og-san-diego-office.webp",
        },
      ],
      cta: { label: "Let's Connect", href: "/connect" },
    },
    {
      slug: "buy",
      title: "Buy a Home",
      metaTitle: "Buy a Home in North County San Diego",
      metaDescription:
        "Buyer representation across Encinitas, Carlsbad, Oceanside and Fallbrook: private showings, relocation guidance, and offers structured to win.",
      preTitle: "North County Buyer Representation",
      heroImage: "/photos/aceituno-great-room.webp",
      intro: [
        "Whether this is your primary residence, a second home near the water, or a move from out of state, buying well in North County comes down to preparation. I set clear expectations about the market up front, then move quickly when the right home appears.",
      ],
      sections: [
        {
          heading: "Offers Structured to Win",
          text: "In a small, competitive market the strongest offer is not always the highest one. I structure terms around what the seller actually needs, and I negotiate to protect your interests from the first showing through closing.",
          image: "/photos/aceituno-living.webp",
        },
        {
          heading: "Relocating to San Diego",
          text: "Moving from across the country means making big decisions from a distance. I help you compare neighborhoods, schools, and commutes, preview homes on your behalf, and keep you informed at every step so nothing is left to guesswork.",
          image: "/photos/gordon-deck-view.webp",
        },
        {
          heading: "Diligence, Handled",
          text: "From inspections scheduled on short notice to contingent sales with moving parts on both sides, I coordinate the specialists and translate what matters so every decision is an informed one.",
          image: "/photos/alexa-patio.webp",
          imageShape: "portrait",
          imageFocus: "center 22%",
        },
        {
          heading: "Family First, Always",
          text: "Family comes first for me, and I know a home decision is a family decision. Schools, space to grow, a yard for the dog, time at the beach: I listen for what matters most to your family and keep the process calm, transparent, and personal.",
          image: "/photos/alexa-family.webp",
        },
      ],
      cta: { label: "Start Your Search", href: "/connect" },
      searchPanel: { kicker: "Search North County", title: "Find Your Next Home" },
      showListings: true,
      listingsHeading: { kicker: "Portfolio", title: "Active & Recently Sold" },
    },
    {
      slug: "sell",
      title: "Sell Your Home",
      metaTitle: "Sell Your Home in North County San Diego",
      metaDescription:
        "Pricing grounded in real North County comparables, presentation that earns showings, and steady communication. Request a home value analysis.",
      preTitle: "Strategic Pricing, Polished Presentation",
      heroImage: "/photos/fallsbrae-sunset.webp",
      intro: [
        "Selling a family home is personal. I build each sale around a clear strategy: pricing grounded in current comparables, presentation that earns showings, and steady communication so you always know where things stand.",
      ],
      sections: [
        {
          heading: "Pricing Grounded in Real Comparables",
          text: "Automated estimates miss what moves a North County sale: lot size, views, school boundaries, and distance to the beach and village. I price from recent sales and direct market knowledge, then position your home to draw competition.",
          image: "/photos/fallsbrae-veranda.webp",
        },
        {
          heading: "Ready for Market, Even When Life Is Busy",
          text: "Young kids, a busy schedule, a home that is not quite buyer ready. I coordinate staging, showings, and vendors so the preparation does not fall on you.",
          image: "/photos/gordon-kitchen.webp",
        },
        {
          heading: "Selling and Buying at the Same Time",
          text: "Contingent moves are stressful. I have guided families through selling one home and buying the next in the same season, bridging gaps with the other side and keeping both transactions on track.",
          image: "/photos/alexa-living-room.webp",
          imageShape: "portrait",
          imageFocus: "center 22%",
        },
        {
          heading: "The Reach of The Oppenheim Group",
          text: "Your listing benefits from the marketing and buyer network of The Oppenheim Group, with offices from Los Angeles and Newport Beach to La Jolla, Cabo, and Dubai.",
          image: "/photos/og-san-diego-office.webp",
        },
      ],
      cta: { label: "Request a Valuation", href: "/connect" },
      valuation: true,
      recentClosings: {
        intro: "A selection of homes Alexa has recently closed across San Diego County, from Carlsbad and Vista to La Jolla and Point Loma.",
      },
      valuationImage: "/photos/fallsbrae-estate.webp",
    },
    {
      slug: "connect",
      type: "connect",
      title: "Let's Connect",
      metaTitle: "Contact a North County San Diego Realtor",
      metaDescription:
        "Call, text or email Alexa Devaney of The Oppenheim Group in La Jolla to talk through buying or selling in Encinitas, Carlsbad, Oceanside or Fallbrook.",
      preTitle: "Begin with a Conversation",
      heroImage: "/photos/alexa-kitchen.webp",
      intro: [
        "Whether you are buying, selling, or simply curious about your options, reach out. Call, text, or email, whatever is easiest for you, and I will get back to you the same day.",
      ],
    },
  ],
  listingGate: {
    enabled: true,
    freeViews: 0,
    dismissible: true,
    heading: "View Full Property Details",
    subheading:
      "Register once for complete listing information, photos, and first access to new North County San Diego properties.",
  },
  landing: {
    accent: "#B71F37",
    accentLight: "#D8475D",
    accentPale: "#F2C4CC",
    tagline: "High-level service. Family first.",
    designations: ["Senior Realtor Associate"],
    designationsLong: "Senior Realtor Associate · The Oppenheim Group · CA DRE# 02031174",
    communities: [
      { label: "Encinitas", href: "/buy" },
      { label: "Carlsbad", href: "/buy" },
      { label: "Oceanside", href: "/buy" },
      { label: "Vista", href: "/buy" },
      { label: "Fallbrook", href: "/buy" },
    ],
    serviceArea: "North County San Diego",
    brokerageLicense: "01983697",
  },
  // Elfsight reviews badge paused; restore to re-enable:
  // reviews: { elfsightAppId: "9a8f661c-a422-48cb-938c-64944318c827" },
  /*
   * PENDING MLS VERIFICATION. The homes-closed and volume figures below are
   * Alexa's own estimates (roughly 150 closings; $30-40M in a typical year,
   * nearer $20M in a slow one) and are deliberately conservative. Replace them
   * with the MLS export's numbers and drop `pending` - do not source these
   * from Zillow or realtor.com, which under-count her by a wide margin.
   */
  stats: [
    { value: "10+", label: "Years in Real Estate" },
    { value: "150+", label: "Homes Closed", pending: true },
    { value: "$30M+", label: "In Annual Sales Volume", pending: true },
  ],
  /*
   * TIMELINE - awaiting Alexa's detail. Every milestone below is built from
   * what she has already stated (started at 22, ten-plus years in the
   * business, North County roots, motherhood). Entries flagged `pending` need
   * her to confirm a year or supply the story; delete any she does not want
   * rather than inventing a substitute, and never add an award or ranking she
   * has not sent us in writing.
   */
  story: {
    kicker: "Experience",
    title: "A Decade in the Same Neighborhoods",
    intro:
      "Real estate was not a second career for me. I earned my license at 22, learned this market one showing at a time, and have spent every year since in the same corner of San Diego County.",
    milestones: [
      {
        title: "Licensed at 22",
        text: "I earned my license while most of my friends were starting their first jobs, and I have worked in San Diego real estate every year since.",
        pending: true,
      },
      {
        title: "Learning the Market Street by Street",
        text: "Hundreds of showings from Leucadia to Fallbrook taught me what no portal can: which blocks hold their value, which schools draw families, and what a home is genuinely worth on a given street.",
        pending: true,
      },
      {
        title: "Joining The Oppenheim Group",
        text: "The brokerage brought national marketing and a buyer network reaching from Los Angeles to Cabo and Dubai. My clients gained that reach without giving up a local agent.",
        pending: true,
      },
      {
        title: "Motherhood Changed the Questions I Ask",
        text: "Raising my own family made me a better guide for other families. School boundaries, commute times, and whether a yard genuinely works come before square footage, because that is how families decide.",
        pending: true,
      },
      {
        title: "Today",
        text: "A first-time buyer, a relocating family, and a luxury seller can share the same week on my calendar. The price changes. The preparation does not.",
      },
    ],
  },
  /*
   * FAMILY BAND - Alexa is comfortable showing her kids. `photos` takes any
   * number (the layout handles one to five), so new family photos drop
   * straight in here with no code change.
   */
  family: {
    kicker: "Off the Clock",
    title: "Raising My Family Here, Too",
    paragraphs: [
      "My own family is why I understand what my clients are weighing. We are at the same beaches on the weekend and in the same school pickup lines on Monday.",
      "So when I say a neighborhood is worth stretching for, or that it is not, the answer comes from living here rather than from a market report.",
    ],
    photos: [
      { image: "/photos/alexa-family.webp", caption: "Game night, the one thing on the calendar that never moves." },
    ],
    cta: { label: "Let's Connect", href: "/connect" },
  },
  services: [
    {
      preTitle: "Primary, Second Home, Relocation",
      title: "Buy a Home",
      cta: "Learn More",
      href: "/buy",
      image: "/photos/aceituno-pool.webp",
    },
    {
      preTitle: "Strategy and Presentation",
      title: "Sell Your Home",
      cta: "Learn More",
      href: "/sell",
      image: "/photos/fallsbrae-estate.webp",
    },
    {
      preTitle: "Active and Sold",
      title: "Portfolio",
      cta: "View Properties",
      href: "/portfolio",
      image: "/photos/gordon-exterior.webp",
    },
  ],
  intro: {
    title: "Oppenheim Group Reach. Local, Family-First Service.",
    paragraphs: [
      "For more than ten years I have sold homes across North County, and I am raising my family in the same neighborhoods I represent. First home or fifth, the standard is the same: know the market street by street, and be present for every decision that follows.",
      "From the bluffs of Encinitas through Carlsbad and Oceanside to the groves of Fallbrook, my clients range from first-time buyers to families selling the home they raised their children in. Each one gets the same preparation.",
      "The Oppenheim Group gives my listings national reach and a buyer network well beyond San Diego. What I bring is closer to home: candid advice, careful negotiation, and someone you can still call years after the keys change hands.",
    ],
    ctaLabel: "Search Homes",
    ctaHref: "/listings",
  },
  /*
   * Area cards link to /areas/<slug>, which renders that town's own live MLS
   * results via `cityId` (from GET /api/locations).
   *
   * Carlsbad, Oceanside and Encinitas use ALEXA'S OWN photography of each
   * town (supplied Sep 2026): the Carlsbad Village sign, the Oceanside Pier,
   * the Encinitas bluffs. Do not swap these for stock - being visibly,
   * specifically local is the whole point of these pages. Fallbrook uses the
   * aerial of her own listing there.
   */
  areas: [
    {
      title: "Encinitas",
      slug: "encinitas",
      metaDescription:
        "Encinitas homes from Leucadia to Cardiff: beach bungalows, family streets, and bluff-top views. Current listings and local guidance from Alexa Devaney.",
      cityId: "14668",
      description: "Surf breaks, bluff-top streets, and a laid-back coastal village from Leucadia to Cardiff.",
      href: "/areas/encinitas",
      image: "/photos/areas/encinitas.webp",
      heroImage: "/photos/areas/encinitas.webp",
      intro: [
        "Encinitas runs from Leucadia down through Cardiff, and every pocket has its own character: beach bungalows along the 101, family streets east of the freeway, and bluff-top homes with the views people move across the country for.",
        "Inventory moves quickly here, and photographs rarely tell the whole story. I preview homes in person, so your weekends are spent only on the ones worth seeing.",
      ],
    },
    {
      title: "Carlsbad",
      slug: "carlsbad",
      metaDescription:
        "Carlsbad homes from Olde Carlsbad to La Costa: strong schools, a walkable village, and coastal estates. Current listings and local guidance from Alexa Devaney.",
      cityId: "7324",
      description: "Top-rated schools, walkable village streets, and generous lots a short drive from the beach.",
      href: "/areas/carlsbad",
      image: "/photos/areas/carlsbad.webp",
      heroImage: "/photos/areas/carlsbad.webp",
      // pull the banner crop down to keep the village sign arch in frame
      heroFocus: "center 78%",
      intro: [
        "Carlsbad is where many North County families land and stay: strong schools, a walkable village, and neighborhoods from Olde Carlsbad to La Costa that each price differently for good reason.",
        "Buyers here range from first homes near the village to estates above the coast. I work every part of that range, and I will tell you candidly where your budget goes furthest.",
      ],
    },
    {
      title: "Oceanside",
      slug: "oceanside",
      metaDescription:
        "Oceanside homes in South O, Fire Mountain, and the blocks nearest the sand, still North County's best coastal value. Current listings from Alexa Devaney.",
      cityId: "34097",
      description: "A revitalized downtown, the historic pier, and some of North County's best coastal value.",
      href: "/areas/oceanside",
      image: "/photos/areas/oceanside.webp",
      heroImage: "/photos/areas/oceanside.webp",
      intro: [
        "Oceanside has changed quickly. The pier and harbor are unchanged, but downtown now holds the restaurants and hotels that once meant a drive south, and the coastline remains the best value in North County.",
        "South O, Fire Mountain, and the blocks nearest the sand behave like separate markets. Matching you to the right one is most of the work.",
      ],
    },
    {
      title: "Fallbrook",
      slug: "fallbrook",
      metaDescription:
        "Fallbrook homes on acreage: groves, rolling hills, and room for horses. Current listings and straight answers on wells, septic, and fire clearance.",
      cityId: "15576",
      description: "Rolling hills, groves, and acreage estates with room to breathe, inland from the coast.",
      href: "/areas/fallbrook",
      image: "/photos/fallsbrae-aerial.webp",
      heroImage: "/photos/fallsbrae-aerial.webp",
      intro: [
        "Fallbrook trades the coastline for space: avocado groves, rolling hills, and acreage with real distance between neighbors. It draws families who want room for horses, gardens, or simply quiet.",
        "Wells, septic, easements, and fire clearance carry weight here that they never do at the beach. I have sold enough Fallbrook property to ask the right questions before you fall for the view.",
      ],
    },
  ],
  about: {
    title: "Meet Alexa Devaney",
    subtitle: "Senior Realtor Associate · The Oppenheim Group",
    image: "/photos/alexa-devaney.webp",
    avatar: "/photos/alexa-devaney-headshot.webp",
    blocks: [
      {
        text: "For more than ten years I have helped San Diego families buy and sell with confidence, pairing deep local market knowledge with strategic negotiation and close attention to detail.",
      },
      {
        text: "Every client gets a personalized plan, honest guidance, and a clear line of communication. Whether you are a first-time buyer, a seasoned investor, or selling a luxury home, I anticipate challenges before they become problems and structure offers that win.",
      },
      {
        heading: "Organized, Proactive, Committed",
        text: "Clients describe the experience as organized and proactive. From cross-country relocations to competitive negotiations, I act as advisor, advocate, and problem solver long after the transaction is complete.",
      },
      {
        heading: "Family First",
        text: "Family comes first for me, and buying or selling a home is a family decision. I keep the process calm and transparent so you can stay focused on what matters most.",
      },
    ],
  },
  cta: {
    title: "Let's Talk About Your Next Move",
    description:
      "Buying, selling, or simply weighing your options in North County San Diego, a short conversation is the best place to start.",
    buttonLabel: "Let's Connect",
    buttonHref: "/connect",
    image: "/photos/gordon-rooftop-sunset.webp",
  },
  footer: {
    agentName: "Alexa Devaney",
    brokerage: "The Oppenheim Group",
    links: [
      { label: "Home", href: "/" },
      { label: "Buy a Home", href: "/buy" },
      { label: "Sell Your Home", href: "/sell" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Search Homes", href: "/listings" },
      { label: "About Alexa", href: "/about" },
      { label: "Let's Connect", href: "/connect" },
    ],
    socials: [
      { platform: "instagram", href: "https://www.instagram.com/alexadevaneyrealtor/" },
      { platform: "facebook", href: "https://www.facebook.com/alexa.walker.9822" },
    ],
    addressLines: ["7925 Girard Ave.", "La Jolla, CA 92037"],
    newsletter: {
      heading: "Stay in the Know",
      tagline: "North County Market Updates. New Listings. Local Insight.",
      consent:
        "I agree to be contacted by Alexa Devaney of The Oppenheim Group via call, email, and text for real estate services. To opt out, reply 'stop' at any time or reply 'help' for assistance. You can also click the unsubscribe link in the emails. Message and data rates may apply. Message frequency may vary.",
    },
    copyright: `Copyright ${new Date().getFullYear()} Alexa Devaney`,
    compliance: {
      image: "/equal-housing.png",
      text: "Alexa Devaney · DRE# 02031174 · The Oppenheim Group · DRE# 01983697",
    },
  },
};
