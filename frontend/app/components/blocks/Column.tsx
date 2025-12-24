import {stegaClean} from 'next-sanity'
import {dataAttr} from '@/sanity/lib/utils'
import ContentBlockRenderer from './ContentBlockRenderer'

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
  }
  index: number
  pageId: string
  pageType: string
  sectionKey: string
  rowKey: string
}

// Desktop width classes (lg breakpoint)
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

// Mobile width classes (base)
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

// Vertical alignment for column content
const verticalAlignClasses: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
}

// Padding classes
const paddingClasses: Record<string, string> = {
  '0': 'p-0',
  '2': 'p-2',
  '4': 'p-4',
  '6': 'p-6',
  '8': 'p-8',
}

export default function Column({block, index, pageId, pageType, sectionKey, rowKey}: ColumnProps) {
  const {
    content = [],
    widthDesktop = 'fill',
    widthTablet = 'inherit',
    widthMobile = '12',
    verticalAlign = 'start',
    padding = '0',
  } = block

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

  const desktopClass = desktopWidthClasses[cleanWidthDesktop] || desktopWidthClasses.fill
  const tabletClass = tabletWidthClasses[effectiveTabletWidth] || ''
  const mobileClass = mobileWidthClasses[effectiveMobileWidth] || mobileWidthClasses['12']
  const alignClass = verticalAlignClasses[cleanVerticalAlign] || verticalAlignClasses.start
  const paddingClass = paddingClasses[cleanPadding] || paddingClasses['0']

  // Build the path for nested content blocks
  const basePath = `pageBuilder[_key=="${sectionKey}"].rows[_key=="${rowKey}"].columns[_key=="${block._key}"]`

  return (
    <div
      className={`flex flex-col ${alignClass} ${mobileClass} ${tabletClass} ${desktopClass} ${paddingClass}`}
      data-sanity={dataAttr({
        id: pageId,
        type: pageType,
        path: `pageBuilder[_key=="${sectionKey}"].rows[_key=="${rowKey}"].columns[_key=="${block._key}"]`,
      }).toString()}
    >
      {content.map((contentBlock, contentIndex) => (
        <ContentBlockRenderer
          key={contentBlock._key}
          block={contentBlock}
          index={contentIndex}
          pageId={pageId}
          pageType={pageType}
          basePath={basePath}
        />
      ))}
    </div>
  )
}
