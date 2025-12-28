import type {Config} from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  content: ['./app/**/*.{ts,tsx}', './sanity/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        layer: '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
      colors: {
        /* Semantic theme colors - these adapt to light/dark mode */
        foreground: 'var(--primary-foreground)',
        background: 'var(--primary-background)',
        border: 'var(--primary-border)',
        'muted-foreground': 'var(--muted-foreground)',
        'muted-background': 'var(--muted-background)',
        'card-background': 'var(--card-background)',
        'card-foreground': 'var(--card-foreground)',

        /* Mast neutral colors */
        black: '#1d1c1a',
        white: '#ffffff',
        'dark-gray': '#292825',
        'light-gray': '#f0eee6',
        'mid-gray-1': '#cccabf',
        'mid-gray-2': '#474641',

        /* Mast primary colors */
        brand: {
          DEFAULT: '#d14424',
          dark: '#9c331b',
        },

        /* Mast secondary colors */
        yellow: {
          DEFAULT: '#f8d47a',
          50: '#fefcf5',
          100: '#fdf8e8',
          200: '#fbf0d0',
          300: '#f8d47a',
          400: '#f5c24d',
          500: '#e9a820',
          600: '#c78618',
          700: '#a56614',
          800: '#834e12',
          900: '#613a0f',
          950: '#3f250a',
        },
        blue: {
          DEFAULT: '#0073e6',
          50: '#e6f2ff',
          100: '#cce5ff',
          200: '#99cbff',
          300: '#66b0ff',
          400: '#3396ff',
          500: '#0073e6',
          600: '#005cb8',
          700: '#00458a',
          800: '#002e5c',
          900: '#00172e',
          950: '#000b17',
        },

        /* Mast gray scale */
        gray: {
          50: '#f0eee6',
          100: '#e5e3db',
          200: '#d4d2c8',
          300: '#cccabf',
          400: '#9a9890',
          500: '#6b6961',
          600: '#474641',
          700: '#353430',
          800: '#292825',
          900: '#1d1c1a',
          950: '#141311',
        },
      },
      fontFamily: {
        sans: ['var(--font-general-sans)', 'General Sans', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: {height: '0'},
          to: {height: 'var(--radix-accordion-content-height)'},
        },
        'accordion-up': {
          from: {height: 'var(--radix-accordion-content-height)'},
          to: {height: '0'},
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [typography],
} satisfies Config
