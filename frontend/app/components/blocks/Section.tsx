import {stegaClean} from 'next-sanity'
import Image from 'next/image'
import {cn} from '@/lib/utils'
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
  }
  index: number
  pageId: string
  pageType: string
}

// Theme class mapping - using Mast CSS semantic classes
const themeClasses: Record<string, string> = {
  primary: '',                    // Default theme
  secondary: 'cc-muted',          // Light gray / dark gray
  invert: 'cc-invert',            // Inverted colors
  // Legacy values for backwards compatibility
  none: '',
  white: '',
  'gray-50': 'cc-muted',
  'gray-100': 'cc-muted',
  'gray-800': 'cc-invert',
  black: 'cc-invert',
  brand: 'cc-invert',
  blue: 'cc-invert',
}

// Min height mapping - Mast CSS classes
const minHeightClasses: Record<string, string> = {
  auto: '',
  small: 'cc-min-sm',
  medium: 'cc-min-md',
  large: 'cc-min-lg',
  screen: 'cc-min-screen',
}

// Vertical alignment for content when min-height is set
const verticalAlignClasses: Record<string, string> = {
  start: '',                      // Default
  center: 'cc-valign-center',
  end: 'cc-valign-end',
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
  } = block

  // Ensure rows is always an array (handles null from Sanity when adding new items)
  const rowItems = rows ?? []

  // Clean stega encoding from values before using as lookup keys
  const cleanBgColor = stegaClean(backgroundColor)
  const cleanMinHeight = stegaClean(minHeight)
  const cleanCustomMinHeight = stegaClean(customMinHeight)
  const cleanVerticalAlign = stegaClean(verticalAlign)
  const cleanOverlay = stegaClean(backgroundOverlay)

  const themeClass = themeClasses[cleanBgColor] || ''
  const minHeightClass = cleanMinHeight === 'custom' ? '' : (minHeightClasses[cleanMinHeight] || '')
  const customMinHeightStyle = cleanMinHeight === 'custom' && cleanCustomMinHeight ? {minHeight: cleanCustomMinHeight} : {}
  const alignClass = verticalAlignClasses[cleanVerticalAlign] || ''

  // Get background image URL
  const backgroundImageUrl = urlForImage(backgroundImage)?.url()

  return (
    <section
      className={cn('section', themeClass, minHeightClass, alignClass)}
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
            className="section-bg-image"
            sizes="100vw"
            priority={index === 0}
          />
          {/* Overlay */}
          {cleanOverlay > 0 && (
            <div
              className="section-bg-overlay"
              style={{opacity: cleanOverlay / 100}}
            />
          )}
        </>
      )}

      {/* Content Container */}
      <div className="container">
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
