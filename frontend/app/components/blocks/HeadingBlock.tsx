import {createElement} from 'react'
import {stegaClean} from 'next-sanity'
import {cn} from '@/lib/utils'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

interface HeadingBlockProps {
  block: {
    _key: string
    _type: string
    text?: string
    level?: HeadingLevel
    size?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    align?: 'left' | 'center' | 'right'
    color?: 'default' | 'gray' | 'white' | 'brand' | 'blue'
    customStyle?: string
  }
  index: number
}

// Parse CSS string to React style object
function parseCustomStyle(cssString?: string): React.CSSProperties | undefined {
  if (!cssString) return undefined
  try {
    return Object.fromEntries(
      cssString
        .split(';')
        .filter((s) => s.trim())
        .map((s) => {
          const [key, ...valueParts] = s.split(':')
          const value = valueParts.join(':').trim()
          const camelKey = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase())
          return [camelKey, value]
        })
    )
  } catch {
    return undefined
  }
}

// Size mapping for visual appearance using Mast typography classes
const sizeClasses: Record<string, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
}

// Text alignment - left is default (no class needed)
const alignClasses: Record<string, string> = {
  left: '',
  center: 'u-text-center',
  right: 'u-text-right',
}

// Color mapping - default inherits from parent (no class needed)
const colorClasses: Record<string, string> = {
  default: '',
  gray: 'u-text-muted',
  white: 'u-text-white',
  brand: 'u-text-brand',
  blue: 'u-text-blue',
}

export default function HeadingBlock({block}: HeadingBlockProps) {
  const {
    text = '',
    level = 'h2',
    size = 'h2',
    align = 'left',
    color = 'default',
    customStyle,
  } = block

  // Clean stega encoding from values before using as lookup keys
  const cleanSize = stegaClean(size)
  const cleanAlign = stegaClean(align)
  const cleanColor = stegaClean(color)
  const cleanLevel = stegaClean(level) as HeadingLevel

  const sizeClass = sizeClasses[cleanSize] || sizeClasses.h2
  const alignClass = alignClasses[cleanAlign] || ''
  const colorClass = colorClasses[cleanColor] || ''
  const className = cn(sizeClass, alignClass, colorClass)
  const inlineStyle = parseCustomStyle(customStyle)
  return createElement(cleanLevel, {className, style: inlineStyle}, text)
}
