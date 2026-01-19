'use client'

import {stegaClean} from 'next-sanity'
import {Eyebrow} from '../ui/eyebrow'
import {parseCustomStyle} from '@/app/lib/parseCustomStyle'

interface EyebrowBlockProps {
  block: {
    _key: string
    _type: string
    text?: string
    variant?: 'text' | 'overline' | 'pill'
    color?: 'default' | 'brand' | 'blue' | 'muted'
    align?: 'left' | 'center' | 'right'
    customStyle?: string
  }
  index: number
}

const alignClasses: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export default function EyebrowBlock({block}: EyebrowBlockProps) {
  const {
    text,
    variant = 'text',
    color = 'default',
    align = 'left',
    customStyle,
  } = block

  if (!text) return null

  const cleanVariant = stegaClean(variant)
  const cleanColor = stegaClean(color)
  const cleanAlign = stegaClean(align)

  const alignClass = alignClasses[cleanAlign] || alignClasses.left
  const inlineStyle = parseCustomStyle(customStyle)

  return (
    <div className={alignClass} style={inlineStyle}>
      <Eyebrow variant={cleanVariant} color={cleanColor}>
        {text}
      </Eyebrow>
    </div>
  )
}
