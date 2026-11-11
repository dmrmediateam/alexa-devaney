/**
 * US / Canada (NANP) phone check, shared by the browser and the server.
 *
 * The listing gate is for people shopping homes in this market, and the spam
 * that gets past the honeypot is overwhelmingly overseas numbers typed by hand
 * (+90, +92, +234). Accepts any common formatting: (760) 555-1234,
 * 760.555.1234, +1 760 555 1234, 17605551234.
 */
export function isUsPhone(value: string): boolean {
  const trimmed = value.trim();
  let digits = trimmed.replace(/\D/g, "");
  // An explicit country code that is not +1 is a foreign number
  if (trimmed.startsWith("+") && !digits.startsWith("1")) return false;
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return false;
  // Area code and exchange both start 2-9 in the NANP; 1xx or 0xx is made up
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits);
}

/**
 * Milliseconds since this page was first loaded, sent with every lead.
 *
 * The server rejects submissions that arrive faster than a person can type,
 * and ones without it at all: those were posted straight at the API by a
 * script that never loaded the page.
 */
export function formElapsedMs(): number {
  return Math.round(performance.now());
}
