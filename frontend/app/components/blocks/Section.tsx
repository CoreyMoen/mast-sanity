import {stegaClean} from 'next-sanity'
import Image from 'next/image'
import {dataAttr, urlForImage} from '@/sanity/lib/utils'
import Row from './Row'
import ContentBlockRenderer from './ContentBlockRenderer'
import ContentBlockOverlay from '@/app/components/overlays/ContentBlockOverlay'

interface SectionProps {
  block: {
    _key: string
    _type: string
    label?: string
    rows?: any[] // Can contain rows or content blocks
    backgroundColor?: string
    backgroundImage?: any
    backgroundOverlay?: number
    minHeight?: string
    customMinHeight?: string
    verticalAlign?: string
    maxWidth?: string
    paddingTop?: string
    paddingBottom?: string
    paddingX?: string
  }
  index: number
  pageId: string
  pageType: string
}

// Background color mapping - using semantic CSS variables
const bgColorClasses: Record<string, string> = {
  primary: 'bg-[var(--primary-background)]',
  secondary: 'bg-[var(--secondary-background)]',
  // Legacy values for backwards compatibility
  none: '',
  white: 'bg-[var(--primary-background)]',
  'gray-50': 'bg-[var(--secondary-background)]',
  'gray-100': 'bg-[var(--secondary-background)]',
  'gray-800': 'bg-gray-800',
  black: 'bg-black',
  brand: 'bg-brand',
  blue: 'bg-blue',
}

// Max width mapping
const maxWidthClasses: Record<string, string> = {
  full: 'w-full',
  container: 'container',
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

// Min height mapping
const minHeightClasses: Record<string, string> = {
  auto: '',
  small: 'min-h-[300px]',
  medium: 'min-h-[500px]',
  large: 'min-h-[700px]',
  screen: 'min-h-screen',
}

// Vertical alignment for content when min-height is set
const verticalAlignClasses: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
}

export default function Section({block, index, pageId, pageType}: SectionProps) {
  const {
    rows,
    backgroundColor = 'primary',
    backgroundImage,
    backgroundOverlay = 0,
    minHeight = 'auto',
    customMinHeight,
    verticalAlign = 'start',
    maxWidth = 'container',
    paddingTop = '12',
    paddingBottom = '12',
    paddingX = '6',
  } = block

  // Ensure rows is always an array (handles null from Sanity when adding new items)
  const rowItems = rows ?? []

  // Clean stega encoding from values before using as lookup keys
  const cleanBgColor = stegaClean(backgroundColor)
  const cleanMaxWidth = stegaClean(maxWidth)
  const cleanPaddingTop = stegaClean(paddingTop)
  const cleanPaddingBottom = stegaClean(paddingBottom)
  const cleanPaddingX = stegaClean(paddingX)
  const cleanMinHeight = stegaClean(minHeight)
  const cleanCustomMinHeight = stegaClean(customMinHeight)
  const cleanVerticalAlign = stegaClean(verticalAlign)
  const cleanOverlay = stegaClean(backgroundOverlay)

  const bgClass = bgColorClasses[cleanBgColor] || ''
  const maxWidthClass = maxWidthClasses[cleanMaxWidth] || maxWidthClasses.container
  const ptClass = paddingTopClasses[cleanPaddingTop] || paddingTopClasses['12']
  const pbClass = paddingBottomClasses[cleanPaddingBottom] || paddingBottomClasses['12']
  // Don't apply horizontal padding when using container class (min() function handles gutters)
  const usesContainer = cleanMaxWidth === 'container' || !cleanMaxWidth
  const pxClass = usesContainer ? '' : (paddingXClasses[cleanPaddingX] || paddingXClasses['6'])

  // Handle min-height (preset or custom)
  const minHeightClass = cleanMinHeight === 'custom' ? '' : (minHeightClasses[cleanMinHeight] || '')
  const customMinHeightStyle = cleanMinHeight === 'custom' && cleanCustomMinHeight ? {minHeight: cleanCustomMinHeight} : {}

  // Vertical alignment (only applies when min-height is set)
  const hasMinHeight = cleanMinHeight !== 'auto'
  const alignClass = hasMinHeight ? verticalAlignClasses[cleanVerticalAlign] || '' : ''

  // Determine if text should be light on dark backgrounds or with background image
  // Primary/secondary backgrounds use theme-aware colors, so no override needed
  const backgroundImageUrl = urlForImage(backgroundImage)?.url()
  const isDarkBg = ['gray-800', 'black', 'brand', 'blue'].includes(cleanBgColor) || (backgroundImageUrl && cleanOverlay >= 40)

  return (
    <section
      className={`relative ${bgClass} ${isDarkBg ? 'text-white' : 'text-foreground'} ${minHeightClass} ${hasMinHeight ? 'flex flex-col' : ''} ${alignClass}`}
      style={customMinHeightStyle}
      data-sanity={dataAttr({
        id: pageId,
        type: pageType,
        path: `pageBuilder:${block._key}`,
      }).toString()}
    >
      {/* Background Image */}
      {backgroundImageUrl && (
        <>
          <Image
            src={backgroundImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority={index === 0}
          />
          {/* Overlay */}
          {cleanOverlay > 0 && (
            <div
              className="absolute inset-0 bg-black"
              style={{opacity: cleanOverlay / 100}}
            />
          )}
        </>
      )}

      {/* Content Container */}
      <div className={`relative z-10 ${maxWidthClass} ${ptClass} ${pbClass} ${pxClass} ${hasMinHeight ? 'flex-1 flex flex-col' : ''} ${alignClass}`}>
        {rowItems.map((item, itemIndex) => (
          <div
            key={item._key}
            data-sanity={dataAttr({
              id: pageId,
              type: pageType,
              path: `pageBuilder:${block._key}.rows:${item._key}`,
            }).toString()}
            data-block-type={item._type}
          >
            {item._type === 'row' ? (
              <Row
                block={item}
                index={itemIndex}
                pageId={pageId}
                pageType={pageType}
                sectionKey={block._key}
              />
            ) : (
              // Render content blocks directly (not wrapped in row/column)
              <ContentBlockOverlay blockType={item._type}>
                <ContentBlockRenderer block={item} index={itemIndex} />
              </ContentBlockOverlay>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
