'use client'

import {stegaClean} from 'next-sanity'
import {Marquee, MarqueeItem} from '../ui/marquee'
import ContentBlockRenderer from './ContentBlockRenderer'

interface MarqueeBlockProps {
  block: {
    _key: string
    _type: string
    items?: Array<{
      _key: string
      _type: string
      [key: string]: any
    }>
    orientation?: 'horizontal' | 'vertical'
    reverse?: boolean
    pauseOnHover?: boolean
    fadeEdges?: boolean
    duration?: number
    gap?: string
    height?: string
  }
  index: number
}

export default function MarqueeBlock({block}: MarqueeBlockProps) {
  const {
    items,
    orientation = 'horizontal',
    reverse = false,
    pauseOnHover = true,
    fadeEdges = false,
    duration = 30,
    gap = '24',
    height = '300',
  } = block

  if (!items || items.length === 0) return null

  const cleanOrientation = stegaClean(orientation)
  const cleanReverse = stegaClean(reverse)
  const cleanPauseOnHover = stegaClean(pauseOnHover)
  const cleanFadeEdges = stegaClean(fadeEdges)
  const cleanDuration = stegaClean(duration)
  const cleanGap = parseInt(stegaClean(gap) || '24', 10)
  const cleanHeight = stegaClean(height)

  const isVertical = cleanOrientation === 'vertical'

  return (
    <div
      className="my-6"
      style={{
        height: isVertical && cleanHeight !== 'auto' ? `${cleanHeight}px` : undefined,
      }}
    >
      <Marquee
        orientation={cleanOrientation}
        reverse={cleanReverse}
        pauseOnHover={cleanPauseOnHover}
        fadeEdges={cleanFadeEdges}
        duration={cleanDuration}
        gap={cleanGap}
      >
        {items.map((item, itemIndex) => (
          <MarqueeItem key={item._key} minWidth="14rem">
            <ContentBlockRenderer block={item} index={itemIndex} />
          </MarqueeItem>
        ))}
      </Marquee>
    </div>
  )
}
