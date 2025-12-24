'use client'

import {stegaClean} from 'next-sanity'
import {Eyebrow} from '../ui/eyebrow'

interface EyebrowBlockProps {
  text?: string
  variant?: 'text' | 'overline' | 'pill'
  color?: 'default' | 'brand' | 'blue' | 'muted'
  align?: 'left' | 'center' | 'right'
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export default function EyebrowBlock({
  text,
  variant = 'text',
  color = 'default',
  align = 'left',
}: EyebrowBlockProps) {
  if (!text) return null

  const cleanVariant = stegaClean(variant)
  const cleanColor = stegaClean(color)
  const cleanAlign = stegaClean(align)

  return (
    <div className={`mb-4 ${alignClasses[cleanAlign]}`}>
      <Eyebrow variant={cleanVariant} color={cleanColor}>
        {text}
      </Eyebrow>
    </div>
  )
}
