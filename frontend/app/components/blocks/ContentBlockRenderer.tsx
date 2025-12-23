import React from 'react'
import {dataAttr} from '@/sanity/lib/utils'

import HeadingBlock from './HeadingBlock'
import RichTextBlock from './RichTextBlock'
import ImageBlock from './ImageBlock'
import ButtonBlock from './ButtonBlock'
import SpacerBlock from './SpacerBlock'

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
  pageId: string
  pageType: string
  basePath: string
}

const ContentBlocks: ContentBlocksType = {
  headingBlock: HeadingBlock,
  richTextBlock: RichTextBlock,
  imageBlock: ImageBlock,
  buttonBlock: ButtonBlock,
  spacerBlock: SpacerBlock,
}

export default function ContentBlockRenderer({
  block,
  index,
  pageId,
  pageType,
  basePath,
}: ContentBlockProps) {
  const Component = ContentBlocks[block._type]

  if (Component) {
    return (
      <div
        data-sanity={dataAttr({
          id: pageId,
          type: pageType,
          path: `${basePath}.content[_key=="${block._key}"]`,
        }).toString()}
      >
        <Component block={block} index={index} />
      </div>
    )
  }

  // Fallback for unknown block types
  return (
    <div className="w-full bg-gray-100 text-center text-gray-500 p-4 rounded my-2">
      A &ldquo;{block._type}&rdquo; content block hasn&apos;t been created
    </div>
  )
}
