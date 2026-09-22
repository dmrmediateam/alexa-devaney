import { NextResponse } from "next/server";
import { isSpam } from "@/lib/spam-filter";
import { emailAgent, emailLead, smsAgent } from "@/lib/leads/notify";
import { LEAD_CAPTURED_COOKIE } from "@/lib/leads/captured";

/**
 * Lead intake for every form on the site.
 *
 * Delivery is env-driven so a client repo needs no code change. Every channel
 * is independent, and a lead only needs one of them to survive:
 *   LEAD_WEBHOOK_URL   Zapier/Make catch hook -> CRM
 *   SENDGRID_*         notification email to the agent, optional auto-responder
 *   TWILIO_*           SMS to the agent, because speed-to-lead decides contact rates
 *
 * The webhook is awaited rather than fired and forgotten, because on serverless
 * the function can be frozen the moment the response is returned, which kills an
 * in-flight request. A lead is worth the extra few hundred milliseconds.
 */
export const runtime = "nodejs";

const WEBHOOK_TIMEOUT_MS = 8000;

async function forwardToWebhook(payload: Record<string, unknown>): Promise<boolean> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("[Lead] webhook rejected", { status: res.status });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Lead] webhook failed", { error: String(error) });
    return false;
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Spam check FIRST, before any validation, so blocked bots see the same
  // success-shaped response as real submissions and get no signal to retune.
  const reasons = isSpam(body);
  if (reasons.length > 0) {
    console.warn("[Lead] blocked likely spam", { reasons });
    return NextResponse.json({ success: true, filtered: true }, { status: 200 });
  }

  const { company: _company, website: _website, attribution, ...lead } = body;

  // Click ids are lifted to the top level: Zapier maps flat fields cleanly, and
  // the gclid is the one field that lets a closed deal be reported back to Ads.
  const attr = (attribution ?? {}) as Record<string, string>;
  const payload = {
    ...lead,
    gclid: attr.gclid ?? "",
    gbraid: attr.gbraid ?? "",
    wbraid: attr.wbraid ?? "",
    msclkid: attr.msclkid ?? "",
    utmSource: attr.utm_source ?? "",
    utmMedium: attr.utm_medium ?? "",
    utmCampaign: attr.utm_campaign ?? "",
    utmTerm: attr.utm_term ?? "",
    utmContent: attr.utm_content ?? "",
    landingPage: attr.landingPage ?? "",
    referrer: attr.referrer ?? "",
    source: "alexadevaney.com",
    submittedAt: new Date().toISOString(),
  };

  /*
   * All channels in parallel: sequential awaits would stack three round trips
   * onto the visitor's wait on a form they have already finished. allSettled
   * because one channel being down must not take the others with it.
   */
  const [webhook, agentEmail, agentSms, autoResponder] = await Promise.allSettled([
    forwardToWebhook(payload),
    emailAgent(payload),
    smsAgent(payload),
    emailLead(payload),
  ]);
  const ok = (r: PromiseSettledResult<boolean>) => r.status === "fulfilled" && r.value;

  const channels = {
    webhook: ok(webhook),
    email: ok(agentEmail),
    sms: ok(agentSms),
    autoResponder: ok(autoResponder),
  };
  const delivered = channels.webhook || channels.email || channels.sms;

  // Always log: when nothing is configured this is the only record, and it is
  // what you grep in Vercel logs to recover a lead after an outage.
  console.log(
    `[Lead] ${delivered ? "delivered" : "NOT DELIVERED"} ${String(lead.formType ?? "unknown")}`,
    { channels, ...payload },
  );

  // The visitor gets a success either way: a delivery failure is ours to fix
  // from the logs, not theirs to retry into a form that already took their data.
  const response = NextResponse.json({ success: true }, { status: 200 });

  /*
   * Mark this visitor as captured, from the SERVER.
   *
   * Safari's storage policy deletes script-written cookies and localStorage
   * after 7 days without a visit, so a client-side flag re-prompts people who
   * already registered. A Set-Cookie from a response survives that. Not
   * HttpOnly: the listing gate reads it in the browser before deciding to open.
   * Any successful lead on any form sets it, not just the gate's own.
   */
  response.cookies.set({
    name: LEAD_CAPTURED_COOKIE,
    value: "1",
    maxAge: 60 * 60 * 24 * 400, // 400 days: the browser cap for Set-Cookie
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
  return response;
}
