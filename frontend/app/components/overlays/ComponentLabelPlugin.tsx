'use client'

import {defineOverlayPlugin} from '@sanity/visual-editing/unstable_overlay-components'

// Map schema types to friendly display names
const typeLabels: Record<string, string> = {
  section: 'Section',
  row: 'Row',
  column: 'Column',
  headingBlock: 'Heading',
  richTextBlock: 'Rich Text',
  imageBlock: 'Image',
  buttonBlock: 'Button',
  spacerBlock: 'Spacer',
  callToAction: 'Call to Action',
  infoSection: 'Info Section',
}

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
function getComponentLabel(context: {
  type?: string
  field?: {name?: string; value?: {type?: string}}
  node?: {path?: string; type?: string}
}): string {
  const {type, field, node} = context

  // First, try to get the type from the schema type
  if (type && typeLabels[type]) {
    return typeLabels[type]
  }

  // Check field value type
  if (field?.value?.type && typeLabels[field.value.type]) {
    return typeLabels[field.value.type]
  }

  // Try to extract from the path
  if (node?.path) {
    const pathType = getComponentTypeFromPath(node.path)
    if (pathType && typeLabels[pathType]) {
      return typeLabels[pathType]
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
    const label = getComponentLabel(props)

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          background: 'var(--overlay-bg, #4f46e5)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <ComponentIcon type={label} />
        <span>{label}</span>
      </div>
    )
  },
}))

// Simple icon component based on type
function ComponentIcon({type}: {type: string}) {
  const iconMap: Record<string, string> = {
    Section: '▭',
    Row: '≡',
    Column: '▯',
    Heading: 'H',
    'Rich Text': '¶',
    Image: '🖼',
    Button: '⬚',
    Spacer: '↕',
    'Call to Action': '📣',
    'Info Section': 'ℹ',
    Element: '◇',
  }

  return <span style={{fontSize: '14px'}}>{iconMap[type] || '◇'}</span>
}
