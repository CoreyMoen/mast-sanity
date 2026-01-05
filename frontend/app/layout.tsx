import './globals.css'

import {SpeedInsights} from '@vercel/speed-insights/next'
import type {Metadata} from 'next'
import localFont from 'next/font/local'
import {draftMode} from 'next/headers'
import {toPlainText} from 'next-sanity'
import {Toaster} from 'sonner'

import DraftModeToast from '@/app/components/DraftModeToast'
import Navigation from '@/app/components/Navigation'
import FooterNew from '@/app/components/FooterNew'
import VisualEditingWithPlugins from '@/app/components/overlays/VisualEditingWithPlugins'
import {OverlayHoverProvider} from '@/app/components/overlays/OverlayHoverContext'
import * as demo from '@/sanity/lib/demo'
import {sanityFetch, SanityLive} from '@/sanity/lib/live'
import {settingsQuery, navigationQuery, footerQuery} from '@/sanity/lib/queries'
import {resolveOpenGraphImage} from '@/sanity/lib/utils'
import {handleError} from './client-utils'

/**
 * General Sans font - Mast design system primary font
 * Includes Regular (400) and Medium (500) weights
 */
const generalSans = localFont({
  src: [
    {
      path: '../public/fonts/GeneralSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/GeneralSans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-general-sans',
  display: 'swap',
})

/**
 * Generate metadata for the page.
 * Learn more: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#generatemetadata-function
 */
export async function generateMetadata(): Promise<Metadata> {
  const {data: settings} = await sanityFetch({
    query: settingsQuery,
    // Metadata should never contain stega
    stega: false,
  })
  const title = settings?.title || demo.title
  const description = settings?.description || demo.description

  const ogImage = resolveOpenGraphImage(settings?.ogImage)
  let metadataBase: URL | undefined = undefined
  try {
    metadataBase = settings?.ogImage?.metadataBase
      ? new URL(settings.ogImage.metadataBase)
      : undefined
  } catch {
    // ignore
  }
  return {
    metadataBase,
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description: toPlainText(description),
    openGraph: {
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()

  // Fetch navigation and footer data
  const [{data: settings}, {data: navigation}, {data: footer}] = await Promise.all([
    sanityFetch({query: settingsQuery, stega: false}),
    sanityFetch({query: navigationQuery}),
    sanityFetch({query: footerQuery}),
  ])

  const siteTitle = settings?.title || demo.title

  // Inline script to prevent theme flash - runs before React hydrates
  const themeScript = `
    (function() {
      try {
        var stored = localStorage.getItem('theme-preference');
        if (stored === 'light' || stored === 'dark') {
          document.documentElement.setAttribute('data-theme', stored);
        }
        // If 'system' or no preference, don't set data-theme - let CSS light-dark() use OS preference
      } catch (e) {}
    })();
  `

  return (
    <html lang="en" className={generalSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* The <Toaster> component is responsible for rendering toast notifications used in /app/client-utils.ts and /app/components/DraftModeToast.tsx */}
        <Toaster />
        {isDraftMode && (
          <>
            <DraftModeToast />
            {/*  Enable Visual Editing, only to be rendered when Draft Mode is enabled */}
            <VisualEditingWithPlugins />
          </>
        )}
        {/* The <SanityLive> component is responsible for making all sanityFetch calls in your application live, so should always be rendered. */}
        <SanityLive onError={handleError} />
        <Navigation data={navigation} siteTitle={siteTitle} />
        <OverlayHoverProvider>
          <main id="main" className="flex-1 pt-16 md:pt-20">{children}</main>
        </OverlayHoverProvider>
        <FooterNew data={footer} siteTitle={siteTitle} />
        <SpeedInsights />
      </body>
    </html>
  )
}
