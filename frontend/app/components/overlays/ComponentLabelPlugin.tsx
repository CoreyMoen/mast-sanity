'use client'

import {defineOverlayPlugin} from '@sanity/visual-editing/unstable_overlay-components'
import {BLOCK_TYPE_LABELS, getBlockLabel, getBlockIcon} from './constants'

// Extract the last component type from a Sanity path
// e.g., "pageBuilder[_key=="abc"].rows[_key=="def"].columns[_key=="ghi"]" -> "columns"
function getComponentTypeFromPath(path: string): string | null {
  // Match patterns like "fieldName[" or just "fieldName" at the end
  const matches = path.match(/\.?(\w+)(?:\[|$)/g)
  if (!matches || matches.length === 0) return null

  // Get the last match and clean it up
  const lastMatch = matches[matches.length - 1]
  const fieldName = lastMatch.replace(/^\./, '').replace(/\[$/, '')

  // Map field names to component types
  const fieldToType: Record<string, string> = {
    pageBuilder: 'section', // Default for pageBuilder items
    rows: 'row',
    columns: 'column',
    content: 'content', // Will be refined by actual type
  }

  return fieldToType[fieldName] || fieldName
}

// Get a friendly label for the component being edited
function getComponentLabelFromContext(context: {
  type?: string
  field?: {name?: string; value?: {type?: string}}
  node?: {path?: string; type?: string}
}): string {
  const {type, field, node} = context

  // First, try to get the type from the schema type
  if (type && BLOCK_TYPE_LABELS[type as keyof typeof BLOCK_TYPE_LABELS]) {
    return getBlockLabel(type)
  }

  // Check field value type
  if (field?.value?.type) {
    const label = getBlockLabel(field.value.type)
    if (label !== field.value.type) return label
  }

  // Try to extract from the path
  if (node?.path) {
    const pathType = getComponentTypeFromPath(node.path)
    if (pathType) {
      const label = getBlockLabel(pathType)
      if (label !== pathType) return label
    }
  }

  // Fall back to the raw type or field name
  return type || field?.name || 'Element'
}

export const ComponentLabelPlugin = defineOverlayPlugin(() => ({
  type: 'hud',
  name: 'component-label',
  title: 'Component Label',
  component: function ComponentLabelOverlay(props) {
    const label = getComponentLabelFromContext(props)
    const icon = getBlockIcon(label)

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          background: 'var(--overlay-bg, #5571FB)',
          color: 'white',
          borderRadius: '3px',
          fontSize: '12px',
          fontWeight: 500,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <span style={{fontSize: '14px'}}>{icon}</span>
        <span>{label}</span>
      </div>
    )
  },
}))
