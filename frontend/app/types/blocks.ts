/**
 * Block type definitions for the page builder
 * These types supplement the auto-generated sanity.types.ts
 * and provide stricter typing for block components
 */

import type {SanityImageAsset} from '@/sanity.types'

// =============================================================================
// BASE TYPES
// =============================================================================

/** Base block type with required _key and _type */
export interface BaseBlock {
  _key: string
  _type: string
}

/** Sanity image reference */
export interface SanityImageSource {
  _type: 'image'
  asset?: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    width: number
    height: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  alt?: string
}

/** Link object from Sanity */
export interface LinkObject {
  _type?: 'link'
  linkType?: 'href' | 'page' | 'post' | 'external'
  href?: string
  page?: string // Resolved slug
  post?: string // Resolved slug
  openInNewTab?: boolean
}

// =============================================================================
// CONTENT BLOCKS
// =============================================================================

export interface HeadingBlock extends BaseBlock {
  _type: 'headingBlock'
  text?: string
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'inherit' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  align?: 'left' | 'center' | 'right'
  color?: 'default' | 'gray' | 'white' | 'brand' | 'blue'
  customStyle?: string
}

export interface RichTextBlock extends BaseBlock {
  _type: 'richTextBlock'
  content?: Array<{
    _type: string
    _key: string
    children?: Array<{
      _type: string
      text?: string
      marks?: string[]
    }>
    markDefs?: Array<{
      _type: string
      _key: string
      href?: string
      page?: string
      post?: string
    }>
    style?: string
    listItem?: string
    level?: number
  }>
  size?: 'sm' | 'base' | 'lg' | 'xl'
  align?: 'left' | 'center' | 'right'
  color?: 'default' | 'gray' | 'white' | 'brand'
  maxWidth?: 'full' | 'prose' | 'md' | 'lg'
  customStyle?: string
}

export interface ImageBlock extends BaseBlock {
  _type: 'imageBlock'
  image?: SanityImageSource
  alt?: string
  caption?: string
  size?: 'small' | 'medium' | 'large' | 'full'
  aspectRatio?: 'auto' | '1:1' | '4:3' | '16:9' | '21:9'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  shadow?: boolean
}

export interface ButtonBlock extends BaseBlock {
  _type: 'buttonBlock'
  label?: string
  link?: LinkObject
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  iconPosition?: 'left' | 'right'
}

export interface SpacerBlock extends BaseBlock {
  _type: 'spacerBlock'
  sizeDesktop?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  sizeMobile?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export interface DividerBlock extends BaseBlock {
  _type: 'dividerBlock'
  marginTop?: 'none' | 'sm' | 'md' | 'lg'
  marginBottom?: 'none' | 'sm' | 'md' | 'lg'
  color?: 'default' | 'light' | 'dark'
}

export interface EyebrowBlock extends BaseBlock {
  _type: 'eyebrowBlock'
  text?: string
  variant?: 'text' | 'overline' | 'pill'
  color?: 'default' | 'gray' | 'brand' | 'blue'
  customStyle?: string
}

export interface IconBlock extends BaseBlock {
  _type: 'iconBlock'
  icon?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'default' | 'gray' | 'brand' | 'blue' | 'white'
  align?: 'left' | 'center' | 'right'
  marginBottom?: 'none' | 'sm' | 'md' | 'lg'
}

export interface CardBlock extends BaseBlock {
  _type: 'cardBlock'
  content?: ContentBlock[]
  backgroundImage?: SanityImageSource
  backgroundColor?: 'none' | 'primary' | 'secondary'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

// =============================================================================
// INTERACTIVE BLOCKS
// =============================================================================

export interface AccordionBlock extends BaseBlock {
  _type: 'accordionBlock'
  items?: Array<{
    _key: string
    title?: string
    content?: ContentBlock[]
  }>
  defaultOpen?: boolean
}

export interface TabsBlock extends BaseBlock {
  _type: 'tabsBlock'
  tabs?: Array<{
    _key: string
    label?: string
    content?: ContentBlock[]
  }>
}

export interface SliderBlock extends BaseBlock {
  _type: 'sliderBlock'
  slides?: Array<{
    _key: string
    image?: SanityImageSource
    alt?: string
    caption?: string
  }>
  autoplay?: boolean
  showNavigation?: boolean
  showPagination?: boolean
}

export interface ModalBlock extends BaseBlock {
  _type: 'modalBlock'
  triggerLabel?: string
  triggerVariant?: 'primary' | 'secondary' | 'ghost' | 'link'
  content?: ContentBlock[]
  title?: string
}

export interface InlineVideoBlock extends BaseBlock {
  _type: 'inlineVideoBlock'
  videoFile?: {
    asset?: {
      _ref: string
      url?: string
    }
  }
  poster?: SanityImageSource
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
}

export interface MarqueeBlock extends BaseBlock {
  _type: 'marqueeBlock'
  items?: Array<{
    _key: string
    text?: string
    image?: SanityImageSource
  }>
  speed?: 'slow' | 'medium' | 'fast'
  direction?: 'left' | 'right'
}

// =============================================================================
// UTILITY BLOCKS
// =============================================================================

export interface BreadcrumbBlock extends BaseBlock {
  _type: 'breadcrumbBlock'
  showHome?: boolean
  separator?: 'slash' | 'chevron' | 'arrow'
}

export interface TableBlock extends BaseBlock {
  _type: 'tableBlock'
  rows?: Array<{
    _key: string
    cells?: string[]
  }>
  hasHeader?: boolean
}

export interface ContentWrap extends BaseBlock {
  _type: 'contentWrap'
  content?: ContentBlock[]
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  align?: 'left' | 'center' | 'right'
  customStyle?: string
}

// =============================================================================
// LAYOUT TYPES
// =============================================================================

export interface RowBlock extends BaseBlock {
  _type: 'row'
  columns?: ColumnBlock[]
  horizontalAlign?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  verticalAlign?: 'start' | 'center' | 'end' | 'stretch' | 'baseline' | 'between'
  gap?: '0' | '2' | '4' | '6' | '8' | '12'
  wrap?: boolean
  reverseOnMobile?: boolean
  customStyle?: string
}

export interface ColumnBlock extends BaseBlock {
  _type: 'column'
  content?: ContentBlock[]
  widthDesktop?: 'auto' | 'fill' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  widthTablet?: 'inherit' | 'auto' | 'fill' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  widthMobile?: 'inherit' | 'auto' | 'fill' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  verticalAlign?: 'start' | 'center' | 'end' | 'between'
  padding?: '0' | '2' | '4' | '6' | '8'
  customStyle?: string
}

export interface SectionBlock extends BaseBlock {
  _type: 'section'
  label?: string
  rows?: Array<RowBlock | ContentBlock>
  backgroundColor?: 'primary' | 'secondary'
  backgroundImage?: SanityImageSource
  backgroundOverlay?: 0 | 20 | 40 | 60 | 80
  minHeight?: 'auto' | 'small' | 'medium' | 'large' | 'screen' | 'custom'
  customMinHeight?: string
  verticalAlign?: 'start' | 'center' | 'end'
  maxWidth?: 'full' | 'container' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  paddingTop?: 'none' | 'compact' | 'default' | 'spacious'
  paddingBottom?: 'none' | 'compact' | 'default' | 'spacious'
}

// =============================================================================
// UNION TYPES
// =============================================================================

/** All content block types that can appear in columns */
export type ContentBlock =
  | HeadingBlock
  | RichTextBlock
  | ImageBlock
  | ButtonBlock
  | SpacerBlock
  | DividerBlock
  | EyebrowBlock
  | IconBlock
  | CardBlock
  | AccordionBlock
  | TabsBlock
  | SliderBlock
  | ModalBlock
  | InlineVideoBlock
  | MarqueeBlock
  | BreadcrumbBlock
  | TableBlock
  | ContentWrap
  | RowBlock

/** All page builder block types */
export type PageBuilderBlock =
  | SectionBlock
  | ContentBlock

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/** Standard props for block components */
export interface BlockComponentProps<T extends BaseBlock = BaseBlock> {
  block: T
  index: number
}

/** Props for layout components that need page context */
export interface LayoutBlockProps<T extends BaseBlock = BaseBlock> extends BlockComponentProps<T> {
  pageId?: string
  pageType?: string
}

/** Props for Column component */
export interface ColumnProps extends LayoutBlockProps<ColumnBlock> {
  sectionKey?: string
  rowKey?: string
  gap?: string
}

/** Props for Row component */
export interface RowProps extends LayoutBlockProps<RowBlock> {
  sectionKey?: string
}

/** Props for Section component */
export interface SectionProps extends LayoutBlockProps<SectionBlock> {}
