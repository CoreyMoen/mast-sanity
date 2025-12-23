import {dataAttr} from '@/sanity/lib/utils'
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
  pageId: string
  pageType: string
  sectionKey: string
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

// Gap mapping
const gapClasses: Record<string, string> = {
  '0': 'gap-0',
  '2': 'gap-2',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
  '12': 'gap-12',
}

export default function Row({block, index, pageId, pageType, sectionKey}: RowProps) {
  const {
    columns = [],
    horizontalAlign = 'start',
    verticalAlign = 'stretch',
    gap = '6',
    wrap = true,
    reverseOnMobile = false,
  } = block

  const justifyClass = horizontalAlignClasses[horizontalAlign] || horizontalAlignClasses.start
  const alignClass = verticalAlignClasses[verticalAlign] || verticalAlignClasses.stretch
  const gapClass = gapClasses[gap] || gapClasses['6']
  const wrapClass = wrap ? 'flex-wrap' : 'flex-nowrap'
  const reverseClass = reverseOnMobile ? 'flex-col-reverse md:flex-row' : 'flex-col md:flex-row'

  return (
    <div
      className={`flex ${reverseClass} ${wrapClass} ${justifyClass} ${alignClass} ${gapClass}`}
    >
      {columns.map((column, colIndex) => (
        <div
          key={column._key}
          data-sanity={dataAttr({
            id: pageId,
            type: pageType,
            path: `pageBuilder[_key=="${sectionKey}"].rows[_key=="${block._key}"].columns[_key=="${column._key}"]`,
          }).toString()}
        >
          <Column
            block={column}
            index={colIndex}
            pageId={pageId}
            pageType={pageType}
            sectionKey={sectionKey}
            rowKey={block._key}
          />
        </div>
      ))}
    </div>
  )
}
