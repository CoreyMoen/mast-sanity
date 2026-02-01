/**
 * Content Variable Resolution Utilities
 *
 * These utilities help resolve content variables on the frontend.
 * Content variables can be:
 * - Text: Simple string values
 * - Link: URL/Page/Post references
 * - Image: Image assets
 *
 * Variables can be used in:
 * - smartString fields (headingBlock, eyebrowBlock, buttonBlock)
 * - Inline in Portable Text (contentVariableInline)
 * - As link targets (in link fields and annotations)
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Content Variable document structure (resolved from Sanity) */
export interface ContentVariable {
  _id?: string
  _type?: 'contentVariable'
  name?: string
  key?: {
    current?: string
  }
  variableType?: 'text' | 'link' | 'image'
  textValue?: string
  linkValue?: ResolvedLink
  imageValue?: {
    _type: 'image'
    asset?: {
      _ref: string
      _type: 'reference'
      url?: string
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
  }
  description?: string
}

/** Resolved link structure */
export interface ResolvedLink {
  _type?: 'link'
  linkType?: 'href' | 'page' | 'post' | 'variable'
  href?: string
  page?: {
    _ref?: string
    slug?: string
  }
  post?: {
    _ref?: string
    slug?: string
  }
  variable?: ContentVariable
  openInNewTab?: boolean
}

/** SmartString field structure */
export interface SmartString {
  _type?: 'smartString'
  mode?: 'static' | 'variable'
  staticValue?: string
  variableRef?: ContentVariable
}

/** Inline variable in Portable Text */
export interface ContentVariableInline {
  _type?: 'contentVariableInline'
  _key?: string
  reference?: ContentVariable
}

// =============================================================================
// RESOLUTION FUNCTIONS
// =============================================================================

/**
 * Resolves a SmartString field to its text value.
 * Handles both static text and variable references.
 *
 * @param smartString - The SmartString field value
 * @param fallback - Optional fallback if no value found
 * @returns The resolved text string
 */
export function resolveSmartString(
  smartString?: SmartString | string | null,
  fallback: string = ''
): string {
  // Handle null/undefined
  if (!smartString) {
    return fallback
  }

  // Handle legacy plain string values (backward compatibility)
  if (typeof smartString === 'string') {
    return smartString || fallback
  }

  // Handle SmartString object
  if (smartString.mode === 'variable' && smartString.variableRef) {
    // Variable mode - get text from referenced variable
    const variable = smartString.variableRef
    if (variable.variableType === 'text' && variable.textValue) {
      return variable.textValue
    }
    // Variable exists but no text value
    return fallback
  }

  // Static mode or default
  return smartString.staticValue || fallback
}

/**
 * Resolves a link that may reference a content variable.
 * Returns the final URL string.
 *
 * @param link - The link object (may contain variable reference)
 * @returns The resolved URL string or undefined
 */
export function resolveLinkUrl(link?: ResolvedLink | null): string | undefined {
  if (!link) return undefined

  // Handle content variable link type
  if (link.linkType === 'variable' && link.variable) {
    const variable = link.variable
    if (variable.variableType === 'link' && variable.linkValue) {
      // Recursively resolve the variable's link value
      return resolveLinkUrl(variable.linkValue)
    }
    return undefined
  }

  // Handle standard link types
  switch (link.linkType) {
    case 'href':
      return link.href
    case 'page':
      return link.page?.slug ? `/${link.page.slug}` : undefined
    case 'post':
      return link.post?.slug ? `/posts/${link.post.slug}` : undefined
    default:
      // Fallback: try href directly
      return link.href
  }
}

/**
 * Checks if a link should open in a new tab.
 * Considers both direct setting and variable reference.
 *
 * @param link - The link object
 * @returns Whether to open in new tab
 */
export function shouldOpenInNewTab(link?: ResolvedLink | null): boolean {
  if (!link) return false

  // If it's a variable link, check the variable's link value
  if (link.linkType === 'variable' && link.variable?.linkValue) {
    return link.variable.linkValue.openInNewTab ?? false
  }

  return link.openInNewTab ?? false
}

/**
 * Resolves an inline content variable to its text value.
 * Used for Portable Text inline variables.
 *
 * @param inlineVar - The inline variable object
 * @returns The resolved text or a placeholder
 */
export function resolveInlineVariable(inlineVar?: ContentVariableInline | null): string {
  if (!inlineVar?.reference) {
    return '[missing variable]'
  }

  const variable = inlineVar.reference

  if (variable.variableType === 'text' && variable.textValue) {
    return variable.textValue
  }

  // Return the key as a fallback indicator
  return `[${variable.key?.current || variable.name || 'variable'}]`
}

/**
 * Type guard to check if a value is a SmartString object
 */
export function isSmartString(value: unknown): value is SmartString {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_type' in value &&
    (value as SmartString)._type === 'smartString'
  )
}

/**
 * Type guard to check if a value is a ContentVariableInline
 */
export function isContentVariableInline(value: unknown): value is ContentVariableInline {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_type' in value &&
    (value as ContentVariableInline)._type === 'contentVariableInline'
  )
}
