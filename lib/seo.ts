import type { Metadata } from "next";

const SITE_NAME = "Angela";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://angela.social";
const DEFAULT_DESCRIPTION =
  "Schedule, manage, and optimize your social media posts across multiple platforms with AI-assisted caption writing.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Generate Next.js Metadata for a given page.
 *
 * @param title   - Page title (will be appended with site name)
 * @param description - Page description for SEO
 * @param path    - URL path (e.g. "/dashboard", "/pricing")
 * @returns Next.js Metadata object
 */
export function generateMetadata(
  title?: string,
  description?: string,
  path?: string,
): Metadata {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const pageDescription = description ?? DEFAULT_DESCRIPTION;
  const url = path ? `${SITE_URL}${path}` : SITE_URL;

  return {
    title: pageTitle,
    description: pageDescription,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: pageTitle,
      description: pageDescription,
      url,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — AI-powered social media scheduling`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Default site-wide metadata. Import this in the root layout.
 */
export const defaultMetadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Social Media Scheduling`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Social Media Scheduling`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — AI-powered social media scheduling`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Social Media Scheduling`,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};
