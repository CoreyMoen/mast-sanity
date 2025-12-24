import {stegaClean} from 'next-sanity'
import {dataAttr} from '@/sanity/lib/utils'
import Row from './Row'

interface SectionProps {
  block: {
    _key: string
    _type: string
    label?: string
    rows?: any[]
    backgroundColor?: string
    maxWidth?: string
    paddingTop?: string
    paddingBottom?: string
    paddingX?: string
  }
  index: number
  pageId: string
  pageType: string
}

// Background color mapping
const bgColorClasses: Record<string, string> = {
  none: '',
  white: 'bg-white',
  'gray-50': 'bg-gray-50',
  'gray-100': 'bg-gray-100',
  'gray-800': 'bg-gray-800',
  black: 'bg-black',
  brand: 'bg-brand',
  blue: 'bg-blue',
}

// Max width mapping
const maxWidthClasses: Record<string, string> = {
  full: 'w-full',
  container: 'container mx-auto',
  sm: 'max-w-screen-sm mx-auto',
  md: 'max-w-screen-md mx-auto',
  lg: 'max-w-screen-lg mx-auto',
  xl: 'max-w-screen-xl mx-auto',
  '2xl': 'max-w-screen-2xl mx-auto',
}

// Padding mapping
const paddingTopClasses: Record<string, string> = {
  '0': 'pt-0',
  '4': 'pt-4',
  '8': 'pt-8',
  '12': 'pt-12',
  '16': 'pt-16',
  '24': 'pt-24',
}

const paddingBottomClasses: Record<string, string> = {
  '0': 'pb-0',
  '4': 'pb-4',
  '8': 'pb-8',
  '12': 'pb-12',
  '16': 'pb-16',
  '24': 'pb-24',
}

const paddingXClasses: Record<string, string> = {
  '0': 'px-0',
  '4': 'px-4',
  '6': 'px-6',
  '8': 'px-8',
}

export default function Section({block, index, pageId, pageType}: SectionProps) {
  const {
    rows = [],
    backgroundColor = 'none',
    maxWidth = 'container',
    paddingTop = '12',
    paddingBottom = '12',
    paddingX = '6',
  } = block

  // Clean stega encoding from values before using as lookup keys
  const cleanBgColor = stegaClean(backgroundColor)
  const cleanMaxWidth = stegaClean(maxWidth)
  const cleanPaddingTop = stegaClean(paddingTop)
  const cleanPaddingBottom = stegaClean(paddingBottom)
  const cleanPaddingX = stegaClean(paddingX)

  const bgClass = bgColorClasses[cleanBgColor] || ''
  const maxWidthClass = maxWidthClasses[cleanMaxWidth] || maxWidthClasses.container
  const ptClass = paddingTopClasses[cleanPaddingTop] || paddingTopClasses['12']
  const pbClass = paddingBottomClasses[cleanPaddingBottom] || paddingBottomClasses['12']
  const pxClass = paddingXClasses[cleanPaddingX] || paddingXClasses['6']

  // Determine if text should be light on dark backgrounds
  const isDarkBg = ['gray-800', 'black', 'brand', 'blue'].includes(cleanBgColor)

  return (
    <section
      className={`${bgClass} ${isDarkBg ? 'text-white' : ''}`}
      data-sanity={dataAttr({
        id: pageId,
        type: pageType,
        path: `pageBuilder[_key=="${block._key}"]`,
      }).toString()}
    >
      <div className={`${maxWidthClass} ${ptClass} ${pbClass} ${pxClass}`}>
        {rows.map((row, rowIndex) => (
          <div
            key={row._key}
            data-sanity={dataAttr({
              id: pageId,
              type: pageType,
              path: `pageBuilder[_key=="${block._key}"].rows[_key=="${row._key}"]`,
            }).toString()}
          >
            <Row
              block={row}
              index={rowIndex}
              pageId={pageId}
              pageType={pageType}
              sectionKey={block._key}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
