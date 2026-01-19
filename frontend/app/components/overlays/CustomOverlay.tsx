'use client'

import {useEffect} from 'react'
import {
  defineOverlayComponents,
  type OverlayComponentProps,
} from '@sanity/visual-editing/unstable_overlay-components'
import {
  BLOCK_TYPE_LABELS,
  BLOCK_TYPE_ICONS,
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

// Enhanced overlay component with label
function EnhancedOverlay(props: OverlayComponentProps) {
  const {PointerEvents} = props
  const label = getComponentLabel(props)
  const icon = getBlockIcon(label)

  // Inject CSS to hide default labels on mount
  useEffect(() => {
    injectHideDefaultLabelStyles()
  }, [])

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
