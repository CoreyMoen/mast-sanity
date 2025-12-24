'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import {CaretDown, List, X} from '@phosphor-icons/react'
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

export default function Navigation({data, siteTitle = 'Site'}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const linkClasses =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-body font-medium transition-colors duration-300 hover:text-brand focus:text-brand focus:outline-none'

  const dropdownLinkClasses =
    'block px-4 py-2.5 text-body transition-colors duration-300 hover:text-brand hover:bg-gray-50 focus:text-brand focus:outline-none'

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main"
        className="fixed left-1/2 top-0 z-[9999] -translate-x-1/2 -translate-y-full bg-brand px-4 py-2 text-white opacity-0 transition-all duration-300 focus:translate-y-2 focus:opacity-100"
      >
        Skip to Main Content
      </a>

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="container">
          <div className="flex h-16 items-center justify-between md:h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
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

            {/* Desktop Navigation */}
            <NavigationMenu.Root className="hidden md:flex">
              <NavigationMenu.List className="flex items-center">
                {data?.items?.map((item) => (
                  <NavigationMenu.Item key={item._key}>
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
                        <NavigationMenu.Content className="absolute left-0 top-full mt-2 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg data-[motion=from-end]:animate-in data-[motion=from-start]:animate-in data-[motion=to-end]:animate-out data-[motion=to-start]:animate-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52">
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

              <NavigationMenu.Viewport className="absolute left-0 top-full flex justify-center" />
            </NavigationMenu.Root>

            {/* CTA Button (Desktop) */}
            <div className="hidden items-center gap-4 md:flex">
              {data?.showCta && data.ctaLabel && (
                <Button
                  variant={data.ctaStyle || 'primary'}
                  colorScheme="brand"
                  size="md"
                  asChild
                >
                  <NavLinkItem
                    href={resolveLink(data.ctaLink)}
                    openInNewTab={data.ctaLink?.openInNewTab}
                  >
                    {data.ctaLabel}
                  </NavLinkItem>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="relative z-50 flex h-10 w-10 items-center justify-center md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="relative h-5 w-6">
                <span
                  className={cn(
                    'absolute left-0 h-0.5 w-full bg-black transition-all duration-300',
                    mobileMenuOpen ? 'top-2.5 rotate-45' : 'top-0'
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 top-2.5 h-0.5 w-full bg-black transition-opacity duration-300',
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 h-0.5 w-full bg-black transition-all duration-300',
                    mobileMenuOpen ? 'top-2.5 -rotate-45' : 'top-5'
                  )}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'fixed inset-0 top-16 z-40 bg-white transition-transform duration-300 md:hidden md:top-20',
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="container h-full overflow-y-auto py-6">
            <nav className="flex flex-col gap-2">
              {data?.items?.map((item) => (
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

              {data?.showCta && data.ctaLabel && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant={data.ctaStyle || 'primary'}
                    colorScheme="brand"
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <NavLinkItem
                      href={resolveLink(data.ctaLink)}
                      openInNewTab={data.ctaLink?.openInNewTab}
                    >
                      <span onClick={() => setMobileMenuOpen(false)}>{data.ctaLabel}</span>
                    </NavLinkItem>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>
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
        className="flex w-full items-center justify-between py-3 text-h4 font-medium transition-colors hover:text-brand"
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
          isOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="pl-4 pb-2">
          {item.dropdownLinks?.map((dropdownLink) => (
            <NavLinkItem
              key={dropdownLink._key}
              href={resolveLink(dropdownLink.link)}
              openInNewTab={dropdownLink.link?.openInNewTab}
              className="block py-2.5 text-body text-gray-600 transition-colors hover:text-brand"
            >
              <span onClick={onLinkClick}>{dropdownLink.label}</span>
            </NavLinkItem>
          ))}
        </div>
      </div>
    </div>
  )
}
