import * as React from 'react'
import Link from 'next/link'
import {cn} from '@/lib/utils'

/**
 * Card component - Mast design system card container
 *
 * A flexible card component that can contain any content.
 * Supports padding variants and optional link functionality.
 *
 * @example
 * // Basic card
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 *
 * @example
 * // Card with large padding
 * <Card padding="lg">
 *   <p>Content with large padding</p>
 * </Card>
 *
 * @example
 * // Clickable card with link
 * <Card href="/page" hoverEffect>
 *   <h3>Click me</h3>
 * </Card>
 */

export type CardPadding = '0' | 'sm' | 'md' | 'lg'
export type CardVariant = 'default' | 'outline' | 'filled' | 'ghost'

interface CardProps {
  children: React.ReactNode
  /** Padding size for card body */
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

// Mast card variant classes - default has border + background (no class needed)
const variantClasses: Record<CardVariant, string> = {
  default: '',
  outline: 'cc-outline',
  filled: 'cc-filled',
  ghost: 'cc-ghost',
}

// Mast card-body padding classes - md is default (no class needed)
const paddingClasses: Record<CardPadding, string> = {
  '0': 'cc-p-0',
  'sm': 'cc-p-sm',
  'md': '',
  'lg': 'cc-p-lg',
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
  const cardClasses = cn(
    'card',
    variantClasses[variant],
    hoverEffect && 'cc-hover',
    className,
  )

  const bodyClasses = cn(
    'card-body',
    paddingClasses[padding],
  )

  const content = <div className={bodyClasses}>{children}</div>

  // If href is provided, render as a link
  if (href) {
    const isExternal = href.startsWith('http') || href.startsWith('//')

    if (isExternal || openInNewTab) {
      return (
        <a
          href={href}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
          className={cardClasses}
        >
          {content}
        </a>
      )
    }

    return (
      <Link href={href} className={cardClasses}>
        {content}
      </Link>
    )
  }

  // Default: render as div
  return <div className={cardClasses}>{content}</div>
}

/**
 * CardHeader - Optional header section for cards
 */
interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({children, className}: CardHeaderProps) {
  return <div className={cn('card-header', className)}>{children}</div>
}

/**
 * CardContent - Main content area for cards
 */
interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({children, className}: CardContentProps) {
  return <div className={cn('card-content', className)}>{children}</div>
}

/**
 * CardFooter - Optional footer section for cards
 */
interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({children, className}: CardFooterProps) {
  return <div className={cn('card-footer', className)}>{children}</div>
}

export default Card
