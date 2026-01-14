import {stegaClean} from 'next-sanity'
import {dataAttr} from '@/sanity/lib/utils'
import ContentBlockRenderer from './ContentBlockRenderer'
import ContentBlockOverlay from '@/app/components/overlays/ContentBlockOverlay'
import ColumnOverlay from '@/app/components/overlays/ColumnOverlay'
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
  gap?: string // Gap value from Row for Bootstrap-style gutters
}

// Parse CSS string to React style object
function parseCustomStyle(cssString?: string): React.CSSProperties | undefined {
  if (!cssString) return undefined
  try {
    const entries = cssString
      .split(';')
      .filter((s) => s.trim())
      .map((s) => {
        const [key, ...valueParts] = s.split(':')
        const value = valueParts.join(':').trim()
        // Clean the key: remove trailing hyphens and convert to camelCase
        const cleanKey = key.trim().replace(/-+$/, '') // Remove trailing hyphens
        if (!cleanKey || !value) return null // Skip invalid entries
        const camelKey = cleanKey.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        return [camelKey, value]
      })
      .filter((entry): entry is [string, string] => entry !== null)
    return Object.fromEntries(entries)
  } catch {
    return undefined
  }
}

// Desktop width classes (lg breakpoint) - percentage based
const desktopWidthClasses: Record<string, string> = {
  auto: 'lg:w-auto lg:flex-none',
  fill: 'lg:flex-1',
  '1': 'lg:w-1/12',
  '2': 'lg:w-2/12',
  '3': 'lg:w-3/12',
  '4': 'lg:w-4/12',
  '5': 'lg:w-5/12',
  '6': 'lg:w-6/12',
  '7': 'lg:w-7/12',
  '8': 'lg:w-8/12',
  '9': 'lg:w-9/12',
  '10': 'lg:w-10/12',
  '11': 'lg:w-11/12',
  '12': 'lg:w-full',
}

// Tablet width classes (md breakpoint)
const tabletWidthClasses: Record<string, string> = {
  auto: 'md:w-auto md:flex-none',
  fill: 'md:flex-1',
  '1': 'md:w-1/12',
  '2': 'md:w-2/12',
  '3': 'md:w-3/12',
  '4': 'md:w-4/12',
  '5': 'md:w-5/12',
  '6': 'md:w-6/12',
  '7': 'md:w-7/12',
  '8': 'md:w-8/12',
  '9': 'md:w-9/12',
  '10': 'md:w-10/12',
  '11': 'md:w-11/12',
  '12': 'md:w-full',
}

// Mobile width classes (base) - on mobile, columns stack full width by default
const mobileWidthClasses: Record<string, string> = {
  auto: 'w-auto flex-none',
  fill: 'flex-1',
  '1': 'w-1/12',
  '2': 'w-2/12',
  '3': 'w-3/12',
  '4': 'w-4/12',
  '5': 'w-5/12',
  '6': 'w-6/12',
  '7': 'w-7/12',
  '8': 'w-8/12',
  '9': 'w-9/12',
  '10': 'w-10/12',
  '11': 'w-11/12',
  '12': 'w-full',
}

// Column horizontal padding (half of gap on each side) - Bootstrap gutter style
const columnGutterClasses: Record<string, string> = {
  '0': '',
  '2': 'px-1',    // 4px each side (8px total gap)
  '4': 'px-2',    // 8px each side (16px total gap)
  '6': 'px-3',    // 12px each side (24px total gap)
  '8': 'px-4',    // 16px each side (32px total gap)
  '12': 'px-6',   // 24px each side (48px total gap)
}

// Inner padding classes (user-configurable padding inside the column)
const innerPaddingClasses: Record<string, string> = {
  '0': '',
  '2': 'p-2',
  '4': 'p-4',
  '6': 'p-6',
  '8': 'p-8',
}

export default function Column({block, index, pageId, pageType, sectionKey, rowKey, gap = '6'}: ColumnProps) {
  const {
    content,
    widthDesktop = 'fill',
    widthTablet = 'inherit',
    widthMobile = '12',
    verticalAlign = 'start',
    padding = '0',
    customStyle,
  } = block

  // Ensure content is always an array (handles null from Sanity when adding new items)
  const contentBlocks = content ?? []

  // Clean stega encoding from values before using as lookup keys
  const cleanWidthDesktop = stegaClean(widthDesktop)
  const cleanWidthTablet = stegaClean(widthTablet)
  const cleanWidthMobile = stegaClean(widthMobile)
  const cleanVerticalAlign = stegaClean(verticalAlign)
  const cleanPadding = stegaClean(padding)

  // Calculate effective tablet width (inherit means use desktop value)
  const effectiveTabletWidth = cleanWidthTablet === 'inherit' ? cleanWidthDesktop : cleanWidthTablet
  // Calculate effective mobile width (inherit means use tablet value)
  const effectiveMobileWidth = cleanWidthMobile === 'inherit' ? effectiveTabletWidth : cleanWidthMobile

  // Use percentage width classes for Flexbox
  const desktopClass = desktopWidthClasses[cleanWidthDesktop] || desktopWidthClasses['12']
  const tabletClass = tabletWidthClasses[effectiveTabletWidth] || ''
  const mobileClass = mobileWidthClasses[effectiveMobileWidth] || mobileWidthClasses['12']
  const innerPaddingClass = innerPaddingClasses[cleanPadding] || ''

  // Bootstrap-style gutters: horizontal padding based on row gap
  const gutterClass = columnGutterClasses[gap] || columnGutterClasses['6']

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
      className={`flex flex-col ${mobileClass} ${tabletClass} ${desktopClass} ${gutterClass} ${innerPaddingClass}`}
      data-sanity={columnDataSanity}
      style={inlineStyle}
    >
      <ColumnOverlay gap={gap} verticalAlign={cleanVerticalAlign}>
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
              data-block-type={pageId ? contentBlock._type : undefined}
            >
              <ContentBlockOverlay blockType="row">
                <Row
                  block={contentBlock}
                  index={contentIndex}
                  pageId={pageId}
                  pageType={pageType}
                  sectionKey={basePath ? `${basePath.replace('pageBuilder:', '')}.content:${contentBlock._key}` : undefined}
                />
              </ContentBlockOverlay>
            </div>
          )
        }

        return (
          <div
            key={contentBlock._key}
            data-sanity={blockDataSanity}
            data-block-type={pageId ? contentBlock._type : undefined}
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
      </ColumnOverlay>
    </div>
  )
}
