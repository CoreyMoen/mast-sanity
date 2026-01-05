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

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
export type CardVariant = 'default' | 'outline' | 'filled' | 'ghost'

interface CardProps {
  children: React.ReactNode
  /** Padding size - uses fluid CSS variables */
  padding?: CardPadding
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

// Simplified padding - uses fluid CSS variable-based sizing
const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3 md:p-4',
  md: 'card-padding', // Uses fluid clamp() from CSS
  lg: 'p-6 md:p-8 lg:p-10',
}

// Variant classes
const variantClasses: Record<CardVariant, string> = {
  default: 'bg-card-background border border-border',
  outline: 'bg-transparent border border-border',
  filled: 'bg-muted-background border border-transparent',
  ghost: 'bg-transparent border border-transparent',
}

export function Card({
  children,
  padding = 'md',
  variant = 'default',
  href,
  openInNewTab = false,
  hoverEffect = false,
  className,
}: CardProps) {
  const baseClasses = cn(
    'rounded-[var(--component-card-radius)] overflow-hidden flex flex-col relative',
    'transition-all duration-300 ease-out',
    variantClasses[variant],
    paddingClasses[padding],
    hoverEffect && 'hover:bg-muted-background hover:border-border',
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
  return <div className={cn('mt-4 pt-4 border-t border-border', className)}>{children}</div>
}

export default Card
