"use client";

import { useId, useState } from "react";
import type { CommunityLink } from "./communities";

/** "Communities" in the side menu: expands in place to the towns only (the
 *  neighborhoods live in the desktop dropdown and on each guide). Same height
 *  animation as the area guide's enquiry drawer. */
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
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
