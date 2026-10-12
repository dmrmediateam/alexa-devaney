import { STUDIO_ORIGIN } from "@/sanity/dmr-client";

// Studio origins allowed to call the /api/dmr routes (hosted Studio + local dev).
const ALLOWED_ORIGINS = [
  STUDIO_ORIGIN,
  "https://www.sanity.io",
  "http://localhost:3333",
  ...(process.env.DMR_STUDIO_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
];

export function studioCors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
