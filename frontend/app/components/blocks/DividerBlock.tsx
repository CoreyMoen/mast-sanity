import {stegaClean} from 'next-sanity'
import {Divider, type SpacingSize, type DividerColor} from '@/app/components/ui/divider'

interface DividerBlockProps {
  block: {
    _key: string
    _type: string
    marginTop?: SpacingSize
    marginBottom?: SpacingSize
    color?: DividerColor
  }
  index: number
}

export default function DividerBlock({block}: DividerBlockProps) {
  const {marginTop = '8', marginBottom = '8', color = 'default'} = block

  // Clean stega encoding from values
  const cleanMarginTop = stegaClean(marginTop) as SpacingSize
  const cleanMarginBottom = stegaClean(marginBottom) as SpacingSize
  const cleanColor = stegaClean(color) as DividerColor

  return (
    <Divider
      marginTop={cleanMarginTop}
      marginBottom={cleanMarginBottom}
      color={cleanColor}
    />
  )
}
