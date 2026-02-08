'use client'

import {useEffect} from 'react'
import {getBlockLabel, getBlockIcon} from './constants'

/**
 * BlockContextBridge
 *
 * Listens for clicks in the Presentation mode preview iframe and detects
 * which specific block the user clicked on by inspecting DOM elements at
 * the click point. Sends a `claude-block-context` postMessage to the
 * Studio parent frame so the FloatingChat can show which block is active.
 *
 * Detection is generic and works with any Sanity project:
 * 1. First checks for `data-block-type` attributes (project-specific, most precise)
 * 2. Falls back to parsing `data-sanity` attributes (standard Sanity, always available)
 * 3. Auto-generates labels for unknown block types via camelCase → Title Case
 */

/** Map path field names to structural element types */
const PATH_FIELD_TO_TYPE: Record<string, string> = {
  pageBuilder: 'section',
  rows: 'row',
  columns: 'column',
  content: 'block',
}

/**
 * Parse a data-sanity attribute value to extract path info.
 * Format: id=...;type=...;path=pageBuilder:key.rows:key.columns:key;base=...
 */
function parseSanityPath(attr: string): string | null {
  const parts = attr.split(';')
  for (const part of parts) {
    const eqIndex = part.indexOf('=')
    if (eqIndex === -1) continue
    const key = part.slice(0, eqIndex)
    const value = part.slice(eqIndex + 1)
    if (key === 'path') return value
  }
  return null
}

/**
 * Infer element type from a Sanity path's last segment.
 * e.g. "pageBuilder:key.rows:key.columns:key" → "column"
 */
function inferTypeFromPath(path: string): string | null {
  const segments = path.split('.')
  if (segments.length === 0) return null
  const lastSegment = segments[segments.length - 1]
  const fieldName = lastSegment.split(':')[0]
  return PATH_FIELD_TO_TYPE[fieldName] || fieldName
}

/**
 * Format any type string into a human-readable label.
 * Handles known types via getBlockLabel, unknown types via camelCase → Title Case.
 * e.g. "headingBlock" → "Heading", "myCustomWidget" → "My Custom Widget"
 */
function formatLabel(type: string): string {
  // Try known labels first
  const known = getBlockLabel(type)
  if (known !== type) return known

  // Strip common suffixes
  const cleaned = type.replace(/Block$/, '').replace(/Component$/, '')
  // camelCase → Title Case
  const formatted = cleaned.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
  return formatted.trim() || type
}

function extractPreviewFromElement(el: Element): string {
  // For images, try to find alt text
  const img = el.querySelector('img')
  if (img?.alt) return img.alt.slice(0, 100)

  // For other elements, use text content
  const text = el.textContent?.trim() || ''
  return text.slice(0, 100)
}

/**
 * Walk up from an element to find the nearest ancestor with a Sanity annotation
 * (data-block-type or data-sanity). Stops at the first match so we always get
 * the most specific context — e.g. a column div with data-sanity rather than
 * the row wrapper further up that has data-block-type.
 */
function findNearestAnnotation(el: Element): {
  blockType: string | null
  sanityAttr: string | null
  element: Element
} | null {
  let current: Element | null = el
  while (current) {
    const hasBlockType = current.hasAttribute('data-block-type')
    const hasSanity = current.hasAttribute('data-sanity')

    if (hasBlockType || hasSanity) {
      return {
        blockType: hasBlockType ? current.getAttribute('data-block-type') : null,
        sanityAttr: hasSanity ? current.getAttribute('data-sanity') : null,
        element: current,
      }
    }
    current = current.parentElement
  }
  return null
}

export function BlockContextBridge() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return

    function handleClick(event: MouseEvent) {
      // Get all elements at the click point (including those behind overlays)
      const allElements = document.elementsFromPoint(event.clientX, event.clientY)

      let blockType: string | null = null
      let sanityAttr: string | null = null
      let blockElement: Element | null = null

      for (const el of allElements) {
        // Skip overlay elements (Sanity's visual editing overlay layer)
        if (el.closest('[data-sanity-overlay]') || el.closest('[data-sanity-overlay-element]')) {
          continue
        }

        // Walk up to find the nearest ancestor with any Sanity annotation.
        // This ensures a column (data-sanity only) is found before its
        // parent row (data-block-type) further up the tree.
        const annotation = findNearestAnnotation(el)
        if (annotation) {
          blockType = annotation.blockType
          sanityAttr = annotation.sanityAttr
          blockElement = annotation.element
          break
        }
      }

      // If no data-block-type, infer type from the data-sanity path
      if (!blockType && sanityAttr) {
        const path = parseSanityPath(sanityAttr)
        if (path) {
          blockType = inferTypeFromPath(path) || 'element'
        }
      }

      if (!blockType) return

      const previewText = blockElement ? extractPreviewFromElement(blockElement) : ''
      const label = formatLabel(blockType)
      const icon = getBlockIcon(label)

      window.parent.postMessage({
        type: 'claude-block-context',
        payload: {
          blockType,
          label,
          icon,
          path: sanityAttr || '',
          preview: previewText,
          timestamp: Date.now(),
        },
      }, '*')
    }

    // Use capture phase to fire before overlay system processes the click
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return null
}
