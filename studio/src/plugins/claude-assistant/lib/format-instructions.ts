/**
 * Format Instructions for Claude
 *
 * Converts Sanity claudeInstructions document to a formatted string for Claude's system prompt.
 * This is in a separate file to avoid circular dependencies.
 *
 * Supports conditional instruction inclusion based on prompt keywords to optimize performance:
 * - Tier 1 (always): Base capabilities
 * - Tier 2 (always): Forbidden terms, max nesting depth, core technical rules
 * - Tier 3 (conditional): Writing guidelines, design rules, component guidelines
 *
 * Guideline fields are stored as Portable Text and serialized to Markdown for Claude.
 */

import {contentToMarkdown} from './portable-text-to-markdown'

/**
 * Portable Text block type (simplified for instructions)
 */
type PortableTextBlock = unknown[]

/**
 * Sanity claudeInstructions document format
 * Guideline fields are Portable Text arrays that get serialized to Markdown
 */
export interface SanityClaudeInstructions {
  _id: string
  _type: 'claudeInstructions'
  // Portable Text fields (rich text stored as array, serialized to Markdown)
  writingGuidelines?: PortableTextBlock | string
  brandVoice?: PortableTextBlock | string
  designSystemRules?: PortableTextBlock | string
  technicalConstraints?: PortableTextBlock | string
  // Simple fields
  forbiddenTerms?: string[]
  preferredTerms?: Array<{
    _key: string
    avoid: string
    useInstead: string
  }>
  componentGuidelines?: Array<{
    _key: string
    component: string
    guidelines?: string
    doNot?: string
  }>
  maxNestingDepth?: number
  requiredFields?: Array<{
    _key: string
    component: string
    fields?: string[]
  }>
  // Configurable trigger keywords for conditional instruction inclusion
  writingKeywords?: string
  designKeywords?: string
  technicalKeywords?: string
}

/**
 * Instruction categories for conditional inclusion
 */
export type InstructionCategory = 'writing' | 'design' | 'technical'

/**
 * Default keywords that trigger inclusion of specific instruction categories
 * These can be overridden by the Sanity claudeInstructions document
 */
const DEFAULT_CATEGORY_KEYWORDS: Record<InstructionCategory, string[]> = {
  writing: [
    'write', 'writing', 'copy', 'text', 'content', 'heading', 'title', 'description',
    'paragraph', 'rich text', 'blog', 'article', 'post', 'caption', 'label',
    'tone', 'voice', 'style', 'language', 'word', 'sentence', 'grammar'
  ],
  design: [
    'design', 'layout', 'section', 'row', 'column', 'spacing', 'padding', 'margin',
    'style', 'visual', 'color', 'theme', 'grid', 'responsive', 'mobile', 'desktop',
    'hero', 'banner', 'card', 'button', 'icon', 'image', 'slider', 'tab',
    'background', 'overlay', 'align', 'width', 'height'
  ],
  technical: [
    'nest', 'nesting', 'depth', 'schema', 'structure', 'field', 'type', 'key',
    'sanity', 'groq', 'query', 'api', 'update', 'create', 'delete', 'duplicate',
    'error', 'fail', 'bug', 'fix', 'constraint', 'limit', 'required'
  ],
}

/**
 * Parse comma-separated keywords string into array
 */
function parseKeywords(keywordsString?: string): string[] {
  if (!keywordsString) return []
  return keywordsString
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0)
}

/**
 * Build category keywords map from Sanity instructions (with fallback to defaults)
 */
export function buildCategoryKeywords(
  instructions?: SanityClaudeInstructions | null
): Record<InstructionCategory, string[]> {
  const writingKeywords = instructions?.writingKeywords
    ? parseKeywords(instructions.writingKeywords)
    : DEFAULT_CATEGORY_KEYWORDS.writing

  const designKeywords = instructions?.designKeywords
    ? parseKeywords(instructions.designKeywords)
    : DEFAULT_CATEGORY_KEYWORDS.design

  const technicalKeywords = instructions?.technicalKeywords
    ? parseKeywords(instructions.technicalKeywords)
    : DEFAULT_CATEGORY_KEYWORDS.technical

  return {
    writing: writingKeywords,
    design: designKeywords,
    technical: technicalKeywords,
  }
}

/**
 * Detect which instruction categories are relevant based on user prompt
 * Uses custom keywords from Sanity instructions if provided, otherwise falls back to defaults
 */
export function detectRelevantCategories(
  userMessage: string,
  instructions?: SanityClaudeInstructions | null
): Set<InstructionCategory> {
  const lowerMessage = userMessage.toLowerCase()
  const relevantCategories = new Set<InstructionCategory>()

  // Build keywords map (uses Sanity config or defaults)
  const categoryKeywords = buildCategoryKeywords(instructions)

  for (const [category, keywords] of Object.entries(categoryKeywords) as [InstructionCategory, string[]][]) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        relevantCategories.add(category)
        break
      }
    }
  }

  // If no categories detected, include all (fallback for ambiguous queries)
  if (relevantCategories.size === 0) {
    relevantCategories.add('writing')
    relevantCategories.add('design')
    relevantCategories.add('technical')
  }

  return relevantCategories
}

/**
 * Get default instructions when none are configured
 */
export function getDefaultInstructions(): string {
  return `## Default Guidelines
- Use clear, concise language
- Follow the schema structure
- Build pages incrementally
- Maximum nesting depth: 12 levels
- Follow proper heading hierarchy (h1 -> h2 -> h3)
- Set meaningful titles and slugs for SEO
- Include alt text for images
`
}

/**
 * Options for formatting instructions
 */
export interface FormatInstructionsOptions {
  /** User message for conditional category detection */
  userMessage?: string
  /** Force include all categories (bypass conditional logic) */
  includeAll?: boolean
}

/**
 * Format instructions from Sanity document for Claude
 *
 * When userMessage is provided, uses keyword detection to only include relevant
 * instruction categories. This optimizes prompt size and improves performance.
 *
 * Tier 1 (always included): Core capabilities context
 * Tier 2 (always included): Forbidden terms, max nesting depth, technical constraints
 * Tier 3 (conditional): Writing guidelines, design rules, component guidelines
 */
export function formatInstructionsForClaude(
  instructions: SanityClaudeInstructions | null,
  options?: FormatInstructionsOptions
): string {
  if (!instructions) {
    return getDefaultInstructions()
  }

  const parts: string[] = []

  // Detect relevant categories if userMessage provided
  // Pass instructions so custom keywords from Sanity can be used
  const relevantCategories = options?.userMessage && !options?.includeAll
    ? detectRelevantCategories(options.userMessage, instructions)
    : new Set<InstructionCategory>(['writing', 'design', 'technical'])

  const includeWriting = relevantCategories.has('writing')
  const includeDesign = relevantCategories.has('design')
  const includeTechnical = relevantCategories.has('technical')

  // --- TIER 2: Always include (essential for safe operation) ---

  // Forbidden Terms (always include - critical for brand safety)
  if (instructions.forbiddenTerms && instructions.forbiddenTerms.length > 0) {
    parts.push('## Forbidden Terms (ALWAYS FOLLOW)')
    instructions.forbiddenTerms.forEach((term) => {
      parts.push(`- Never use: "${term}"`)
    })
    parts.push('')
  }

  // Max Nesting Depth (always include - critical for technical safety)
  const maxNesting = instructions.maxNestingDepth || 12
  parts.push('## Core Technical Constraints')
  parts.push(`- Maximum nesting depth: ${maxNesting} levels`)
  parts.push('- Build pages incrementally to avoid depth limits')
  parts.push('')

  // --- TIER 3: Conditional based on detected categories ---

  // Writing Guidelines (conditional)
  if (includeWriting) {
    const writingContent = contentToMarkdown(instructions.writingGuidelines)
    if (writingContent) {
      parts.push('## Writing Guidelines')
      parts.push(writingContent)
      parts.push('')
    }

    // Brand Voice
    const brandVoiceContent = contentToMarkdown(instructions.brandVoice)
    if (brandVoiceContent) {
      parts.push('### Brand Voice')
      parts.push(brandVoiceContent)
      parts.push('')
    }

    // Preferred Terms
    if (instructions.preferredTerms && instructions.preferredTerms.length > 0) {
      parts.push('### Preferred Terms')
      instructions.preferredTerms.forEach((term) => {
        parts.push(`- Instead of "${term.avoid}", use "${term.useInstead}"`)
      })
      parts.push('')
    }
  }

  // Design System Rules (conditional)
  if (includeDesign) {
    const designContent = contentToMarkdown(instructions.designSystemRules)
    if (designContent) {
      parts.push('## Design System Rules')
      parts.push(designContent)
      parts.push('')
    }

    // Component Guidelines
    if (instructions.componentGuidelines && instructions.componentGuidelines.length > 0) {
      parts.push('### Component Guidelines')
      instructions.componentGuidelines.forEach((comp) => {
        parts.push(`**${comp.component}**`)
        if (comp.guidelines) {
          parts.push(`- Guidelines: ${comp.guidelines}`)
        }
        if (comp.doNot) {
          parts.push(`- Avoid: ${comp.doNot}`)
        }
        parts.push('')
      })
    }
  }

  // Technical Constraints (conditional - detailed technical info)
  if (includeTechnical) {
    const technicalContent = contentToMarkdown(instructions.technicalConstraints)
    if (technicalContent) {
      parts.push('## Technical Constraints')
      parts.push(technicalContent)
      parts.push('')
    }

    // Required Fields
    if (instructions.requiredFields && instructions.requiredFields.length > 0) {
      parts.push('### Required Fields')
      instructions.requiredFields.forEach((rule) => {
        const fields = rule.fields?.join(', ') || 'None specified'
        parts.push(`- ${rule.component}: ${fields}`)
      })
      parts.push('')
    }
  }

  // If we have content, return it; otherwise return defaults
  if (parts.length === 0) {
    return getDefaultInstructions()
  }

  return parts.join('\n')
}
