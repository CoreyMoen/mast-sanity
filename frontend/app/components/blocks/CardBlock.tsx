import {stegaClean} from 'next-sanity'
import {Card, type CardPadding, type CardVariant} from '@/app/components/ui/card'
import ContentBlockRenderer from './ContentBlockRenderer'

interface CardBlockProps {
  block: {
    _key: string
    _type: string
    content?: Array<{
      _key: string
      _type: string
      [key: string]: any
    }>
    padding?: CardPadding
    variant?: CardVariant
    href?: string
    openInNewTab?: boolean
    hoverEffect?: boolean
  }
  index: number
}

export default function CardBlock({block}: CardBlockProps) {
  const {
    content,
    padding = 'md',
    variant = 'default',
    href,
    openInNewTab = false,
    hoverEffect = false,
  } = block

  // Ensure content is always an array
  const contentItems = content ?? []

  // Clean stega encoding from values
  const cleanPadding = stegaClean(padding) as CardPadding
  const cleanVariant = stegaClean(variant) as CardVariant
  const cleanHref = stegaClean(href)
  const cleanOpenInNewTab = stegaClean(openInNewTab)
  const cleanHoverEffect = stegaClean(hoverEffect)

  return (
    <Card
      padding={cleanPadding}
      variant={cleanVariant}
      href={cleanHref}
      openInNewTab={cleanOpenInNewTab}
      hoverEffect={cleanHoverEffect}
    >
      {contentItems.map((contentBlock, contentIndex) => (
        <ContentBlockRenderer
          key={contentBlock._key}
          block={contentBlock}
          index={contentIndex}
        />
      ))}
    </Card>
  )
}
