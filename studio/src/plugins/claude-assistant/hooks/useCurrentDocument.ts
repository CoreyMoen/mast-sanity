/**
 * useCurrentDocument Hook
 *
 * Detects the currently viewed document based on URL in both Structure and Presentation modes.
 * Used by FloatingChat to auto-populate document context.
 *
 * URL Patterns:
 * - Structure mode: /structure/<list>;document-id (e.g., /structure/orderable-page;home-page)
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
}

/**
 * Parse document ID from Structure mode URL
 * Pattern: /structure/<list>;document-id
 */
function parseStructureUrl(pathname: string): string | null {
  // Match pattern like /structure/orderable-page;home-page or /structure/post;post-id
  const match = pathname.match(/\/structure\/[^;]+;([^\/]+)/)
  if (match) {
    return match[1] // Returns the document ID (e.g., "home-page", "drafts.basic-layouts")
  }
  return null
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

export function useCurrentDocument({
  client,
  pollInterval = 500,
  enabled = true,
}: UseCurrentDocumentOptions): UseCurrentDocumentResult {
  const [currentDocument, setCurrentDocument] = useState<DocumentContext | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [mode, setMode] = useState<'structure' | 'presentation' | null>(null)

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
        // Fetch by slug (Presentation mode)
        doc = await client.fetch(
          `*[_type == "page" && slug.current == $slug][0] {
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
        lastDocIdRef.current = cacheKey
        setCurrentDocument({
          _id: doc._id,
          _type: doc._type,
          name: doc.name || doc.title || 'Untitled',
          slug: doc.slug?.current,
        })
      } else {
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
      detectDocument()
    } else {
      // When disabled, don't clear document - let parent manage state
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
  }
}
