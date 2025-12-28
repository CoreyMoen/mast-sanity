import {person} from './documents/person'
import {page} from './documents/page'
import {post} from './documents/post'
import {callToAction} from './objects/callToAction'
import {infoSection} from './objects/infoSection'
import {settings} from './singletons/settings'
import {navigation} from './singletons/navigation'
import {footer} from './singletons/footer'
import {link} from './objects/link'
import {blockContent} from './objects/blockContent'
// Layout blocks
import {section} from './objects/section'
import {row} from './objects/row'
import {column} from './objects/column'
import {contentWrap} from './objects/contentWrap'
// Content blocks
import {headingBlock} from './objects/headingBlock'
import {richTextBlock} from './objects/richTextBlock'
import {imageBlock} from './objects/imageBlock'
import {buttonBlock} from './objects/buttonBlock'
import {spacerBlock} from './objects/spacerBlock'
import {dividerBlock} from './objects/dividerBlock'
import {cardBlock} from './objects/cardBlock'
import {eyebrowBlock} from './objects/eyebrowBlock'
import {breadcrumbBlock} from './objects/breadcrumbBlock'
import {tableBlock} from './objects/tableBlock'
import {iconBlock} from './objects/iconBlock'
import {accordionBlock} from './objects/accordionBlock'
// Interactive blocks
import {sliderBlock} from './objects/sliderBlock'
import {tabsBlock} from './objects/tabsBlock'
import {modalBlock} from './objects/modalBlock'
import {inlineVideoBlock} from './objects/inlineVideoBlock'
import {marqueeBlock} from './objects/marqueeBlock'

// Export an array of all the schema types.  This is used in the Sanity Studio configuration. https://www.sanity.io/docs/schema-types

export const schemaTypes = [
  // Singletons
  settings,
  navigation,
  footer,
  // Documents
  page,
  post,
  person,
  // Objects
  blockContent,
  infoSection,
  callToAction,
  link,
  // Layout blocks (must be in order: content blocks first, then column, row, section)
  headingBlock,
  richTextBlock,
  imageBlock,
  buttonBlock,
  spacerBlock,
  dividerBlock,
  cardBlock,
  eyebrowBlock,
  breadcrumbBlock,
  tableBlock,
  iconBlock,
  accordionBlock,
  sliderBlock,
  tabsBlock,
  modalBlock,
  inlineVideoBlock,
  marqueeBlock,
  contentWrap,
  column,
  row,
  section,
]
