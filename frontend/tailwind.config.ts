import type {Config} from 'tailwindcss'

/**
 * Tailwind CSS v4 Configuration
 *
 * Most configuration is now in globals.css using:
 * - @theme { } for design tokens (colors, fonts, shadows)
 * - @utility for custom utilities
 * - CSS custom properties for brand variables
 *
 * This file only handles content paths and future flags.
 */
export default {
  content: ['./app/**/*.{ts,tsx}', './sanity/**/*.{ts,tsx}'],
  future: {
    hoverOnlyWhenSupported: true,
  },
} satisfies Config
