import Link from 'next/link'
import Image from 'next/image'
import {
  LinkedinLogo,
  XLogo,
  InstagramLogo,
  FacebookLogo,
  YoutubeLogo,
  GithubLogo,
  TiktokLogo,
} from '@phosphor-icons/react/dist/ssr'
import {urlForImage} from '@/sanity/lib/utils'
import {ThemeToggle} from './ui/theme-toggle'

// Types for the footer data
interface FooterLink {
  linkType?: string
  href?: string
  page?: string
  post?: string
  openInNewTab?: boolean
}

interface LinkItem {
  _key: string
  label: string
  link?: FooterLink
}

interface LinkColumn {
  _key: string
  title?: string
  links?: LinkItem[]
}

interface SocialLink {
  _key: string
  platform: string
  url: string
}

interface FooterData {
  showLogo?: boolean
  logoText?: string
  logoImage?: {
    asset?: {_ref: string}
    alt?: string
  }
  linkColumns?: LinkColumn[]
  socialLinks?: SocialLink[]
  companyName?: string
  showThemeToggle?: boolean
}

interface FooterProps {
  data: FooterData | null
  siteTitle?: string
}

// Helper to resolve link URL
function resolveLink(link?: FooterLink): string {
  if (!link) return '#'
  if (link.linkType === 'href' && link.href) return link.href
  if (link.linkType === 'page' && link.page) return `/${link.page}`
  if (link.linkType === 'post' && link.post) return `/posts/${link.post}`
  return '#'
}

// Social icon component
function SocialIcon({platform}: {platform: string}) {
  const iconProps = {size: 24, weight: 'regular' as const}

  switch (platform) {
    case 'linkedin':
      return <LinkedinLogo {...iconProps} />
    case 'x':
      return <XLogo {...iconProps} />
    case 'instagram':
      return <InstagramLogo {...iconProps} />
    case 'facebook':
      return <FacebookLogo {...iconProps} />
    case 'youtube':
      return <YoutubeLogo {...iconProps} />
    case 'github':
      return <GithubLogo {...iconProps} />
    case 'tiktok':
      return <TiktokLogo {...iconProps} />
    default:
      return null
  }
}

// Footer link component
function FooterLinkItem({
  href,
  openInNewTab,
  children,
}: {
  href: string
  openInNewTab?: boolean
  children: React.ReactNode
}) {
  const isExternal = href.startsWith('http') || href.startsWith('//')
  const className =
    'text-body text-[var(--muted-foreground)] transition-colors duration-300 hover:text-[var(--primary-foreground)] hover:underline'

  if (isExternal || openInNewTab) {
    return (
      <a
        href={href}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export default function FooterNew({data, siteTitle = 'Site'}: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--footer-border)] bg-[var(--footer-background)] mt-auto">
      <div className="container py-12 md:py-16">
        {/* Top section: Logo and Link Columns */}
        <div className="grid gap-8 md:grid-cols-12 md:gap-12">
          {/* Logo column */}
          {data?.showLogo !== false && (
            <div className="md:col-span-3">
              <Link href="/" className="inline-block">
                {data?.logoImage?.asset ? (
                  <Image
                    src={urlForImage(data.logoImage)?.width(200).height(50).url() || ''}
                    alt={data.logoImage.alt || siteTitle}
                    width={100}
                    height={40}
                    className="h-8 w-auto md:h-10"
                  />
                ) : (
                  <span className="text-h4 font-medium text-brand">
                    {data?.logoText || siteTitle}
                  </span>
                )}
              </Link>
            </div>
          )}

          {/* Link columns */}
          {data?.linkColumns && data.linkColumns.length > 0 && (
            <div
              className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-${Math.min(data.linkColumns.length, 4)} ${
                data?.showLogo !== false ? 'md:col-span-9' : 'md:col-span-12'
              }`}
            >
              {data.linkColumns.map((column) => (
                <div key={column._key}>
                  {column.title && (
                    <h3 className="text-h6 font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-4">
                      {column.title}
                    </h3>
                  )}
                  {column.links && column.links.length > 0 && (
                    <ul className="space-y-3">
                      {column.links.map((linkItem) => (
                        <li key={linkItem._key}>
                          <FooterLinkItem
                            href={resolveLink(linkItem.link)}
                            openInNewTab={linkItem.link?.openInNewTab}
                          >
                            {linkItem.label}
                          </FooterLinkItem>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <hr className="my-8 border-[var(--footer-border)] md:my-12" />

        {/* Bottom section: Copyright, Theme Toggle, and Social links */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Copyright */}
          <p className="text-p-sm text-[var(--muted-foreground)]">
            © {currentYear} {data?.companyName || siteTitle}. All rights reserved.
          </p>

          {/* Theme Toggle and Social links */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            {data?.showThemeToggle !== false && (
              <ThemeToggle showLabels />
            )}

            {/* Social links */}
            {data?.socialLinks && data.socialLinks.length > 0 && (
              <ul className="flex items-center gap-2">
                {data.socialLinks.map((social) => (
                  <li key={social._key}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center text-[var(--muted-foreground)] transition-colors duration-300 hover:text-brand"
                      aria-label={`Visit our ${social.platform} page`}
                    >
                      <SocialIcon platform={social.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
