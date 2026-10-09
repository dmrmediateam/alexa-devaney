import type { AreaGuide } from "./types";

/* --------------------------------------------------------------------------
   Carlsbad guide. Copy supplied by Alexa (Oct 2026), lightly trimmed.

   Pins are geocoded from her addresses (OpenStreetMap / Nominatim). Places
   without a street address (surf breaks, the Seawall, the golf courses,
   the preserves) sit on the feature itself. Places her copy doesn't tie to
   a neighborhood carry none and show in the whole-town view only.

   Verify before launch:
   - Rancho La Costa Preserve and Quarry Creek pins are placed at the trail
     areas she describes, not a trailhead address.
   -------------------------------------------------------------------------- */

export const carlsbadGuide: AreaGuide = {
  tagline: "Seaside Sophistication & Coastal Elegance",
  lede: "Carlsbad combines beach-town charm with luxury resorts, golf, strong schools, upscale neighborhoods, and a polished dining and shopping scene. It feels family-friendly and sophisticated without losing its relaxed coastal character.",
  stats: [
    { value: "5", label: "Distinct neighborhoods" },
    { value: "8", label: "Beaches, breaks & coastal spots" },
    { value: "185+", label: "Bird species at Batiquitos" },
    { value: "50+", label: "Acres of ranunculus blooms" },
  ],
  categories: [
    { id: "beaches", label: "Beaches & Outdoors" },
    { id: "wellness", label: "Lagoons & Nature" },
    { id: "dining", label: "Dining" },
    { id: "golf", label: "Golf & Resorts" },
    { id: "shopping", label: "Shopping & Village Life" },
    { id: "attractions", label: "Attractions" },
  ],
  neighborhoods: [
    {
      id: "village",
      name: "Carlsbad Village",
      character: "Walkable · Coastal · Lively",
      centeredOn: "State Street, Carlsbad Boulevard & Grand Avenue",
      description:
        "The walkable heart of Carlsbad, centered on State Street, Carlsbad Boulevard, Grand Avenue, and Carlsbad Village Drive. The beach, the Carlsbad Seawall, the State Street Farmers Market, boutique shopping, restaurants, and the Village train station are all within a few blocks.",
      anchors: ["Carlsbad Seawall", "State Street Farmers Market", "Boutique shopping", "Restaurants", "Village train station"],
    },
    {
      id: "la-costa",
      name: "La Costa",
      character: "Established · Resort · Hillside",
      centeredOn: "La Costa Avenue & Costa Del Mar Road",
      description:
        "An established luxury community anchored by Omni La Costa Resort & Spa, its Champions and Legends golf courses, the spa, and the hillside neighborhoods around them.",
      anchors: ["Omni La Costa Resort & Spa", "La Costa Champions Course", "La Costa Legends Course"],
    },
    {
      id: "aviara",
      name: "Aviara",
      character: "Prestigious · Master-planned · Golf",
      centeredOn: "Park Hyatt Aviara & Batiquitos Lagoon",
      description:
        "A prestigious master-planned community surrounding Park Hyatt Aviara, Aviara Golf Club, and the northern edge of Batiquitos Lagoon.",
      anchors: ["Park Hyatt Aviara Resort, Golf Club & Spa", "Aviara Golf Club", "Batiquitos Lagoon"],
    },
    {
      id: "olde-carlsbad",
      name: "Olde Carlsbad",
      character: "Established · Large lots · Custom",
      centeredOn: "West of El Camino Real, around the Village",
      description:
        "An established residential area west of El Camino Real and around the Village, known for larger lots, custom homes, mature landscaping, and easy access to downtown and the coastline.",
      anchors: ["Larger lots", "Custom homes", "Mature landscaping"],
      focus: { center: [-117.3356, 33.1631], zoom: 13.6 },
    },
    {
      id: "south-carlsbad",
      name: "Batiquitos Lagoon / South Carlsbad",
      character: "Coastal · Lagoon · Beach",
      centeredOn: "Batiquitos Lagoon & Carlsbad Boulevard",
      description:
        "A coastal residential area near Batiquitos Lagoon, South Ponto Beach, South Carlsbad State Beach, and the stretch of coast bordering Carlsbad Boulevard.",
      anchors: ["Batiquitos Lagoon Nature Center", "South Ponto Beach", "South Carlsbad State Beach"],
    },
  ],
  places: [
    /* ---- Beaches & Outdoors ---- */
    { id: "tamarack", name: "Tamarack State Beach", categories: ["beaches"], address: "Carlsbad Boulevard at Tamarack Avenue", note: "Popular swimming and surfing beach with access to the Carlsbad Seawall.", coords: [-117.3458, 33.1477] },
    { id: "tamarack-surf", name: "Tamarack Surf Beach", categories: ["beaches"], note: "One of Carlsbad's most established surf areas.", coords: [-117.3452, 33.1468] },
    { id: "seawall", name: "Carlsbad Seawall", categories: ["beaches"], neighborhood: "village", note: "Paved coastal walking and biking route connecting the Village and Tamarack with beaches farther south.", coords: [-117.3500, 33.1540] },
    { id: "warm-water", name: "Warm Water Jetty", categories: ["beaches"], address: "Carlsbad Boulevard at the Agua Hedionda Lagoon outlet", note: "Surf break near the Agua Hedionda Lagoon outlet.", coords: [-117.3418, 33.1403] },
    { id: "terramar", name: "Terramar", categories: ["beaches"], address: "Carlsbad Boulevard near Cerezo Drive", note: "Reef break along Carlsbad Boulevard.", coords: [-117.3352, 33.1290] },
    { id: "south-carlsbad-beach", name: "South Carlsbad State Beach", categories: ["beaches"], neighborhood: "south-carlsbad", note: "Coastal stretch through southern Carlsbad with bluff-top camping and access points including South Ponto.", coords: [-117.3217, 33.1082] },
    { id: "south-ponto", name: "South Ponto Beach", categories: ["beaches"], neighborhood: "south-carlsbad", note: "Wide beach at the southern end of Carlsbad near Batiquitos Lagoon.", coords: [-117.3105, 33.0862] },
    { id: "campground", name: "South Carlsbad State Beach Campground", categories: ["beaches"], neighborhood: "south-carlsbad", note: "Bluff-top campground overlooking the Pacific.", coords: [-117.3190, 33.1020] },

    /* ---- Lagoons & Nature ---- */
    { id: "batiquitos", name: "Batiquitos Lagoon Nature Center", categories: ["wellness"], neighborhood: "south-carlsbad", address: "7380 Gabbiano Lane", note: "Access to the lagoon's walking trails, wildlife viewing, and birdwatching. The lagoon supports more than 185 bird species.", coords: [-117.3014, 33.0942] },
    { id: "agua-hedionda", name: "Agua Hedionda Lagoon Discovery Center", categories: ["wellness"], address: "1580 Cannon Road", note: "Educational center and access point for exploring the lagoon ecosystem.", coords: [-117.3077, 33.1414] },
    { id: "calavera", name: "Lake Calavera Preserve", categories: ["wellness"], note: "Trail network around Mount Calavera and Lake Calavera in northeastern Carlsbad.", coords: [-117.2849, 33.1706] },
    { id: "quarry-creek", name: "Quarry Creek Trails", categories: ["wellness"], note: "Open-space trails in northeast Carlsbad near Marron Road.", coords: [-117.2985, 33.1785] },
    { id: "rancho-la-costa", name: "Rancho La Costa Preserve", categories: ["wellness"], note: "Hiking and mountain biking trails in the hills east of La Costa.", coords: [-117.2290, 33.0960] },
    { id: "cal-watersports", name: "California Watersports", categories: ["wellness"], address: "4215 Harrison Street", note: "Kayak, paddleboard, WaveRunner, and boat rentals directly on Agua Hedionda Lagoon.", coords: [-117.3327, 33.1483] },

    /* ---- Dining ---- */
    { id: "jeune-et-jolie", name: "Jeune et Jolie", categories: ["dining"], neighborhood: "village", address: "2659 State Street", coords: [-117.3518, 33.1629] },
    { id: "lilo", name: "Lilo", categories: ["dining"], neighborhood: "village", address: "2571 Roosevelt Street", coords: [-117.3515, 33.1644] },
    { id: "campfire", name: "Campfire", categories: ["dining"], neighborhood: "village", address: "2725 State Street", coords: [-117.3510, 33.1620] },
    { id: "nicks", name: "Nick's on State", categories: ["dining"], neighborhood: "village", address: "2742 State Street", coords: [-117.3503, 33.1620] },
    { id: "revolution-roasters", name: "Revolution Roasters", categories: ["dining"], neighborhood: "village", address: "2956 Roosevelt Street", coords: [-117.3477, 33.1608] },
    { id: "windmill", name: "Windmill Food Hall", categories: ["dining"], address: "890 Palomar Airport Road", coords: [-117.3208, 33.1232] },

    /* ---- Golf & Resorts ---- */
    { id: "omni", name: "Omni La Costa Resort & Spa", categories: ["golf"], neighborhood: "la-costa", address: "2100 Costa Del Mar Road", note: "Luxury resort with spa and two golf courses.", coords: [-117.2661, 33.0920] },
    { id: "champions", name: "La Costa Champions Course", categories: ["golf"], neighborhood: "la-costa", note: "Championship course at Omni La Costa and host site of major collegiate golf competition.", coords: [-117.2650, 33.0962] },
    { id: "legends", name: "La Costa Legends Course", categories: ["golf"], neighborhood: "la-costa", note: "Second course at Omni La Costa, available to club members and resort guests.", coords: [-117.2618, 33.0878] },
    { id: "park-hyatt", name: "Park Hyatt Aviara Resort, Golf Club & Spa", categories: ["golf"], neighborhood: "aviara", note: "Luxury resort overlooking Batiquitos Lagoon.", coords: [-117.2860, 33.0993] },
    { id: "aviara-golf", name: "Aviara Golf Club", categories: ["golf"], neighborhood: "aviara", note: "Arnold Palmer-designed championship course beside Park Hyatt Aviara.", coords: [-117.2863, 33.0927] },
    { id: "crossings", name: "The Crossings at Carlsbad", categories: ["golf"], address: "5800 The Crossings Drive", note: "18-hole public championship course across rolling coastal terrain with Pacific views.", coords: [-117.3026, 33.1298] },

    /* ---- Shopping & Village Life ---- */
    { id: "blues-and-shoes", name: "Blues and Shoes", categories: ["shopping"], neighborhood: "village", address: "457 Carlsbad Village Drive", note: "Locally owned fashion boutique.", coords: [-117.3487, 33.1592] },
    { id: "cielo", name: "Cielo Boutique & Body Bar", categories: ["shopping"], neighborhood: "village", address: "2969 State Street", coords: [-117.3491, 33.1599] },
    { id: "humble-olive", name: "Humble Olive Oils", categories: ["shopping"], neighborhood: "village", address: "2922 State Street", note: "Specialty olive oil and gourmet shop.", coords: [-117.3493, 33.1604] },
    { id: "baba", name: "Baba Coffee", categories: ["shopping"], neighborhood: "village", address: "2727 State Street", coords: [-117.3509, 33.1620] },
    { id: "lofty", name: "Lofty Coffee", categories: ["shopping"], neighborhood: "village", address: "2742 State Street", coords: [-117.3503, 33.1620] },
    { id: "steady-state", name: "Steady State Roasting", categories: ["shopping"], neighborhood: "village", address: "2562 State Street", coords: [-117.3524, 33.1643] },
    { id: "carruth", name: "Carruth Cellars Wine Garden", categories: ["shopping"], neighborhood: "village", address: "2727 State Street", note: "Carlsbad Village wine tasting room.", coords: [-117.3509, 33.1620] },
    { id: "state-street-market", name: "State Street Farmers Market", categories: ["shopping", "attractions"], neighborhood: "village", address: "2907 State Street", note: "Weekly market in Carlsbad Village.", schedule: "Wednesdays", coords: [-117.3496, 33.1604] },

    /* ---- Attractions ---- */
    { id: "flower-fields", name: "The Flower Fields at Carlsbad Ranch", categories: ["attractions"], address: "5704 Paseo Del Norte", note: "Seasonal display of more than 50 acres of ranunculus blooms.", schedule: "Seasonal", coords: [-117.3211, 33.1245] },
    { id: "legoland", name: "LEGOLAND California Resort", categories: ["attractions"], address: "One LEGOLAND Drive", note: "Theme park, water park, aquarium, and resort.", coords: [-117.3117, 33.1279] },
    { id: "leo-carrillo", name: "Leo Carrillo Ranch Historic Park", categories: ["attractions"], address: "6200 Flying Leo Carrillo Lane", note: "Historic ranch with gardens, adobe structures, trails, and resident peacocks.", coords: [-117.2353, 33.1188] },
    { id: "making-music", name: "Museum of Making Music", categories: ["attractions"], address: "5790 Armada Drive", note: "Interactive museum exploring the history and evolution of musical instruments.", coords: [-117.3170, 33.1272] },
    { id: "street-faire", name: "Carlsbad Village Street Faire", categories: ["attractions"], neighborhood: "village", address: "Throughout Carlsbad Village", note: "Large street festival held throughout the Village.", schedule: "Twice a year" },
  ],
};
