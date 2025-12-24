import * as React from 'react'
import Link from 'next/link'
import {cn} from '@/lib/utils'

/**
 * Card component - Mast design system card container
 *
 * A flexible card component that can contain any content.
 * Supports responsive padding and optional link functionality.
 *
 * @example
 * // Basic card
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 *
 * @example
 * // Card with custom padding
 * <Card paddingDesktop="8" paddingMobile="4">
 *   <p>Content with responsive padding</p>
 * </Card>
 *
 * @example
 * // Clickable card with link
 * <Card href="/page" hoverEffect>
 *   <h3>Click me</h3>
 * </Card>
 */

export type CardPadding = '0' | '4' | '6' | '8' | '12' | '16'
export type CardVariant = 'default' | 'outline' | 'filled' | 'ghost'

interface CardProps {
  children: React.ReactNode
  /** Padding on desktop (lg+) */
  paddingDesktop?: CardPadding
  /** Padding on mobile/tablet */
  paddingMobile?: CardPadding
  /** Card visual style */
  variant?: CardVariant
  /** Makes the entire card a link */
  href?: string
  /** Open link in new tab */
  openInNewTab?: boolean
  /** Show hover effect (background change) */
  hoverEffect?: boolean
  /** Additional CSS classes */
  className?: string
}

// Desktop padding classes (lg breakpoint)
const paddingDesktopClasses: Record<CardPadding, string> = {
  '0': 'lg:p-0',
  '4': 'lg:p-4',
  '6': 'lg:p-6',
  '8': 'lg:p-8',
  '12': 'lg:p-12',
  '16': 'lg:p-16',
}

// Mobile padding classes (base)
const paddingMobileClasses: Record<CardPadding, string> = {
  '0': 'p-0',
  '4': 'p-4',
  '6': 'p-6',
  '8': 'p-8',
  '12': 'p-12',
  '16': 'p-16',
}

// Variant classes
const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-300',
  outline: 'bg-transparent border border-gray-300',
  filled: 'bg-gray-50 border border-transparent',
  ghost: 'bg-transparent border border-transparent',
}

export function Card({
  children,
  paddingDesktop = '6',
  paddingMobile = '4',
  variant = 'default',
  href,
  openInNewTab = false,
  hoverEffect = false,
  className,
}: CardProps) {
  const baseClasses = cn(
    'rounded-lg overflow-hidden flex flex-col relative',
    'transition-all duration-300 ease-out',
    variantClasses[variant],
    paddingMobileClasses[paddingMobile],
    paddingDesktopClasses[paddingDesktop],
    hoverEffect && 'hover:bg-gray-100 hover:border-gray-400',
    href && 'cursor-pointer',
    className,
  )

  // If href is provided, render as a link
  if (href) {
    const isExternal = href.startsWith('http') || href.startsWith('//')

    if (isExternal || openInNewTab) {
      return (
        <a
          href={href}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
          className={cn(baseClasses, 'no-underline text-inherit')}
        >
          {children}
        </a>
      )
    }

    return (
      <Link href={href} className={cn(baseClasses, 'no-underline text-inherit')}>
        {children}
      </Link>
    )
  }

  // Default: render as div
  return <div className={baseClasses}>{children}</div>
}

/**
 * CardHeader - Optional header section for cards
 */
interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({children, className}: CardHeaderProps) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

/**
 * CardContent - Main content area for cards
 */
interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({children, className}: CardContentProps) {
  return <div className={cn('flex-1', className)}>{children}</div>
}

/**
 * CardFooter - Optional footer section for cards
 */
interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({children, className}: CardFooterProps) {
  return <div className={cn('mt-4 pt-4 border-t border-gray-200', className)}>{children}</div>
}

export default Card
