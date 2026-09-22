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
    ],
    formats: ["image/avif", "image/webp"],
    // Next 16 requires the quality values used anywhere in the app
    qualities: [60, 70, 78, 82],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
