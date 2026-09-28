/* ==========================================================================
   Breadcrumb trail for listing and property detail pages.

   Sits between the header and the gallery so a visitor who landed here from
   search knows where "here" is before the photography takes over. The last
   crumb is the page itself, so it is plain text rather than a link.
   ========================================================================== */

export type Crumb = { label: string; href?: string };

export default function ListingBreadcrumbs({ trail }: { trail: Crumb[] }) {
  if (trail.length === 0) return null;

  return (
    <nav className="ld-crumbs lp-container" aria-label="Breadcrumb">
      <ol>
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${crumb.label}-${i}`}>
              {crumb.href && !last ? (
                <a href={crumb.href}>{crumb.label}</a>
              ) : (
                <span aria-current={last ? "page" : undefined}>{crumb.label}</span>
              )}
              {!last && <span className="ld-crumbs__sep" aria-hidden="true">&rsaquo;</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
