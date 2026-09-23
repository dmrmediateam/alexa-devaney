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
  intro?: string[];
  /** Alternating image/text split sections */
  sections?: { heading: string; text: string; image?: string }[];
  cta?: { label: string; href: string };
  /** Append the client's listings grid to a standard page (e.g. buy) */
  showListings?: boolean;
  /** Render the working property search (filters + results) on this page */
  search?: boolean;
  /** Compact search form (hands off to /listings), e.g. on the buy page */
  searchPanel?: { kicker?: string; title?: string };
  /** Proof-point band (site.stats) under the intro, e.g. on the portfolio page */
  showStats?: boolean;
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
  /** Optional proof-point band rendered after the intro (e.g. "40+ / Years") */
  stats?: { value: string; label: string }[];
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
    brokerageLogo: { light: "/brand/og-wordmark-light.png", dark: "/brand/og-wordmark-dark.png" },
    emblem: "/brand/og-emblem.png",
    decal: "/brand/og-ring-decal.webp",
  },
  meta: {
    siteUrl: "https://example.com",
    title: "North County San Diego Luxury Homes – Alexa Devaney",
    description:
      "Alexa Devaney, Senior Realtor Associate with The Oppenheim Group, helps families buy and sell luxury homes from Encinitas and Carlsbad to Oceanside and Fallbrook.",
  },
  hero: {
    preTitle: "North County San Diego",
    title: "Coastal Living, Personally Guided",
    video: { mp4: "/video/hero.mp4", mobileMp4: "/video/hero-mobile.mp4" },
    image: "/video/hero-poster.jpg",
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
        image: "/photos/fallsbrae-estate.jpg",
        href: "/property/4462-fallsbrae-rd-fallbrook",
        gallery: [
          "/photos/fallsbrae-aerial.jpg",
          "/photos/fallsbrae-veranda.jpg",
          "/photos/fallsbrae-sunset.jpg",
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
        image: "/photos/gordon-exterior.jpg",
        href: "/property/5115-gordon-ln-san-diego",
        gallery: [
          "/photos/gordon-ocean-view.jpg",
          "/photos/gordon-kitchen.jpg",
          "/photos/gordon-deck-view.jpg",
          "/photos/gordon-rooftop-sunset.jpg",
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
        image: "/photos/aceituno-aerial-dusk.jpg",
        href: "/property/18787-aceituno-st-san-diego",
        gallery: [
          "/photos/aceituno-great-room.jpg",
          "/photos/aceituno-living.jpg",
          "/photos/aceituno-pool.jpg",
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
      preTitle: "Active and Recently Sold",
      heroImage: "/photos/aceituno-aerial-dusk.jpg",
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
      preTitle: "Senior Realtor Associate · The Oppenheim Group",
      heroImage: "/photos/alexa-kitchen.jpg",
      intro: [
        "For more than ten years I have helped San Diego families buy and sell with confidence, pairing deep local market knowledge with strategic negotiation and close attention to detail.",
        "Every client gets a personalized plan, honest guidance, and a clear line of communication. Whether you are a first-time buyer, a seasoned investor, or selling a luxury home, I anticipate challenges before they become problems and structure offers that win.",
      ],
      sections: [
        {
          heading: "Organized, Proactive, Committed",
          text: "Clients describe the experience as organized and proactive. From cross-country relocations to competitive negotiations, I act as advisor, advocate, and problem solver long after the transaction is complete.",
          image: "/photos/alexa-devaney.jpg",
        },
        {
          heading: "Family First",
          text: "Family comes first for me, and buying or selling a home is a family decision. Schools, space to grow, a yard for the dog, time at the beach: I listen for what matters most to your family and keep the process calm, transparent, and personal.",
          image: "/photos/alexa-family.jpg",
        },
        {
          heading: "The Reach of The Oppenheim Group",
          text: "My clients benefit from the marketing and buyer network of The Oppenheim Group, with offices from Los Angeles and Newport Beach to La Jolla, Cabo San Lucas, and Dubai.",
          image: "/photos/og-san-diego-office.jpg",
        },
      ],
      cta: { label: "Let's Connect", href: "/connect" },
    },
    {
      slug: "buy",
      title: "Buy a Home",
      preTitle: "North County Buyer Representation",
      heroImage: "/photos/aceituno-great-room.jpg",
      intro: [
        "Whether this is your primary residence, a second home near the water, or a move from out of state, buying well in North County comes down to preparation. I set clear expectations about the market up front, then move quickly when the right home appears.",
      ],
      sections: [
        {
          heading: "Offers Structured to Win",
          text: "In a small, competitive market the strongest offer is not always the highest one. I structure terms around what the seller actually needs, and I negotiate to protect your interests from the first showing through closing.",
          image: "/photos/aceituno-living.jpg",
        },
        {
          heading: "Relocating to San Diego",
          text: "Moving from across the country means making big decisions from a distance. I help you compare neighborhoods, schools, and commutes, preview homes on your behalf, and keep you informed at every step so nothing is left to guesswork.",
          image: "/photos/gordon-deck-view.jpg",
        },
        {
          heading: "Diligence, Handled",
          text: "From inspections scheduled on short notice to contingent sales with moving parts on both sides, I coordinate the specialists and translate what matters so every decision is an informed one.",
          image: "/photos/alexa-patio.jpg",
        },
        {
          heading: "Family First, Always",
          text: "Family comes first for me, and I know a home decision is a family decision. Schools, space to grow, a yard for the dog, time at the beach: I listen for what matters most to your family and keep the process calm, transparent, and personal.",
          image: "/photos/alexa-family.jpg",
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
      preTitle: "Strategic Pricing, Polished Presentation",
      heroImage: "/photos/fallsbrae-sunset.jpg",
      intro: [
        "Selling a family home is personal. I build each sale around a clear strategy: pricing grounded in current comparables, presentation that earns showings, and steady communication so you always know where things stand.",
      ],
      sections: [
        {
          heading: "Pricing Grounded in Real Comparables",
          text: "Automated estimates miss what moves a North County sale: lot size, views, school boundaries, and distance to the beach and village. I price from recent sales and direct market knowledge, then position your home to draw competition.",
          image: "/photos/fallsbrae-veranda.jpg",
        },
        {
          heading: "Ready for Market, Even When Life Is Busy",
          text: "Young kids, a busy schedule, a home that is not quite buyer ready. I coordinate staging, showings, and vendors so the preparation does not fall on you.",
          image: "/photos/gordon-kitchen.jpg",
        },
        {
          heading: "Selling and Buying at the Same Time",
          text: "Contingent moves are stressful. I have guided families through selling one home and buying the next in the same season, bridging gaps with the other side and keeping both transactions on track.",
          image: "/photos/alexa-living-room.jpg",
        },
        {
          heading: "The Reach of The Oppenheim Group",
          text: "Your listing benefits from the marketing and buyer network of The Oppenheim Group, with offices from Los Angeles and Newport Beach to La Jolla, Cabo, and Dubai.",
          image: "/photos/og-san-diego-office.jpg",
        },
      ],
      cta: { label: "Request a Valuation", href: "/connect" },
      valuation: true,
      recentClosings: {
        intro: "A selection of homes Alexa has recently closed across San Diego County, from Carlsbad and Vista to La Jolla and Point Loma.",
      },
      valuationImage: "/photos/fallsbrae-estate.jpg",
    },
    {
      slug: "connect",
      type: "connect",
      title: "Let's Connect",
      preTitle: "Begin with a Conversation",
      heroImage: "/photos/alexa-kitchen.jpg",
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
  stats: [
    { value: "10+", label: "Years in San Diego Real Estate" },
    { value: "$60M+", label: "In Closed Sales" },
    { value: "25+", label: "Closed Transactions" },
  ],
  services: [
    {
      preTitle: "Primary, Second Home, Relocation",
      title: "Buy a Home",
      cta: "Learn More",
      href: "/buy",
      image: "/photos/aceituno-pool.jpg",
    },
    {
      preTitle: "Strategy and Presentation",
      title: "Sell Your Home",
      cta: "Learn More",
      href: "/sell",
      image: "/photos/fallsbrae-estate.jpg",
    },
    {
      preTitle: "Active and Sold",
      title: "Portfolio",
      cta: "View Properties",
      href: "/portfolio",
      image: "/photos/gordon-exterior.jpg",
    },
  ],
  intro: {
    title: "High-Level Service, Family First",
    paragraphs: [
      "A personal approach to buying and selling in North County San Diego, built on clear communication, sharp negotiation, and genuine care for every family I represent.",
      "From Encinitas north through Carlsbad, Oceanside, and Fallbrook, I help clients buy and sell with confidence: primary residences, second homes near the coast, and relocations from out of state.",
      "My goal is simple: make the process seamless and deliver exceptional results, then stay a trusted resource long after closing.",
    ],
    ctaLabel: "Search Homes",
    ctaHref: "/listings",
  },
  areas: [
    {
      title: "Encinitas",
      description: "Surf breaks, bluff-top streets, and a laid-back coastal village from Leucadia to Cardiff.",
      href: "/buy",
      image: "/photos/gordon-ocean-view.jpg",
    },
    {
      title: "Carlsbad",
      description: "Top-rated schools, walkable village streets, and generous lots a short drive from the beach.",
      href: "/buy",
      image: "/listings/7212-columbine.webp",
    },
    {
      title: "Oceanside",
      description: "A revitalized downtown, the historic pier, and some of North County's best coastal value.",
      href: "/buy",
      image: "/photos/coast-sunset.jpg",
    },
    {
      title: "Fallbrook",
      description: "Rolling hills, groves, and acreage estates with room to breathe, inland from the coast.",
      href: "/buy",
      image: "/photos/fallsbrae-aerial.jpg",
    },
  ],
  about: {
    title: "Meet Alexa Devaney",
    subtitle: "Senior Realtor Associate · The Oppenheim Group",
    image: "/photos/alexa-devaney.jpg",
    avatar: "/photos/alexa-devaney-headshot.jpg",
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
    image: "/photos/gordon-rooftop-sunset.jpg",
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
