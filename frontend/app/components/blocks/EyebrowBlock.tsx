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
    customStyle?: string
  }
  index: number
}

// Parse CSS string to React style object
function parseCustomStyle(cssString?: string): React.CSSProperties | undefined {
  if (!cssString) return undefined
  try {
    return Object.fromEntries(
      cssString
        .split(';')
        .filter((s) => s.trim())
        .map((s) => {
          const [key, ...valueParts] = s.split(':')
          const value = valueParts.join(':').trim()
          const camelKey = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase())
          return [camelKey, value]
        })
    )
  } catch {
    return undefined
  }
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
