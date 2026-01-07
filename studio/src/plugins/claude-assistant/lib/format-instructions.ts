/**
 * Format Instructions for Claude
 *
 * Converts Sanity claudeInstructions document to a formatted string for Claude's system prompt.
 * This is in a separate file to avoid circular dependencies.
 */

/**
 * Sanity claudeInstructions document format
 */
export interface SanityClaudeInstructions {
  _id: string
  _type: 'claudeInstructions'
  writingGuidelines?: string
  brandVoice?: string
  forbiddenTerms?: string[]
  preferredTerms?: Array<{
    _key: string
    avoid: string
    useInstead: string
  }>
  designSystemRules?: string
  componentGuidelines?: Array<{
    _key: string
    component: string
    guidelines?: string
    doNot?: string
  }>
  technicalConstraints?: string
  maxNestingDepth?: number
  requiredFields?: Array<{
    _key: string
    component: string
    fields?: string[]
  }>
  examplePrompts?: Array<{
    _key: string
    category?: string
    userPrompt: string
    idealResponse?: string
    notes?: string
  }>
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
 * Format instructions from Sanity document for Claude
 */
export function formatInstructionsForClaude(instructions: SanityClaudeInstructions | null): string {
  if (!instructions) {
    return getDefaultInstructions()
  }

  const parts: string[] = []

  // Writing Guidelines
  parts.push('## Writing Guidelines')
  parts.push(instructions.writingGuidelines || 'No specific guidelines set.')
  parts.push('')

  // Brand Voice
  if (instructions.brandVoice) {
    parts.push('### Brand Voice')
    parts.push(instructions.brandVoice)
    parts.push('')
  }

  // Forbidden Terms
  if (instructions.forbiddenTerms && instructions.forbiddenTerms.length > 0) {
    parts.push('### Forbidden Terms')
    instructions.forbiddenTerms.forEach((term) => {
      parts.push(`- Never use: "${term}"`)
    })
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

  // Design System Rules
  parts.push('## Design System Rules')
  parts.push(instructions.designSystemRules || 'No design rules set.')
  parts.push('')

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

  // Technical Constraints
  parts.push('## Technical Constraints')
  parts.push(instructions.technicalConstraints || 'No technical constraints set.')
  parts.push('')

  // Max Nesting Depth
  const maxNesting = instructions.maxNestingDepth || 12
  parts.push(`- Maximum nesting depth: ${maxNesting} levels`)
  parts.push('- Build pages incrementally to avoid depth limits')
  parts.push('')

  // Required Fields
  if (instructions.requiredFields && instructions.requiredFields.length > 0) {
    parts.push('### Required Fields')
    instructions.requiredFields.forEach((rule) => {
      const fields = rule.fields?.join(', ') || 'None specified'
      parts.push(`- ${rule.component}: ${fields}`)
    })
    parts.push('')
  }

  // Examples
  if (instructions.examplePrompts && instructions.examplePrompts.length > 0) {
    parts.push('## Examples')
    instructions.examplePrompts.forEach((example) => {
      parts.push(`### Example: ${example.category || 'General'}`)
      parts.push(`**User:** ${example.userPrompt}`)
      if (example.idealResponse) {
        parts.push(`**Expected Response:** ${example.idealResponse}`)
      }
      if (example.notes) {
        parts.push(`**Notes:** ${example.notes}`)
      }
      parts.push('')
    })
  }

  return parts.join('\n')
}
