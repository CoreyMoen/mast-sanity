'use client'

import {useEffect} from 'react'
import {
  defineOverlayComponents,
  type OverlayComponentProps,
} from '@sanity/visual-editing/unstable_overlay-components'
import {
  BLOCK_TYPE_LABELS,
  HIDE_DEFAULT_LABEL_CSS,
  SANITY_SELECTORS,
  getBlockLabel,
  getBlockIcon,
} from './constants'

let styleInjected = false
function injectHideDefaultLabelStyles() {
  if (styleInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.id = 'custom-overlay-hide-default'
  style.textContent = HIDE_DEFAULT_LABEL_CSS
  document.head.appendChild(style)
  styleInjected = true
}

// Get component label from various context sources
function getComponentLabel(props: OverlayComponentProps): string {
  const {type, field, node} = props

  // Try schema type first (but skip generic types like 'object' and document types like 'page')
  if (type && type !== 'object' && type !== 'page' && BLOCK_TYPE_LABELS[type as keyof typeof BLOCK_TYPE_LABELS]) {
    return BLOCK_TYPE_LABELS[type as keyof typeof BLOCK_TYPE_LABELS]
  }

  // Try field value _type (Sanity documents have _type property)
  const fieldValue = field?.value as Record<string, unknown> | undefined
  if (fieldValue?._type && typeof fieldValue._type === 'string') {
    const label = getBlockLabel(fieldValue._type)
    if (label !== fieldValue._type) return label
  }

  // Try field value type property
  if (field?.value?.type && field.value.type !== 'object') {
    const label = getBlockLabel(field.value.type)
    if (label !== field.value.type) return label
  }

  // Try node.type if available
  if (node && 'type' in node && typeof node.type === 'string' && node.type !== 'object') {
    const label = getBlockLabel(node.type)
    if (label !== node.type) return label
  }

  // Try to get element from DOM and check its data attributes for block type
  if (node && 'element' in node && node.element instanceof HTMLElement) {
    // Check the element itself first
    const blockType = node.element.getAttribute('data-block-type')
    if (blockType) {
      const label = getBlockLabel(blockType)
      if (label !== blockType) return label
    }
    // Then check for nested block type indicator
    const blockTypeEl = node.element.querySelector(SANITY_SELECTORS.BLOCK_TYPE)
    if (blockTypeEl) {
      const nestedBlockType = blockTypeEl.getAttribute('data-block-type')
      if (nestedBlockType) {
        const label = getBlockLabel(nestedBlockType)
        if (label !== nestedBlockType) return label
      }
    }
  }

  // Try to extract from path - check what the LAST array segment is
  if (node && 'path' in node && node.path) {
    const path = node.path as string

    // Map of array field names to labels
    const fieldToLabel: Record<string, string> = {
      pageBuilder: 'Section',
      rows: 'Row',
      columns: 'Column',
      content: 'Block',
    }

    // Handle encoded path format (fieldName:key.fieldName:key)
    // Example: pageBuilder:section-1.rows:row-1.columns:col-1.content:block-1
    const encodedMatches = path.match(/(\w+):/g)
    if (encodedMatches && encodedMatches.length > 0) {
      const lastMatch = encodedMatches[encodedMatches.length - 1]
      const lastArrayField = lastMatch.replace(':', '')
      if (fieldToLabel[lastArrayField]) {
        return fieldToLabel[lastArrayField]
      }
    }

    // Handle original path format (fieldName[_key=="..."])
    const arrayMatches = path.match(/(\w+)\[(?:_key==|_type==|\d)/g)
    if (arrayMatches && arrayMatches.length > 0) {
      const lastMatch = arrayMatches[arrayMatches.length - 1]
      const lastArrayField = lastMatch.replace(/\[.*$/, '')
      if (fieldToLabel[lastArrayField]) {
        return fieldToLabel[lastArrayField]
      }
    }
  }

  // Fallback - try to use the type even if it's not in our map
  if (type && type !== 'object' && type !== 'page') {
    // Capitalize first letter and convert camelCase to Title Case
    const formatted = type.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
    return formatted.trim()
  }

  return 'Element'
}

// Extract a short preview text from a block's field value
function extractPreviewText(fieldValue: Record<string, unknown> | undefined): string {
  if (!fieldValue) return ''

  const blockType = fieldValue._type as string | undefined

  // headingBlock / eyebrowBlock: text field
  if ((blockType === 'headingBlock' || blockType === 'eyebrowBlock') && typeof fieldValue.text === 'string') {
    return fieldValue.text.slice(0, 100)
  }

  // buttonBlock: text field
  if (blockType === 'buttonBlock' && typeof fieldValue.text === 'string') {
    return fieldValue.text.slice(0, 100)
  }

  // imageBlock: alt text
  if (blockType === 'imageBlock') {
    if (typeof fieldValue.alt === 'string') return fieldValue.alt.slice(0, 100)
    return 'Image'
  }

  // richTextBlock: extract first text span from portable text content array
  if (blockType === 'richTextBlock' && Array.isArray(fieldValue.content)) {
    for (const block of fieldValue.content) {
      if (block && typeof block === 'object' && Array.isArray((block as Record<string, unknown>).children)) {
        for (const child of (block as Record<string, unknown>).children as Array<Record<string, unknown>>) {
          if (typeof child.text === 'string' && child.text.trim()) {
            return child.text.trim().slice(0, 100)
          }
        }
      }
    }
  }

  // Generic: try common text fields
  if (typeof fieldValue.text === 'string') return fieldValue.text.slice(0, 100)
  if (typeof fieldValue.title === 'string') return fieldValue.title.slice(0, 100)
  if (typeof fieldValue.label === 'string') return (fieldValue.label as string).slice(0, 100)

  return ''
}

// Enhanced overlay component with label
function EnhancedOverlay(props: OverlayComponentProps) {
  const {PointerEvents, focused, type, field, node} = props
  const label = getComponentLabel(props)
  const icon = getBlockIcon(label)

  // Inject CSS to hide default labels on mount
  useEffect(() => {
    injectHideDefaultLabelStyles()
  }, [])

  // Send block context to Studio when this overlay becomes focused
  useEffect(() => {
    if (!focused) return
    if (typeof window === 'undefined' || window.parent === window) return

    const fieldValue = field?.value as Record<string, unknown> | undefined
    const blockType = (fieldValue?._type as string) || type || 'unknown'
    const path = (node && 'path' in node) ? (node.path as string) : ''
    const preview = extractPreviewText(fieldValue)

    window.parent.postMessage({
      type: 'claude-block-context',
      payload: {
        blockType,
        label,
        icon,
        path,
        preview,
        fieldValue: fieldValue && JSON.stringify(fieldValue).length < 5000 ? fieldValue : undefined,
        timestamp: Date.now(),
      },
    }, '*')
  }, [focused, type, field, node, label])

  return (
    <PointerEvents>
      {/* Label positioned directly above element border */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 3px)',
          left: '0',
          display: 'flex',
          alignItems: 'center',
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            background: '#5571FB',
            color: 'white',
            borderRadius: '3px',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{fontSize: '12px', opacity: 0.9}}>{icon}</span>
          <span>{label}</span>
        </div>
      </div>
    </PointerEvents>
  )
}

// The components resolver - returns our custom component for all overlays
export const customOverlayComponents = defineOverlayComponents(() => {
  return EnhancedOverlay
})
