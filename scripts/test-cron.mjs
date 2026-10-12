#!/usr/bin/env node
/**
 * Hits the cron endpoint the way Vercel does and prints each check.
 *
 *   npm run test:cron                                   (local dev server, :3000)
 *   CRON_URL=https://site.com npm run test:cron         (deployed; needs CRON_SECRET)
 *
 * Reads CRON_SECRET from the env or .env.local. Exits 1 if any check fails,
 * so it can gate CI or a deploy.
 */
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  } catch {}
}
loadEnvLocal();

const base = (process.env.CRON_URL ?? "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.CRON_SECRET;
const headers = secret ? { Authorization: `Bearer ${secret}` } : {};

let res;
try {
  res = await fetch(`${base}/api/cron`, { headers, signal: AbortSignal.timeout(60_000) });
} catch (err) {
  console.error(`Could not reach ${base}/api/cron: ${err.message}`);
  console.error("Is the dev server running? (npm run dev)");
  process.exit(1);
}

if (res.status === 401) {
  console.error("401 unauthorized: set CRON_SECRET to match the deployment's value.");
  process.exit(1);
}

const body = await res.json().catch(() => null);
if (!body?.checks) {
  console.error(`Unexpected response (${res.status})`);
  process.exit(1);
}

console.log(`\nCron health check: ${base}  (HTTP ${res.status}, portal ${body.portalVersion ? `v${body.portalVersion}` : "version unknown"})\n`);
for (const c of body.checks) {
  const label = c.skipped ? "SKIP" : c.ok ? "PASS" : "FAIL";
  console.log(`  ${label}  ${c.name.padEnd(15)} ${String(c.ms).padStart(5)}ms  ${c.detail}`);
}
// Anything else the client's cron route adds (IDX usage, ...) prints as-is.
for (const [key, value] of Object.entries(body)) {
  if (!["ok", "ranAt", "portalVersion", "checks"].includes(key)) console.log(`\n  ${key}: ${JSON.stringify(value)}`);
}
console.log(`\n${body.ok ? "All checks passed." : "Some checks FAILED."}`);
process.exit(body.ok ? 0 : 1);
