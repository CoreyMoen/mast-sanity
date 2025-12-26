import {stegaClean} from 'next-sanity'
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
  }
  index: number
  pageId?: string
  pageType?: string
  sectionKey?: string
}

// Horizontal alignment (justify-content)
const horizontalAlignClasses: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

// Vertical alignment (align-items)
const verticalAlignClasses: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

// Row negative margin (half of gap on each side)
// This cancels out the column padding on the outer edges
const rowNegativeMarginClasses: Record<string, string> = {
  '0': '',
  '2': '-mx-1',    // 4px each side (8px total gap)
  '4': '-mx-2',    // 8px each side (16px total gap)
  '6': '-mx-3',    // 12px each side (24px total gap)
  '8': '-mx-4',    // 16px each side (32px total gap)
  '12': '-mx-6',   // 24px each side (48px total gap)
}

// Vertical gap for stacked mobile columns
const verticalGapClasses: Record<string, string> = {
  '0': 'gap-y-0',
  '2': 'gap-y-2',
  '4': 'gap-y-4',
  '6': 'gap-y-6',
  '8': 'gap-y-8',
  '12': 'gap-y-12',
}

export default function Row({block, index, pageId, pageType, sectionKey}: RowProps) {
  const {
    columns,
    horizontalAlign = 'start',
    verticalAlign = 'stretch',
    gap = '6',
    wrap = true,
    reverseOnMobile = false,
  } = block

  // Ensure columns is always an array (handles null from Sanity when adding new items)
  const columnItems = columns ?? []

  // Clean stega encoding from values before using as lookup keys
  const cleanHorizontalAlign = stegaClean(horizontalAlign)
  const cleanVerticalAlign = stegaClean(verticalAlign)
  const cleanGap = stegaClean(gap)

  const justifyClass = horizontalAlignClasses[cleanHorizontalAlign] || horizontalAlignClasses.start
  const alignClass = verticalAlignClasses[cleanVerticalAlign] || verticalAlignClasses.stretch
  const negativeMarginClass = rowNegativeMarginClasses[cleanGap] || rowNegativeMarginClasses['6']
  const verticalGapClass = verticalGapClasses[cleanGap] || verticalGapClasses['6']
  const wrapClass = wrap ? 'flex-wrap' : 'flex-nowrap'

  // Flexbox with negative margins (Bootstrap-style gutter system)
  // On mobile, stack columns vertically with gap
  const mobileClass = reverseOnMobile ? 'flex-col-reverse' : 'flex-col'

  return (
    <div
      className={`flex ${mobileClass} md:flex-row ${wrapClass} ${justifyClass} ${alignClass} ${negativeMarginClass} ${verticalGapClass}`}
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
          gap={cleanGap}
        />
      ))}
    </div>
  )
}
