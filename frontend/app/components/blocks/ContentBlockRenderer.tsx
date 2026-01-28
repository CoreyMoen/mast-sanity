import React from 'react'
import dynamic from 'next/dynamic'

// Static imports for lightweight, frequently-used blocks
import HeadingBlock from './HeadingBlock'
import RichTextBlock from './RichTextBlock'
import ImageBlock from './ImageBlock'
import ButtonBlock from './ButtonBlock'
import SpacerBlock from './SpacerBlock'
import DividerBlock from './DividerBlock'
import CardBlock from './CardBlock'
import EyebrowBlock from './EyebrowBlock'
import IconBlock from './IconBlock'
import AccordionBlock from './AccordionBlock'
import Row from './Row'
import BreadcrumbBlock from './BreadcrumbBlock'
import TableBlock from './TableBlock'
import InlineVideoBlock from './InlineVideoBlock'
import MarqueeBlock from './MarqueeBlock'
import ContentWrap from './ContentWrap'
import BlogGridBlock from './BlogGridBlock'

// Dynamic imports for heavy components (Swiper, Radix libraries)
// These are code-split into separate bundles and loaded on demand
const SliderBlock = dynamic(() => import('./SliderBlock'), {
  loading: () => <div className="w-full aspect-video bg-muted-background animate-pulse rounded" />,
})

const TabsBlock = dynamic(() => import('./TabsBlock'), {
  loading: () => <div className="w-full h-48 bg-muted-background animate-pulse rounded" />,
})

const ModalBlock = dynamic(() => import('./ModalBlock'), {
  loading: () => null, // Modals are typically hidden initially
})

type ContentBlocksType = {
  [key: string]: React.ComponentType<any>
}

interface ContentBlockProps {
  block: {
    _key: string
    _type: string
    [key: string]: any
  }
  index: number
}

const ContentBlocks: ContentBlocksType = {
  headingBlock: HeadingBlock,
  richTextBlock: RichTextBlock,
  imageBlock: ImageBlock,
  buttonBlock: ButtonBlock,
  spacerBlock: SpacerBlock,
  dividerBlock: DividerBlock,
  cardBlock: CardBlock,
  eyebrowBlock: EyebrowBlock,
  iconBlock: IconBlock,
  accordionBlock: AccordionBlock,
  row: Row,
  breadcrumbBlock: BreadcrumbBlock,
  tableBlock: TableBlock,
  sliderBlock: SliderBlock,
  tabsBlock: TabsBlock,
  modalBlock: ModalBlock,
  inlineVideoBlock: InlineVideoBlock,
  marqueeBlock: MarqueeBlock,
  contentWrap: ContentWrap,
  blogGridBlock: BlogGridBlock,
}

export default function ContentBlockRenderer({
  block,
  index,
}: ContentBlockProps) {
  const Component = ContentBlocks[block._type]

  if (Component) {
    return <Component block={block} index={index} />
  }

  // Fallback for unknown block types
  return (
    <div className="w-full bg-muted-background text-center text-muted-foreground p-4 rounded my-2">
      A &ldquo;{block._type}&rdquo; content block hasn&apos;t been created
    </div>
  )
}
