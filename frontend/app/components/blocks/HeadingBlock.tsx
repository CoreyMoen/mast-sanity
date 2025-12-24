import {createElement} from 'react'
import {stegaClean} from 'next-sanity'

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

// Color mapping
const colorClasses: Record<string, string> = {
  default: 'text-gray-900',
  gray: 'text-gray-600',
  white: 'text-white',
  brand: 'text-brand',
  blue: 'text-blue',
}

export default function HeadingBlock({block}: HeadingBlockProps) {
  const {
    text = '',
    level = 'h2',
    size = 'h2',
    align = 'left',
    color = 'default',
  } = block

  // Clean stega encoding from values before using as lookup keys
  const cleanSize = stegaClean(size)
  const cleanAlign = stegaClean(align)
  const cleanColor = stegaClean(color)
  const cleanLevel = stegaClean(level) as HeadingLevel

  const sizeClass = sizeClasses[cleanSize] || sizeClasses.h2
  const alignClass = alignClasses[cleanAlign] || alignClasses.left
  const colorClass = colorClasses[cleanColor] || colorClasses.default
  const className = `${sizeClass} ${alignClass} ${colorClass} mb-4`
  return createElement(cleanLevel, {className}, text)
}
