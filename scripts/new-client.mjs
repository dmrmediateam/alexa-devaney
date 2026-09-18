#!/usr/bin/env node
/* ==========================================================================
   Turn a fresh template spawn into a single-client repo.

     npm run new-client -- --slug carole-tierney --name "Carole Tierney" --variant estate

   What it does:
   1. Locks the chosen homepage variant: SitePage renders it directly and
      the unused variant components are deleted.
   2. Deletes template-only surfaces: /templates previews, the demo client
      folder(s), and content/clients.
   3. Marks content/site.ts as this client's config (homeVariant set,
      header comment updated) - the demo copy inside it is then rewritten
      by hand/Claude during customization.
   4. Renames the package and stamps CLAUDE.md with a client banner.

   Run once, right after creating the repo from the template. Idempotent
   enough to re-run safely, but intended as a one-shot.
   ========================================================================== */

import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
function arg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

const slug = arg("--slug");
const name = arg("--name") ?? slug;
const variant = arg("--variant") ?? "classic";
const VARIANTS = ["classic", "noir", "estate"];

if (!slug || !VARIANTS.includes(variant)) {
  console.error('Usage: npm run new-client -- --slug <client-slug> --name "<Client Name>" --variant classic|noir|estate');
  process.exit(1);
}

const componentFor = { classic: "HomeClassic", noir: "HomeNoir", estate: "HomeEstate" };
const chosen = componentFor[variant];

/* 1 ---- SitePage renders the chosen variant directly ---- */
writeFileSync(
  "components/SitePage.tsx",
  `import ${chosen} from "@/components/home/${chosen}";
import type { Listing, SiteContent } from "@/content/site";

/* This client uses the "${variant}" homepage design (locked by new-client). */

export default function SitePage({
  content,
  liveListings,
}: {
  content: SiteContent;
  liveListings?: Listing[] | null;
}) {
  return <${chosen} content={content} liveListings={liveListings} />;
}
`,
);

/* delete the unused variants and their private helpers */
const helperFor = { noir: "components/home/CountUpStat.tsx", estate: "components/home/ServiceShowcase.tsx" };
for (const other of VARIANTS.filter((v) => v !== variant)) {
  rmSync(`components/home/${componentFor[other]}.tsx`, { force: true });
  if (helperFor[other]) rmSync(helperFor[other], { force: true });
}

/* 2 ---- remove template-only surfaces ---- */
for (const path of ["app/templates", "content/clients"]) rmSync(path, { recursive: true, force: true });
// demo client folders: any app/<dir> that has a [slug] sibling and isn't a known route
for (const demo of ["app/carole-tierney", "public/clients"]) rmSync(demo, { recursive: true, force: true });

/* 3 ---- mark the config as this client's ---- */
let site = readFileSync("content/site.ts", "utf8");
site = site.replace(
  /\/\* -{10,}\n   Placeholder content[^*]*-{10,} \*\//,
  `/* --------------------------------------------------------------------------\n   CLIENT: ${name} (${slug}) - homepage variant "${variant}"\n   Fill every field below for this client; see CLAUDE.md for the playbook.\n   -------------------------------------------------------------------------- */`,
);
if (!/^\s*homeVariant:/m.test(site)) {
  site = site.replace("export const site: SiteContent = {", `export const site: SiteContent = {\n  homeVariant: "${variant}",`);
} else {
  site = site.replace(/^\s*homeVariant:.*$/m, `  homeVariant: "${variant}",`);
}
writeFileSync("content/site.ts", site);

/* 4 ---- package name + CLAUDE.md banner ---- */
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
pkg.name = slug;
writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");

let playbook = readFileSync("CLAUDE.md", "utf8");
if (!playbook.startsWith("> CLIENT REPO")) {
  playbook = `> CLIENT REPO: **${name}** · homepage variant: **${variant}** · scaffolded by new-client.\n> This repo serves ONE client. Customize content/site.ts per the playbook below;\n> the other homepage variants have been removed by design - do not re-add them.\n\n${playbook}`;
  writeFileSync("CLAUDE.md", playbook);
}

/* sanity: the repo should still typecheck */
try {
  execSync("npx tsc --noEmit", { stdio: "pipe" });
  console.log("typecheck: OK");
} catch (error) {
  console.error("typecheck FAILED after scaffold:\n" + String(error.stdout));
  process.exit(1);
}

console.log(`
Scaffolded client repo for ${name}
  variant   : ${variant} (others removed)
  config    : content/site.ts (fill it per CLAUDE.md)
  next steps:
    1. Open in VS Code, run \`claude\`, hand it the intake material
       (logo, colors, areas, Zillow/GBP links) - CLAUDE.md guides the rest.
    2. Create the Vercel project for this repo; set meta.siteUrl and, when
       IDX is ready: IDX_API_KEY, IDX_MARKET_CITIES, IDX_OFFICE_IDS.
`);
if (existsSync("app/carole-tierney")) console.warn("warning: demo client folder still present");
