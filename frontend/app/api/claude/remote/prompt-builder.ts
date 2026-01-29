/**
 * Prompt Builder for Remote API
 *
 * Builds the system prompt for Claude using instructions, workflows,
 * and schema context. Mirrors the logic from the Studio plugin but
 * works in a server-side context.
 */

import type {
  InstructionsDocument,
  WorkflowDocument,
  InstructionCategory,
} from './types'
import { getServerSchemaContext, detectRelevantCategories } from './sanity-loader'

/**
 * Base system prompt for the Claude assistant (same as Studio plugin)
 */
const BASE_SYSTEM_PROMPT = `You are an AI assistant that helps create and manage content in Sanity CMS. You are being accessed via a remote API, which means:

1. You should be concise and action-oriented
2. You should execute actions directly rather than asking for confirmation (unless the request is ambiguous)
3. You should return structured results that can be processed programmatically

## Your Capabilities

1. **Create Content**: You can create new documents of any available type
2. **Update Content**: You can modify existing documents
3. **Delete Content**: You can remove documents
4. **Query Content**: You can search and retrieve documents using GROQ queries

## Action Format

When you need to perform an action, output it in this format:

\`\`\`action
{
  "type": "create|update|delete|query",
  "description": "Human-readable description of what this action does",
  "payload": {
    // For create:
    "documentType": "page",
    "fields": { "title": "New Page", "slug": { "current": "new-page" } }

    // For update:
    "documentId": "abc123",
    "fields": { "title": "Updated Title" }

    // For delete:
    "documentId": "abc123"

    // For query:
    "query": "*[_type == 'page'][0...10]{ _id, _type, ... }"
  }
}
\`\`\`

## Creating Pages with Nested Content

When creating pages with the page builder, include complete nested structures:

\`\`\`action
{
  "type": "create",
  "description": "Create a new landing page with hero section",
  "payload": {
    "documentType": "page",
    "fields": {
      "name": "Landing Page",
      "slug": { "_type": "slug", "current": "landing-page" },
      "pageBuilder": [
        {
          "_key": "abc123def4",
          "_type": "section",
          "label": "Hero",
          "paddingTop": "default",
          "maxWidth": "container",
          "rows": [
            {
              "_key": "row123abc4",
              "_type": "row",
              "columns": [
                {
                  "_key": "col123abc4",
                  "_type": "column",
                  "widthDesktop": "12",
                  "content": [
                    {
                      "_key": "blk123abc4",
                      "_type": "headingBlock",
                      "text": "Welcome",
                      "level": "h1"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
\`\`\`

**CRITICAL RULES:**
- Every array item MUST have both \`_key\` (random 10-char string) and \`_type\`
- Items in \`pageBuilder\` need \`"_type": "section"\`
- Items in \`rows\` need \`"_type": "row"\`
- Items in \`columns\` need \`"_type": "column"\`
- Items in \`content\` need their block type (e.g., \`"_type": "headingBlock"\`)

## Remote API Guidelines

Since this is a remote/automated context:
- Be direct and action-oriented
- Create drafts by default (safer for automated workflows)
- Return meaningful descriptions of what was created
- If the request is clear, execute immediately
- If the request is ambiguous, ask a clarifying question in your response
`

/**
 * Convert Portable Text to plain text (simplified version for server-side)
 */
function portableTextToPlainText(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    return content
      .filter((block): block is { _type: string; children?: Array<{ text?: string }> } =>
        block && typeof block === 'object' && block._type === 'block'
      )
      .map(block => {
        if (!block.children) return ''
        return block.children
          .filter((child): child is { text: string } => child && typeof child.text === 'string')
          .map(child => child.text)
          .join('')
      })
      .join('\n\n')
  }

  return ''
}

/**
 * Format instructions for the prompt based on selected categories
 */
function formatInstructions(
  instructions: InstructionsDocument,
  categories: Set<InstructionCategory>
): string {
  const parts: string[] = []

  // Always include forbidden terms (critical for brand safety)
  if (instructions.forbiddenTerms && instructions.forbiddenTerms.length > 0) {
    parts.push('## Forbidden Terms (ALWAYS FOLLOW)')
    instructions.forbiddenTerms.forEach(term => {
      parts.push(`- Never use: "${term}"`)
    })
    parts.push('')
  }

  // Always include max nesting depth
  const maxNesting = instructions.maxNestingDepth || 12
  parts.push('## Core Technical Constraints')
  parts.push(`- Maximum nesting depth: ${maxNesting} levels`)
  parts.push('- Build pages incrementally to avoid depth limits')
  parts.push('')

  // Writing guidelines (conditional)
  if (categories.has('writing')) {
    const writingContent = portableTextToPlainText(instructions.writingGuidelines)
    if (writingContent) {
      parts.push('## Writing Guidelines')
      parts.push(writingContent)
      parts.push('')
    }

    const brandVoice = portableTextToPlainText(instructions.brandVoice)
    if (brandVoice) {
      parts.push('### Brand Voice')
      parts.push(brandVoice)
      parts.push('')
    }

    if (instructions.preferredTerms && instructions.preferredTerms.length > 0) {
      parts.push('### Preferred Terms')
      instructions.preferredTerms.forEach(term => {
        parts.push(`- Instead of "${term.avoid}", use "${term.useInstead}"`)
      })
      parts.push('')
    }
  }

  // Design guidelines (conditional)
  if (categories.has('design')) {
    const designContent = portableTextToPlainText(instructions.designSystemRules)
    if (designContent) {
      parts.push('## Design System Rules')
      parts.push(designContent)
      parts.push('')
    }

    if (instructions.componentGuidelines && instructions.componentGuidelines.length > 0) {
      parts.push('### Component Guidelines')
      instructions.componentGuidelines.forEach(comp => {
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

  // Technical constraints (conditional)
  if (categories.has('technical')) {
    const technicalContent = portableTextToPlainText(instructions.technicalConstraints)
    if (technicalContent) {
      parts.push('## Technical Constraints')
      parts.push(technicalContent)
      parts.push('')
    }

    if (instructions.requiredFields && instructions.requiredFields.length > 0) {
      parts.push('### Required Fields')
      instructions.requiredFields.forEach(rule => {
        const fields = rule.fields?.join(', ') || 'None specified'
        parts.push(`- ${rule.component}: ${fields}`)
      })
      parts.push('')
    }
  }

  return parts.join('\n')
}

/**
 * Build context string for selected documents
 */
function formatDocumentContext(
  documents: Array<{ _id: string; _type: string; name?: string; title?: string; slug?: string }>
): string {
  if (!documents.length) return ''

  const lines = ['## Document Context', 'The following documents are provided as context:']

  for (const doc of documents) {
    const name = doc.name || doc.title || 'Untitled'
    const slugInfo = doc.slug ? `, slug: "${doc.slug}"` : ''
    lines.push(`- **${name}** (${doc._type}, ID: \`${doc._id}\`${slugInfo})`)
  }

  lines.push('')
  lines.push('Use these document IDs when the user refers to these documents.')

  return lines.join('\n')
}

/**
 * Options for building the system prompt
 */
export interface BuildPromptOptions {
  /** The user's message (for category detection) */
  userMessage: string

  /** Instructions document from Sanity */
  instructions: InstructionsDocument | null

  /** Workflow to apply (optional) */
  workflow: WorkflowDocument | null

  /** Categories to include (if not provided, will be auto-detected) */
  includeCategories?: InstructionCategory[]

  /** Documents loaded for context */
  contextDocuments?: Array<{ _id: string; _type: string; name?: string; title?: string; slug?: string }>

  /** Additional context text */
  additionalContext?: string
}

/**
 * Build the complete system prompt for Claude
 */
export function buildSystemPrompt(options: BuildPromptOptions): {
  prompt: string
  includedCategories: InstructionCategory[]
} {
  const parts: string[] = [BASE_SYSTEM_PROMPT]

  // Add schema context
  parts.push('\n## Available Schema\n')
  parts.push(getServerSchemaContext())

  // Determine which instruction categories to include
  let categories: Set<InstructionCategory>
  if (options.includeCategories) {
    categories = new Set(options.includeCategories)
  } else {
    categories = detectRelevantCategories(options.userMessage, options.instructions)
  }

  // Add instructions
  if (options.instructions) {
    const formattedInstructions = formatInstructions(options.instructions, categories)
    if (formattedInstructions) {
      parts.push('\n## Custom Instructions\n')
      parts.push(formattedInstructions)
    }
  }

  // Add workflow context
  if (options.workflow?.systemInstructions) {
    parts.push('\n## Active Workflow: ' + options.workflow.name + '\n')
    parts.push(options.workflow.systemInstructions)
  }

  // Add document context
  if (options.contextDocuments && options.contextDocuments.length > 0) {
    parts.push('\n')
    parts.push(formatDocumentContext(options.contextDocuments))
  }

  // Add additional context
  if (options.additionalContext) {
    parts.push('\n## Additional Context\n')
    parts.push(options.additionalContext)
  }

  return {
    prompt: parts.join('\n'),
    includedCategories: Array.from(categories),
  }
}
