import {type PortableTextBlock, stegaClean} from 'next-sanity'
import PortableText from '@/app/components/PortableText'
import {parseCustomStyle} from '@/app/lib/parseCustomStyle'

interface RichTextBlockProps {
  block: {
    _key: string
    _type: string
    content?: PortableTextBlock[]
    align?: 'left' | 'center' | 'right'
    size?: 'inherit' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'xl' | 'lg' | 'base' | 'sm'
    maxWidth?: 'none' | 'prose' | 'prose-lg' | 'prose-xl'
    color?: 'default' | 'gray' | 'white' | 'brand' | 'blue'
    customStyle?: string
  }
  index: number
}

// Text alignment
const alignClasses: Record<string, string> = {
  left: 'text-left',
  center: 'text-center mx-auto',
  right: 'text-right ml-auto',
}

// Text sizes (using design system heading and paragraph utilities)
const sizeClasses: Record<string, string> = {
  // Default - same as base
  inherit: 'text-body',
  // Heading sizes - use design system heading variables
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
  h5: 'text-h5',
  h6: 'text-h6',
  // Paragraph sizes - use design system paragraph utilities
  xl: 'text-p-xl',
  lg: 'text-p-lg',
  base: 'text-body',
  sm: 'text-p-sm',
}

// Max width for readability
const maxWidthClasses: Record<string, string> = {
  none: '',
  prose: 'max-w-prose',
  'prose-lg': 'max-w-[80ch]',
  'prose-xl': 'max-w-[90ch]',
}

// Text colors
const colorClasses: Record<string, string> = {
  default: 'text-foreground',
  gray: 'text-muted-foreground',
  white: 'text-white',
  brand: 'text-brand',
  blue: 'text-blue',
}

export default function RichTextBlock({block}: RichTextBlockProps) {
  const {
    content,
    align = 'left',
    size = 'inherit',
    maxWidth = 'none',
    color = 'default',
    customStyle,
  } = block

  if (!content || content.length === 0) {
    return null
  }

  // Clean stega encoding from values before using as lookup keys
  const cleanAlign = stegaClean(align)
  const cleanSize = stegaClean(size)
  const cleanMaxWidth = stegaClean(maxWidth)
  const cleanColor = stegaClean(color)

  const alignClass = alignClasses[cleanAlign] || alignClasses.left
  const sizeClass = sizeClasses[cleanSize] || sizeClasses.inherit
  const maxWidthClass = maxWidthClasses[cleanMaxWidth] || ''
  const colorClass = colorClasses[cleanColor] || colorClasses.default
  const inlineStyle = parseCustomStyle(customStyle)

  return (
    <div className={`${alignClass} ${maxWidthClass} ${colorClass} ${sizeClass}`} style={inlineStyle}>
      <PortableText value={content} disableProse />
    </div>
  )
}
