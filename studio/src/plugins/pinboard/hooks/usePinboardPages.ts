import {useEffect, useState, useCallback, useRef} from 'react'
import {useClient} from 'sanity'
import type {PageDocument, PageWithStatus} from '../types'

const LISTENER_DEBOUNCE_MS = 500

/**
 * Fetches and deduplicates pages for a specific pinboard.
 * Gets page references from the pinboard document, then fetches
 * the actual page documents (including draft versions).
 */
export function usePinboardPages(pinboardId: string | null) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [pages, setPages] = useState<PageWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const fetchPages = useCallback(async () => {
    if (!pinboardId) {
      setPages([])
      setError(null)
      return
    }

    const requestId = ++requestIdRef.current

    try {
      setLoading(true)

      // Get the page reference IDs from the pinboard document
      const pinboard = await client.fetch<{pageIds: string[]} | null>(
        `*[_type == "pinboard" && _id == $pinboardId][0]{ "pageIds": pages[]._ref }`,
        {pinboardId},
      )

      // Bail if a newer request has been issued (user switched pinboards)
      if (requestId !== requestIdRef.current) return

      const pageIds = pinboard?.pageIds || []
      if (pageIds.length === 0) {
        setPages([])
        setError(null)
        return
      }

      // Fetch actual page documents including drafts
      const allIds = pageIds.flatMap((id) => [id, `drafts.${id}`])
      const result = await client.fetch<PageDocument[]>(
        `*[_type == "page" && _id in $ids] | order(_updatedAt desc) {
          _id, _type, _createdAt, _updatedAt, name, slug
        }`,
        {ids: allIds},
      )

      // Bail if a newer request has been issued
      if (requestId !== requestIdRef.current) return

      setPages(deduplicatePages(result, pageIds))
      setError(null)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err : new Error('Failed to fetch pages'))
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [client, pinboardId])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // Listen for changes to the pinboard document (immediate) or page mutations (debounced).
  // Pinboard changes (add/remove pages) trigger immediate re-fetch.
  // Page content changes are debounced to avoid rapid re-fetches during editing.
  useEffect(() => {
    if (!pinboardId) return

    const subscription = client
      .listen(
        `*[_type == "page" || (_type == "pinboard" && _id == $pinboardId)]`,
        {pinboardId},
        {includeResult: false},
      )
      .subscribe({
        next: (event) => {
          const isPinboardChange =
            'documentId' in event &&
            (event.documentId === pinboardId || event.documentId === `drafts.${pinboardId}`)

          if (isPinboardChange) {
            // Pinboard structure changed (pages added/removed) — fetch immediately
            fetchPages()
          } else {
            // Page content changed — debounce to avoid rapid re-fetches
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(fetchPages, LISTENER_DEBOUNCE_MS)
          }
        },
        error: (err: Error) => console.error('Pinboard pages: listener error', err),
      })

    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [client, pinboardId, fetchPages])

  return {pages, loading, error}
}

/**
 * Deduplicates pages by merging draft and published versions.
 * Preserves the order from the pinboard document's page references.
 */
function deduplicatePages(pages: PageDocument[], orderedIds: string[]): PageWithStatus[] {
  const byId = new Map<string, {published?: PageDocument; draft?: PageDocument}>()

  for (const page of pages) {
    const isDraft = page._id.startsWith('drafts.')
    const baseId = isDraft ? page._id.replace('drafts.', '') : page._id

    if (!byId.has(baseId)) {
      byId.set(baseId, {})
    }

    const entry = byId.get(baseId)!
    if (isDraft) {
      entry.draft = page
    } else {
      entry.published = page
    }
  }

  // Return in the order defined by the pinboard document
  return orderedIds
    .filter((id) => byId.has(id))
    .map((id) => {
      const {published, draft} = byId.get(id)!
      if (draft && published) {
        return {page: draft, status: 'modified' as const}
      }
      if (draft) {
        return {page: draft, status: 'draft' as const}
      }
      return {page: published!, status: 'published' as const}
    })
}
