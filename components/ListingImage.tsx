import Image, { type ImageProps } from "next/image";

/* ==========================================================================
   Listing photo.

   MLS photos come from whatever host the listing brokerage happens to use,
   and `next/image` THROWS on a hostname that is not in next.config's
   remotePatterns, which turns one unexpected photo into a 500 for the whole
   page. Known hosts go through the optimizer; anything else still renders,
   unoptimized. A slightly heavier image beats a broken homepage.

   Add genuinely common hosts to next.config as they turn up: this is the
   safety net, not the strategy.
   ========================================================================== */

/** Hosts declared in next.config.mjs → images.remotePatterns */
const OPTIMIZABLE = [
  /^cdn\.realtyfeed\.com$/,
  /^dx41nk9nsacii\.cloudfront\.net$/,
  /\.idxbroker\.com$/,
  /^cdn\.agentimagehosting\.com$/,
  /^s3\.amazonaws\.com$/,
  /^s3[.-][a-z0-9-]+\.amazonaws\.com$/,
];

function isOptimizable(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return true;
  if (!src.startsWith("http")) return true; // local file in /public
  try {
    const { hostname } = new URL(src);
    return OPTIMIZABLE.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

export default function ListingImage(props: ImageProps) {
  return <Image {...props} unoptimized={props.unoptimized ?? !isOptimizable(props.src)} />;
}
