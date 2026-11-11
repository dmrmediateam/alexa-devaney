import "server-only";
import { promises as dns } from "node:dns";

/**
 * Does this email's domain accept mail at all?
 *
 * Catches made-up and mistyped domains (jon@gmial.con, a@asdf.xyz) that pass a
 * format check but can never be reached. Fails OPEN: only a definite "this
 * domain does not exist / has no mail server" answer rejects. A slow or broken
 * DNS lookup lets the lead through, because losing a real lead to our own
 * outage is worse than letting one junk lead in.
 */
const LOOKUP_TIMEOUT_MS = 2500;
const DEFINITE_MISS = new Set(["ENOTFOUND", "ENODATA", "ENONAME", "NXDOMAIN"]);

async function resolves(lookup: () => Promise<unknown[]>): Promise<boolean | null> {
  try {
    const records = await Promise.race([
      lookup(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), LOOKUP_TIMEOUT_MS),
      ),
    ]);
    return records.length > 0;
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    return DEFINITE_MISS.has(code) ? false : null;
  }
}

export async function emailDomainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.toLowerCase().split("@").pop()?.trim();
  if (!domain) return true; // format problems are the spam filter's job

  const mx = await resolves(() => dns.resolveMx(domain));
  if (mx !== false) return true; // has MX, or lookup inconclusive: let it through

  // No MX record: mail falls back to the domain's own address (RFC 5321)
  const a = await resolves(() => dns.resolve4(domain));
  return a !== false;
}
