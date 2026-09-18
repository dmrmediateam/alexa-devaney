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
  href: string;
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
    video?: { webm?: string; mp4?: string };
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

export const site: SiteContent = {
  homeVariant: "noir",
  theme: {
    primary: "#004F71",
    secondary: "#88786A",
    background: "#FBF9F7",
  },
  brand: {
    name: "Meridian",
    tagline: "Real Estate Advisory",
  },
  meta: {
    siteUrl: "https://example.com",
    title: "Coastal Luxury Homes & Estates – Meridian Real Estate Advisory",
    description:
      "Waterfront estates, in-town residences, and quiet off-market opportunities across the coast, represented with discretion and precision.",
  },
  hero: {
    preTitle: "Coastal Luxury Real Estate",
    title: "Exceptional Homes, Expertly Represented",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
  },
  searchBar: {
    placeholder: "Search by Address or Area",
    ctaLabel: "Request a Call",
    ctaHref: "/connect",
  },
  nav: {
    left: [
      { label: "Featured Listings", href: "/listings" },
      { label: "Buy With Us", href: "/buy" },
      { label: "Sell With Us", href: "/sell" },
    ],
    right: [
      { label: "Search", href: "/search" },
      { label: "Let’s Connect", href: "/connect" },
    ],
    menu: [
      { label: "Home", href: "/" },
      { label: "Meet the Team", href: "/team" },
      { label: "Featured Listings", href: "/listings" },
      { label: "Buy with Us", href: "/buy" },
      { label: "Search", href: "/search" },
      { label: "Let's Connect", href: "/connect" },
    ],
  },
  contact: { phone: "(000) 000-0000", email: "hello@example.com" },
  team: {
    tagline: "Three specialists. One standard of care.",
    members: [
      {
        name: "Alex Morgan",
        role: "Founder & Lead Agent",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
        phone: "(000) 000-0000",
        email: "alex@example.com",
        license: "License #0000000",
        bio: "Trusted advisor to buyers and sellers across the region, with a background in landmark development marketing and record-breaking sales.",
      },
      {
        name: "Jordan Lee",
        role: "Buyer Specialist",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
        phone: "(000) 000-0001",
        email: "jordan@example.com",
        license: "License #0000001",
        bio: "Guides relocation and first-time luxury buyers through the market with patience, data, and early access to quiet inventory.",
      },
      {
        name: "Sam Rivera",
        role: "Listing & Marketing Director",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
        phone: "(000) 000-0002",
        email: "sam@example.com",
        license: "License #0000002",
        bio: "Runs every launch end to end: staging, photography, film, and the campaigns that put exceptional homes in front of the right buyers.",
      },
    ],
  },
  legal: {
    licenseState: "Licensed in [State]",
    mlsName: "[Client MLS]",
    governingLaw: "the State of [State]",
    lastUpdated: "August 2026",
  },
  featured: {
    title: "Featured Properties",
    subtitle: "Active Listings",
    listings: [
      {
        price: "$4,995,000",
        address: "12 Harbor Lane, Harborside",
        propertyType: "single-family",
        beds: "5",
        baths: "6.5",
        sqft: "6,240",
        status: "For Sale",
        mls: "A0000001",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        href: "/search",
      },
      {
        price: "$3,250,000",
        address: "800 Bayfront Drive PH2, Bayfront",
        propertyType: "condominium",
        beds: "4",
        baths: "4",
        sqft: "3,980",
        status: "For Sale",
        mls: "A0000002",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
        href: "/search",
      },
      {
        price: "$2,150,000",
        address: "45 Shorecrest Avenue, Shorecrest",
        propertyType: "townhouse",
        beds: "3",
        baths: "3.5",
        sqft: "2,760",
        status: "Pending",
        mls: "A0000003",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        href: "/search",
      },
    ],
  },
  pages: [
    {
      slug: "listings",
      type: "listings",
      title: "Featured Listings",
      preTitle: "Active and Recently Sold",
      heroImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
      intro: [
        "A curated portfolio of the properties we represent: current listings, quiet opportunities, and recent results.",
      ],
    },
    {
      slug: "buy",
      title: "Buy with Us",
      preTitle: "Representation for Discerning Buyers",
      heroImage: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1920&q=80",
      intro: [
        "Buying at the top of the market rewards preparation. We track inventory before it lists, know the buildings and blocks worth waiting for, and negotiate with the leverage that comes from full command of the data.",
      ],
      sections: [
        {
          heading: "Access Before the Market",
          text: "Our relationships with developers, attorneys, and fellow brokers surface off-market and pre-construction opportunities you will not find on the portals. You see the full picture, not the public slice.",
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        },
        {
          heading: "Diligence, Handled",
          text: "From building financials to inspection findings, we coordinate the specialists and translate what matters, so your decision is clear and your closing is quiet.",
          image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
        },
      ],
      cta: { label: "Start Your Search", href: "/listings" },
      search: true,
    },
    {
      slug: "sell",
      title: "Sell with Us",
      preTitle: "Precise Pricing, Sophisticated Presentation",
      heroImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1920&q=80",
      intro: [
        "Exceptional properties deserve more than a listing. We build a launch: pricing grounded in real comparables, editorial-grade media, and placement in front of the exact buyers your home was built for.",
      ],
      sections: [
        {
          heading: "Pricing Grounded in Real Comparables",
          text: "Automated estimates miss what actually moves a luxury sale: renovation quality, exposure, view corridors, and the quiet sales that never hit the portals. We price from current comparables and direct market knowledge, then position to attract competition rather than chase the market down.",
          image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        },
        {
          heading: "Presentation That Sells",
          text: "Staging consultation, architectural photography, film, floor plans, and copy assembled into a listing that reads like a publication feature. Presentation is what earns the showings that produce offers.",
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        },
        {
          heading: "Reach Beyond the Portals",
          text: "Targeted digital campaigns, agent-to-agent networks, and international syndication put your property in front of qualified buyers locally and abroad, including the relocation buyers who drive this market.",
          image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
        },
        {
          heading: "A Quiet, Managed Process",
          text: "From pre-market preparation through inspection, appraisal, and closing, we coordinate the vendors and handle the negotiation, so the process protects your time and your privacy.",
          image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
        },
      ],
      cta: { label: "Request a Valuation", href: "/connect" },
      valuation: true,
      valuationImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80",
    },
    {
      slug: "team",
      type: "team",
      title: "Meet the Team",
      preTitle: "The People Behind the Results",
      heroImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80",
      intro: [
        "Every engagement is a team effort: one lead relationship, backed by specialists in buying, listing, and marketing who each own their part of the process.",
      ],
      cta: { label: "Work With Us", href: "/connect" },
    },
    { slug: "search", type: "search", title: "Search Properties", preTitle: "Every Listing, One Place", heroImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80" },
    {
      slug: "connect",
      type: "connect",
      title: "Let's Connect",
      preTitle: "Begin with a Conversation",
      heroImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1920&q=80",
      intro: [
        "Whether you are buying, selling, or simply weighing what comes next, a short conversation is the right place to start.",
      ],
    },
  ],
  stats: [
    { value: "20+", label: "Years in Luxury Real Estate" },
    { value: "$150M+", label: "Residential Sales" },
    { value: "Top 1%", label: "of Agents in the Region" },
  ],
  services: [
    {
      preTitle: "Luxury Listings",
      title: "Buy with Us",
      cta: "Learn More",
      href: "/buy",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
    },
    {
      preTitle: "Proven Marketing",
      title: "Sell with Us",
      cta: "Learn More",
      href: "/sell",
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80",
    },
    {
      preTitle: "Current Portfolio",
      title: "Featured Listings",
      cta: "View Properties",
      href: "/listings",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80",
    },
  ],
  intro: {
    title: "A Considered Approach to Coastal Property",
    paragraphs: [
      "A curated portfolio of the finest homes across the region: waterfront estates, in-town residences, and gated community properties, alongside the quiet opportunities that never reach the public portals.",
      "We assemble the advisory team around each transaction, with access to the resources, specialists, and introductions typically shared only among close family and friends.",
      "Everything we do is designed to simplify complex transactions, protect your time, and help you quietly build not just a real estate portfolio, but the next stage of your life.",
    ],
    ctaLabel: "Explore Listings",
    ctaHref: "/listings",
  },
  areas: [
    {
      title: "Harborside",
      description: "Marina-front condos and townhomes steps from the waterfront dining district.",
      href: "#",
      image: "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "The Peninsula",
      description: "Gated estates on a private spit of land with panoramic water views in every direction.",
      href: "#",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Bayfront",
      description: "Modern high-rises over a protected bay, with private docks and resort amenities.",
      href: "#",
      image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Shorecrest",
      description: "A quiet enclave of new construction homes a short walk from the beach.",
      href: "#",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    },
  ],
  about: {
    title: "Meet Alex Morgan",
    subtitle: "Meridian Real Estate Advisory",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80",
    blocks: [
      {
        text: "A next-generation luxury estate agent who has become a trusted consultant and advisor to loyal clients buying and selling homes across the region and beyond.",
      },
      {
        heading: "Award Winning Success",
        text: "Early success leading award-winning marketing strategy for landmark developments, plus experience running global corporate relocation programs, set the stage for the white-glove service and detailed analysis behind record-breaking sales.",
      },
      {
        heading: "Access Beyond the Portals",
        text: "In a fast-moving luxury market, deep industry connections keep our clients ahead of the trends. Relationships with fellow brokers, attorneys, and longtime owners surface opportunities before they are listed, and often instead of being listed at all.",
      },
      {
        heading: "Real Estate Family Office",
        text: "Sophisticated clients appreciate the concierge-level service of our real estate family office, sharing access to the advisors, partners, and resources typically reserved for select family and friends.",
      },
      {
        heading: "Optimize Your Real Estate Portfolio",
        text: "Whether you are investing in your first luxury home or your family has been in real estate for generations, we simplify the journey and help optimize your portfolio, blending cutting-edge technology and analytics with the classic principles that drive generational wealth.",
      },
      {
        heading: "Curate The Next Stage of Your Life",
        text: "We guide you to navigate the luxury market like a pro: early access to off-market opportunities, a sharper portfolio, and a clear path to the next stage of your life.",
      },
    ],
  },
  cta: {
    title: "Connect with Us",
    description:
      "Life is always shifting. We guide clients through meaningful milestones with clarity, calm, and access to the kinds of opportunities that rarely make it online.",
    buttonLabel: "Let's Connect",
    buttonHref: "/connect",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80",
  },
  footer: {
    agentName: "Alex Morgan",
    brokerage: "Meridian Real Estate Advisory",
    links: [
      { label: "Home", href: "/" },
      { label: "Meet the Team", href: "/team" },
      { label: "Featured Listings", href: "/listings" },
      { label: "Buy with Us", href: "/buy" },
      { label: "Sell with Us", href: "/sell" },
      { label: "Search", href: "/search" },
      { label: "Let's Connect", href: "/connect" },
    ],
    socials: [
      { platform: "instagram", href: "#" },
      { platform: "facebook", href: "#" },
      { platform: "linkedin", href: "#" },
    ],
    addressLines: ["100 Main Street Suite 200", "Anytown, ST 00000"],
    newsletter: {
      heading: "Join the Network",
      tagline: "Early Access. Quiet Opportunities. Curated Partners.",
      consent:
        "I agree to be contacted via call, email, and text for real estate services. To opt out, reply 'stop' at any time or reply 'help' for assistance. You can also click the unsubscribe link in the emails. Message and data rates may apply. Message frequency may vary.",
    },
    copyright: `Copyright ${new Date().getFullYear()}`,
  },
};
