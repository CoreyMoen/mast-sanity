import {createElement} from 'react'
import {stegaClean} from 'next-sanity'
import {parseCustomStyle} from '@/app/lib/parseCustomStyle'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

interface HeadingBlockProps {
  block: {
    _key: string
    _type: string
    text?: string
    level?: HeadingLevel
    /** Visual size - 'inherit' uses the heading level's default size */
    size?: 'inherit' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    align?: 'left' | 'center' | 'right'
    color?: 'default' | 'gray' | 'white' | 'brand' | 'blue'
    customStyle?: string
  }
  index: number
}

// Size mapping for visual appearance using fluid typography (Mast-style)
const sizeClasses: Record<string, string> = {
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
  h5: 'text-h5',
  h6: 'text-h6',
}

// Text alignment
const alignClasses: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

// Color mapping - using semantic colors for theme support
const colorClasses: Record<string, string> = {
  default: 'text-foreground',
  gray: 'text-muted-foreground',
  white: 'text-white',
  brand: 'text-brand',
  blue: 'text-blue',
}

export default function HeadingBlock({block}: HeadingBlockProps) {
  const {
    text = '',
    level = 'h2',
    size = 'inherit',
    align = 'left',
    color = 'default',
    customStyle,
  } = block

  // Clean stega encoding from values before using as lookup keys
  const cleanSize = stegaClean(size)
  const cleanAlign = stegaClean(align)
  const cleanColor = stegaClean(color)
  const cleanLevel = stegaClean(level) as HeadingLevel

  // If size is 'inherit' or not set, use the heading level for visual size
  const effectiveSize = cleanSize === 'inherit' || !cleanSize ? cleanLevel : cleanSize
  const sizeClass = sizeClasses[effectiveSize] || sizeClasses[cleanLevel]
  const alignClass = alignClasses[cleanAlign] || alignClasses.left
  const colorClass = colorClasses[cleanColor] || colorClasses.default
  const className = `${sizeClass} ${alignClass} ${colorClass}`
  const inlineStyle = parseCustomStyle(customStyle)
  return createElement(cleanLevel, {className, style: inlineStyle}, text)
}
