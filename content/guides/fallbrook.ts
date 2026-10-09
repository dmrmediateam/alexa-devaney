import type { AreaGuide } from "./types";

/* --------------------------------------------------------------------------
   Fallbrook guide. Copy supplied by Alexa (Oct 2026), lightly trimmed.

   Pins are geocoded from her addresses (OpenStreetMap / Nominatim); the
   Monserate Mountain pin is the published trailhead. Places that appear in
   two of her sections (Heritage Center, Reche Schoolhouse, the farmers
   market, First Fridays, Monserate Winery) are one card with both
   categories. Downtown festivals have cards but no pin.

   Left out, pending Alexa:
   - Myrtle Creek Botanical Gardens & Nursery closed to the public in
     January 2020 (Village News); it stays out so nobody drives to a closed
     garden.

   Verify before launch:
   - The Golf Club of California (3742 Flowerwood Lane) and the Olive Hill
     farmstand don't resolve to a map point, so they have cards and
     directions but no pin. Sources also disagree on whether the Golf Club
     of California is public or members-only.
   - Lake Rancho Viejo and Rolling Hills Estates have no pinned places and
     no confirmed map frame, so selecting them shows the whole town.
   -------------------------------------------------------------------------- */

export const fallbrookGuide: AreaGuide = {
  tagline: "Tranquil Country Estates & Rolling Hills",
  lede: "Fallbrook offers a quieter North County lifestyle built around land, privacy, agriculture, equestrian living, and scenic hillsides. It feels removed from the coast while remaining within reach of San Diego and Orange County.",
  stats: [
    { value: "5", label: "Distinct neighborhoods" },
    { value: "5", label: "Local wineries" },
    { value: "6", label: "Preserves & trails" },
    { value: "30+", label: "Acres of estate gardens" },
  ],
  categories: [
    { id: "parks", label: "Outdoor Recreation" },
    { id: "wellness", label: "Gardens & Estates" },
    { id: "golf", label: "Golf" },
    { id: "dining", label: "Dining" },
    { id: "wine", label: "Wineries & Agriculture" },
    { id: "arts", label: "Arts & Culture" },
    { id: "events", label: "Events & Community" },
  ],
  neighborhoods: [
    {
      id: "downtown",
      name: "Historic Downtown Fallbrook",
      character: "Historic · Walkable · Artful",
      centeredOn: "Main Avenue, Alvarado Street, Mission Road & Elder Street",
      description:
        "Centered on Main Avenue, East and West Alvarado Street, Mission Road, and Elder Street. Local anchors include the Fallbrook Art Center, the Historical Society's Railroad Heritage Park, the weekly farmers market, 127 West Social House, and local galleries, cafes, and boutiques.",
      anchors: ["Fallbrook Art Center", "Fallbrook Railroad Heritage Park", "Fallbrook Main Avenue Certified Farmers & Artisan Market", "127 West Social House", "Galleries, cafes & boutiques"],
    },
    {
      id: "gird-valley",
      name: "Gird Valley",
      character: "Scenic · Vineyard · Rolling hills",
      centeredOn: "Gird Road",
      description:
        "A scenic residential and vineyard area centered on Gird Road, with Monserate Winery, Live Oak County Park, surrounding vineyards, and custom homes set among rolling hills.",
      anchors: ["Monserate Winery", "Live Oak County Park", "Vineyards", "Custom homes"],
    },
    {
      id: "lake-rancho-viejo",
      name: "Lake Rancho Viejo",
      character: "Planned · Community · Convenient",
      centeredOn: "Old Highway 395",
      description:
        "A planned residential community near Old Highway 395 with single-family homes, townhomes, neighborhood green space, community amenities, and convenient access toward Interstate 15.",
      anchors: ["Single-family homes", "Townhomes", "Green space", "Access to I-15"],
    },
    {
      id: "winterwarm",
      name: "Winterwarm",
      character: "Rural · Agricultural · Equestrian",
      centeredOn: "East and southeast of Downtown",
      description:
        "A rural residential area east and southeast of Downtown Fallbrook with larger parcels, avocado and agricultural properties, equestrian estates, and custom homes.",
      anchors: ["Larger parcels", "Avocado properties", "Equestrian estates", "Fallbrook Winery"],
    },
    {
      id: "rolling-hills-estates",
      name: "Rolling Hills Estates",
      character: "Private · Estate · Country",
      centeredOn: "Fallbrook's country hills",
      description:
        "A private, estate-oriented residential area with larger lots, custom homes, gated properties, and a quiet country setting.",
      anchors: ["Larger lots", "Custom homes", "Gated properties"],
    },
  ],
  places: [
    /* ---- Outdoor Recreation ---- */
    { id: "santa-margarita", name: "Santa Margarita County Preserve", categories: ["parks"], address: "37385 De Luz Road", note: "Multi-use trails along the Santa Margarita River for hiking, mountain biking, and horseback riding, with dedicated equestrian staging.", coords: [-117.2512, 33.4033] },
    { id: "santa-margarita-trail", name: "Santa Margarita River Trail", categories: ["parks"], note: "Riverfront hiking and equestrian route reached through the Santa Margarita County Preserve.", coords: [-117.2494, 33.4083] },
    { id: "live-oak-park", name: "Live Oak County Park", categories: ["parks"], neighborhood: "gird-valley", address: "2746 Reche Road", note: "27-acre oak woodland with walking areas, playgrounds, athletic fields, picnic spaces, and an amphitheater.", coords: [-117.2075, 33.3670] },
    { id: "los-jilgueros", name: "Los Jilgueros Preserve", categories: ["parks"], note: "Fallbrook Land Conservancy preserve with walking trails, ponds, native habitat, and birdwatching.", coords: [-117.2459, 33.3566] },
    { id: "monserate-mountain", name: "Monserate Mountain Preserve Trail", categories: ["parks"], note: "Popular local hike climbing the hills southeast of Fallbrook.", coords: [-117.1590, 33.3660] },
    { id: "dinwiddie", name: "Dinwiddie Preserve", categories: ["parks"], note: "Fallbrook Land Conservancy open space used for guided nature walks and conservation programming.", coords: [-117.2316, 33.3558] },

    /* ---- Gardens & Estates ---- */
    { id: "grand-tradition", name: "Grand Tradition Estate & Gardens", categories: ["wellness"], address: "220 Grand Tradition Way", note: "More than 30 acres of landscaped gardens, waterfalls, lakes, and event grounds.", coords: [-117.2475, 33.3638] },
    { id: "heritage-center", name: "Fallbrook Historical Society Heritage Center", categories: ["wellness", "arts"], address: "1730 Hill Avenue", note: "The Main Museum, Pittenger House, Gem and Mineral Museum, historic exhibits, and local archives.", coords: [-117.2536, 33.3613] },
    { id: "reche-schoolhouse", name: "Reche Schoolhouse", categories: ["wellness", "arts"], address: "1319 South Live Oak Park Road", note: "Restored 1896 one-room schoolhouse operated by the Fallbrook Historical Society.", coords: [-117.2092, 33.3687] },

    /* ---- Golf ---- */
    { id: "pala-mesa", name: "Pala Mesa Resort Golf Course", categories: ["golf"], address: "2001 Old Highway 395", note: "18-hole, par-72 championship course within the 205-acre Pala Mesa Resort.", coords: [-117.1609, 33.3494] },
    { id: "golf-club-ca", name: "The Golf Club of California", categories: ["golf"], address: "3742 Flowerwood Lane", note: "Championship golf course in the rolling hills south of Fallbrook." },

    /* ---- Dining ---- */
    { id: "monserate-winery", name: "Monserate Winery", categories: ["wine", "dining"], neighborhood: "gird-valley", address: "2757 Gird Road", note: "116-acre Gird Valley property with vineyards, lakes, a tasting room, and a full-service indoor/outdoor restaurant overlooking the vineyards.", coords: [-117.1911, 33.3417] },
    { id: "trupianos", name: "Trupiano's Italian Bistro", categories: ["dining"], neighborhood: "downtown", address: "945 South Main Avenue", coords: [-117.2517, 33.3742] },
    { id: "127-west", name: "127 West Social House", categories: ["dining"], neighborhood: "downtown", address: "127 West Elder Street", coords: [-117.2520, 33.3805] },
    { id: "aquaterra", name: "Aquaterra Restaurant at Pala Mesa Resort", categories: ["dining"], address: "2001 Old Highway 395", coords: [-117.1612, 33.3497] },
    { id: "veranda", name: "The Veranda Restaurant", categories: ["dining"], address: "Grand Tradition Estate & Gardens, 220 Grand Tradition Way", note: "Garden-view brunch and lunch.", coords: [-117.2478, 33.3641] },
    { id: "cafe-des-artistes", name: "Cafe des Artistes", categories: ["dining"], neighborhood: "downtown", address: "103 South Main Avenue", note: "Inside the Fallbrook Art Center complex.", coords: [-117.2518, 33.3816] },

    /* ---- Wineries & Agriculture ---- */
    { id: "diacobelli", name: "Estate D'Iacobelli Winery", categories: ["wine"], address: "2175 Tecalote Drive", coords: [-117.1624, 33.3500] },
    { id: "fallbrook-winery", name: "Fallbrook Winery", categories: ["wine"], neighborhood: "winterwarm", address: "2554 Via Rancheros", coords: [-117.2045, 33.3428] },
    { id: "myrtle-creek-vineyards", name: "Myrtle Creek Vineyards", categories: ["wine"], address: "1600 Via Vista", coords: [-117.2003, 33.3632] },
    { id: "adobe-hill", name: "Adobe Hill Winery", categories: ["wine"], address: "40740 Via Ranchitos", coords: [-117.2278, 33.4195] },
    { id: "farmers-market", name: "Fallbrook Main Avenue Certified Farmers & Artisan Market", categories: ["wine", "events"], neighborhood: "downtown", address: "111 South Main Avenue", schedule: "Saturdays · 9 a.m. to 1 p.m.", coords: [-117.2516, 33.3817] },
    { id: "olive-hill-farmstand", name: "Olive Hill Farmstand", categories: ["wine"], address: "Olive Hill Road at Rancho Bonito Road", note: "Local farmstand for Fallbrook-grown produce and agricultural products." },

    /* ---- Arts & Culture ---- */
    { id: "art-center", name: "Fallbrook Art Center", categories: ["arts"], neighborhood: "downtown", address: "103 South Main Avenue", note: "Rotating exhibitions, artist programming, classes, and community art events.", coords: [-117.2515, 33.3819] },
    { id: "railroad-park", name: "Fallbrook Railroad Heritage Park", categories: ["arts"], neighborhood: "downtown", address: "West Elder Street at South Main Avenue", note: "Rail-history displays opened during major community events.", coords: [-117.2513, 33.3806] },
    { id: "first-fridays", name: "Fallbrook First Fridays", categories: ["arts", "events"], neighborhood: "downtown", address: "Downtown Fallbrook", note: "Evening arts programming with local galleries, businesses, artists, and the Fallbrook Art Center.", schedule: "First Friday · Monthly" },

    /* ---- Events & Community ---- */
    { id: "avocado-festival", name: "Fallbrook Avocado Festival", categories: ["events"], neighborhood: "downtown", address: "Main Avenue, Downtown Fallbrook", note: "Food, vendors, entertainment, and avocado-focused programming.", schedule: "Annual · Spring" },
    { id: "harvest-faire", name: "Fallbrook Harvest Faire", categories: ["events"], neighborhood: "downtown", address: "Main Avenue, Downtown Fallbrook", note: "Fall street festival.", schedule: "Annual · Fall" },
    { id: "artisan-faire", name: "Fallbrook Village Artisan Faire", categories: ["events"], neighborhood: "downtown", address: "Downtown Fallbrook", note: "Downtown market featuring local artisans and makers.", schedule: "Seasonal" },
    { id: "christmas-parade", name: "Fallbrook Christmas Parade", categories: ["events"], neighborhood: "downtown", address: "Main Avenue, Downtown Fallbrook", schedule: "Annual · December" },
    { id: "wine-and-a-bite", name: "Holiday Wine & A Bite Art Walk", categories: ["events"], neighborhood: "downtown", address: "Downtown Fallbrook", note: "Wine, food, shopping, and the arts downtown.", schedule: "Seasonal" },
  ],
};
