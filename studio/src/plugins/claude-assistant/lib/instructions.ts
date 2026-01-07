/**
 * Instructions Formatting
 *
 * Builds and manages system prompts and instructions for Claude
 */

import type {SystemPromptContext, SchemaContext, ParsedAction} from '../types'
import {formatSchemaForPrompt} from './schema-context'

/**
 * Base system prompt for the Claude assistant
 */
const BASE_SYSTEM_PROMPT = `You are an AI assistant integrated into Sanity Studio, a content management system. Your role is to help content editors manage and create content efficiently.

## Your Capabilities

1. **Create Content**: You can create new documents of any available type
2. **Update Content**: You can modify existing documents
3. **Delete Content**: You can remove documents (with confirmation)
4. **Query Content**: You can search and retrieve documents using GROQ queries
5. **Navigate**: You can help users find and navigate to documents
6. **Explain**: You can explain schema structures, content relationships, and best practices

## Action Format

When you need to perform an action, output it in this format:

\`\`\`action
{
  "type": "create|update|delete|query|navigate|explain",
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
    "query": "*[_type == 'page'][0...10]"

    // For navigate:
    "documentId": "abc123"
    // or
    "path": "/desk/page;abc123"

    // For explain:
    "explanation": "Detailed explanation text"
  }
}
\`\`\`

## Guidelines

1. **Be Helpful**: Provide clear, actionable responses
2. **Be Safe**: Always confirm before destructive actions (delete)
3. **Be Accurate**: Use the exact field names and types from the schema
4. **Be Efficient**: Batch related operations when possible
5. **Be Educational**: Explain what you're doing and why

## Content Best Practices

- Follow proper heading hierarchy (h1 -> h2 -> h3)
- Use consistent formatting throughout documents
- Set meaningful titles and slugs for SEO
- Include alt text for images
- Structure content for accessibility
`

/**
 * Build the complete system prompt with context
 */
export function buildSystemPrompt(context: SystemPromptContext): string {
  const parts: string[] = [BASE_SYSTEM_PROMPT]

  // Add schema context
  if (context.schemaContext) {
    parts.push('\n## Available Schema\n')
    parts.push(formatSchemaForPrompt(context.schemaContext))
  }

  // Add current document context
  if (context.currentDocument) {
    parts.push('\n## Current Document Context\n')
    parts.push(`Type: ${context.currentDocument._type}`)
    parts.push(`ID: ${context.currentDocument._id}`)
    parts.push(`Title: ${(context.currentDocument as Record<string, unknown>).title || (context.currentDocument as Record<string, unknown>).name || 'Untitled'}`)
  }

  // Add recent actions for context
  if (context.recentActions && context.recentActions.length > 0) {
    parts.push('\n## Recent Actions\n')
    for (const action of context.recentActions.slice(-5)) {
      parts.push(`- ${action.type}: ${action.description} (${action.status})`)
    }
  }

  // Add custom instructions
  if (context.customInstructions) {
    parts.push('\n## Custom Instructions\n')
    parts.push(context.customInstructions)
  }

  return parts.join('\n')
}

/**
 * Format a user message with optional context
 */
export function formatUserMessage(
  content: string,
  documentContext?: {type: string; id: string}
): string {
  if (documentContext) {
    return `[Context: ${documentContext.type} document, ID: ${documentContext.id}]\n\n${content}`
  }
  return content
}

/**
 * Get example prompts for users
 */
export function getExamplePrompts(): Array<{label: string; prompt: string}> {
  return [
    {
      label: 'Create a new page',
      prompt: 'Create a new page called "About Us" with a hero section',
    },
    {
      label: 'Find recent content',
      prompt: 'Show me the 5 most recently updated pages',
    },
    {
      label: 'Update content',
      prompt: 'Update the title of the current document to "New Title"',
    },
    {
      label: 'Explain schema',
      prompt: 'Explain the structure of the page document type',
    },
    {
      label: 'Query content',
      prompt: 'Find all pages that have a hero section',
    },
    {
      label: 'Help with GROQ',
      prompt: 'Help me write a GROQ query to find posts by author',
    },
  ]
}

/**
 * Default instruction sets that can be used
 */
export const DEFAULT_INSTRUCTION_SETS = [
  {
    id: 'default',
    name: 'Default',
    content: '',
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    content: `Focus on helping create engaging, SEO-friendly content.
- Suggest compelling headlines
- Recommend content structure
- Help with meta descriptions
- Ensure accessibility best practices`,
    isDefault: false,
    createdAt: new Date(),
  },
  {
    id: 'developer',
    name: 'Developer Mode',
    content: `Provide more technical details in responses.
- Show GROQ queries used
- Explain schema relationships
- Include document IDs in responses
- Show full action payloads`,
    isDefault: false,
    createdAt: new Date(),
  },
]

/**
 * Truncate text to fit within token limits
 */
export function truncateForTokenLimit(text: string, maxChars: number = 50000): string {
  if (text.length <= maxChars) {
    return text
  }
  return text.substring(0, maxChars) + '\n\n[Content truncated due to length]'
}
