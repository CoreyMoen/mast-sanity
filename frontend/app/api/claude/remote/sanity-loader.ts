/**
 * Sanity Data Loader for Remote API
 *
 * Server-side utilities for loading instructions, workflows, and documents
 * from Sanity for use in the remote Claude API.
 */

import { createClient, type SanityClient } from '@sanity/client'
import type {
  WorkflowDocument,
  InstructionsDocument,
  ApiSettingsDocument,
  InstructionCategory,
} from './types'

/**
 * Create a Sanity client for server-side operations
 */
export function createSanityClient(): SanityClient {
  const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_API_TOKEN

  if (!projectId) {
    throw new Error('SANITY_PROJECT_ID environment variable is required')
  }

  if (!token) {
    throw new Error('SANITY_API_TOKEN environment variable is required for remote API')
  }

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2024-01-01',
    useCdn: false, // Always use fresh data for mutations
  })
}

/**
 * Load Claude instructions from Sanity
 */
export async function loadInstructions(client: SanityClient): Promise<InstructionsDocument | null> {
  const query = `*[_type == "claudeInstructions"][0]{
    _id,
    _type,
    writingGuidelines,
    brandVoice,
    designSystemRules,
    technicalConstraints,
    forbiddenTerms,
    preferredTerms,
    componentGuidelines,
    maxNestingDepth,
    requiredFields,
    writingKeywords,
    designKeywords,
    technicalKeywords,
    includeSectionTemplates,
    sectionTemplateGuidance
  }`

  return client.fetch(query)
}

/**
 * Load API settings from Sanity
 */
export async function loadApiSettings(client: SanityClient): Promise<ApiSettingsDocument | null> {
  // Only fetch published version (not drafts)
  const query = `*[_type == "claudeApiSettings" && !(_id in path("drafts.**"))][0]{
    _id,
    model,
    maxTokens,
    temperature,
    enableStreaming
  }`

  return client.fetch(query)
}

/**
 * Load a workflow by name or ID
 */
export async function loadWorkflow(
  client: SanityClient,
  nameOrId: string
): Promise<WorkflowDocument | null> {
  // Try to find by ID first, then by name
  const query = `*[_type == "claudeWorkflow" && (
    _id == $nameOrId ||
    name == $nameOrId ||
    lower(name) == lower($nameOrId)
  ) && active != false][0]{
    _id,
    name,
    description,
    systemInstructions,
    starterPrompt,
    active
  }`

  return client.fetch(query, { nameOrId })
}

/**
 * Load section templates for design context
 */
export async function loadSectionTemplates(client: SanityClient): Promise<unknown[]> {
  const query = `*[_type == "sectionTemplate"]{
    _id,
    name,
    description,
    category,
    rows,
    backgroundColor,
    paddingTop,
    maxWidth,
    minHeight,
    verticalAlign
  }`

  return client.fetch(query)
}

/**
 * Load documents by IDs for context
 */
export async function loadDocumentsForContext(
  client: SanityClient,
  documentIds: string[]
): Promise<Array<{ _id: string; _type: string; name?: string; title?: string; slug?: { current: string } }>> {
  if (!documentIds.length) return []

  const query = `*[_id in $documentIds]{
    _id,
    _type,
    name,
    title,
    "slug": slug.current
  }`

  return client.fetch(query, { documentIds })
}

/**
 * Schema context for the remote API
 * Since we don't have access to Sanity Studio's schema object on the server,
 * we provide a simplified version based on known types
 */
export function getServerSchemaContext(): string {
  return `
# Available Document Types

## Page (page)
Primary content pages with flexible page builder.
Fields:
- name: string (required) - Page name
- slug: slug (required) - URL path
- pageBuilder: array - Array of sections

## Post (post)
Blog posts with rich content.
Fields:
- title: string (required)
- slug: slug (required)
- author: reference to author
- publishedAt: datetime
- body: array (Portable Text)

## Section Template (sectionTemplate)
Reusable section templates for the page builder.

# Object Types

## section
Page builder sections containing rows.
Fields:
- label: string - Internal label
- rows: array of row objects
- backgroundColor: 'primary' | 'secondary'
- paddingTop: 'none' | 'compact' | 'default' | 'spacious'
- maxWidth: 'full' | 'container' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
- minHeight: 'auto' | 'small' | 'medium' | 'large' | 'screen'

## row
Rows containing columns.
Fields:
- columns: array of column objects
- horizontalAlign: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
- verticalAlign: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
- gap: '0' | '2' | '4' | '6' | '8' | '12'

## column
Columns containing content blocks.
Fields:
- content: array of block objects
- widthDesktop: 'auto' | 'fill' | '1'-'12'
- widthMobile: 'inherit' | 'auto' | 'fill' | '12'
- verticalAlign: 'start' | 'center' | 'end' | 'between'
- padding: '0' | '2' | '4' | '6' | '8'

# Block Types

## headingBlock
Headings h1-h6.
Fields: text, level ('h1'-'h6'), size, align, color

## richTextBlock
Rich text content with Portable Text.
Fields: content (Portable Text), size, align, color, maxWidth

## eyebrowBlock
Small label text above headings.
Fields: text, variant ('text' | 'overline' | 'pill')

## imageBlock
Images with responsive options.
Fields: image, aspectRatio, size, rounded, shadow

## buttonBlock
Call-to-action buttons.
Fields: text, url, variant ('primary' | 'secondary' | 'ghost'), colorScheme

## spacerBlock
Vertical spacing.
Fields: sizeDesktop, sizeMobile

## dividerBlock
Horizontal line divider.
Fields: marginTop, marginBottom, color

## iconBlock
Phosphor icons.
Fields: icon, size, color, align

## cardBlock
Container with content array.
Fields: content (array of blocks), padding, background

## sliderBlock
Image carousel.
Fields: slides (array of images), autoplay, showArrows

## tabsBlock
Tabbed content.
Fields: tabs (array with label and content)

## accordionBlock
Collapsible sections.
Fields: items (array with title and content)
`
}

/**
 * Check if a category should be included based on keywords in the message
 */
export function detectRelevantCategories(
  userMessage: string,
  instructions: InstructionsDocument | null
): Set<InstructionCategory> {
  const lowerMessage = userMessage.toLowerCase()
  const relevantCategories = new Set<InstructionCategory>()

  // Default keywords for each category
  const categoryKeywords: Record<InstructionCategory, string[]> = {
    writing: [
      'write', 'writing', 'copy', 'text', 'content', 'heading', 'title', 'description',
      'paragraph', 'rich text', 'blog', 'article', 'post', 'caption', 'label',
      'tone', 'voice', 'style', 'language', 'word', 'sentence', 'grammar'
    ],
    design: [
      'design', 'layout', 'section', 'row', 'column', 'spacing', 'padding', 'margin',
      'style', 'visual', 'color', 'theme', 'grid', 'responsive', 'mobile', 'desktop',
      'hero', 'banner', 'card', 'button', 'icon', 'image', 'slider', 'tab',
      'background', 'overlay', 'align', 'width', 'height', 'page', 'create', 'build'
    ],
    technical: [
      'nest', 'nesting', 'depth', 'schema', 'structure', 'field', 'type', 'key',
      'sanity', 'groq', 'query', 'api', 'update', 'delete', 'duplicate',
      'error', 'fail', 'bug', 'fix', 'constraint', 'limit', 'required'
    ],
  }

  // Override with custom keywords from instructions if provided
  if (instructions?.writingKeywords) {
    categoryKeywords.writing = instructions.writingKeywords.split(',').map(k => k.trim().toLowerCase())
  }
  if (instructions?.designKeywords) {
    categoryKeywords.design = instructions.designKeywords.split(',').map(k => k.trim().toLowerCase())
  }
  if (instructions?.technicalKeywords) {
    categoryKeywords.technical = instructions.technicalKeywords.split(',').map(k => k.trim().toLowerCase())
  }

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
