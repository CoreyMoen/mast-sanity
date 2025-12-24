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
    paddingDesktop?: CardPadding
    paddingMobile?: CardPadding
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
    paddingDesktop = '6',
    paddingMobile = '4',
    variant = 'default',
    href,
    openInNewTab = false,
    hoverEffect = false,
  } = block

  // Ensure content is always an array
  const contentItems = content ?? []

  // Clean stega encoding from values
  const cleanPaddingDesktop = stegaClean(paddingDesktop) as CardPadding
  const cleanPaddingMobile = stegaClean(paddingMobile) as CardPadding
  const cleanVariant = stegaClean(variant) as CardVariant
  const cleanHref = stegaClean(href)
  const cleanOpenInNewTab = stegaClean(openInNewTab)
  const cleanHoverEffect = stegaClean(hoverEffect)

  return (
    <Card
      paddingDesktop={cleanPaddingDesktop}
      paddingMobile={cleanPaddingMobile}
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
