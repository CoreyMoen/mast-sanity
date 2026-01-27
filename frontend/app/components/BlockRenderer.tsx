import React from 'react'

import {Section} from '@/app/components/blocks'

type BlocksType = {
  [key: string]: React.FC<any>
}

type BlockType = {
  _type: string
  _key: string
}

type BlockProps = {
  index: number
  block: BlockType
  pageId?: string
  pageType?: string
}

// Blocks that need pageId and pageType for nested visual editing
const NestedBlocks: BlocksType = {
  section: Section,
}

/**
 * Used by the <PageBuilder>, this component renders a the component that matches the block type.
 */
export default function BlockRenderer({block, index, pageId, pageType}: BlockProps) {
  // Handle nested blocks (section) - they manage their own data-sanity attributes
  if (NestedBlocks[block._type]) {
    return React.createElement(NestedBlocks[block._type], {
      key: block._key,
      block: block,
      index: index,
      pageId: pageId,
      pageType: pageType,
    })
  }

  // Block doesn't exist yet
  return React.createElement(
    () => (
      <div className="w-full bg-muted-background text-center text-muted-foreground p-20 rounded">
        A &ldquo;{block._type}&rdquo; block hasn&apos;t been created
      </div>
    ),
    {key: block._key},
  )
}
