/**
 * Portable Text to Markdown Serializer
 *
 * Converts Sanity Portable Text (rich text) to Markdown format.
 * This is used to serialize instruction content for Claude's system prompt.
 *
 * Supports:
 * - Headings (h2, h3, h4)
 * - Paragraphs
 * - Lists (bullet and numbered)
 * - Marks (bold, italic, code)
 */

import type {PortableTextBlock, PortableTextSpan} from '@portabletext/types'

/**
 * Type for Portable Text block with children
 */
interface TextBlock extends PortableTextBlock {
  _type: 'block'
  style?: string
  listItem?: 'bullet' | 'number'
  level?: number
  children: PortableTextSpan[]
}

/**
 * Check if a block is a text block
 */
function isTextBlock(block: unknown): block is TextBlock {
  return (
    typeof block === 'object' &&
    block !== null &&
    '_type' in block &&
    (block as {_type: string})._type === 'block'
  )
}

/**
 * Serialize marks (bold, italic, code) around text
 */
function serializeMarks(text: string, marks: string[] = []): string {
  if (!text || marks.length === 0) return text

  let result = text

  // Apply marks in order: code first (innermost), then italic, then bold (outermost)
  if (marks.includes('code')) {
    result = `\`${result}\``
  }
  if (marks.includes('em')) {
    result = `*${result}*`
  }
  if (marks.includes('strong')) {
    result = `**${result}**`
  }

  return result
}

/**
 * Serialize a span (text with marks)
 */
function serializeSpan(span: PortableTextSpan): string {
  if (span._type !== 'span') return ''
  return serializeMarks(span.text || '', span.marks)
}

/**
 * Serialize block children (spans) to text
 */
function serializeChildren(children: PortableTextSpan[]): string {
  return children.map(serializeSpan).join('')
}

/**
 * Get the Markdown heading prefix for a style
 */
function getHeadingPrefix(style: string | undefined): string {
  switch (style) {
    case 'h1':
      return '# '
    case 'h2':
      return '## '
    case 'h3':
      return '### '
    case 'h4':
      return '#### '
    case 'h5':
      return '##### '
    case 'h6':
      return '###### '
    default:
      return ''
  }
}

/**
 * Get the list prefix for a list item
 */
function getListPrefix(listItem: 'bullet' | 'number' | undefined, index: number, level: number = 1): string {
  const indent = '  '.repeat(level - 1)

  if (listItem === 'bullet') {
    return `${indent}- `
  }
  if (listItem === 'number') {
    return `${indent}${index + 1}. `
  }
  return ''
}

/**
 * Convert Portable Text blocks to Markdown
 *
 * @param blocks - Array of Portable Text blocks
 * @returns Markdown string
 */
export function portableTextToMarkdown(blocks: unknown[] | null | undefined): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return ''
  }

  const lines: string[] = []
  let listIndex = 0
  let inList = false
  let currentListType: 'bullet' | 'number' | undefined

  for (const block of blocks) {
    if (!isTextBlock(block)) continue

    const {style, listItem, level, children} = block
    const text = serializeChildren(children)

    // Handle list items
    if (listItem) {
      // Reset index when starting a new list or changing list type
      if (!inList || currentListType !== listItem) {
        listIndex = 0
        inList = true
        currentListType = listItem
      }

      const prefix = getListPrefix(listItem, listIndex, level)
      lines.push(`${prefix}${text}`)
      listIndex++
    } else {
      // Not a list item - reset list tracking
      if (inList) {
        inList = false
        listIndex = 0
        currentListType = undefined
        // Add blank line after list
        if (lines.length > 0 && lines[lines.length - 1] !== '') {
          lines.push('')
        }
      }

      // Handle headings
      const headingPrefix = getHeadingPrefix(style)
      if (headingPrefix) {
        // Add blank line before heading (if not at start)
        if (lines.length > 0 && lines[lines.length - 1] !== '') {
          lines.push('')
        }
        lines.push(`${headingPrefix}${text}`)
        lines.push('')
      } else {
        // Regular paragraph
        if (text.trim()) {
          lines.push(text)
          lines.push('')
        }
      }
    }
  }

  // Clean up: remove trailing blank lines and join
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }

  return lines.join('\n')
}

/**
 * Check if the content is Portable Text (array of blocks) or plain string
 */
export function isPortableText(content: unknown): content is unknown[] {
  return Array.isArray(content) && content.length > 0 && isTextBlock(content[0])
}

/**
 * Serialize content to Markdown, handling both Portable Text and plain strings
 */
export function contentToMarkdown(content: unknown): string {
  if (!content) return ''

  // Already a string
  if (typeof content === 'string') {
    return content
  }

  // Portable Text array
  if (isPortableText(content)) {
    return portableTextToMarkdown(content)
  }

  return ''
}
