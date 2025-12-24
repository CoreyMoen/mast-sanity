import {createElement} from 'react'
import {stegaClean} from 'next-sanity'

interface HeadingBlockProps {
  block: {
    _key: string
    _type: string
    text?: string
    level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
    align?: 'left' | 'center' | 'right'
    color?: 'default' | 'gray' | 'white' | 'brand' | 'blue'
  }
  index: number
}

// Size mapping for visual appearance
const sizeClasses: Record<string, string> = {
  xl: 'text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight',
  lg: 'text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight',
  md: 'text-2xl md:text-3xl font-bold',
  sm: 'text-xl md:text-2xl font-semibold',
  xs: 'text-lg md:text-xl font-semibold',
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
    size = 'lg',
    align = 'left',
    color = 'default',
  } = block

  // Clean stega encoding from values before using as lookup keys
  const cleanSize = stegaClean(size)
  const cleanAlign = stegaClean(align)
  const cleanColor = stegaClean(color)
  const cleanLevel = stegaClean(level) as keyof JSX.IntrinsicElements

  const sizeClass = sizeClasses[cleanSize] || sizeClasses.lg
  const alignClass = alignClasses[cleanAlign] || alignClasses.left
  const colorClass = colorClasses[cleanColor] || colorClasses.default
  const className = `${sizeClass} ${alignClass} ${colorClass} mb-4`
  return createElement(cleanLevel, {className}, text)
}
