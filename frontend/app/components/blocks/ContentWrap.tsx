import {stegaClean} from 'next-sanity'
import ContentBlockRenderer from './ContentBlockRenderer'
import ContentBlockOverlay from '@/app/components/overlays/ContentBlockOverlay'
import {parseCustomStyle} from '@/app/lib/parseCustomStyle'

interface ContentWrapProps {
  block: {
    _key: string
    _type: string
    content?: any[]
    gap?: string
    align?: string
    customStyle?: string
  }
  index: number
}

// Gap classes
const gapClasses: Record<string, string> = {
  '0': 'gap-0',
  '2': 'gap-2',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
}

// Horizontal alignment classes
const alignClasses: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

export default function ContentWrap({block}: ContentWrapProps) {
  const {content, gap = '0', align = 'stretch', customStyle} = block

  // Ensure content is always an array
  const contentBlocks = content ?? []

  // Clean stega encoding from values
  const cleanGap = stegaClean(gap)
  const cleanAlign = stegaClean(align)

  const gapClass = gapClasses[cleanGap] || gapClasses['0']
  const alignClass = alignClasses[cleanAlign] || alignClasses.stretch
  const inlineStyle = parseCustomStyle(customStyle)

  return (
    <div className={`flex flex-col ${gapClass} ${alignClass}`} style={inlineStyle}>
      {contentBlocks.map((contentBlock, contentIndex) => (
        <div key={contentBlock._key}>
          <ContentBlockOverlay blockType={contentBlock._type}>
            <ContentBlockRenderer block={contentBlock} index={contentIndex} />
          </ContentBlockOverlay>
        </div>
      ))}
    </div>
  )
}
