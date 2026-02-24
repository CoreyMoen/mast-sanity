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
      } catch (e) {}

      // Pinboard iframe mode: lock viewport-height values to the initial 900px
      // viewport so sections don't expand when the parent resizes the iframe.
      if (window.self !== window.top && new URLSearchParams(window.location.search).has('pinboard')) {
        document.documentElement.classList.add('pinboard-mode');

        // The iframe starts at 1600x900 so 1vh = 9px.
        var VH_PX = 9;

        // Fix ALL viewport-height references: inline styles AND utility classes.
        // Uses a re-entrancy guard so MutationObserver doesn't loop infinitely.
        var fixing = false;
        function fixViewportHeights() {
          if (fixing) return;
          fixing = true;

          // 1. Replace inline vh values (e.g. style="min-height: 100vh")
          document.querySelectorAll('[style]').forEach(function(el) {
            var style = el.getAttribute('style');
            if (style && /\d+vh/.test(style)) {
              el.setAttribute('style', style.replace(/([\d.]+)vh/g, function(_, num) {
                return Math.round(parseFloat(num) * VH_PX) + 'px';
              }));
            }
          });

          // 2. Force inline overrides on elements with viewport-height classes.
          //    The CSS override in globals.css should handle this, but React
          //    hydration can re-apply the original class-based value.
          document.querySelectorAll('.min-h-screen').forEach(function(el) {
            if (el !== document.body && el !== document.documentElement) {
              el.style.setProperty('min-height', '900px', 'important');
            }
          });
          document.querySelectorAll('.h-screen').forEach(function(el) {
            if (el !== document.body && el !== document.documentElement) {
              el.style.setProperty('height', '900px', 'important');
            }
          });

          fixing = false;
        }

        function reportHeight() {
          window.parent.postMessage({
            type: 'pinboard-height',
            height: document.documentElement.scrollHeight
          }, '*');
        }

        var resizeTimer;
        function reportHeightDebounced() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(reportHeight, 200);
        }

        window.addEventListener('load', function() {
          fixViewportHeights();
          reportHeight();
          // Re-run after hydration and image loading settle
          setTimeout(function() { fixViewportHeights(); reportHeight(); }, 1000);
          setTimeout(function() { fixViewportHeights(); reportHeight(); }, 3000);
        });

        // MutationObserver catches React hydration re-applying styles/classes.
        // This is critical: React owns the DOM and will overwrite our fixes
        // unless we re-apply them whenever attributes change.
        if (typeof MutationObserver !== 'undefined') {
          var mutationTimer;
          new MutationObserver(function() {
            clearTimeout(mutationTimer);
            mutationTimer = setTimeout(function() {
              fixViewportHeights();
              reportHeightDebounced();
            }, 50);
          }).observe(document.documentElement, {
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
          });
        }

        // Watch for body resizes (images loading, fonts swapping, etc.)
        if (typeof ResizeObserver !== 'undefined') {
          new ResizeObserver(reportHeightDebounced).observe(document.body);
        }

        window.addEventListener('message', function(e) {
          if (e.data && e.data.type === 'pinboard-request-height') {
            fixViewportHeights();
            reportHeight();
          }
        });
      }
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
        {/* Visual Editing and Draft Mode Toast - only rendered in draft mode */}
        {isDraftMode && (
          <>
            <DraftModeToast />
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
