/**
 * useCurrentDocument Hook
 *
 * Detects the currently viewed document based on URL in both Structure and Presentation modes.
 * Used by FloatingChat to auto-populate document context.
 *
 * URL Patterns:
 * - Structure mode: /structure/<list>;document-id (e.g., /structure/orderable-page;home-page)
 * - Structure mode (nested): /structure/<list>;...;document-id (e.g., /structure/collections;collectionsList;post;post-id)
 * - Presentation mode: /presentation?preview=/slug (e.g., /presentation?preview=/about)
 */

import {useState, useEffect, useCallback, useRef} from 'react'
import type {SanityClient} from 'sanity'
import type {DocumentContext} from '../types'

interface UseCurrentDocumentOptions {
  /** Sanity client for fetching document details */
  client: SanityClient
  /** Polling interval in ms (default: 500) */
  pollInterval?: number
  /** Whether detection is enabled (set to false when user has manual selection) */
  enabled?: boolean
}

interface UseCurrentDocumentResult {
  /** Currently detected document, or null if none */
  currentDocument: DocumentContext | null
  /** Whether detection is currently loading */
  isDetecting: boolean
  /** Current mode: 'structure', 'presentation', or null */
  mode: 'structure' | 'presentation' | null
  /** Field path from URL (when editing nested content, e.g., 'pageBuilder[_key=="xxx"]') */
  fieldPath: string | null
}

/**
 * Parse document ID from Structure mode URL
 * Pattern: /structure/<list>;document-id
 * For nested paths like /structure/collections;collectionsList;post;some-post-id,
 * returns the last semicolon-separated segment (the actual document ID).
 */
function parseStructureUrl(pathname: string): string | null {
  if (!pathname.includes('/structure/')) return null
  const match = pathname.match(/\/structure\/(.+)/)
  if (!match) return null
  const segments = match[1].replace(/\/$/, '').split(';')
  if (segments.length < 2) return null
  const docId = segments[segments.length - 1]
  console.debug('[useCurrentDocument] Structure URL parsed:', {pathname, segments, docId})
  return docId
}

/**
 * Parse page slug from Presentation mode URL
 * Handles both simple and full URL formats:
 * - Simple: /presentation?preview=/about
 * - Full URL: /presentation?preview=http://localhost:4000/about?sanity-preview-perspective=drafts
 */
function parsePresentationUrl(pathname: string, search: string): string | null {
  if (!pathname.includes('/presentation')) {
    return null
  }

  const params = new URLSearchParams(search)
  const preview = params.get('preview')

  if (preview) {
    // Handle full URL format (e.g., http://localhost:4000/about?sanity-preview-perspective=drafts)
    if (preview.startsWith('http://') || preview.startsWith('https://')) {
      try {
        const url = new URL(preview)
        const slug = url.pathname.replace(/^\//, '')
        return slug || 'home'
      } catch {
        return null
      }
    }
    // Handle simple slug format (e.g., /about)
    const slug = preview.replace(/^\//, '')
    return slug || 'home'
  }

  return null
}

/**
 * Parse field path from URL query parameters
 * Sanity may add 'path' or 'inspect' params when editing nested content
 * Examples:
 * - ?path=pageBuilder[_key=="abc123"]
 * - ?inspect=pageBuilder,0
 */
function parseFieldPath(search: string): string | null {
  const params = new URLSearchParams(search)

  // Check for 'path' parameter (standard field path format)
  const pathParam = params.get('path')
  if (pathParam) {
    return pathParam
  }

  // Check for 'inspect' parameter (alternative format)
  const inspectParam = params.get('inspect')
  if (inspectParam) {
    return inspectParam
  }

  // Check for 'pathKey' parameter (another variant)
  const pathKeyParam = params.get('pathKey')
  if (pathKeyParam) {
    return pathKeyParam
  }

  return null
}

export function useCurrentDocument({
  client,
  pollInterval = 500,
  enabled = true,
}: UseCurrentDocumentOptions): UseCurrentDocumentResult {
  const [currentDocument, setCurrentDocument] = useState<DocumentContext | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [mode, setMode] = useState<'structure' | 'presentation' | null>(null)
  const [fieldPath, setFieldPath] = useState<string | null>(null)

  // Track last detected URL to avoid redundant fetches
  const lastUrlRef = useRef<string>('')
  const lastDocIdRef = useRef<string | null>(null)

  const detectDocument = useCallback(async () => {
    if (!enabled) {
      return
    }

    const currentUrl = window.location.href
    const pathname = window.location.pathname
    const search = window.location.search

    // Skip if URL hasn't changed
    if (currentUrl === lastUrlRef.current) {
      return
    }
    lastUrlRef.current = currentUrl

    // Determine mode and extract identifier
    let documentId: string | null = null
    let pageSlug: string | null = null
    let detectedMode: 'structure' | 'presentation' | null = null

    // Check Structure mode first
    documentId = parseStructureUrl(pathname)
    if (documentId) {
      detectedMode = 'structure'
    } else {
      // Check Presentation mode
      pageSlug = parsePresentationUrl(pathname, search)
      if (pageSlug !== null) {
        detectedMode = 'presentation'
      }
    }

    setMode(detectedMode)

    // Check for field path in URL (for nested content editing)
    const detectedPath = parseFieldPath(search)
    setFieldPath(detectedPath)

    // If no document detected, clear current document
    if (!documentId && pageSlug === null) {
      if (lastDocIdRef.current !== null) {
        lastDocIdRef.current = null
        setCurrentDocument(null)
      }
      return
    }

    // Create a cache key for the detected document
    const cacheKey = documentId || `slug:${pageSlug}`
    if (cacheKey === lastDocIdRef.current) {
      return // Same document, skip fetch
    }

    setIsDetecting(true)

    try {
      let doc: {_id: string; _type: string; name?: string; title?: string; slug?: {current: string}} | null = null

      if (documentId) {
        // Fetch by document ID (Structure mode)
        doc = await client.fetch(
          `*[_id == $id || _id == "drafts." + $id][0] {
            _id,
            _type,
            name,
            title,
            slug
          }`,
          {id: documentId}
        )
      } else if (pageSlug !== null) {
        // Fetch by slug (Presentation mode) - check page and post types
        doc = await client.fetch(
          `*[slug.current == $slug && (_type == "page" || _type == "post")][0] {
            _id,
            _type,
            name,
            title,
            slug
          }`,
          {slug: pageSlug}
        )
      }

      if (doc) {
        console.debug('[useCurrentDocument] Document detected:', {mode: detectedMode, id: doc._id, type: doc._type, name: doc.name || doc.title})
        lastDocIdRef.current = cacheKey
        setCurrentDocument({
          _id: doc._id,
          _type: doc._type,
          name: doc.name || doc.title || 'Untitled',
          slug: doc.slug?.current,
        })
      } else {
        console.debug('[useCurrentDocument] No document found for:', {documentId, pageSlug})
        lastDocIdRef.current = null
        setCurrentDocument(null)
      }
    } catch (err) {
      console.error('Failed to detect current document:', err)
      lastDocIdRef.current = null
      setCurrentDocument(null)
    } finally {
      setIsDetecting(false)
    }
  }, [client, enabled])

  // Run detection on mount and when enabled changes
  useEffect(() => {
    if (enabled) {
      // Clear cache refs to force fresh detection (handles case where user
      // navigated while detection was disabled due to manual selection)
      lastUrlRef.current = ''
      lastDocIdRef.current = null
      detectDocument()
    }
  }, [enabled, detectDocument])

  // Poll for URL changes (since Sanity SPA navigation doesn't always trigger popstate)
  useEffect(() => {
    if (!enabled) {
      return
    }

    const intervalId = setInterval(detectDocument, pollInterval)

    // Also listen to popstate for browser back/forward
    window.addEventListener('popstate', detectDocument)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('popstate', detectDocument)
    }
  }, [enabled, pollInterval, detectDocument])

  return {
    currentDocument,
    isDetecting,
    mode,
    fieldPath,
  }
}
