/**
 * Action Parsing
 *
 * Parses Claude's responses to extract structured actions.
 * Identifies destructive actions and returns properly typed PendingAction objects.
 */

import type {ActionType, ParsedAction, ActionPayload} from '../types'

/**
 * Actions that require user confirmation before execution
 */
const DESTRUCTIVE_ACTION_TYPES: ActionType[] = ['delete']

/**
 * Action types that modify data and could be considered risky
 */
const RISKY_ACTION_TYPES: ActionType[] = ['delete', 'update']

/**
 * Generate a unique action ID
 */
function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Check if an action is destructive (requires confirmation)
 */
export function isDestructiveAction(action: ParsedAction): boolean {
  // Delete is always destructive
  if (action.type === 'delete') {
    return true
  }

  // Unpublish is also destructive (if we add it as an action type)
  // Bulk updates could be considered destructive
  // Check description for keywords indicating destructive operations
  const destructiveKeywords = ['delete', 'remove', 'unpublish', 'destroy', 'clear', 'reset']
  const descriptionLower = action.description.toLowerCase()

  return destructiveKeywords.some((keyword) => descriptionLower.includes(keyword))
}

/**
 * Check if an action should auto-execute (non-destructive)
 * Read-only actions (query, navigate, explain) always auto-execute
 * Modifying actions (create, update, delete) require user confirmation via inline buttons
 */
export function shouldAutoExecute(action: ParsedAction): boolean {
  // Read-only actions always auto-execute (they don't modify data)
  const readOnlyActions: ActionType[] = ['explain', 'query', 'navigate', 'fetchFigmaFrame']
  if (readOnlyActions.includes(action.type)) {
    return true
  }

  // Modifying actions (create, update, delete, uploadFigmaImage) require confirmation via inline buttons
  return false
}

/**
 * Safely parse JSON from a string, handling common issues
 */
function safeParseJSON(jsonString: string): unknown | null {
  try {
    // First, try direct parse
    return JSON.parse(jsonString)
  } catch {
    try {
      // Try to fix common issues:
      // 1. Remove trailing commas
      const cleaned = jsonString
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        // 2. Fix unquoted keys (simple cases)
        .replace(/(\s*)(\w+)(\s*):/g, '$1"$2"$3:')

      return JSON.parse(cleaned)
    } catch {
      // If all else fails, return null
      console.warn('Failed to parse JSON after cleanup:', jsonString.substring(0, 100))
      return null
    }
  }
}

/**
 * Parse Claude's response to extract actions
 *
 * Looks for structured action blocks in the format:
 * ```action
 * {
 *   "type": "create|update|delete|query|navigate|explain",
 *   "description": "Human readable description",
 *   "payload": { ... }
 * }
 * ```
 *
 * Also supports:
 * - ```json blocks with action data
 * - [ACTION]...[/ACTION] inline markers
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
    } else {
      console.warn('Failed to parse action block:', jsonStr.substring(0, 100))
    }
  }

  // Also look for json blocks that contain action data
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/g
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    const jsonStr = match[1].trim()
    const data = safeParseJSON(jsonStr)

    // Only process if it looks like an action (has type field)
    if (data && typeof data === 'object' && 'type' in data) {
      const action = parseActionData(data)
      if (action) {
        actions.push(action)
      }
    }
  }

  // Also look for inline JSON actions marked with [ACTION]
  const inlineActionRegex = /\[ACTION\]\s*({[\s\S]*?})\s*\[\/ACTION\]/g
  while ((match = inlineActionRegex.exec(content)) !== null) {
    const jsonStr = match[1].trim()
    const actionData = safeParseJSON(jsonStr)

    if (actionData) {
      const action = parseActionData(actionData)
      if (action) {
        actions.push(action)
      }
    } else {
      console.warn('Failed to parse inline action:', jsonStr.substring(0, 100))
    }
  }

  return actions
}

/**
 * Parse a single action data object
 */
function parseActionData(data: unknown): ParsedAction | null {
  if (typeof data !== 'object' || data === null) {
    console.warn('[parseActionData] Invalid data: not an object')
    return null
  }

  const actionData = data as Record<string, unknown>
  const type = actionData.type as ActionType

  if (!isValidActionType(type)) {
    console.warn(`[parseActionData] Invalid action type: ${type}`, actionData)
    return null
  }

  // Parse the payload - check for nested payload object first, then fall back to flat structure
  const payloadSource = actionData.payload || actionData
  const payload = parsePayload(payloadSource)
  const description = (actionData.description as string) || getDefaultDescription(type)

  console.log('[parseActionData] Parsed action:', {
    type,
    description,
    payloadSource: typeof actionData.payload !== 'undefined' ? 'nested' : 'flat',
    payload,
  })

  const action: ParsedAction = {
    id: generateActionId(),
    type,
    description,
    status: 'pending',
    payload,
  }

  // Note: isDestructive is computed via isDestructiveAction() function
  // and stored in result.isDestructive when needed by ActionCard

  return action
}

/**
 * Parse an action and determine if it requires confirmation
 */
export interface ParsedActionWithMeta extends ParsedAction {
  isDestructive: boolean
  autoExecute: boolean
}

/**
 * Parse actions and add metadata about destructiveness and auto-execution
 */
export function parseActionsWithMeta(content: string): ParsedActionWithMeta[] {
  const actions = parseActions(content)

  return actions.map((action) => ({
    ...action,
    isDestructive: isDestructiveAction(action),
    autoExecute: shouldAutoExecute(action),
  }))
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
    'fetchFigmaFrame',
    'uploadFigmaImage',
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

  // Handle both nested payload and flat action data structures
  // Claude might send: { type, payload: { documentType, ... } }
  // Or Claude might send: { type, documentType, ... }
  return {
    documentType: (payloadData.documentType as string) || undefined,
    documentId: (payloadData.documentId as string) || undefined,
    fields: (payloadData.fields as Record<string, unknown>) ||
      (payloadData.data as Record<string, unknown>) || undefined,
    query: (payloadData.query as string) || (payloadData.groq as string) || undefined,
    path: (payloadData.path as string) || (payloadData.url as string) || undefined,
    explanation: (payloadData.explanation as string) ||
      (payloadData.message as string) || undefined,
    // Image upload fields
    filename: (payloadData.filename as string) || undefined,
    // Figma fields
    figmaUrl: (payloadData.url as string) || undefined,
    figmaNodeId: (payloadData.nodeId as string) || undefined,
    figmaFileKey: (payloadData.fileKey as string) || undefined,
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
    fetchFigmaFrame: 'Fetch frame data from Figma',
    uploadFigmaImage: 'Upload image from Figma design',
  }
  return descriptions[type]
}

/**
 * Extract non-action content from Claude's response
 */
export function extractTextContent(content: string): string {
  // Remove action blocks
  let text = content.replace(/```action\s*[\s\S]*?```/g, '')
  // Remove inline actions
  text = text.replace(/\[ACTION\]\s*{[\s\S]*?}\s*\[\/ACTION\]/g, '')
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

/**
 * Format an action for display
 */
export function formatActionForDisplay(action: ParsedAction): string {
  const lines: string[] = []
  lines.push(`**${action.description}**`)
  lines.push(`Type: ${action.type}`)

  if (action.payload.documentType) {
    lines.push(`Document Type: ${action.payload.documentType}`)
  }
  if (action.payload.documentId) {
    lines.push(`Document ID: ${action.payload.documentId}`)
  }
  if (action.payload.query) {
    lines.push(`Query: ${action.payload.query}`)
  }
  if (action.payload.fields) {
    lines.push(`Fields: ${JSON.stringify(action.payload.fields, null, 2)}`)
  }

  return lines.join('\n')
}

/**
 * Validate that an action has all required data
 */
export function validateAction(action: ParsedAction): string[] {
  const errors: string[] = []

  switch (action.type) {
    case 'create':
      if (!action.payload.documentType) {
        errors.push('Document type is required for create action')
      }
      break
    case 'update':
      if (!action.payload.documentId) {
        errors.push('Document ID is required for update action')
      }
      if (!action.payload.fields || Object.keys(action.payload.fields).length === 0) {
        errors.push('Fields are required for update action')
      }
      break
    case 'delete':
      if (!action.payload.documentId) {
        errors.push('Document ID is required for delete action')
      }
      break
    case 'query':
      if (!action.payload.query) {
        errors.push('Query is required for query action')
      }
      break
    case 'navigate':
      if (!action.payload.documentId && !action.payload.path) {
        errors.push('Document ID or path is required for navigate action')
      }
      break
  }

  return errors
}
