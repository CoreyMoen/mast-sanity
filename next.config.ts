import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: "standalone",

  images: {
    remotePatterns: [
      // Clerk user avatars
      { protocol: "https", hostname: "img.clerk.com" },
      // Social platform media
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "media.licdn.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.angela.social" }],
        destination: "https://angela.social/:path*",
        permanent: true,
      },
    ];
  },
};

// Conditionally wrap with bundle analyzer
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

export default withBundleAnalyzer(nextConfig);
