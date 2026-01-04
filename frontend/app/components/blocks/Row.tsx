import {stegaClean} from 'next-sanity'
import {cn} from '@/lib/utils'
import Column from './Column'

interface RowProps {
  block: {
    _key: string
    _type: string
    columns?: any[]
    horizontalAlign?: string
    verticalAlign?: string
    gap?: string
    wrap?: boolean
    reverseOnMobile?: boolean
    customStyle?: string
  }
  index: number
  pageId?: string
  pageType?: string
  sectionKey?: string
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

// Horizontal alignment (justify-content) - Mast CSS classes
const justifyClasses: Record<string, string> = {
  start: '',                      // Default
  center: 'row-justify-center',
  end: 'row-justify-end',
  between: 'row-justify-between',
  around: 'row-justify-between',  // Map to between as fallback
  evenly: 'row-justify-between',  // Map to between as fallback
}

// Vertical alignment (align-items) - Mast CSS classes
const alignClasses: Record<string, string> = {
  stretch: '',                    // Default
  start: 'row-align-start',
  center: 'row-align-center',
  end: 'row-align-end',
  baseline: 'row-align-start',    // Map to start as fallback
  between: '',                    // Not supported, use default
}

// Gap classes - Mast CSS
const gapClasses: Record<string, string> = {
  '0': 'row-gap-0',
  '2': 'row-gap-sm',
  '4': 'row-gap-sm',
  '6': '',                        // Default (md)
  '8': 'row-gap-lg',
  '12': 'row-gap-lg',
}

// Reverse on mobile modifier
const reverseClass = 'row-reverse-mobile'

export default function Row({block, index, pageId, pageType, sectionKey}: RowProps) {
  const {
    columns,
    horizontalAlign = 'start',
    verticalAlign = 'stretch',
    gap = '6',
    wrap = true,
    reverseOnMobile = false,
    customStyle,
  } = block

  // Ensure columns is always an array (handles null from Sanity when adding new items)
  const columnItems = columns ?? []

  // Clean stega encoding from values before using as lookup keys
  const cleanHorizontalAlign = stegaClean(horizontalAlign)
  const cleanVerticalAlign = stegaClean(verticalAlign)
  const cleanGap = stegaClean(gap)

  const justifyClass = justifyClasses[cleanHorizontalAlign] || ''
  const alignClass = alignClasses[cleanVerticalAlign] || ''
  const gapClass = gapClasses[cleanGap] || ''

  const inlineStyle = parseCustomStyle(customStyle)

  return (
    <div
      className={cn(
        'row',
        justifyClass,
        alignClass,
        gapClass,
        reverseOnMobile && reverseClass
      )}
      style={inlineStyle}
    >
      {columnItems.map((column, colIndex) => (
        <Column
          key={column._key}
          block={column}
          index={colIndex}
          pageId={pageId}
          pageType={pageType}
          sectionKey={sectionKey}
          rowKey={block._key}
        />
      ))}
    </div>
  )
}
