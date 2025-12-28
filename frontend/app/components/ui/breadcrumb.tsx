import * as React from 'react'
import Link from 'next/link'
import {CaretRight} from '@phosphor-icons/react/dist/ssr'
import {cn} from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: 'slash' | 'chevron'
  className?: string
}

interface BreadcrumbLinkProps {
  href: string
  children: React.ReactNode
  isExternal?: boolean
}

function BreadcrumbLink({href, children, isExternal}: BreadcrumbLinkProps) {
  const className =
    'text-p-sm font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground hover:underline'

  if (isExternal) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
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

/**
 * Breadcrumb component for navigation hierarchy
 *
 * Features:
 * - Accessible with proper ARIA attributes and schema.org markup
 * - Eyebrow-style typography (uppercase, letter-spacing)
 * - Two separator options: slash or chevron
 * - Last item is not clickable (current page)
 */
export function Breadcrumb({items, separator = 'chevron', className}: BreadcrumbProps) {
  if (!items || items.length === 0) return null

  const separatorElement =
    separator === 'slash' ? (
      <span className="mx-2 text-muted-foreground" aria-hidden="true">
        /
      </span>
    ) : (
      <CaretRight className="mx-2 h-3 w-3 text-muted-foreground" aria-hidden="true" weight="bold" />
    )

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        className="flex flex-wrap items-center"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isExternal = item.href?.startsWith('http')

          return (
            <li
              key={index}
              itemScope
              itemProp="itemListElement"
              itemType="https://schema.org/ListItem"
              className="flex items-center"
            >
              {item.href && !isLast ? (
                <>
                  <BreadcrumbLink href={item.href} isExternal={isExternal}>
                    <span itemProp="name">{item.label}</span>
                  </BreadcrumbLink>
                  <meta itemProp="item" content={item.href} />
                </>
              ) : (
                <span
                  className="text-p-sm font-medium uppercase tracking-[0.1em] text-muted-foreground"
                  itemProp="name"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              <meta itemProp="position" content={String(index + 1)} />
              {!isLast && separatorElement}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Export individual parts for flexibility
export const BreadcrumbRoot = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
    <ol
      itemScope
      itemType="https://schema.org/BreadcrumbList"
      className="flex flex-wrap items-center"
    >
      {children}
    </ol>
  </nav>
)

export const BreadcrumbItem = ({
  children,
  position,
}: {
  children: React.ReactNode
  position: number
}) => (
  <li
    itemScope
    itemProp="itemListElement"
    itemType="https://schema.org/ListItem"
    className="flex items-center"
  >
    {children}
    <meta itemProp="position" content={String(position)} />
  </li>
)

export const BreadcrumbSeparator = ({type = 'chevron'}: {type?: 'slash' | 'chevron'}) =>
  type === 'slash' ? (
    <span className="mx-2 text-muted-foreground" aria-hidden="true">
      /
    </span>
  ) : (
    <CaretRight className="mx-2 h-3 w-3 text-muted-foreground" aria-hidden="true" weight="bold" />
  )
