import React from 'react'

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
import SliderBlock from './SliderBlock'
import TabsBlock from './TabsBlock'
import ModalBlock from './ModalBlock'
import InlineVideoBlock from './InlineVideoBlock'
import MarqueeBlock from './MarqueeBlock'

type ContentBlocksType = {
  [key: string]: React.FC<any>
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
    <div className="w-full bg-gray-100 text-center text-gray-500 p-4 rounded my-2">
      A &ldquo;{block._type}&rdquo; content block hasn&apos;t been created
    </div>
  )
}
