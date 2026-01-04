import {type PortableTextBlock, stegaClean} from 'next-sanity'
import PortableText from '@/app/components/PortableText'
import {cn} from '@/lib/utils'

interface RichTextBlockProps {
  block: {
    _key: string
    _type: string
    content?: PortableTextBlock[]
    align?: 'left' | 'center' | 'right'
    size?: 'xl' | 'lg' | 'base' | 'sm'
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

// Text alignment - left is default (no class needed)
const alignClasses: Record<string, string> = {
  left: '',
  center: 'u-text-center',
  right: 'u-text-right',
}

// Text sizes using Mast component classes - base is default (no class needed)
const sizeClasses: Record<string, string> = {
  sm: 'cc-sm',
  base: '',
  lg: 'cc-lg',
  xl: 'cc-xl',
}

export default function RichTextBlock({block}: RichTextBlockProps) {
  const {
    content,
    align = 'left',
    size = 'base',
    customStyle,
  } = block

  if (!content || content.length === 0) {
    return null
  }

  // Clean stega encoding from values before using as lookup keys
  const cleanAlign = stegaClean(align)
  const cleanSize = stegaClean(size)

  const alignClass = alignClasses[cleanAlign] || ''
  const sizeClass = sizeClasses[cleanSize] || ''
  const inlineStyle = parseCustomStyle(customStyle)

  return (
    <div className={cn('rich-text', sizeClass, alignClass)} style={inlineStyle}>
      <PortableText value={content} />
    </div>
  )
}
