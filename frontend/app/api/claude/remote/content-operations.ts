/**
 * Content Operations for Remote API
 *
 * Executes Sanity CRUD operations based on parsed actions.
 * This is a simplified server-side version of the studio plugin's operations.
 */

import type { SanityClient } from '@sanity/client'
import type { ParsedAction, ActionResult } from './types'

/**
 * Generate a random key for Sanity array items
 */
function generateKey(): string {
  return Math.random().toString(36).substring(2, 12)
}

/**
 * Ensure all nested objects have _key and _type fields
 */
function ensureKeysAndTypes(obj: unknown, parentType?: string): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        const typedItem = item as Record<string, unknown>
        // Add _key if missing
        if (!typedItem._key) {
          typedItem._key = generateKey()
        }
        // Recursively process nested objects
        return ensureKeysAndTypes(typedItem, parentType)
      }
      return item
    })
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {}
    const typedObj = obj as Record<string, unknown>

    for (const [key, value] of Object.entries(typedObj)) {
      if (key === 'pageBuilder' && Array.isArray(value)) {
        result[key] = (value as unknown[]).map(section => {
          const s = section as Record<string, unknown>
          if (!s._type) s._type = 'section'
          if (!s._key) s._key = generateKey()
          if (s.rows && Array.isArray(s.rows)) {
            s.rows = (s.rows as unknown[]).map(row => {
              const r = row as Record<string, unknown>
              if (!r._type) r._type = 'row'
              if (!r._key) r._key = generateKey()
              if (r.columns && Array.isArray(r.columns)) {
                r.columns = (r.columns as unknown[]).map(col => {
                  const c = col as Record<string, unknown>
                  if (!c._type) c._type = 'column'
                  if (!c._key) c._key = generateKey()
                  if (c.content && Array.isArray(c.content)) {
                    c.content = (c.content as unknown[]).map(block => {
                      const b = block as Record<string, unknown>
                      if (!b._key) b._key = generateKey()
                      return ensureKeysAndTypes(b)
                    })
                  }
                  return c
                })
              }
              return r
            })
          }
          return s
        })
      } else {
        result[key] = ensureKeysAndTypes(value)
      }
    }
    return result
  }

  return obj
}

/**
 * Execute a create action
 */
async function executeCreate(
  client: SanityClient,
  action: ParsedAction
): Promise<ActionResult> {
  const { documentType, fields } = action.payload

  if (!documentType) {
    return {
      success: false,
      message: 'Document type is required for create action',
    }
  }

  if (!fields || Object.keys(fields).length === 0) {
    return {
      success: false,
      message: 'Fields are required for create action',
    }
  }

  try {
    // Generate a document ID
    const docId = `drafts.${documentType}-${generateKey()}`

    // Ensure all nested objects have proper keys and types
    const processedFields = ensureKeysAndTypes(fields) as Record<string, unknown>

    // Build the document
    const document = {
      _id: docId,
      _type: documentType,
      ...processedFields,
    }

    // Create the document
    const result = await client.createOrReplace(document)

    return {
      success: true,
      documentId: result._id,
      message: `Created ${documentType} document`,
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create document',
    }
  }
}

/**
 * Execute an update action
 */
async function executeUpdate(
  client: SanityClient,
  action: ParsedAction
): Promise<ActionResult> {
  const { documentId, fields } = action.payload

  if (!documentId) {
    return {
      success: false,
      message: 'Document ID is required for update action',
    }
  }

  if (!fields || Object.keys(fields).length === 0) {
    return {
      success: false,
      message: 'Fields are required for update action',
    }
  }

  try {
    // Fetch current document state for undo capability
    const preState = await client.getDocument(documentId)

    // Process fields - handle nested path updates
    const processedFields = ensureKeysAndTypes(fields) as Record<string, unknown>

    // Check if any fields use path notation (e.g., "pageBuilder[_key==...].rows")
    const hasPathNotation = Object.keys(processedFields).some(key => key.includes('['))

    if (hasPathNotation) {
      // Use patch API for path-based updates
      let patch = client.patch(documentId)

      for (const [path, value] of Object.entries(processedFields)) {
        patch = patch.set({ [path]: value })
      }

      const result = await patch.commit()

      return {
        success: true,
        documentId: result._id,
        message: `Updated document`,
        data: result,
        preState,
      }
    } else {
      // Simple field update
      const result = await client
        .patch(documentId)
        .set(processedFields)
        .commit()

      return {
        success: true,
        documentId: result._id,
        message: `Updated document`,
        data: result,
        preState,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update document',
    }
  }
}

/**
 * Execute a delete action
 */
async function executeDelete(
  client: SanityClient,
  action: ParsedAction
): Promise<ActionResult> {
  const { documentId } = action.payload

  if (!documentId) {
    return {
      success: false,
      message: 'Document ID is required for delete action',
    }
  }

  try {
    // Fetch current document state for undo capability
    const preState = await client.getDocument(documentId)

    // Delete the document
    await client.delete(documentId)

    return {
      success: true,
      documentId,
      message: `Deleted document`,
      preState,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete document',
    }
  }
}

/**
 * Validate a GROQ query for safety
 * Only allows read-only queries that start with standard patterns
 */
function validateQuery(query: string): { valid: boolean; error?: string } {
  const trimmed = query.trim()

  // Must start with a standard GROQ query pattern
  if (!trimmed.startsWith('*[') && !trimmed.startsWith('count(') && !trimmed.startsWith('coalesce(')) {
    return { valid: false, error: 'Query must start with *[ or count( or coalesce(' }
  }

  // Block potentially dangerous patterns
  const dangerousPatterns = [
    /\bsanity::/i,        // Internal Sanity functions
    /_createdAt\s*</,     // Time-based attacks
    /identity\(\)/i,      // User identity access
    /\$.*token/i,         // Token parameter access
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Query contains restricted patterns' }
    }
  }

  // Limit query length to prevent DoS
  if (trimmed.length > 5000) {
    return { valid: false, error: 'Query exceeds maximum length of 5000 characters' }
  }

  return { valid: true }
}

/**
 * Execute a query action with validation
 */
async function executeQuery(
  client: SanityClient,
  action: ParsedAction
): Promise<ActionResult> {
  const { query } = action.payload

  if (!query) {
    return {
      success: false,
      message: 'Query is required for query action',
    }
  }

  // Validate query for safety
  const validation = validateQuery(query)
  if (!validation.valid) {
    return {
      success: false,
      message: `Query validation failed: ${validation.error}`,
    }
  }

  try {
    const result = await client.fetch(query)

    // Limit result size to prevent large data exfiltration
    const resultStr = JSON.stringify(result)
    if (resultStr.length > 1000000) { // 1MB limit
      return {
        success: true,
        message: 'Query executed successfully (result truncated due to size)',
        data: { _truncated: true, _message: 'Result exceeds 1MB limit' },
      }
    }

    return {
      success: true,
      message: `Query executed successfully`,
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to execute query',
    }
  }
}

/**
 * Execute an action based on its type
 */
export async function executeAction(
  client: SanityClient,
  action: ParsedAction
): Promise<ActionResult> {
  switch (action.type) {
    case 'create':
      return executeCreate(client, action)

    case 'update':
      return executeUpdate(client, action)

    case 'delete':
      return executeDelete(client, action)

    case 'query':
      return executeQuery(client, action)

    case 'navigate':
      // Navigate actions don't apply in a headless context
      return {
        success: true,
        message: 'Navigate action acknowledged (no-op in headless mode)',
        data: { path: action.payload.path, documentId: action.payload.documentId },
      }

    case 'explain':
      // Explain actions are just informational
      return {
        success: true,
        message: 'Explanation provided',
        data: { explanation: action.payload.explanation },
      }

    case 'uploadImage':
      // Image upload requires base64 data which isn't available in remote context
      return {
        success: false,
        message: 'Image upload is not supported in remote API mode',
      }

    default:
      return {
        success: false,
        message: `Unknown action type: ${action.type}`,
      }
  }
}
