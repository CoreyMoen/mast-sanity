import type {NextConfig} from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  turbopack: {
    // Lock workspace root to this project so Turbopack doesn't traverse into
    // ~/ when a stray package-lock.json exists in a parent directory.
    root: path.resolve(__dirname, '..'),
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
