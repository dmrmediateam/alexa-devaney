"use client";

import { useId, useState } from "react";
import { goToNeighborhood, type CommunityLink } from "./communities";

/** "Communities" in the side menu: expands in place to the towns, plus the
 *  neighborhoods of any town with a guide. Same height animation as the
 *  area guide's enquiry drawer. */
export default function SideMenuCommunities({
  label,
  communities,
  style,
}: {
  label: string;
  communities: CommunityLink[];
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const closeMenu = () => document.getElementById("sidemenu-close")?.click();

  return (
    <li style={style} className={`sidemenu__group${open ? " is-open" : ""}`}>
      <button type="button" className="sidemenu__toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        {label}
        <span className="sidemenu__plus" aria-hidden="true" />
      </button>
      <div id={id} className="sidemenu__drawer" inert={!open}>
        <div className="sidemenu__drawer-clip">
          <ul className="sidemenu__sub">
            {communities.map((c) => (
              <li key={c.href}>
                <a href={c.href}>{c.title}</a>
                {c.neighborhoods.length > 0 && (
                  <div className="sidemenu__hoods">
                    {c.neighborhoods.map((n) => (
                      <a
                        key={n.id}
                        href={n.href}
                        onClick={(e) => {
                          if (goToNeighborhood(e, c.href, n.id)) closeMenu();
                        }}
                      >
                        {n.name}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
