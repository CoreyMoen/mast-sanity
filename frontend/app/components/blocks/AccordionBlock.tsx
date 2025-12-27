import {stegaClean} from 'next-sanity'
import {cn} from '@/lib/utils'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/app/components/ui/accordion'
import ContentBlockRenderer from './ContentBlockRenderer'

interface AccordionItemData {
  _key: string
  title?: string
  content?: Array<{
    _key: string
    _type: string
    [key: string]: any
  }>
  defaultOpen?: boolean
}

interface AccordionBlockProps {
  block: {
    _key: string
    _type: string
    items?: AccordionItemData[]
    allowMultiple?: boolean
    titleStyle?: 'h3' | 'h4' | 'h5' | 'body'
    dividers?: boolean
  }
  index: number
}

export default function AccordionBlock({block}: AccordionBlockProps) {
  const {
    items = [],
    allowMultiple = true,
    titleStyle = 'h4',
    dividers = true,
  } = block

  // Clean stega encoding
  const cleanAllowMultiple = stegaClean(allowMultiple)
  const cleanTitleStyle = stegaClean(titleStyle) as 'h3' | 'h4' | 'h5' | 'body'
  const cleanDividers = stegaClean(dividers)

  if (!items || items.length === 0) {
    return null
  }

  // Map titleStyle to component type
  const headingAs = cleanTitleStyle === 'body' ? 'span' : cleanTitleStyle

  return (
    <Accordion
      allowMultiple={cleanAllowMultiple}
      className={cn(
        'my-4',
        cleanDividers ? 'divide-y divide-border' : 'divide-y-0'
      )}
    >
      {items.map((item) => (
        <AccordionItem
          key={item._key}
          defaultOpen={item.defaultOpen}
          className={cn(!cleanDividers && 'mb-2')}
        >
          <AccordionTrigger as={headingAs}>
            {item.title || 'Untitled'}
          </AccordionTrigger>
          <AccordionContent>
            {item.content?.map((contentBlock, contentIndex) => (
              <ContentBlockRenderer
                key={contentBlock._key}
                block={contentBlock}
                index={contentIndex}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
