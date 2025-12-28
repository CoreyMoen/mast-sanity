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
  const iconProps = {size: 20, weight: 'regular' as const}

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

// Mast-style logo SVG component (same as in Navigation)
function MastLogo({className}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 101 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Mast Sanity"
    >
      <path
        d="M11.9187 26.6316H16.4157L23.1435 9.59964V26.6316H28.03V1.2076H21.5855L14.1849 20.0454L6.81977 1.2076H0.375244V26.6316H5.26175V9.74128L11.9187 26.6316Z"
        fill="currentColor"
      />
      <path
        d="M50.2224 26.6316H55.9941L46.5044 1.2076H40.6264L31.0658 26.6316H36.4835L38.431 21.1785H48.3102L50.2224 26.6316ZM43.4237 7.08557L46.823 16.894H39.9536L43.4237 7.08557Z"
        fill="currentColor"
      />
      <path
        d="M77.9103 18.7353C77.9103 14.9819 75.5025 12.9281 71.0409 12.0429L66.6855 11.1577C64.8442 10.8036 63.2508 10.06 63.2508 8.3249C63.2508 6.55443 64.738 5.06723 67.3583 5.06723C70.0494 5.06723 71.8907 6.87312 72.0678 9.52883H77.5208C77.1667 4.21741 72.9884 0.888916 67.2875 0.888916C61.799 0.888916 57.7978 4.14659 57.7978 8.679C57.7978 12.8927 60.7722 14.9819 64.6318 15.7255L68.8101 16.5399C70.9701 16.9648 72.2094 17.9209 72.2094 19.5143C72.2094 21.568 70.2619 22.772 67.5354 22.772C64.2423 22.772 62.4364 20.9661 62.2948 18.1687H56.8417C57.2312 23.551 61.2325 26.9857 67.6416 26.9857C74.0153 26.9857 77.9103 23.5864 77.9103 18.7353Z"
        fill="currentColor"
      />
      <path
        d="M92.4503 26.6316V6.0587H100.488V1.2076H79.0656V6.0587H87.0681V26.6316H92.4503Z"
        fill="currentColor"
      />
    </svg>
  )
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
    'text-body transition-colors duration-300 hover:text-brand cursor-pointer'

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

// Default footer link columns (shown when no data from Sanity)
const defaultLinkColumns: LinkColumn[] = [
  {
    _key: 'col1',
    links: [
      {_key: '1', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '2', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '3', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '4', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '5', label: 'Footer link', link: {linkType: 'href', href: '#'}},
    ],
  },
  {
    _key: 'col2',
    links: [
      {_key: '1', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '2', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '3', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '4', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '5', label: 'Footer link', link: {linkType: 'href', href: '#'}},
    ],
  },
  {
    _key: 'col3',
    links: [
      {_key: '1', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '2', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '3', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '4', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '5', label: 'Footer link', link: {linkType: 'href', href: '#'}},
    ],
  },
  {
    _key: 'col4',
    links: [
      {_key: '1', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '2', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '3', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '4', label: 'Footer link', link: {linkType: 'href', href: '#'}},
      {_key: '5', label: 'Footer link', link: {linkType: 'href', href: '#'}},
    ],
  },
]

// Default social links
const defaultSocialLinks: SocialLink[] = [
  {_key: 'yt', platform: 'youtube', url: '#'},
  {_key: 'li', platform: 'linkedin', url: '#'},
  {_key: 'x', platform: 'x', url: '#'},
]

export default function FooterNew({data, siteTitle = 'Mast Sanity'}: FooterProps) {
  const currentYear = new Date().getFullYear()
  const hasLogoImage = data?.logoImage?.asset
  const linkColumns = data?.linkColumns?.length ? data.linkColumns : defaultLinkColumns
  const socialLinks = data?.socialLinks?.length ? data.socialLinks : defaultSocialLinks

  return (
    <footer className="border-t border-[var(--primary-border)] bg-[var(--primary-background)] mt-auto">
      <div className="container py-12 md:py-16">
        {/* Top section: Logo/Theme Toggle and Link Columns - matching Mast reference */}
        <div className="flex flex-wrap -mx-3">
          {/* Logo and Theme Toggle column */}
          <div className="w-full md:w-3/12 px-3 mb-8 md:mb-0">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <Link href="/" className="inline-block w-20 text-brand transition-opacity duration-300 hover:opacity-80 mb-auto">
                {hasLogoImage ? (
                  <Image
                    src={urlForImage(data.logoImage)?.width(200).height(50).url() || ''}
                    alt={data.logoImage?.alt || siteTitle}
                    width={80}
                    height={32}
                    className="w-full h-auto"
                  />
                ) : (
                  <MastLogo className="w-full h-auto" />
                )}
              </Link>

              {/* Theme Toggle - at bottom of column */}
              {data?.showThemeToggle !== false && (
                <div className="mt-auto pt-6">
                  <ThemeToggle showLabels />
                </div>
              )}
            </div>
          </div>

          {/* Link columns - taking 9/12 on desktop */}
          <div className="w-full md:w-9/12 px-3">
            <div className="flex flex-wrap -mx-3">
              {linkColumns.map((column) => (
                <div key={column._key} className="w-1/2 md:w-1/4 px-3 mb-6 md:mb-0">
                  <ul className="space-y-2">
                    {column.links?.map((linkItem) => (
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-8 border-[var(--primary-border)] md:my-10" />

        {/* Bottom section: Copyright and Social links */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Copyright */}
          <p className="text-body">
            © <span>{currentYear}</span> {data?.companyName || 'Company'}
          </p>

          {/* Social links */}
          <ul className="flex items-center gap-1">
            {socialLinks.map((social) => (
              <li key={social._key}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center transition-colors duration-300 hover:text-brand cursor-pointer"
                  aria-label={`Visit our ${social.platform} page`}
                >
                  <SocialIcon platform={social.platform} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
