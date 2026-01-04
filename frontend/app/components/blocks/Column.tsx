import {stegaClean} from 'next-sanity'
import {cn} from '@/lib/utils'
import {dataAttr} from '@/sanity/lib/utils'
import ContentBlockRenderer from './ContentBlockRenderer'
import ContentBlockOverlay from '@/app/components/overlays/ContentBlockOverlay'
import Row from './Row'

interface ColumnProps {
  block: {
    _key: string
    _type: string
    content?: any[]
    widthDesktop?: string
    widthTablet?: string
    widthMobile?: string
    verticalAlign?: string
    padding?: string
    customStyle?: string
  }
  index: number
  pageId?: string
  pageType?: string
  sectionKey?: string
  rowKey?: string
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

// Desktop width classes (lg breakpoint) - Mast CSS
const desktopWidthClasses: Record<string, string> = {
  auto: 'col-shrink',
  fill: '',                       // Default flex behavior
  shrink: 'col-shrink',
  '1': 'col-lg-1',
  '2': 'col-lg-2',
  '3': 'col-lg-3',
  '4': 'col-lg-4',
  '5': 'col-lg-5',
  '6': 'col-lg-6',
  '7': 'col-lg-7',
  '8': 'col-lg-8',
  '9': 'col-lg-9',
  '10': 'col-lg-10',
  '11': 'col-lg-11',
  '12': 'col-lg-12',
}

// Tablet width classes (md breakpoint) - Mast CSS
const tabletWidthClasses: Record<string, string> = {
  auto: 'col-md-shrink',
  fill: '',
  shrink: 'col-md-shrink',
  '1': 'col-md-1',
  '2': 'col-md-2',
  '3': 'col-md-3',
  '4': 'col-md-4',
  '5': 'col-md-5',
  '6': 'col-md-6',
  '7': 'col-md-7',
  '8': 'col-md-8',
  '9': 'col-md-9',
  '10': 'col-md-10',
  '11': 'col-md-11',
  '12': 'col-md-12',
}

// Mobile width classes (sm breakpoint) - Mast CSS
const mobileWidthClasses: Record<string, string> = {
  auto: 'col-sm-shrink',
  fill: '',
  shrink: 'col-sm-shrink',
  '1': 'col-sm-1',
  '2': 'col-sm-2',
  '3': 'col-sm-3',
  '4': 'col-sm-4',
  '5': 'col-sm-5',
  '6': 'col-sm-6',
  '7': 'col-sm-7',
  '8': 'col-sm-8',
  '9': 'col-sm-9',
  '10': 'col-sm-10',
  '11': 'col-sm-11',
  '12': 'col-sm-12',
}

// Vertical alignment for column content - Mast CSS
const verticalAlignClasses: Record<string, string> = {
  start: '',                      // Default
  center: 'col-valign-center',
  end: 'col-valign-end',
  between: 'col-valign-between',
}

export default function Column({block, index, pageId, pageType, sectionKey, rowKey}: ColumnProps) {
  const {
    content,
    widthDesktop = 'fill',
    widthTablet = 'inherit',
    widthMobile = '12',
    verticalAlign = 'start',
    customStyle,
  } = block

  // Ensure content is always an array (handles null from Sanity when adding new items)
  const contentBlocks = content ?? []

  // Clean stega encoding from values before using as lookup keys
  const cleanWidthDesktop = stegaClean(widthDesktop)
  const cleanWidthTablet = stegaClean(widthTablet)
  const cleanWidthMobile = stegaClean(widthMobile)
  const cleanVerticalAlign = stegaClean(verticalAlign)

  // Calculate effective tablet width (inherit means use desktop value)
  const effectiveTabletWidth = cleanWidthTablet === 'inherit' ? cleanWidthDesktop : cleanWidthTablet
  // Calculate effective mobile width (inherit means use tablet value)
  const effectiveMobileWidth = cleanWidthMobile === 'inherit' ? effectiveTabletWidth : cleanWidthMobile

  // Use Mast CSS width classes
  const desktopClass = desktopWidthClasses[cleanWidthDesktop] || ''
  const tabletClass = tabletWidthClasses[effectiveTabletWidth] || ''
  const mobileClass = mobileWidthClasses[effectiveMobileWidth] || ''
  const alignClass = verticalAlignClasses[cleanVerticalAlign] || ''

  // Build the path for nested content blocks using shorthand format (field:key)
  // This format may help Sanity resolve types in polymorphic arrays
  const basePath = pageId && sectionKey && rowKey
    ? `pageBuilder:${sectionKey}.rows:${rowKey}.columns:${block._key}`
    : null

  // Only include data-sanity attributes when in visual editing context
  const columnDataSanity = pageId && pageType && basePath
    ? dataAttr({
        id: pageId,
        type: pageType,
        path: basePath,
      }).toString()
    : undefined

  const inlineStyle = parseCustomStyle(customStyle)

  return (
    <div
      className={cn('col', desktopClass, tabletClass, mobileClass, alignClass)}
      data-sanity={columnDataSanity}
      style={inlineStyle}
    >
      {contentBlocks.map((contentBlock, contentIndex) => {
        const blockDataSanity = pageId && pageType && basePath
          ? dataAttr({
              id: pageId,
              type: pageType,
              path: `${basePath}.content:${contentBlock._key}`,
            }).toString()
          : undefined

        // Handle nested rows
        if (contentBlock._type === 'row') {
          return (
            <div
              key={contentBlock._key}
              data-sanity={blockDataSanity}
              data-block-type={contentBlock._type}
            >
              <Row
                block={contentBlock}
                index={contentIndex}
                pageId={pageId}
                pageType={pageType}
                sectionKey={basePath ? `${basePath.replace('pageBuilder:', '')}.content:${contentBlock._key}` : undefined}
              />
            </div>
          )
        }

        return (
          <div
            key={contentBlock._key}
            data-sanity={blockDataSanity}
            data-block-type={contentBlock._type}
          >
            <ContentBlockOverlay blockType={contentBlock._type}>
              <ContentBlockRenderer
                block={contentBlock}
                index={contentIndex}
              />
            </ContentBlockOverlay>
          </div>
        )
      })}
    </div>
  )
}
