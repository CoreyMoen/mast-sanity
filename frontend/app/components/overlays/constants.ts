/**
 * Centralized constants for visual editing overlays
 * This file provides a single source of truth for selectors and block type configuration
 */

// =============================================================================
// SANITY SELECTORS
// =============================================================================

/**
 * Sanity library attribute selectors (from next-sanity and @sanity/visual-editing)
 * These are stable selectors maintained by the Sanity team
 */
export const SANITY_SELECTORS = {
  /** Main data attribute for Sanity-managed elements */
  SANITY_ATTRIBUTE: '[data-sanity]',
  /** Overlay element created by @sanity/visual-editing */
  OVERLAY_ELEMENT: '[data-sanity-overlay-element]',
  /** Overlay container */
  OVERLAY_CONTAINER: '[data-sanity-overlay]',
  /** Custom block type indicator (set by our components) */
  BLOCK_TYPE: '[data-block-type]',
} as const

/**
 * Internal Sanity component selectors - HIGH BREAKING CHANGE RISK
 * These depend on @sanity/visual-editing internal structure and may change between versions
 * Consider deprecating in favor of data-sanity-overlay-element when possible
 *
 * WARNING: If Sanity updates their visual editing library, these selectors may break.
 * Monitor @sanity/visual-editing changelog for changes to:
 * 1. Internal component naming (data-ui="Flex", data-ui="Label")
 * 2. DOM hierarchy (> div:first-child patterns)
 * 3. Class names (.sanity-overlay__element-label)
 */
export const SANITY_INTERNAL_SELECTORS = {
  FLEX_COMPONENT: '[data-ui="Flex"]',
  LABEL_COMPONENT: '[data-ui="Label"]',
  CLASS_BASED_LABEL: '.sanity-overlay__element-label',
  OVERLAY_ELEMENT_LABEL_ATTR: '[data-sanity-overlay-element-label]',
  OVERLAY_ELEMENT_INTERNAL: '[data-overlay-element]',
  ABSOLUTE_POSITIONED: 'div[style*="position: absolute"][style*="top:"]',
} as const

// =============================================================================
// BLOCK TYPE CONFIGURATION
// =============================================================================

/**
 * All block type keys used in the page builder
 * This should match the _type values from Sanity schemas
 */
export type BlockTypeKey =
  | 'section'
  | 'row'
  | 'column'
  | 'headingBlock'
  | 'richTextBlock'
  | 'imageBlock'
  | 'buttonBlock'
  | 'spacerBlock'
  | 'dividerBlock'
  | 'sliderBlock'
  | 'tabsBlock'
  | 'eyebrowBlock'
  | 'cardBlock'
  | 'iconBlock'
  | 'accordionBlock'
  | 'breadcrumbBlock'
  | 'tableBlock'
  | 'modalBlock'
  | 'inlineVideoBlock'
  | 'marqueeBlock'
  | 'contentWrap'

/**
 * Human-readable labels for each block type
 * Used in overlay labels and debugging
 */
export const BLOCK_TYPE_LABELS: Record<BlockTypeKey, string> = {
  section: 'Section',
  row: 'Row',
  column: 'Column',
  headingBlock: 'Heading',
  richTextBlock: 'Rich Text',
  imageBlock: 'Image',
  buttonBlock: 'Button',
  spacerBlock: 'Spacer',
  dividerBlock: 'Divider',
  sliderBlock: 'Slider',
  tabsBlock: 'Tabs',
  eyebrowBlock: 'Eyebrow',
  cardBlock: 'Card',
  iconBlock: 'Icon',
  accordionBlock: 'Accordion',
  breadcrumbBlock: 'Breadcrumb',
  tableBlock: 'Table',
  modalBlock: 'Modal',
  inlineVideoBlock: 'Video',
  marqueeBlock: 'Marquee',
  contentWrap: 'Content Wrap',
}

/**
 * Icons for each block type label (used in overlay displays)
 * Maps from the human-readable label to an icon character
 */
export const BLOCK_TYPE_ICONS: Record<string, string> = {
  'Section': '▭',
  'Row': '≡',
  'Column': '▯',
  'Heading': 'H',
  'Rich Text': '¶',
  'Image': '🖼',
  'Button': '⬚',
  'Spacer': '↕',
  'Divider': '─',
  'Slider': '◄►',
  'Tabs': '≡',
  'Eyebrow': '•',
  'Card': '☐',
  'Icon': '★',
  'Accordion': '▼',
  'Breadcrumb': '→',
  'Table': '▦',
  'Modal': '▢',
  'Video': '▶',
  'Marquee': '⇄',
  'Content Wrap': '⊡',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get human-readable label for a block type
 * @param blockType - The _type value from Sanity schema
 * @returns Human-readable label or the original type if not found
 */
export function getBlockLabel(blockType: string): string {
  return BLOCK_TYPE_LABELS[blockType as BlockTypeKey] || blockType
}

/**
 * Get icon for a block type label
 * @param label - Human-readable label (from getBlockLabel)
 * @returns Icon character or default diamond
 */
export function getBlockIcon(label: string): string {
  return BLOCK_TYPE_ICONS[label] || '◇'
}

/**
 * Get both label and icon for a block type
 * @param blockType - The _type value from Sanity schema
 * @returns Object with label and icon
 */
export function getBlockInfo(blockType: string): { label: string; icon: string } {
  const label = getBlockLabel(blockType)
  const icon = getBlockIcon(label)
  return { label, icon }
}

// =============================================================================
// CSS FOR HIDING DEFAULT SANITY LABELS
// =============================================================================

/**
 * CSS to hide default Sanity visual editing labels
 * WARNING: These selectors depend on internal Sanity component structure
 * and may break with @sanity/visual-editing updates
 *
 * This CSS is injected to hide default labels so we can show our custom labels
 */
export const HIDE_DEFAULT_LABEL_CSS = `
  /* Hide the default Sanity visual editing label */
  /* WARNING: These selectors depend on @sanity/visual-editing internal structure */
  ${SANITY_SELECTORS.OVERLAY_ELEMENT} > ${SANITY_INTERNAL_SELECTORS.FLEX_COMPONENT}:first-child,
  ${SANITY_SELECTORS.OVERLAY_CONTAINER} ${SANITY_INTERNAL_SELECTORS.LABEL_COMPONENT},
  ${SANITY_INTERNAL_SELECTORS.OVERLAY_ELEMENT_LABEL_ATTR},
  ${SANITY_INTERNAL_SELECTORS.OVERLAY_ELEMENT_INTERNAL} > div:first-child > div:first-child,
  ${SANITY_INTERNAL_SELECTORS.CLASS_BASED_LABEL},
  ${SANITY_SELECTORS.SANITY_ATTRIBUTE} + ${SANITY_INTERNAL_SELECTORS.ABSOLUTE_POSITIONED} {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
  }
`
