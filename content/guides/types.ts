/* ==========================================================================
   Interactive neighborhood guide for an area page (/areas/<slug>).

   The copy is Alexa's own, supplied per town. Keep it that way: a place
   only appears here because she put it in her guide, and a note only says
   what she said about it. Coordinates were geocoded from the addresses she
   gave (OpenStreetMap / Nominatim), never guessed from a name.
   ========================================================================== */

export interface GuideCategory {
  id: string;
  label: string;
}

export interface GuideNeighborhood {
  id: string;
  name: string;
  /** Three or four words of character, shown as the panel kicker */
  character: string;
  /** The streets the neighborhood centres on */
  centeredOn: string;
  description: string;
  /** Landmarks named in her copy, in her order */
  anchors: string[];
}

export interface GuidePlace {
  id: string;
  name: string;
  /** First entry decides the pin and card label; extra entries also match filters */
  categories: string[];
  neighborhood: string;
  address?: string;
  /** Her description, if she gave one */
  note?: string;
  /** Recurring day and time, e.g. "Sundays · 10 a.m. to 2 p.m." */
  schedule?: string;
  /** Omitted when no address could be confirmed: the card shows, the pin does not */
  coords?: [lng: number, lat: number];
}

export interface GuideStat {
  value: string;
  label: string;
}

export interface AreaGuide {
  /** Her headline for the town, e.g. "Coastal Soul Meets Effortless Luxury" */
  tagline: string;
  lede: string;
  stats: GuideStat[];
  categories: GuideCategory[];
  neighborhoods: GuideNeighborhood[];
  places: GuidePlace[];
}
