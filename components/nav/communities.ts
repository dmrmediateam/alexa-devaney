import type { MouseEvent } from "react";
import type { GalleryCard } from "@/content/site";

/* ==========================================================================
   The Communities menus (desktop dropdown, side menu, footer) all read the
   site's `areas`, so a new town or a new neighborhood guide shows up in
   every menu without touching them. Only plain data crosses into the client
   components.
   ========================================================================== */

export interface CommunityLink {
  title: string;
  href: string;
  image: string;
  description?: string;
  neighborhoods: { id: string; name: string; href: string }[];
}

/** Event an area guide listens for, so a neighborhood link on its own page
 *  re-targets the map instead of reloading the page. */
export const GUIDE_NEIGHBORHOOD_EVENT = "guide:neighborhood";

export function communityLinks(areas: GalleryCard[]): CommunityLink[] {
  return areas
    .filter((area) => area.slug)
    .map((area) => ({
      title: area.title,
      href: area.href,
      image: area.image,
      description: area.description,
      neighborhoods: (area.guide?.neighborhoods ?? []).map((n) => ({
        id: n.id,
        name: n.name,
        href: `${area.href}?neighborhood=${n.id}#explore`,
      })),
    }));
}

/**
 * Click handler for neighborhood links. On the guide's own page it hands the
 * neighborhood to the guide and glides to the map; anywhere else the link
 * navigates normally and the guide reads `?neighborhood=` on load.
 */
export function goToNeighborhood(event: MouseEvent<HTMLAnchorElement>, areaHref: string, id: string) {
  if (window.location.pathname !== areaHref) return false;
  const explore = document.getElementById("explore");
  if (!explore) return false;
  event.preventDefault();
  window.dispatchEvent(new CustomEvent(GUIDE_NEIGHBORHOOD_EVENT, { detail: id }));
  window.history.replaceState(null, "", `${areaHref}?neighborhood=${id}#explore`);
  explore.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
