/**
 * Action Parser for Remote API
 *
 * Parses Claude's responses to extract structured actions.
 * This is a server-side version of the studio plugin's action parser.
 */

import type { ActionType, ParsedAction, ActionPayload } from './types'

/**
 * Generate a unique action ID
 */
function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Safely parse JSON from a string
 */
function safeParseJSON(jsonString: string): unknown | null {
  try {
    return JSON.parse(jsonString)
  } catch {
    try {
      // Try to fix common issues:
      const cleaned = jsonString
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/(\s*)(\w+)(\s*):/g, '$1"$2"$3:')

      return JSON.parse(cleaned)
    } catch {
      console.warn('Failed to parse JSON:', jsonString.substring(0, 100))
      return null
    }
  }
}

/**
 * Check if a string is a valid action type
 */
function isValidActionType(type: unknown): type is ActionType {
  const validTypes: ActionType[] = [
    'create',
    'update',
    'delete',
    'query',
    'navigate',
    'explain',
    'uploadImage',
  ]
  return typeof type === 'string' && validTypes.includes(type as ActionType)
}

/**
 * Parse and validate action payload
 */
function parsePayload(payload: unknown): ActionPayload {
  if (typeof payload !== 'object' || payload === null) {
    return {}
  }

  const payloadData = payload as Record<string, unknown>

  return {
    documentType: (payloadData.documentType as string) || undefined,
    documentId: (payloadData.documentId as string) || undefined,
    fields: (payloadData.fields as Record<string, unknown>) ||
      (payloadData.data as Record<string, unknown>) || undefined,
    query: (payloadData.query as string) || (payloadData.groq as string) || undefined,
    path: (payloadData.path as string) || (payloadData.url as string) || undefined,
    explanation: (payloadData.explanation as string) ||
      (payloadData.message as string) || undefined,
  }
}

/**
 * Get default description for an action type
 */
function getDefaultDescription(type: ActionType): string {
  const descriptions: Record<ActionType, string> = {
    create: 'Create a new document',
    update: 'Update an existing document',
    delete: 'Delete a document',
    query: 'Query documents',
    navigate: 'Navigate to a document',
    explain: 'Explanation',
    uploadImage: 'Upload image to Sanity',
  }
  return descriptions[type]
}

/**
 * Parse a single action data object
 */
function parseActionData(data: unknown): ParsedAction | null {
  if (typeof data !== 'object' || data === null) {
    return null
  }

  const actionData = data as Record<string, unknown>
  const type = actionData.type as ActionType

  if (!isValidActionType(type)) {
    console.warn(`Invalid action type: ${type}`)
    return null
  }

  const payloadSource = actionData.payload || actionData
  const payload = parsePayload(payloadSource)
  const description = (actionData.description as string) || getDefaultDescription(type)

  return {
    id: generateActionId(),
    type,
    description,
    status: 'pending',
    payload,
  }
}

/**
 * Parse Claude's response to extract actions
 *
 * Looks for structured action blocks in the format:
 * ```action
 * { "type": "create", "description": "...", "payload": { ... } }
 * ```
 */
export function parseActions(content: string): ParsedAction[] {
  const actions: ParsedAction[] = []

  // Match action blocks (```action ... ```)
  const actionBlockRegex = /```action\s*([\s\S]*?)```/g
  let match

  while ((match = actionBlockRegex.exec(content)) !== null) {
    const jsonStr = match[1].trim()
    const actionData = safeParseJSON(jsonStr)

    if (actionData) {
      const action = parseActionData(actionData)
      if (action) {
        actions.push(action)
      }
    }
  }

  // Also look for json blocks that contain action data
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/g
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    const jsonStr = match[1].trim()
    const data = safeParseJSON(jsonStr)

    if (data && typeof data === 'object' && 'type' in data) {
      const action = parseActionData(data)
      if (action) {
        actions.push(action)
      }
    }
  }

  return actions
}

/**
 * Extract non-action content from Claude's response
 */
export function extractTextContent(content: string): string {
  let text = content.replace(/```action\s*[\s\S]*?```/g, '')
  text = text.replace(/\[ACTION\]\s*{[\s\S]*?}\s*\[\/ACTION\]/g, '')
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}
