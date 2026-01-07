/**
 * Schema Context Extraction
 *
 * Extracts schema information from Sanity to provide context to Claude
 */

import type {Schema, SchemaType, ObjectSchemaType, ArraySchemaType} from 'sanity'
import type {SchemaContext, SchemaInfo, FieldInfo} from '../types'

/**
 * Extract complete schema context from Sanity schema
 */
export function extractSchemaContext(schema: Schema): SchemaContext {
  const allTypes = schema.getTypeNames()
  const documentTypes: SchemaInfo[] = []
  const objectTypes: SchemaInfo[] = []

  for (const typeName of allTypes) {
    const schemaType = schema.get(typeName)
    if (!schemaType) continue

    // Skip internal Sanity types
    if (typeName.startsWith('sanity.') || typeName.startsWith('system.')) {
      continue
    }

    const info = extractTypeInfo(schemaType)

    if (schemaType.type?.name === 'document') {
      documentTypes.push(info)
    } else if (schemaType.type?.name === 'object') {
      objectTypes.push(info)
    }
  }

  return {
    documentTypes,
    objectTypes,
    timestamp: new Date(),
  }
}

/**
 * Extract information about a single schema type
 */
function extractTypeInfo(schemaType: SchemaType): SchemaInfo {
  const fields = extractFields(schemaType)

  return {
    name: schemaType.name,
    title: schemaType.title || schemaType.name,
    type: schemaType.type?.name || 'unknown',
    description: (schemaType as ObjectSchemaType).description,
    fields,
  }
}

/**
 * Extract field information from a schema type
 */
function extractFields(schemaType: SchemaType): FieldInfo[] {
  const objectType = schemaType as ObjectSchemaType
  if (!objectType.fields) return []

  return objectType.fields.map((field) => extractFieldInfo(field))
}

/**
 * Safely extract primitive values from an object, avoiding circular references
 */
function safeExtractOptions(options: unknown): Record<string, unknown> | undefined {
  if (!options || typeof options !== 'object') return undefined

  try {
    // Only extract simple, JSON-safe properties
    const result: Record<string, unknown> = {}
    const obj = options as Record<string, unknown>

    for (const key of Object.keys(obj)) {
      const value = obj[key]

      // Skip functions, symbols, and anything that looks like a circular reference
      if (typeof value === 'function' || typeof value === 'symbol') continue
      if (key.startsWith('_')) continue // Skip internal properties

      // Handle primitives
      if (value === null || typeof value !== 'object') {
        result[key] = value
        continue
      }

      // Handle arrays of primitives or simple objects
      if (Array.isArray(value)) {
        const safeArray = value
          .filter((item) => item !== null && typeof item !== 'function' && typeof item !== 'symbol')
          .map((item) => {
            if (typeof item !== 'object') return item
            // For objects in arrays, only take string properties
            if (typeof item === 'object' && item !== null) {
              const simpleObj: Record<string, unknown> = {}
              for (const k of Object.keys(item as Record<string, unknown>)) {
                const v = (item as Record<string, unknown>)[k]
                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                  simpleObj[k] = v
                }
              }
              return Object.keys(simpleObj).length > 0 ? simpleObj : undefined
            }
            return undefined
          })
          .filter(Boolean)
        if (safeArray.length > 0) {
          result[key] = safeArray
        }
        continue
      }

      // Skip complex nested objects to avoid circular references
    }

    return Object.keys(result).length > 0 ? result : undefined
  } catch {
    return undefined
  }
}

/**
 * Extract information about a single field
 */
function extractFieldInfo(field: {
  name: string
  type: SchemaType
}): FieldInfo {
  const fieldType = field.type

  // Check if field has validation (indicates required) - just check existence, don't copy the object
  const hasValidation = !!(fieldType as ObjectSchemaType).validation

  const baseInfo: FieldInfo = {
    name: field.name,
    title: fieldType.title || field.name,
    type: fieldType.type?.name || fieldType.name || 'unknown',
    required: hasValidation,
    description: typeof (fieldType as ObjectSchemaType).description === 'string'
      ? (fieldType as ObjectSchemaType).description
      : undefined,
  }

  // Handle array types
  if (fieldType.jsonType === 'array') {
    const arrayType = fieldType as ArraySchemaType
    if (arrayType.of) {
      baseInfo.of = arrayType.of.map((ofType) => ({
        name: ofType.name,
        title: ofType.title || ofType.name,
        type: ofType.type?.name || ofType.name || 'unknown',
        required: false,
      }))
    }
  }

  // Handle reference types - extract only the type names
  if (fieldType.type?.name === 'reference') {
    const refType = fieldType as ObjectSchemaType & {to?: Array<{type?: string; name?: string}>}
    if (refType.to && Array.isArray(refType.to)) {
      baseInfo.to = refType.to.map((t) => ({
        type: t.type || t.name || 'unknown',
      }))
    }
  }

  // Handle options - safely extract without circular references
  const options = (fieldType as ObjectSchemaType).options
  if (options) {
    const safeOptions = safeExtractOptions(options)
    if (safeOptions) {
      baseInfo.options = safeOptions
    }
  }

  return baseInfo
}

/**
 * Format schema context as a string for Claude's system prompt
 */
export function formatSchemaForPrompt(context: SchemaContext): string {
  const lines: string[] = []

  lines.push('# Available Document Types\n')
  for (const docType of context.documentTypes) {
    lines.push(`## ${docType.title} (${docType.name})`)
    if (docType.description) {
      lines.push(docType.description)
    }
    lines.push('\nFields:')
    for (const field of docType.fields) {
      const required = field.required ? ' (required)' : ''
      lines.push(`- ${field.name}: ${field.type}${required}`)
      if (field.description) {
        lines.push(`  ${field.description}`)
      }
    }
    lines.push('')
  }

  if (context.objectTypes.length > 0) {
    lines.push('\n# Object Types\n')
    for (const objType of context.objectTypes.slice(0, 20)) {
      // Limit to avoid token overflow
      lines.push(`## ${objType.title} (${objType.name})`)
      if (objType.fields.length > 0) {
        lines.push('Fields:')
        for (const field of objType.fields.slice(0, 10)) {
          lines.push(`- ${field.name}: ${field.type}`)
        }
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Get a simplified schema summary for quick reference
 */
export function getSchemasSummary(context: SchemaContext): string {
  const docNames = context.documentTypes.map((d) => d.name).join(', ')
  return `Document types: ${docNames}`
}

/**
 * Find a schema type by name
 */
export function findSchemaType(
  context: SchemaContext,
  typeName: string
): SchemaInfo | undefined {
  return (
    context.documentTypes.find((t) => t.name === typeName) ||
    context.objectTypes.find((t) => t.name === typeName)
  )
}
