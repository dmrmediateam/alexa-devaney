import { NextResponse } from "next/server";
import { studioCors as cors } from "@/lib/dmr/studioCors";
import { DMR_PORTAL_VERSION } from "@/sanity/dmr-dashboard/version";

/**
 * The portal version this deployment of the website is running. The Studio
 * dashboard shows it in its footer next to its own version, so a site that
 * wasn't redeployed (or a Studio that wasn't `sanity deploy`ed) after a portal
 * update is visible at a glance. Public on purpose: it's a version number.
 */
export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

export async function GET(request: Request) {
  return NextResponse.json(
    {
      version: DMR_PORTAL_VERSION,
      // Vercel sets these at build time; null when run anywhere else.
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      env: process.env.VERCEL_ENV ?? null,
    },
    { headers: { ...cors(request.headers.get("origin")), "Cache-Control": "no-store" } },
  );
}
