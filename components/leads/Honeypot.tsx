/**
 * Hidden decoy fields bots auto-fill. Visually hidden wrapper (NOT
 * type="hidden"; bots skip those) with tabIndex={-1} and aria-hidden so
 * keyboard and screen-reader users never reach them. `idSuffix` keeps DOM ids
 * unique when multiple forms render on one page.
 */
export default function Honeypot({ idSuffix }: { idSuffix: string }) {
  return (
    <div aria-hidden="true" className="lp-honeypot">
      <label htmlFor={`company-${idSuffix}`}>Company</label>
      <input id={`company-${idSuffix}`} name="company" type="text" tabIndex={-1} autoComplete="off" />
      <label htmlFor={`website-${idSuffix}`}>Website</label>
      <input id={`website-${idSuffix}`} name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
