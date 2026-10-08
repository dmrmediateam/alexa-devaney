import type { AreaGuide } from "./types";

/* --------------------------------------------------------------------------
   Encinitas guide. Copy supplied by Alexa (Oct 2026), lightly trimmed.

   Verify before launch:
   - SHELTER: 540 S Coast Hwy 101 comes from a single directory listing.
   - Encinitas House of Art: no address found anywhere, so it has no pin
     until Alexa supplies one.
   - Surf breaks (Swami's, Cardiff Reef, Seaside Reef) have no street
     address; their pins sit on the break itself.
   -------------------------------------------------------------------------- */

export const encinitasGuide: AreaGuide = {
  tagline: "Coastal Soul Meets Effortless Luxury",
  lede: "Encinitas blends iconic Southern California surf culture with elevated coastal living. The city feels relaxed, creative, wellness-focused, and deeply connected to the outdoors, with six miles of coastline, a walkable downtown, local dining, and distinct residential communities.",
  stats: [
    { value: "6", label: "Miles of coastline" },
    { value: "5", label: "Distinct neighborhoods" },
    { value: "8", label: "Beaches & surf breaks" },
    { value: "37", label: "Acre botanic garden" },
  ],
  categories: [
    { id: "beaches", label: "Beaches & Surf" },
    { id: "dining", label: "Dining" },
    { id: "drinks", label: "Drinks & Nightlife" },
    { id: "arts", label: "Arts & Culture" },
    { id: "wellness", label: "Wellness & Nature" },
    { id: "parks", label: "Parks & Outdoors" },
    { id: "shopping", label: "Shopping & Markets" },
  ],
  neighborhoods: [
    {
      id: "old-encinitas",
      name: "Old Encinitas",
      character: "Historic · Walkable · Downtown",
      centeredOn: "Coast Highway 101",
      description:
        "Historic and walkable, centered on Coast Highway 101. Home to La Paloma Theatre, the Pacific View Arts Center, Moonlight State Beach, the Downtown Encinitas shopping and dining district, and the D Street coastal overlook.",
      anchors: ["La Paloma Theatre", "Pacific View Arts Center", "Moonlight State Beach", "Downtown Encinitas", "D Street Overlook"],
    },
    {
      id: "leucadia",
      name: "Leucadia",
      character: "Artsy · Laid-back · Eclectic",
      centeredOn: "North Coast Highway 101",
      description:
        "Artsy, laid-back, and eclectic, centered along North Coast Highway 101. Bluff stairways down to the sand, a Sunday farmers market, a winery kitchen, and independent shops along the 101.",
      anchors: ["Beacon's Beach", "Grandview Beach", "Stone Steps", "Four Moons Spa", "Solterra Winery & Kitchen", "Thread Spun", "Leucadia Farmers Market"],
    },
    {
      id: "cardiff",
      name: "Cardiff-by-the-Sea",
      character: "Oceanfront · Village · Surf",
      centeredOn: "San Elijo Avenue & Coast Highway 101",
      description:
        "An oceanfront village centered on San Elijo Avenue and Coast Highway 101, between Cardiff Reef, Seaside Reef, and the San Elijo Lagoon.",
      anchors: ["Cardiff Reef", "Seaside Reef", "San Elijo State Beach", "Glen Park", "Seaside Market", "Pacific Coast Grill"],
    },
    {
      id: "new-encinitas",
      name: "New Encinitas",
      character: "Suburban · Planned · Convenient",
      centeredOn: "El Camino Real & Encinitas Boulevard",
      description:
        "A more suburban, planned area centered on El Camino Real, Encinitas Boulevard, and the Encinitas Ranch area, with golf, gardens, and everyday shopping close to home.",
      anchors: ["Encinitas Ranch Golf Course", "San Diego Botanic Garden", "Encinitas Ranch Town Center", "Encinitas Village Square"],
    },
    {
      id: "olivenhain",
      name: "Olivenhain",
      character: "Private · Rural · Equestrian",
      centeredOn: "Lone Jack Road & Rancho Santa Fe Road",
      description:
        "A private, rural-feeling community known for custom estates and equestrian living, laced with riding trails and anchored by the historic Olivenhain Town Hall.",
      anchors: ["Little Oaks Equestrian Park", "Lone Jack Road", "Lone Hill Horse Trail", "Fortuna Ranch Loop", "Olivenhain Town Hall"],
    },
  ],
  places: [
    /* ---- Beaches & Surf ---- */
    { id: "swamis", name: "Swami's Beach", categories: ["beaches"], neighborhood: "old-encinitas", note: "Iconic point break and bluff-top coastal destination at the southern end of Old Encinitas.", coords: [-117.2934, 33.0346] },
    { id: "moonlight", name: "Moonlight State Beach", categories: ["beaches", "parks"], neighborhood: "old-encinitas", address: "400 B Street", note: "Family-friendly beach with volleyball courts, playgrounds, picnic areas, and fire rings.", coords: [-117.2966, 33.0478] },
    { id: "d-street", name: "D Street Beach & Viewpoint", categories: ["beaches", "parks"], neighborhood: "old-encinitas", address: "West end of D Street", note: "Beach access and a coastal overlook with panoramic ocean views.", coords: [-117.2974, 33.0456] },
    { id: "cardiff-reef", name: "Cardiff Reef", categories: ["beaches"], neighborhood: "cardiff", note: "Popular surf break along Cardiff State Beach near the mouth of San Elijo Lagoon.", coords: [-117.2826, 33.0146] },
    { id: "seaside-reef", name: "Seaside Reef", categories: ["beaches"], neighborhood: "cardiff", note: "Surf break at the southern end of Cardiff State Beach, near South Cardiff and Seaside.", coords: [-117.2790, 33.0032] },
    { id: "san-elijo-beach", name: "San Elijo State Beach", categories: ["beaches"], neighborhood: "cardiff", coords: [-117.2842, 33.0212] },
    { id: "beacons", name: "Beacon's Beach", categories: ["beaches"], neighborhood: "leucadia", address: "948 Neptune Avenue", coords: [-117.3047, 33.0653] },
    { id: "stone-steps", name: "Stone Steps", categories: ["beaches"], neighborhood: "leucadia", address: "350 South El Portal Street", coords: [-117.3005, 33.0549] },
    { id: "grandview", name: "Grandview Beach", categories: ["beaches"], neighborhood: "leucadia", address: "1700 Neptune Avenue", note: "At the northern end of Leucadia.", coords: [-117.3094, 33.0759] },

    /* ---- Dining ---- */
    { id: "herb-sea", name: "Herb & Sea", categories: ["dining"], neighborhood: "old-encinitas", address: "131 West D Street", coords: [-117.2945, 33.0458] },
    { id: "sago", name: "SAGO", categories: ["dining"], neighborhood: "old-encinitas", address: "485 South Coast Highway 101", coords: [-117.2937, 33.0462] },
    { id: "temaki", name: "Temaki Bar Sushi", categories: ["dining"], neighborhood: "old-encinitas", address: "575 South Coast Highway 101", coords: [-117.2934, 33.0450] },
    { id: "waverly", name: "The Waverly", categories: ["dining"], neighborhood: "cardiff", address: "2005 San Elijo Avenue", coords: [-117.2832, 33.0224] },
    { id: "pcg", name: "Pacific Coast Grill", categories: ["dining"], neighborhood: "cardiff", address: "2526 South Coast Highway 101", coords: [-117.2804, 33.0136] },
    { id: "solterra", name: "Solterra Winery & Kitchen", categories: ["dining", "drinks"], neighborhood: "leucadia", address: "934 North Coast Highway 101", coords: [-117.3028, 33.0651] },

    /* ---- Drinks & Nightlife ---- */
    { id: "roxy", name: "The Roxy Encinitas", categories: ["drinks", "dining"], neighborhood: "old-encinitas", address: "517 South Coast Highway 101", note: "Live music, cocktails, and dining in Downtown Encinitas.", coords: [-117.2936, 33.0457] },
    { id: "shelter", name: "SHELTER Encinitas", categories: ["drinks"], neighborhood: "old-encinitas", address: "540 South Coast Highway 101", note: "Indoor-outdoor cocktail bar on the 101.", coords: [-117.2940, 33.0454] },
    { id: "culture", name: "Culture Brewing Co.", categories: ["drinks"], neighborhood: "old-encinitas", address: "629 South Coast Highway 101", note: "Coast Highway tasting room in the heart of Encinitas.", coords: [-117.2931, 33.0443] },

    /* ---- Arts & Culture ---- */
    { id: "la-paloma", name: "La Paloma Theatre", categories: ["arts"], neighborhood: "old-encinitas", address: "471 South Coast Highway 101", note: "Historic 1928 theater and one of Downtown Encinitas' most recognizable cultural landmarks.", coords: [-117.2937, 33.0463] },
    { id: "pacific-view", name: "Pacific View Arts Center", categories: ["arts"], neighborhood: "old-encinitas", address: "380 West F Street", note: "Historic bluff-top campus repurposed for arts and cultural programming.", coords: [-117.2956, 33.0431] },
    { id: "ica-north", name: "ICA North", categories: ["arts"], neighborhood: "new-encinitas", address: "1550 South El Camino Real", note: "The North County campus of the Institute of Contemporary Art San Diego.", coords: [-117.2576, 33.0279] },
    { id: "house-of-art", name: "Encinitas House of Art", categories: ["arts"], neighborhood: "old-encinitas", note: "Local gallery and creative space highlighting art and community programming." },
    { id: "olivenhain-hall", name: "Olivenhain Town Hall", categories: ["arts"], neighborhood: "olivenhain", address: "423 Rancho Santa Fe Road", note: "The historic Olivenhain Town Hall area.", coords: [-117.2346, 33.0440] },

    /* ---- Wellness & Nature ---- */
    { id: "botanic", name: "San Diego Botanic Garden", categories: ["wellness"], neighborhood: "new-encinitas", address: "300 Quail Gardens Drive", note: "37-acre botanical garden with approximately four miles of trails and gardens.", coords: [-117.2794, 33.0556] },
    { id: "san-elijo-lagoon", name: "San Elijo Lagoon Ecological Reserve", categories: ["wellness"], neighborhood: "cardiff", address: "2710 Manchester Avenue", note: "Coastal wetland reserve and nature center with trails, birding, and environmental programming.", coords: [-117.2742, 33.0133] },
    { id: "soul-of-yoga", name: "Soul of Yoga", categories: ["wellness"], neighborhood: "old-encinitas", address: "627 Encinitas Boulevard", note: "Yoga classes, workshops, meditation, and teacher training.", coords: [-117.2803, 33.0468] },
    { id: "four-moons", name: "Four Moons Spa", categories: ["wellness"], neighborhood: "leucadia", address: "775 North Vulcan Avenue", note: "Spa, wellness, movement classes, breathwork, and sound experiences.", coords: [-117.3011, 33.0628] },
    { id: "srf", name: "Self-Realization Fellowship Meditation Gardens", categories: ["wellness"], neighborhood: "old-encinitas", address: "215 West K Street", note: "Cliff-top meditation gardens overlooking the Pacific.", coords: [-117.2936, 33.0364] },
    { id: "rail-trail", name: "Coastal Rail Trail", categories: ["wellness", "parks"], neighborhood: "cardiff", note: "Dedicated walking and biking corridor connecting Downtown Encinitas and Cardiff, including the stretch from Santa Fe Drive toward Chesterfield Drive.", coords: [-117.2875, 33.0284] },

    /* ---- Parks & Outdoors ---- */
    { id: "community-park", name: "Encinitas Community Park", categories: ["parks"], neighborhood: "cardiff", address: "425 Santa Fe Drive", note: "Athletic fields, playground, skate park, dog park, and open lawn.", coords: [-117.2804, 33.0321] },
    { id: "glen-park", name: "Glen Park", categories: ["parks"], neighborhood: "cardiff", address: "2149 Orinda Drive", note: "Neighborhood park with tennis, basketball, volleyball, playgrounds, and picnic areas.", coords: [-117.2806, 33.0191] },
    { id: "little-oaks", name: "Little Oaks Equestrian Park", categories: ["parks"], neighborhood: "olivenhain", address: "2879 Lone Jack Road", note: "Equestrian staging area and access point for the surrounding riding and walking trails.", coords: [-117.2254, 33.0555] },
    { id: "ranch-golf", name: "Encinitas Ranch Golf Course", categories: ["parks"], neighborhood: "new-encinitas", address: "1275 Quail Gardens Drive", note: "Public championship golf course overlooking the coast.", coords: [-117.2760, 33.0676] },

    /* ---- Shopping & Markets ---- */
    { id: "thread-spun", name: "Thread Spun", categories: ["shopping"], neighborhood: "leucadia", address: "1114 North Coast Highway 101", coords: [-117.3039, 33.0685] },
    { id: "moonlight-market", name: "Moonlight Marketplace", categories: ["shopping"], neighborhood: "old-encinitas", address: "459 South Coast Highway 101", note: "Weekend marketplace featuring independent vendors and makers.", schedule: "Weekends", coords: [-117.2938, 33.0466] },
    { id: "leucadia-market", name: "Leucadia Farmers Market", categories: ["shopping"], neighborhood: "leucadia", address: "Oak Crest Middle School, 675 Balour Drive", schedule: "Sundays · 10 a.m. to 2 p.m.", coords: [-117.2683, 33.0430] },
    { id: "seaside-market", name: "Seaside Market", categories: ["shopping"], neighborhood: "cardiff", coords: [-117.2821, 33.0220] },
    { id: "ranch-town-center", name: "Encinitas Ranch Town Center", categories: ["shopping"], neighborhood: "new-encinitas", address: "El Camino Real near Leucadia Boulevard", note: "Major retail center.", coords: [-117.2651, 33.0651] },
    { id: "village-square", name: "Encinitas Village Square", categories: ["shopping"], neighborhood: "new-encinitas", address: "Encinitas Boulevard & El Camino Real", note: "Shopping and dining center.", coords: [-117.2567, 33.0464] },
  ],
};
