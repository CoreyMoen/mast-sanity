import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // Lock workspace root to the mast-sanity monorepo root so Turbopack
    // doesn't traverse into ~/ when a stray package-lock.json exists in
    // a parent directory. Hardcoded to avoid __dirname resolution issues
    // in the TS config loader.
    root: '/Users/corey/code/personal/mast-sanity',
  },
  env: {
    // Matches the behavior of `sanity dev` which sets styled-components to use the fastest way of inserting CSS rules in both dev and production. It's default behavior is to disable it in dev mode.
    SC_DISABLE_SPEEDY: 'false',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  // Disable the dev indicator (Next.js logo button in bottom-left corner)
  // Errors still show in console and error overlay
  devIndicators: false,
}

export default nextConfig
