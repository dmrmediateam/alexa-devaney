/**
 * Minimal SendGrid REST sender for the budget-request email. No mailer SDK on
 * purpose: if the client site already has a sender (the reference build's
 * lib/leads/notify.ts exports one with this exact signature), import that
 * instead and delete this file, so there is one set of credentials to keep
 * working.
 */
export async function sendGrid(body: Record<string, unknown>): Promise<boolean> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    // SendGrid returns 202 with an empty body on success
    if (res.status !== 202) {
      console.error("[DMR] sendgrid rejected", { status: res.status, detail: (await res.text()).slice(0, 300) });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[DMR] sendgrid failed", { error: String(error) });
    return false;
  }
}
