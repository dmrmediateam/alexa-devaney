import type { AreaGuide } from "./types";

/* --------------------------------------------------------------------------
   Oceanside guide. Copy supplied by Alexa (Oct 2026), lightly trimmed.

   Pins are geocoded from her addresses (OpenStreetMap / Nominatim). The
   harbor activities all depart from Oceanside Harbor, so they share the
   harbor's directions rather than stacking six pins on one spot. Events
   with no fixed venue have cards but no pin.

   Verify before launch:
   - Valle is described as Michelin-starred; confirm the star is current.
   - Dija Mara (232 S Coast Hwy) and Allmine (119 S Coast Hwy) addresses
     come from public listings, not her copy. She places Allmine in South
     Oceanside; its address sits nearer downtown.
   -------------------------------------------------------------------------- */

export const oceansideGuide: AreaGuide = {
  tagline: "Coastal Heritage & Culinary Innovation",
  lede: "Oceanside has a more energetic, creative, and evolving personality. It mixes classic surf and skate culture with new restaurants, boutique hotels, arts, redevelopment, and a growing luxury coastal market.",
  stats: [
    { value: "5", label: "Distinct neighborhoods" },
    { value: "7", label: "Beach & surf spots" },
    { value: "6", label: "Ways out on the water" },
    { value: "6", label: "Markets, art walks & festivals" },
  ],
  categories: [
    { id: "beaches", label: "Beaches & Surf" },
    { id: "water", label: "Water Activities" },
    { id: "dining", label: "Dining" },
    { id: "coffee", label: "Coffee & Social" },
    { id: "arts", label: "Arts & Culture" },
    { id: "history", label: "History" },
    { id: "events", label: "Events & Community" },
  ],
  neighborhoods: [
    {
      id: "downtown",
      name: "Downtown & Pier District",
      character: "Energetic · Walkable · Coastal",
      centeredOn: "Mission Avenue, Pier View Way & North Myers Street",
      description:
        "Centered on Mission Avenue, Pier View Way, North Myers Street, and the Oceanside Pier. Highlights include Mission Pacific Beach Resort, The Seabird Ocean Resort & Spa, the Thursday Sunset Market, Artist Alley, the California Surf Museum, and the Oceanside Museum of Art.",
      anchors: ["Oceanside Pier", "Mission Pacific Beach Resort", "The Seabird Ocean Resort & Spa", "Thursday Sunset Market", "Artist Alley", "California Surf Museum", "Oceanside Museum of Art"],
    },
    {
      id: "south-o",
      name: "South Oceanside",
      character: "Walkable · Independent · Coastal",
      centeredOn: "South Coast Highway & South Tremont Street",
      description:
        "A walkable coastal neighborhood along South Coast Highway and South Tremont Street, anchored by Communal Coffee, Revolution Roasters, The Plot, vintage and independent shops, neighborhood restaurants, and nearby Buccaneer Beach.",
      anchors: ["Communal Coffee", "Revolution Roasters", "The Plot", "Vintage & independent shops", "Buccaneer Beach"],
    },
    {
      id: "harbor",
      name: "Oceanside Harbor",
      character: "Marina · Waterfront · Active",
      centeredOn: "Harbor Village & Harbor Beach",
      description:
        "The marina district around Harbor Village, Harbor Beach, the North Jetty, boat slips, charter operations, waterfront restaurants, and water-sport rentals.",
      anchors: ["Harbor Village", "Harbor Beach & North Jetty", "Boat slips", "Charters", "Water-sport rentals"],
    },
    {
      id: "fire-mountain",
      name: "Fire Mountain",
      character: "Elevated · Large lots · Custom",
      centeredOn: "East of Coast Highway",
      description:
        "An elevated residential neighborhood east of Coast Highway known for larger lots, custom homes, mature landscaping, and select ocean-view properties.",
      anchors: ["Larger lots", "Custom homes", "Select ocean views"],
      focus: { center: [-117.3323, 33.1948], zoom: 14 },
    },
    {
      id: "rancho-del-oro",
      name: "Rancho Del Oro & Ocean Hills",
      character: "Inland · Quiet · Suburban",
      centeredOn: "Inland Oceanside",
      description:
        "Inland residential communities near parks, open space, schools, and recreation, offering a quieter suburban counterpart to Oceanside's coastal neighborhoods.",
      anchors: ["Parks", "Open space", "Schools", "Recreation"],
      focus: { center: [-117.2900, 33.1950], zoom: 12.4 },
    },
  ],
  places: [
    /* ---- Beaches & Surf ---- */
    { id: "pier", name: "Oceanside Pier / Pier View South", categories: ["beaches"], neighborhood: "downtown", note: "The main downtown beach and one of Oceanside's signature surf zones, home to recurring professional, amateur, longboard, and youth surf competitions.", coords: [-117.3846, 33.1942] },
    { id: "pier-view-north", name: "Pier View North", categories: ["beaches"], neighborhood: "downtown", note: "Surf and beach area immediately north of the Oceanside Pier.", coords: [-117.3851, 33.1962] },
    { id: "strand", name: "The Strand", categories: ["beaches"], neighborhood: "downtown", note: "Oceanfront road and pedestrian route along the beach north and south of the pier.", coords: [-117.3873, 33.1985] },
    { id: "harbor-beach", name: "Harbor Beach / North Jetty", categories: ["beaches"], neighborhood: "harbor", note: "Wide sandy beach beside Oceanside Harbor and a well-known local surf area.", coords: [-117.3945, 33.2051] },
    { id: "harbor-volleyball", name: "Harbor Beach Volleyball Courts", categories: ["beaches"], neighborhood: "harbor", note: "Beach volleyball along Harbor Beach.", coords: [-117.3925, 33.2036] },
    { id: "buccaneer", name: "Buccaneer Beach", categories: ["beaches"], neighborhood: "south-o", address: "South Pacific Street at Buccaneer Beach Park", note: "Neighborhood beach in South Oceanside.", coords: [-117.3689, 33.1761] },

    /* ---- Water Activities ---- */
    { id: "boating", name: "Oceanside Harbor Marina", categories: ["water"], neighborhood: "harbor", note: "Boat slips, launch access, and charter services.", coords: [-117.3925, 33.2070] },
    { id: "whale-watching", name: "Whale Watching", categories: ["water"], neighborhood: "harbor", address: "Oceanside Harbor", note: "Sightseeing and whale-watching excursions depart directly from the harbor." },
    { id: "sportfishing", name: "Sportfishing", categories: ["water"], neighborhood: "harbor", address: "Oceanside Harbor", note: "Deep-sea fishing charters into offshore North County waters." },
    { id: "kayaking", name: "Kayaking", categories: ["water"], neighborhood: "harbor", address: "Oceanside Harbor", note: "Rentals and protected-water paddling inside the harbor." },
    { id: "paddleboarding", name: "Stand-Up Paddleboarding", categories: ["water"], neighborhood: "harbor", address: "Oceanside Harbor", note: "Rentals and calm-water paddling around the marina." },
    { id: "jet-ski", name: "Jet Ski Rentals", categories: ["water"], neighborhood: "harbor", address: "Oceanside Harbor", note: "Personal watercraft rentals from the harbor recreation area." },

    /* ---- Dining ---- */
    { id: "valle", name: "Valle", categories: ["dining"], neighborhood: "downtown", address: "Mission Pacific Beach Resort, 201 North Myers Street", note: "Michelin-starred, Baja-inspired restaurant.", coords: [-117.3829, 33.1945] },
    { id: "dija-mara", name: "Dija Mara", categories: ["dining"], neighborhood: "downtown", address: "232 South Coast Highway", note: "Balinese-Californian restaurant.", coords: [-117.3770, 33.1934] },
    { id: "the-plot", name: "The Plot", categories: ["dining"], neighborhood: "south-o", address: "1733 South Coast Highway", note: "Plant-forward restaurant.", coords: [-117.3630, 33.1757] },
    { id: "allmine", name: "Allmine", categories: ["dining"], neighborhood: "south-o", address: "119 South Coast Highway", note: "Pizza and natural wine.", coords: [-117.3784, 33.1945] },
    { id: "24-suns", name: "24 Suns", categories: ["dining"], address: "3375 Mission Avenue", note: "Modern Chinese restaurant.", coords: [-117.3401, 33.2182] },

    /* ---- Coffee & Social ---- */
    { id: "communal", name: "Communal Coffee", categories: ["coffee"], neighborhood: "south-o", address: "602 South Tremont Street, Suite 100", coords: [-117.3749, 33.1891] },
    { id: "rooftop", name: "The Rooftop Bar at Mission Pacific", categories: ["coffee"], neighborhood: "downtown", address: "201 North Myers Street", note: "Overlooking the pier and coastline.", coords: [-117.3827, 33.1947] },
    { id: "revolution-roasters", name: "Revolution Roasters", categories: ["coffee", "arts"], neighborhood: "south-o", address: "1836 South Coast Highway", note: "Home to the Revolution Roasters mural.", coords: [-117.3616, 33.1747] },
    { id: "vigilante", name: "Vigilante Coffee", categories: ["coffee"], neighborhood: "south-o", address: "1575 South Coast Highway", coords: [-117.3661, 33.1797] },
    { id: "bound", name: "Bound Coffee Company", categories: ["coffee"], neighborhood: "south-o", address: "2110 South Coast Highway, Suite C", coords: [-117.3576, 33.1703] },

    /* ---- Arts & Culture ---- */
    { id: "oma", name: "Oceanside Museum of Art", categories: ["arts"], neighborhood: "downtown", address: "704 Pier View Way", note: "Contemporary art and Southern California artists.", coords: [-117.3787, 33.1980] },
    { id: "surf-museum", name: "California Surf Museum", categories: ["arts", "history"], neighborhood: "downtown", address: "312 Pier View Way", note: "Dedicated to surf history and culture, preserving Oceanside's connection to Southern California surfing: its boards, athletes, and stories.", coords: [-117.3814, 33.1964] },
    { id: "artist-alley", name: "Artist Alley", categories: ["arts"], neighborhood: "downtown", address: "Between Mission Avenue & Pier View Way", note: "Creative district with galleries, studios, murals, and First Friday programming.", coords: [-117.3796, 33.1962] },
    { id: "artist-alley-mural", name: "Artist Alley Mural", categories: ["arts"], neighborhood: "downtown", address: "Around 212-213 Artist Alley", coords: [-117.3799, 33.1957] },
    { id: "js-mural", name: "J.S. Industries Mural", categories: ["arts"], address: "305 Wisconsin Avenue", coords: [-117.3745, 33.1875] },
    { id: "art-collective", name: "Oceanside Art Collective", categories: ["arts"], address: "427 South Coast Highway", coords: [-117.3759, 33.1914] },
    { id: "first-friday", name: "First Friday Oceanside Art Walk", categories: ["arts", "events"], neighborhood: "downtown", address: "Artist Alley & downtown galleries", note: "Monthly art walk centered on Artist Alley and participating downtown galleries.", schedule: "First Friday · Monthly" },

    /* ---- History ---- */
    { id: "mission", name: "Mission San Luis Rey", categories: ["history"], note: "Historic Spanish mission east of Downtown Oceanside, known as the “King of the Missions.”", coords: [-117.3194, 33.2324] },
    { id: "graves-house", name: "Graves House / Top Gun House", categories: ["history"], neighborhood: "downtown", note: "Restored Victorian cottage incorporated into the Mission Pacific resort property near the pier.", coords: [-117.3834, 33.1952] },
    { id: "brick-hotel", name: "The Brick Hotel / Schuyler Building", categories: ["history"], neighborhood: "downtown", address: "408 Pier View Way", note: "Historic downtown property.", coords: [-117.3809, 33.1967] },
    { id: "roberts-cottages", name: "Roberts Cottages", categories: ["history"], neighborhood: "downtown", address: "North The Strand", note: "Distinctive historic beachfront cottages.", coords: [-117.3889, 33.2006] },

    /* ---- Events & Community ---- */
    { id: "sunset-market", name: "Thursday Sunset Market", categories: ["events"], neighborhood: "downtown", address: "Pier View Way, Downtown Oceanside", note: "Weekly evening market with food vendors, shopping, live entertainment, and community programming.", schedule: "Thursdays · Evenings", coords: [-117.3803, 33.1968] },
    { id: "super-girl", name: "Super Girl Surf Festival", categories: ["events"], neighborhood: "downtown", address: "Oceanside Pier", note: "Major women's professional surf competition.", schedule: "Annual" },
    { id: "longboard-contest", name: "Oceanside Longboard Surfing Club Contest & Beach Festival", categories: ["events"], neighborhood: "downtown", address: "Oceanside Pier", note: "Longboard competition and beach festival at the pier.", schedule: "Annual" },
    { id: "usa-surfing", name: "USA Surfing Championships & Team Trials", categories: ["events"], note: "National-level surfing competition held in Oceanside." },
    { id: "dia-de-los-muertos", name: "Oceanside Día de los Muertos", categories: ["events"], neighborhood: "downtown", address: "Downtown Oceanside", note: "Downtown cultural celebration with altars, music, food, and community programming.", schedule: "Annual" },
  ],
};
