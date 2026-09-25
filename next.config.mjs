/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    /*
     * MLS photo CDNs. The feed serves one very large original per photo (often
     * 2700px wide) with no sized variants, so every listing image goes through
     * Next's optimizer to come back sized and in a modern format. Without this
     * a phone downloads a 2700px file to paint a 390px box.
     */
    remotePatterns: [
      { protocol: "https", hostname: "cdn.realtyfeed.com" },
      { protocol: "https", hostname: "dx41nk9nsacii.cloudfront.net" },
      { protocol: "https", hostname: "**.idxbroker.com" },
      { protocol: "https", hostname: "cdn.agentimagehosting.com" },
      // Some listing brokerages serve photos straight from S3; the IDX host
      // only appears in the path, so the hostname has to be allowed too.
      { protocol: "https", hostname: "s3.amazonaws.com" },
      { protocol: "https", hostname: "s3.*.amazonaws.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // Next 16 requires the quality values used anywhere in the app
    qualities: [60, 70, 78, 80, 82],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

nextConfig.redirects = async () => [
  // One search page. /search was a stub form that only handed off to
  // /listings; old links and printed material still land in the right place.
  { source: "/search", destination: "/listings", permanent: true },
  // The client's way in: /studio lands on the branded portal, which hands off
  // to Sanity's sign-in. Point it straight at the Studio instead if the team
  // would rather skip the front door.
  { source: "/studio", destination: "/client-portal", permanent: false },
];

export default nextConfig;
