#!/usr/bin/env node
/**
 * Google Ads API connection test for the DMR dashboard. Walks the same steps
 * the cron and the dashboard sync use, stopping at the first failure with
 * Google's full error, so a 403 says WHICH permission is missing.
 *
 *   npm run test:google-ads                  (reads GOOGLE_ADS_* from env / .env.local)
 *   npm run test:google-ads -- 1234567890    (test a specific client account)
 *
 * Pull the production keys first:  npx vercel env pull .env.local
 */
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^"(.*)"$/, "$1");
    }
  } catch {}
}
loadEnvLocal();

const env = process.env;
const digits = (v) => (v ?? "").replace(/\D/g, "");
// Newest first; a new version's URL answers "Method not found" before release.
const versions = env.GOOGLE_ADS_API_VERSION ? [env.GOOGLE_ADS_API_VERSION] : ["v26", "v25", "v24", "v23", "v22"];
let version = versions[0];
const loginCustomerId = digits(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);

const missing = ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"]
  .filter((name) => !env[name]);
if (missing.length) {
  console.error(`Missing: ${missing.join(", ")}\nRun: npx vercel env pull .env.local`);
  process.exit(1);
}

const pass = (msg) => console.log(`  PASS  ${msg}`);
function fail(step, detail) {
  console.log(`  FAIL  ${step}\n\n${detail}\n`);
  process.exit(1);
}

/** Google's error, including the specific errorCode that the HTTP status hides. */
function explain(status, body) {
  const err = body?.error ?? {};
  const lines = [`HTTP ${status} ${err.status ?? ""}`.trim(), err.message ?? JSON.stringify(body).slice(0, 400)];
  for (const detail of err.details ?? []) {
    for (const e of detail.errors ?? []) {
      lines.push(`  ${Object.entries(e.errorCode ?? {}).map(([k, v]) => `${k}: ${v}`).join(", ")} - ${e.message ?? ""}`);
    }
  }
  const text = lines.join("\n");
  const hints = [
    [/DEVELOPER_TOKEN_NOT_APPROVED|DEVELOPER_TOKEN_PROHIBITED/, "Developer token only has Test access. Apply for Basic access in the MCC: Tools > API Center."],
    [/USER_PERMISSION_DENIED/, "The Google user behind the refresh token can't reach this account. Set GOOGLE_ADS_LOGIN_CUSTOMER_ID to the MCC id, and make sure the client is linked under that MCC."],
    [/CUSTOMER_NOT_ENABLED/, "The client account is cancelled or not finished setting up."],
    [/SERVICE_DISABLED|has not been used in project/, "Enable the Google Ads API in the Google Cloud project that owns GOOGLE_ADS_CLIENT_ID."],
    [/invalid_grant/, "Refresh token expired or revoked. If the OAuth app is in 'Testing' mode, tokens expire after 7 days: publish the app and mint a new token."],
    [/invalid_client/, "GOOGLE_ADS_CLIENT_ID / CLIENT_SECRET don't match."],
    [/UNSUPPORTED_VERSION|Method not found/, `No live API version among ${versions.join(", ")}. Set GOOGLE_ADS_API_VERSION.`],
  ].filter(([re]) => re.test(text)).map(([, hint]) => `  -> ${hint}`);
  return [text, ...hints].join("\n");
}

console.log(`\nGoogle Ads API test\n`);

// 1. OAuth: refresh token -> access token
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  }),
});
const token = await tokenRes.json().catch(() => ({}));
if (!token.access_token) {
  fail("OAuth token", explain(tokenRes.status, { error: { message: `${token.error}: ${token.error_description ?? ""}` } }));
}
pass("OAuth refresh token -> access token");

const headers = (withLogin) => ({
  Authorization: `Bearer ${token.access_token}`,
  "developer-token": env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "Content-Type": "application/json",
  ...(withLogin && loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
});

// 2. Which accounts can this login see directly?
let listRes;
for (version of versions) {
  listRes = await fetch(`https://googleads.googleapis.com/${version}/customers:listAccessibleCustomers`, { headers: headers(false) });
  if (listRes.status !== 404) break;
}
const list = await listRes.json().catch(() => ({}));
if (!listRes.ok) fail("listAccessibleCustomers (developer token + API enabled)", explain(listRes.status, list));
const accessible = (list.resourceNames ?? []).map((r) => r.split("/")[1]);
pass(`API ${version}: developer token accepted; login sees ${accessible.length} account(s) directly: ${accessible.join(", ") || "none"}`);
if (loginCustomerId) {
  console.log(`        login-customer-id (MCC) ${loginCustomerId} ${accessible.includes(loginCustomerId) ? "is in that list" : "is NOT in that list -> wrong MCC id or the user isn't on it"}`);
}

// 3. Client account: CLI arg > env > dashboard Report Settings in Sanity
let customerId = digits(process.argv[2]) || digits(env.GOOGLE_ADS_CUSTOMER_ID);
let source = process.argv[2] ? "argument" : "GOOGLE_ADS_CUSTOMER_ID";
if (!customerId) {
  // Fall back to the id in sanity/dmr-client.ts when .env.local doesn't carry it.
  let clientFile = "";
  try { clientFile = readFileSync("sanity/dmr-client.ts", "utf8"); } catch {}
  const project = env.NEXT_PUBLIC_SANITY_PROJECT_ID || clientFile.match(/projectId:\s*'([^']+)'/)?.[1];
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const q = encodeURIComponent('*[_id == "dmr-client-settings"][0].googleAdsCustomerId');
  const res = await fetch(`https://${project}.api.sanity.io/v2025-01-01/data/query/${dataset}?query=${q}`, {
    headers: env.SANITY_API_TOKEN ? { Authorization: `Bearer ${env.SANITY_API_TOKEN}` } : {},
  }).catch(() => null);
  customerId = digits((await res?.json().catch(() => null))?.result);
  source = "DMR Report Settings";
}
if (!customerId) {
  fail("customer id", "No client account id. Pass one (npm run test:google-ads -- 1234567890), set GOOGLE_ADS_CUSTOMER_ID, or fill Google Ads customer ID in the Studio's DMR Report Settings.");
}
console.log(`        client account ${customerId} (from ${source})`);

// 4. The dashboard's query: spend, clicks, conversions by campaign, this month
const query =
  "SELECT customer.descriptive_name, campaign.id, campaign.name, campaign.status, " +
  "metrics.cost_micros, metrics.clicks, metrics.conversions " +
  "FROM campaign WHERE segments.date DURING THIS_MONTH AND metrics.impressions > 0";
const searchRes = await fetch(`https://googleads.googleapis.com/${version}/customers/${customerId}/googleAds:search`, {
  method: "POST",
  headers: headers(true),
  body: JSON.stringify({ query }),
});
const search = await searchRes.json().catch(() => ({}));
if (!searchRes.ok) fail(`GAQL query on ${customerId}`, explain(searchRes.status, search));

const rows = search.results ?? [];
pass(`GAQL query on ${rows[0]?.customer?.descriptiveName ?? customerId}: ${rows.length} campaign(s) with impressions this month`);
let spend = 0, conv = 0;
for (const r of rows) {
  const cost = Number(r.metrics?.costMicros ?? 0) / 1e6;
  spend += cost;
  conv += Number(r.metrics?.conversions ?? 0);
  console.log(`        ${(r.campaign?.name ?? "?").slice(0, 44).padEnd(44)} $${cost.toFixed(2).padStart(9)}  ${String(r.metrics?.clicks ?? 0).padStart(5)} clicks  ${Number(r.metrics?.conversions ?? 0).toFixed(1).padStart(5)} conv`);
}
console.log(`\n  Month to date: $${spend.toFixed(2)} spend, ${conv.toFixed(1)} conversions\n\nGoogle Ads API is working.`);
