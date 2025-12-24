import {type PortableTextBlock, stegaClean} from 'next-sanity'
import PortableText from '@/app/components/PortableText'

interface RichTextBlockProps {
  block: {
    _key: string
    _type: string
    content?: PortableTextBlock[]
    align?: 'left' | 'center' | 'right'
    maxWidth?: 'none' | 'prose' | 'prose-lg' | 'prose-xl'
  }
  index: number
}

// Text alignment
const alignClasses: Record<string, string> = {
  left: 'text-left',
  center: 'text-center mx-auto',
  right: 'text-right ml-auto',
}

// Max width for readability
const maxWidthClasses: Record<string, string> = {
  none: '',
  prose: 'max-w-prose',
  'prose-lg': 'max-w-[80ch]',
  'prose-xl': 'max-w-[90ch]',
}

export default function RichTextBlock({block}: RichTextBlockProps) {
  const {
    content,
    align = 'left',
    maxWidth = 'none',
  } = block

  if (!content || content.length === 0) {
    return null
  }

  // Clean stega encoding from values before using as lookup keys
  const cleanAlign = stegaClean(align)
  const cleanMaxWidth = stegaClean(maxWidth)

  const alignClass = alignClasses[cleanAlign] || alignClasses.left
  const maxWidthClass = maxWidthClasses[cleanMaxWidth] || ''

  return (
    <div className={`${alignClass} ${maxWidthClass} mb-4`}>
      <PortableText value={content} />
    </div>
  )
}
