'use client'

import {useState} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {List, X, CaretDown} from '@phosphor-icons/react/dist/ssr'

import {linkResolver, urlForImage} from '@/sanity/lib/utils'
import {Button} from './ui/button'

interface NavLink {
  _key: string
  label: string
  link?: {
    linkType?: string
    href?: string
    openInNewTab?: boolean
    page?: string
    post?: string
  }
}

interface NavItem {
  _key: string
  label: string
  type: 'link' | 'dropdown'
  link?: {
    linkType?: string
    href?: string
    openInNewTab?: boolean
    page?: string
    post?: string
  }
  dropdownLinks?: NavLink[]
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
  ctaLink?: {
    linkType?: string
    href?: string
    openInNewTab?: boolean
    page?: string
    post?: string
  }
  ctaStyle?: 'primary' | 'secondary'
}

interface HeaderProps {
  navigation: NavigationData | null
}

export default function Header({navigation}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  if (!navigation) {
    return null
  }

  const {logoText, logoImage, items, showCta, ctaLabel, ctaLink, ctaStyle} = navigation

  const logoImageUrl = logoImage?.asset?._ref ? urlForImage(logoImage)?.width(200).url() : null

  return (
    <header className="fixed z-50 h-24 inset-x-0 top-0 bg-background/80 flex items-center backdrop-blur-lg border-b border-border">
      <div className="container py-6 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-5">
          {/* Logo */}
          <Link className="flex items-center gap-2" href="/">
            {logoImageUrl ? (
              <Image
                src={logoImageUrl}
                alt={logoImage?.alt || 'Logo'}
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            ) : (
              <span className="text-lg sm:text-2xl font-semibold">{logoText || 'Site Title'}</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <ul role="list" className="flex items-center gap-6">
              {items?.map((item) => (
                <li key={item._key} className="relative">
                  {item.type === 'dropdown' ? (
                    <div
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item._key)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button className="text-body flex items-center gap-1 text-foreground hover:text-brand transition-colors">
                        {item.label}
                        <CaretDown
                          className={`h-4 w-4 transition-transform ${openDropdown === item._key ? 'rotate-180' : ''}`}
                          weight="bold"
                        />
                      </button>
                      {openDropdown === item._key && item.dropdownLinks && (
                        <div className="absolute top-full left-0 mt-2 py-2 bg-background border border-border rounded-lg shadow-lg min-w-[200px]">
                          {item.dropdownLinks.map((dropdownLink) => {
                            const href = linkResolver(dropdownLink.link)
                            return href ? (
                              <Link
                                key={dropdownLink._key}
                                href={href}
                                target={dropdownLink.link?.openInNewTab ? '_blank' : undefined}
                                rel={dropdownLink.link?.openInNewTab ? 'noopener noreferrer' : undefined}
                                className="block px-4 py-2 text-body text-foreground hover:bg-muted-background hover:text-brand transition-colors"
                              >
                                {dropdownLink.label}
                              </Link>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    (() => {
                      const href = linkResolver(item.link)
                      return href ? (
                        <Link
                          href={href}
                          target={item.link?.openInNewTab ? '_blank' : undefined}
                          rel={item.link?.openInNewTab ? 'noopener noreferrer' : undefined}
                          className="text-body text-foreground hover:text-brand transition-colors"
                        >
                          {item.label}
                        </Link>
                      ) : null
                    })()
                  )}
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            {showCta && ctaLabel && ctaLink && (
              <Button
                asChild
                variant={ctaStyle === 'secondary' ? 'secondary' : 'default'}
              >
                <Link
                  href={linkResolver(ctaLink) || '#'}
                  target={ctaLink?.openInNewTab ? '_blank' : undefined}
                  rel={ctaLink?.openInNewTab ? 'noopener noreferrer' : undefined}
                >
                  {ctaLabel}
                </Link>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" weight="bold" />
            ) : (
              <List className="h-6 w-6" weight="bold" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <ul role="list" className="flex flex-col gap-4">
              {items?.map((item) => (
                <li key={item._key}>
                  {item.type === 'dropdown' ? (
                    <div>
                      <button
                        className="text-body flex items-center gap-1 text-foreground w-full"
                        onClick={() =>
                          setOpenDropdown(openDropdown === item._key ? null : item._key)
                        }
                      >
                        {item.label}
                        <CaretDown
                          className={`h-4 w-4 transition-transform ${openDropdown === item._key ? 'rotate-180' : ''}`}
                          weight="bold"
                        />
                      </button>
                      {openDropdown === item._key && item.dropdownLinks && (
                        <div className="mt-2 ml-4 flex flex-col gap-2">
                          {item.dropdownLinks.map((dropdownLink) => {
                            const href = linkResolver(dropdownLink.link)
                            return href ? (
                              <Link
                                key={dropdownLink._key}
                                href={href}
                                target={dropdownLink.link?.openInNewTab ? '_blank' : undefined}
                                rel={
                                  dropdownLink.link?.openInNewTab ? 'noopener noreferrer' : undefined
                                }
                                className="text-body text-muted-foreground hover:text-brand transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {dropdownLink.label}
                              </Link>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    (() => {
                      const href = linkResolver(item.link)
                      return href ? (
                        <Link
                          href={href}
                          target={item.link?.openInNewTab ? '_blank' : undefined}
                          rel={item.link?.openInNewTab ? 'noopener noreferrer' : undefined}
                          className="text-body text-foreground hover:text-brand transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ) : null
                    })()
                  )}
                </li>
              ))}
            </ul>

            {/* Mobile CTA Button */}
            {showCta && ctaLabel && ctaLink && (
              <div className="mt-4">
                <Button
                  asChild
                  variant={ctaStyle === 'secondary' ? 'secondary' : 'default'}
                  className="w-full"
                >
                  <Link
                    href={linkResolver(ctaLink) || '#'}
                    target={ctaLink?.openInNewTab ? '_blank' : undefined}
                    rel={ctaLink?.openInNewTab ? 'noopener noreferrer' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {ctaLabel}
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
