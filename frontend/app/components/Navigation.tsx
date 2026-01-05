'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import {CaretDown} from '@phosphor-icons/react'
import {urlForImage} from '@/sanity/lib/utils'
import {Button} from './ui/button'
import {cn} from '@/lib/utils'

// Types for the navigation data
interface NavLink {
  linkType?: string
  href?: string
  page?: string
  post?: string
  openInNewTab?: boolean
}

interface DropdownLink {
  _key: string
  label: string
  link?: NavLink
}

interface NavItem {
  _key: string
  label: string
  type: 'link' | 'dropdown'
  link?: NavLink
  dropdownLinks?: DropdownLink[]
}

interface NavigationData {
  logoText?: string
  logoImage?: {
    asset?: {_ref: string}
    alt?: string
  }
  items?: NavItem[]
  showCta?: boolean
  ctaLabel?: string
  ctaLink?: NavLink
  ctaStyle?: 'primary' | 'secondary'
}

interface NavigationProps {
  data: NavigationData | null
  siteTitle?: string
}

// Default navigation items (shown when no data from Sanity)
const defaultNavItems: NavItem[] = [
  {
    _key: 'home',
    label: 'Home',
    type: 'link',
    link: {linkType: 'page', page: ''},
  },
  {
    _key: 'pages',
    label: 'Pages',
    type: 'dropdown',
    dropdownLinks: [
      {_key: 'inspired', label: 'Inspired Layouts', link: {linkType: 'page', page: 'inspired-layouts'}},
      {_key: 'about', label: 'About', link: {linkType: 'page', page: 'about'}},
      {_key: 'contact', label: 'Contact', link: {linkType: 'page', page: 'contact'}},
    ],
  },
  {
    _key: 'blog',
    label: 'Blog',
    type: 'link',
    link: {linkType: 'href', href: '/posts'},
  },
]

const defaultCta = {
  show: true,
  label: 'Get Started',
  link: {linkType: 'href', href: '#'},
  style: 'primary' as const,
}

// Mast-style logo SVG component
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

// Helper to resolve link URL
function resolveLink(link?: NavLink): string {
  if (!link) return '#'
  if (link.linkType === 'href' && link.href) return link.href
  if (link.linkType === 'page' && link.page) return `/${link.page}`
  if (link.linkType === 'post' && link.post) return `/posts/${link.post}`
  return '#'
}

// Navigation link component
function NavLinkItem({
  href,
  openInNewTab,
  children,
  className,
}: {
  href: string
  openInNewTab?: boolean
  children: React.ReactNode
  className?: string
}) {
  const isExternal = href.startsWith('http') || href.startsWith('//')

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

export default function Navigation({data, siteTitle = 'Mast Sanity'}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch with Radix NavigationMenu IDs
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const linkClasses =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-body font-medium transition-colors duration-300 hover:text-brand focus:text-brand focus:outline-none cursor-pointer'

  const dropdownLinkClasses =
    'block px-4 py-2.5 text-body transition-colors duration-300 hover:text-brand hover:bg-muted-background focus:text-brand focus:outline-none cursor-pointer'

  // Determine what logo to show - MAST SVG is the default
  const hasLogoImage = data?.logoImage?.asset

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main"
        className="fixed left-1/2 top-0 z-[9999] -translate-x-1/2 -translate-y-full rounded-b-lg bg-brand px-6 py-3 text-sm font-medium uppercase tracking-wider text-white opacity-0 transition-all duration-300 focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
      >
        Skip to Main Content
      </a>

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--primary-border)] bg-[var(--primary-background)]/95 backdrop-blur-sm">
        <div className="container">
          <div className="flex h-16 items-center justify-between md:h-20">
            {/* Logo - Shows uploaded image or MAST SVG as default */}
            <Link href="/" className="flex-shrink-0 text-brand transition-opacity duration-300 hover:opacity-80">
              {hasLogoImage ? (
                <Image
                  src={urlForImage(data.logoImage)?.width(200).height(50).url() || ''}
                  alt={data.logoImage?.alt || siteTitle}
                  width={80}
                  height={32}
                  className="w-20 h-auto"
                />
              ) : (
                // Show MAST SVG logo as default - 5rem (80px) width matching Webflow reference
                <MastLogo className="w-20 h-auto" />
              )}
            </Link>

            {/* Desktop Navigation and CTA - aligned to the right */}
            <div className="hidden md:flex items-center gap-4 ml-auto">
              {/* Only render NavigationMenu after mount to prevent hydration mismatch */}
              {mounted ? (
                <NavigationMenu.Root className="relative">
                  <NavigationMenu.List className="flex items-center">
                    {(data?.items?.length ? data.items : defaultNavItems).map((item) => (
                      <NavigationMenu.Item key={item._key} className="relative">
                        {item.type === 'dropdown' && item.dropdownLinks?.length ? (
                          <>
                            <NavigationMenu.Trigger
                              className={cn(
                                linkClasses,
                                'group data-[state=open]:text-brand'
                              )}
                            >
                              {item.label}
                              <CaretDown
                                className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180"
                                weight="bold"
                              />
                            </NavigationMenu.Trigger>
                            <NavigationMenu.Content className="absolute left-0 top-full mt-2 min-w-[200px] rounded-lg border border-border bg-background py-1 shadow-lg">
                              {item.dropdownLinks.map((dropdownLink) => (
                                <NavigationMenu.Link key={dropdownLink._key} asChild>
                                  <NavLinkItem
                                    href={resolveLink(dropdownLink.link)}
                                    openInNewTab={dropdownLink.link?.openInNewTab}
                                    className={dropdownLinkClasses}
                                  >
                                    {dropdownLink.label}
                                  </NavLinkItem>
                                </NavigationMenu.Link>
                              ))}
                            </NavigationMenu.Content>
                          </>
                        ) : (
                          <NavigationMenu.Link asChild>
                            <NavLinkItem
                              href={resolveLink(item.link)}
                              openInNewTab={item.link?.openInNewTab}
                              className={linkClasses}
                            >
                              {item.label}
                            </NavLinkItem>
                          </NavigationMenu.Link>
                        )}
                      </NavigationMenu.Item>
                    ))}
                  </NavigationMenu.List>

                  <NavigationMenu.Viewport className="absolute top-full left-0" />
                </NavigationMenu.Root>
              ) : (
                // SSR fallback - simple nav links without Radix
                <nav className="flex items-center">
                  {(data?.items?.length ? data.items : defaultNavItems).map((item) => (
                    <NavLinkItem
                      key={item._key}
                      href={resolveLink(item.link)}
                      openInNewTab={item.link?.openInNewTab}
                      className={linkClasses}
                    >
                      {item.label}
                      {item.type === 'dropdown' && (
                        <CaretDown className="h-4 w-4" weight="bold" />
                      )}
                    </NavLinkItem>
                  ))}
                </nav>
              )}

              {/* CTA Button */}
              {(data?.showCta ?? defaultCta.show) && (data?.ctaLabel || defaultCta.label) && (
                <Button
                  variant={data?.ctaStyle || defaultCta.style}
                  colorScheme="brand"
                  asChild
                >
                  <NavLinkItem
                    href={resolveLink(data?.ctaLink || defaultCta.link)}
                    openInNewTab={data?.ctaLink?.openInNewTab}
                  >
                    {data?.ctaLabel || defaultCta.label}
                  </NavLinkItem>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="relative z-50 flex h-10 w-10 cursor-pointer items-center justify-center md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="relative h-5 w-6">
                <span
                  className={cn(
                    'absolute left-0 h-0.5 w-full bg-foreground transition-all duration-300',
                    mobileMenuOpen ? 'top-2.5 rotate-45' : 'top-0'
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 top-2.5 h-0.5 w-full bg-foreground transition-opacity duration-300',
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 h-0.5 w-full bg-foreground transition-all duration-300',
                    mobileMenuOpen ? 'top-2.5 -rotate-45' : 'top-5'
                  )}
                />
              </div>
            </button>
          </div>
        </div>

      </header>

      {/* Mobile Menu - Full screen overlay with fade */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-[var(--primary-background)] transition-opacity duration-300 md:hidden',
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Mobile menu header with logo, CTA, and close button */}
        <div className="border-b border-[var(--primary-border)]">
          <div className="container">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <Link
                href="/"
                className="flex-shrink-0 text-brand transition-opacity duration-300 hover:opacity-80"
                onClick={() => setMobileMenuOpen(false)}
              >
                {hasLogoImage ? (
                  <Image
                    src={urlForImage(data.logoImage)?.width(200).height(50).url() || ''}
                    alt={data.logoImage?.alt || siteTitle}
                    width={80}
                    height={32}
                    className="w-20 h-auto"
                  />
                ) : (
                  <MastLogo className="w-20 h-auto" />
                )}
              </Link>

              {/* CTA and Close button */}
              <div className="flex items-center gap-4">
                {(data?.showCta ?? defaultCta.show) && (data?.ctaLabel || defaultCta.label) && (
                  <Button
                    variant={data?.ctaStyle || defaultCta.style}
                    colorScheme="brand"
                    asChild
                  >
                    <NavLinkItem
                      href={resolveLink(data?.ctaLink || defaultCta.link)}
                      openInNewTab={data?.ctaLink?.openInNewTab}
                    >
                      <span onClick={() => setMobileMenuOpen(false)}>{data?.ctaLabel || defaultCta.label}</span>
                    </NavLinkItem>
                  </Button>
                )}

                {/* Close button */}
                <button
                  type="button"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu content */}
        <div className="container h-[calc(100%-4rem)] overflow-y-auto py-6">
          <nav className="flex flex-col gap-4">
            {(data?.items?.length ? data.items : defaultNavItems).map((item) => (
              <div key={item._key}>
                {item.type === 'dropdown' && item.dropdownLinks?.length ? (
                  <MobileDropdown item={item} onLinkClick={() => setMobileMenuOpen(false)} />
                ) : (
                  <NavLinkItem
                    href={resolveLink(item.link)}
                    openInNewTab={item.link?.openInNewTab}
                    className="block py-3 text-h4 font-medium transition-colors hover:text-brand"
                  >
                    <span onClick={() => setMobileMenuOpen(false)}>{item.label}</span>
                  </NavLinkItem>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}

// Mobile dropdown component
function MobileDropdown({
  item,
  onLinkClick,
}: {
  item: NavItem
  onLinkClick: () => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between py-3 text-h4 font-medium transition-colors hover:text-brand"
        aria-expanded={isOpen}
      >
        {item.label}
        <CaretDown
          className={cn(
            'h-5 w-5 transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
          weight="bold"
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {/* Bordered container for dropdown links - matches Mast Webflow style */}
        <div className="mt-2 rounded-lg border border-[var(--primary-border)] p-2">
          {item.dropdownLinks?.map((dropdownLink) => (
            <NavLinkItem
              key={dropdownLink._key}
              href={resolveLink(dropdownLink.link)}
              openInNewTab={dropdownLink.link?.openInNewTab}
              className="block px-4 py-3 text-body transition-colors hover:text-brand"
            >
              <span onClick={onLinkClick}>{dropdownLink.label}</span>
            </NavLinkItem>
          ))}
        </div>
      </div>
    </div>
  )
}
