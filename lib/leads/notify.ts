import { site } from "@/content/site";
import { qualify } from "@/lib/leads/qualify";

/* ==========================================================================
   Lead notification: SendGrid (email) + Twilio (SMS).

   Speed-to-lead is the whole game in residential real estate: contact rates
   fall off a cliff after the first few minutes, and an agent showing property
   is not reading email. So a lead fires an SMS to Carole and an email in
   parallel, and the visitor gets an instant acknowledgement so they know a
   human is coming.

   Every channel is independently optional and driven by env vars, so a client
   with only one of them configured still gets that one. No SDKs: both are
   plain REST calls, which keeps the dependency list at zero.
   ========================================================================== */

const TIMEOUT_MS = 8000;

/* Overridable so the delivery path can be pointed at a sandbox or a mock and
   exercised for real without sending mail or SMS. Defaults are production. */
const SENDGRID_BASE = process.env.SENDGRID_API_BASE || "https://api.sendgrid.com";
const TWILIO_BASE = process.env.TWILIO_API_BASE || "https://api.twilio.com";

export type LeadPayload = Record<string, unknown>;

const FORM_LABELS: Record<string, string> = {
  "home-value": "Seller / home value",
  buyer: "Buyer enquiry",
  "listing-inquiry": "Listing enquiry",
  contact: "Contact form",
  newsletter: "Newsletter signup",
};

/** Only these shout at Carole's phone. A newsletter signup at 2am must not. */
const SMS_WORTHY = new Set(["home-value", "buyer", "listing-inquiry", "contact"]);

function str(payload: LeadPayload, ...keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function leadName(payload: LeadPayload): string {
  const first = str(payload, "name", "firstName");
  const last = str(payload, "lastName");
  const full = [first, last].filter(Boolean).join(" ");
  // A newsletter signup has no name, so the email is the only useful identifier
  // in a subject line; "New lead" tells the reader nothing.
  return full || str(payload, "email") || str(payload, "phone") || "New lead";
}

/** Fields worth putting in front of an agent, in the order they matter. */
function summaryRows(payload: LeadPayload): Array<[string, string]> {
  const skip = new Set([
    "formType", "name", "firstName", "lastName", "company", "website",
    "source", "submittedAt",
  ]);
  const rows: Array<[string, string]> = [];
  const push = (label: string, value: string) => value && rows.push([label, value]);

  push("Phone", str(payload, "phone"));
  push("Email", str(payload, "email"));
  push("Property", [str(payload, "address"), str(payload, "address2")].filter(Boolean).join(", "));
  push("City", [str(payload, "city"), str(payload, "zip")].filter(Boolean).join(" "));
  // Qualifying answers sit directly under the contact details: they decide how
  // fast this lead gets called back.
  push("Price point", str(payload, "pricePoint"));
  push("Financing", str(payload, "financing"));
  push("Thinks it's worth", str(payload, "estimatedValue"));
  push("Working with an agent", str(payload, "agentStatus"));
  push("Timeline", str(payload, "timeline"));
  push("Landing page", str(payload, "landingPage", "page"));
  push("Campaign", str(payload, "utmCampaign"));
  push("Google click id", str(payload, "gclid"));

  const seen = new Set(rows.map(([l]) => l.toLowerCase()));
  for (const [key, value] of Object.entries(payload)) {
    if (skip.has(key) || typeof value !== "string" || !value.trim()) continue;
    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
    if (seen.has(label.toLowerCase())) continue;
    if (rows.some(([, v]) => v === value.trim())) continue;
    push(label, value.trim());
  }
  return rows;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/* --------------------------------------------------------------------------
   SendGrid
   -------------------------------------------------------------------------- */

async function sendGrid(body: Record<string, unknown>): Promise<boolean> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(`${SENDGRID_BASE}/v3/mail/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // SendGrid returns 202 with an empty body on success
    if (res.status !== 202) {
      console.error("[Lead] sendgrid rejected", { status: res.status, detail: (await res.text()).slice(0, 300) });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Lead] sendgrid failed", { error: String(error) });
    return false;
  }
}

/**
 * Recipients of the lead notification.
 *
 * LEAD_NOTIFY_EMAIL takes a comma-separated list, so the agent and whoever
 * runs their ads can both be on it. Everyone lands in one `to`, deliberately:
 * a single thread means a reply is visible to both rather than two people
 * chasing the same lead separately.
 */
function notifyRecipients(): string[] {
  const raw = process.env.LEAD_NOTIFY_EMAIL || site.contact?.email || "";
  return raw
    .split(",")
    .map((address) => address.trim())
    .filter((address) => address.includes("@"))
    .filter((address, i, all) => all.indexOf(address) === i);
}

/** The lead notification Carole actually reads. Reply-To is the lead. */
export async function emailAgent(payload: LeadPayload): Promise<boolean> {
  const from = process.env.SENDGRID_FROM_EMAIL;
  const recipients = notifyRecipients();
  if (!from || recipients.length === 0) return false;

  const formType = str(payload, "formType") || "unknown";
  const label = FORM_LABELS[formType] ?? formType;
  const name = leadName(payload);
  const rows = summaryRows(payload);
  const phone = str(payload, "phone");
  const email = str(payload, "email");

  const { qualified, label: verdict, tag } = qualify(payload);

  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 18px 7px 0;color:#8C8377;font-size:12px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td>` +
        `<td style="padding:7px 0;color:#1A1A1A;font-size:15px">${escapeHtml(v)}</td></tr>`,
    )
    .join("");

  /* Dark masthead carrying the verdict, so the answer is visible in the
     preview pane before anything is opened or scrolled. */
  const pill =
    tag === "NEW"
      ? { bg: "#ECEBE8", fg: "#4A4640", text: verdict }
      : qualified
        ? { bg: "#E7F3EA", fg: "#1D6B36", text: `Qualified — ${verdict}` }
        : { bg: "#F3EFEA", fg: "#8A6B34", text: `Not qualified — ${verdict}` };

  const html = `<div style="font-family:Helvetica,Arial,sans-serif;max-width:620px;margin:0 auto;background:#FAF9F7">
  <div style="background:#141414;padding:34px 34px 30px">
    <h1 style="margin:0;font-family:Georgia,serif;font-weight:400;font-size:30px;line-height:1.2;color:#ffffff">${escapeHtml(label)}</h1>
    <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,.66)">${escapeHtml(name)}${
      str(payload, "city") ? ` · ${escapeHtml(str(payload, "city"))}` : ""
    } · ${escapeHtml(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}</p>
    <p style="margin:22px 0 0"><span style="display:inline-block;background:${pill.bg};color:${pill.fg};font-size:15px;font-weight:600;padding:11px 22px;border-radius:999px">${escapeHtml(pill.text)}</span></p>
  </div>
  <div style="padding:28px 34px 32px">
    <table style="border-collapse:collapse;width:100%">${rowsHtml}</table>
    <p style="margin:26px 0 0">
      ${phone ? `<a href="tel:${escapeHtml(phone.replace(/[^+\d]/g, ""))}" style="display:inline-block;padding:13px 24px;background:#1A1A1A;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin-right:8px">Call ${escapeHtml(name.split(" ")[0])}</a>` : ""}
      ${email ? `<a href="mailto:${escapeHtml(email)}" style="display:inline-block;padding:13px 24px;border:1px solid #1A1A1A;color:#1A1A1A;text-decoration:none;font-size:12px;letter-spacing:.14em;text-transform:uppercase">Email</a>` : ""}
    </p>
    <p style="margin:24px 0 0;font-size:11px;color:#8C8377;line-height:1.6">Submitted from ${escapeHtml(str(payload, "landingPage") || str(payload, "page") || "the website")} · ${escapeHtml(site.meta.siteUrl ?? "")}</p>
  </div>
</div>`;

  return sendGrid({
    personalizations: [{ to: recipients.map((email) => ({ email })) }],
    /* Named for the SITE, not the agent. This email goes TO Carole, so a From
       of "Carole Tierney" makes it look like she wrote to herself. The
       auto-responder below is the one that should carry her name. */
    from: { email: from, name: `${site.brand.name} Website` },
    // Hitting reply goes straight to the lead, not into a no-reply void
    ...(email ? { reply_to: { email, name: name } } : {}),
    subject: `[${tag}] ${label} - ${name}${phone ? ` · ${phone}` : ""}`,
    content: [{ type: "text/html", value: html }],
  });
}

/**
 * Instant acknowledgement to the lead. Off unless LEAD_AUTORESPONDER=1, since
 * it sends mail on the client's behalf and they should opt into that wording.
 */
export async function emailLead(payload: LeadPayload): Promise<boolean> {
  if (process.env.LEAD_AUTORESPONDER !== "1") return false;
  const from = process.env.SENDGRID_FROM_EMAIL;
  const email = str(payload, "email");
  if (!from || !email) return false;

  const first = (str(payload, "name", "firstName").split(" ")[0]) || "there";
  const agent = site.footer.agentName;
  const phone = site.contact?.phone ?? "";

  const html = `<div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FAF9F7;color:#1A1A1A">
  <p style="margin:0 0 16px;font-size:15px;line-height:1.7">Hi ${escapeHtml(first)},</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.7">Thank you for reaching out. I have your details and will be in touch personally, usually the same day.</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.7">If it is time sensitive, call or text me directly at ${escapeHtml(phone)}.</p>
  <p style="margin:24px 0 0;font-family:Georgia,serif;font-size:17px">${escapeHtml(agent)}</p>
  <p style="margin:2px 0 0;font-size:12px;color:#8C8377">${escapeHtml(site.footer.brokerage)}</p>
</div>`;

  return sendGrid({
    personalizations: [{ to: [{ email }] }],
    from: { email: from, name: process.env.SENDGRID_FROM_NAME || site.footer.agentName },
    ...(site.contact?.email ? { reply_to: { email: site.contact.email } } : {}),
    subject: `Thank you for contacting ${site.footer.agentName}`,
    content: [{ type: "text/html", value: html }],
  });
}

/* --------------------------------------------------------------------------
   Twilio
   -------------------------------------------------------------------------- */

/**
 * SMS to the agent. The one channel that reliably interrupts a showing.
 *
 * Sender: prefer TWILIO_MESSAGING_SERVICE_SID. A2P 10DLC campaigns attach their
 * numbers to a Messaging Service, and sending through the service is what keeps
 * traffic on the registered campaign (plus it handles STOP/HELP). A bare
 * TWILIO_FROM_NUMBER still works for unregistered testing.
 *
 * Auth: prefer an API Key (SK...) over the account Auth Token. The token is the
 * master credential for the whole account and cannot be rotated without
 * breaking everything else; an API key can be revoked on its own.
 */
export async function smsAgent(payload: LeadPayload): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authUser = process.env.TWILIO_API_KEY_SID || sid;
  const authPass = process.env.TWILIO_API_KEY_SECRET || process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.LEAD_NOTIFY_SMS;
  if (!sid || !authUser || !authPass || !to) return false;
  if (!messagingServiceSid && !from) return false;

  const formType = str(payload, "formType") || "unknown";
  if (!SMS_WORTHY.has(formType)) return false;

  const label = FORM_LABELS[formType] ?? formType;

  /* Only qualified leads buzz the phone. An alert that fires for every
     submission is one she learns to ignore, and then it stops working for the
     leads that matter. Disqualified ones still arrive by email. */
  const { qualified, label: verdict } = qualify(payload);
  if (!qualified) return false;

  const qualifier =
    str(payload, "financing") ||
    str(payload, "agentStatus") ||
    str(payload, "estimatedValue");
  const detail = str(payload, "address") || str(payload, "pricePoint") || str(payload, "city");
  const body = [
    `${label}: ${leadName(payload)}`,
    str(payload, "phone"),
    detail,
    qualifier || verdict,
  ]
    .filter(Boolean)
    .join(" · ")
    // One segment is 160 chars; longer costs more and gets split oddly
    .slice(0, 300);

  try {
    const res = await fetch(`${TWILIO_BASE}/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${authUser}:${authPass}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        Body: body,
        ...(messagingServiceSid
          ? { MessagingServiceSid: messagingServiceSid }
          : { From: from as string }),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("[Lead] twilio rejected", { status: res.status, detail: (await res.text()).slice(0, 300) });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Lead] twilio failed", { error: String(error) });
    return false;
  }
}
