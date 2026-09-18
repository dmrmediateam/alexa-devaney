/**
 * Server-side spam heuristics. Call `isSpam(body)` at the TOP of every form
 * handler, before validation. Non-empty result = likely spam; respond with a
 * success-shaped payload and silently drop it so bots get no signal.
 *
 * Vocabulary tuned for a real estate lead site: street addresses with digit
 * runs must pass; links in name/message are blocked.
 */

import "server-only";

const MAX_FIELD_LENGTHS = { name: 120, email: 120, phone: 32, message: 5_000 };

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com", "guerrillamail.com", "mailinator.com",
  "tempmail.com", "temp-mail.org", "yopmail.com",
]);

const BLOCKED_TEXT_PATTERNS = [
  /\b(?:seo|backlinks?|guest post|crypto|forex|casino|viagra|porn|escort)\b/i,
  /\b(?:whatsapp|telegram)\b/i,
  /https?:\/\/|www\./i, // links in name/message = bot
  /\[[^\]]*url=|<a\s/i, // BBCode / HTML anchor injection
];

const asString = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const getEmailDomain = (email: string) => email.toLowerCase().split("@").pop() || "";
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const normalizeDigits = (v: string) => v.replace(/\D/g, "");
const hasExcessiveRepeatedChars = (v: string) => /(.)\1{5,}/i.test(v);
const hasKeyboardMash = (v: string) => /(?:qwerty|asdf|zxcv|jkl;|lkj|mnbv|poiuy)/i.test(v);

/** Random-token detector ("xKfNbWqjTpLmZr"): long, no whitespace, mixed case,
 * few vowels, many case transitions. 16-char floor keeps real names safe. */
function looksLikeRandomToken(value: string) {
  const t = value.trim();
  if (t.length < 16 || /\s/.test(t)) return false;
  const letters = t.replace(/[^a-z]/gi, "");
  if (letters.length < 16) return false;
  const hasLower = /[a-z]/.test(t);
  const hasUpper = /[A-Z]/.test(t);
  const vowelRatio = (letters.match(/[aeiou]/gi)?.length ?? 0) / letters.length;
  const transitions = letters.split("").reduce(
    (n, c, i, arr) =>
      i && c === c.toUpperCase() && arr[i - 1] === arr[i - 1].toLowerCase() ? n + 1 : n,
    0,
  );
  return hasLower && hasUpper && vowelRatio < 0.32 && transitions >= 3;
}

function looksLikeSpamText(v: string) {
  if (!v) return false;
  return (
    BLOCKED_TEXT_PATTERNS.some((p) => p.test(v)) ||
    hasExcessiveRepeatedChars(v) ||
    hasKeyboardMash(v) ||
    looksLikeRandomToken(v)
  );
}

/** Returns reasons a submission looks like spam; empty array = clean. */
export function isSpam(body: Record<string, unknown>): string[] {
  const reasons: string[] = [];

  const name =
    asString(body.name) ||
    [asString(body.firstName), asString(body.lastName)].filter(Boolean).join(" ");
  const email = asString(body.email);
  const phone = asString(body.phone);
  const message = asString(body.message) || asString(body.notes);

  // Free-text scan = name + message ONLY. Phone/email have their own format
  // checks; address fields are exempt (digit runs are legitimate there).
  const userText = [name, message].filter(Boolean).join(" ");

  // Honeypot decoys: a filled decoy field is the strongest signal.
  if (asString(body.company) || asString(body.website) || asString(body.url))
    reasons.push("honeypot");

  if (name.length > MAX_FIELD_LENGTHS.name) reasons.push("name-too-long");
  if (email.length > MAX_FIELD_LENGTHS.email) reasons.push("email-too-long");
  if (phone.length > MAX_FIELD_LENGTHS.phone) reasons.push("phone-too-long");
  if (message.length > MAX_FIELD_LENGTHS.message) reasons.push("message-too-long");

  if (email && (!isValidEmail(email) || DISPOSABLE_EMAIL_DOMAINS.has(getEmailDomain(email))))
    reasons.push("bad-email");

  const digits = normalizeDigits(phone);
  if (phone && (digits.length < 7 || digits.length > 15 || /^(\d)\1+$/.test(digits)))
    reasons.push("bad-phone");

  if (looksLikeSpamText(userText)) reasons.push("spam-text");
  if (looksLikeRandomToken(name)) reasons.push("random-token-name");
  if (looksLikeRandomToken(message)) reasons.push("random-token-message");

  return reasons;
}
