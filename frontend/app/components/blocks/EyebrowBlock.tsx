'use client'

import {stegaClean} from 'next-sanity'
import {Eyebrow} from '../ui/eyebrow'

interface EyebrowBlockProps {
  block: {
    _key: string
    _type: string
    text?: string
    variant?: 'text' | 'overline' | 'pill'
    color?: 'default' | 'brand' | 'blue' | 'muted'
    align?: 'left' | 'center' | 'right'
    marginBottom?: string
  }
  index: number
}

const alignClasses: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const marginBottomClasses: Record<string, string> = {
  '0': 'mb-0',
  '1': 'mb-1',
  '2': 'mb-2',
  '4': 'mb-4',
  '6': 'mb-6',
  '8': 'mb-8',
}

export default function EyebrowBlock({block}: EyebrowBlockProps) {
  const {
    text,
    variant = 'text',
    color = 'default',
    align = 'left',
    marginBottom = '4',
  } = block

  if (!text) return null

  const cleanVariant = stegaClean(variant)
  const cleanColor = stegaClean(color)
  const cleanAlign = stegaClean(align)
  const cleanMarginBottom = stegaClean(marginBottom)

  const alignClass = alignClasses[cleanAlign] || alignClasses.left
  const marginClass = marginBottomClasses[cleanMarginBottom] || marginBottomClasses['4']

  return (
    <div className={`${alignClass} ${marginClass}`}>
      <Eyebrow variant={cleanVariant} color={cleanColor}>
        {text}
      </Eyebrow>
    </div>
  )
}
