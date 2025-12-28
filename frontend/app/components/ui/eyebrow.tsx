import * as React from 'react'
import {cn} from '@/lib/utils'

type EyebrowVariant = 'text' | 'overline' | 'pill'
type EyebrowColor = 'default' | 'brand' | 'blue' | 'muted'

interface EyebrowProps {
  children: React.ReactNode
  variant?: EyebrowVariant
  color?: EyebrowColor
  className?: string
}

const variantClasses: Record<EyebrowVariant, string> = {
  text: '',
  overline: 'border-t pt-2 inline-block',
  pill: 'px-3 py-1 rounded-full inline-block',
}

const colorClasses: Record<EyebrowColor, Record<EyebrowVariant, string>> = {
  default: {
    text: 'text-foreground',
    overline: 'text-foreground border-foreground',
    pill: 'text-foreground bg-muted-background',
  },
  brand: {
    text: 'text-brand',
    overline: 'text-brand border-brand',
    pill: 'text-white bg-brand',
  },
  blue: {
    text: 'text-blue',
    overline: 'text-blue border-blue',
    pill: 'text-white bg-blue',
  },
  muted: {
    text: 'text-muted-foreground',
    overline: 'text-muted-foreground border-border',
    pill: 'text-muted-foreground bg-muted-background',
  },
}

/**
 * Eyebrow component - small uppercase text typically used above headings
 *
 * Variants:
 * - text: Simple uppercase text
 * - overline: Text with a border line above
 * - pill: Text in a pill/badge shape
 */
export function Eyebrow({
  children,
  variant = 'text',
  color = 'default',
  className,
}: EyebrowProps) {
  return (
    <span
      className={cn(
        // Base styles matching Mast eyebrow
        'text-p-sm font-medium uppercase tracking-[0.1em] leading-tight',
        variantClasses[variant],
        colorClasses[color][variant],
        className
      )}
    >
      {children}
    </span>
  )
}
