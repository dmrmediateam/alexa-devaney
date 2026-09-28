/**
 * The anonymous visitor id that listing activity is recorded against.
 *
 * Same dual-storage trick as `lib/leads/captured.ts`: a cookie (survives
 * Safari's 7-day script-storage eviction) plus a localStorage mirror
 * (survives a cookie the visitor clears). Either one counts, and when both
 * are missing we mint a new id rather than failing - a fresh id costs us a
 * split identity, a thrown error costs us the listing view.
 *
 * This id is NOT personal data on its own. It becomes personal data the
 * moment a lead form ties it to an email, which is the whole point: see
 * `identify()` in lib/tracking/store.ts. Anything storing it must be covered
 * by the site's privacy policy.
 */

export const VISITOR_COOKIE = "dmr_vid";
export const VISITOR_STORAGE = "dmr_vid";
export const HEARTS_STORAGE = "dmr_hearts";

/** Two years: long enough to span a real estate search, short enough to age out. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 730;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

function newId(): string {
  // randomUUID needs a secure context; the fallback keeps http://localhost and
  // older Safari working rather than throwing inside a tracking call.
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The visitor's id, minted and persisted on first call.
 *
 * Safe to call during render on the client; returns "" on the server so a
 * component can render the same markup in both passes and avoid a hydration
 * mismatch.
 */
export function getVisitorId(): string {
  if (typeof document === "undefined") return "";

  const fromCookie = readCookie(VISITOR_COOKIE);
  if (fromCookie) {
    mirror(fromCookie);
    return fromCookie;
  }

  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(VISITOR_STORAGE);
  } catch {
    /* storage blocked; the cookie below is the only copy */
  }

  const id = stored || newId();
  persist(id);
  return id;
}

function persist(id: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(id)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  mirror(id);
}

function mirror(id: string): void {
  try {
    window.localStorage.setItem(VISITOR_STORAGE, id);
  } catch {
    /* cookie already carries this */
  }
}

/* --------------------------------------------------------------------------
   Hearts

   Kept in localStorage as well as on the server. The local copy is what the
   heart buttons read on first paint: waiting on a round trip to decide whether
   a heart is filled makes every card flicker on load.
   -------------------------------------------------------------------------- */

export function readHearts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HEARTS_STORAGE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeHearts(ids: string[]): void {
  try {
    window.localStorage.setItem(HEARTS_STORAGE, JSON.stringify(ids.slice(0, 200)));
  } catch {
    /* server copy is the system of record; nothing to do */
  }
  // Cards and the detail page both render hearts, so they need to agree the
  // moment one of them changes.
  window.dispatchEvent(new CustomEvent("dmr:hearts", { detail: ids }));
}
