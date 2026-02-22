import {useEffect, useState, useCallback, useRef} from 'react'
import {useClient} from 'sanity'
import type {PageDocument, PageWithStatus} from '../types'

const LISTENER_DEBOUNCE_MS = 500

/**
 * Fetches and deduplicates pages for a specific canvas.
 * Gets page references from the canvas document, then fetches
 * the actual page documents (including draft versions).
 */
export function useCanvasPages(canvasId: string | null) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [pages, setPages] = useState<PageWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPages = useCallback(async () => {
    if (!canvasId) {
      setPages([])
      return
    }

    try {
      setLoading(true)

      // Get the page reference IDs from the canvas document
      const canvas = await client.fetch<{pageIds: string[]} | null>(
        `*[_type == "canvas" && _id == $canvasId][0]{ "pageIds": pages[]._ref }`,
        {canvasId},
      )

      const pageIds = canvas?.pageIds || []
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

      setPages(deduplicatePages(result, pageIds))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pages'))
    } finally {
      setLoading(false)
    }
  }, [client, canvasId])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // Listen for changes to the canvas document (immediate) or page mutations (debounced).
  // Canvas changes (add/remove pages) trigger immediate re-fetch.
  // Page content changes are debounced to avoid rapid re-fetches during editing.
  useEffect(() => {
    if (!canvasId) return

    const subscription = client
      .listen(
        `*[_type == "page" || (_type == "canvas" && _id == $canvasId)]`,
        {canvasId},
        {includeResult: false},
      )
      .subscribe({
        next: (event) => {
          const isCanvasChange =
            'documentId' in event &&
            (event.documentId === canvasId || event.documentId === `drafts.${canvasId}`)

          if (isCanvasChange) {
            // Canvas structure changed (pages added/removed) — fetch immediately
            fetchPages()
          } else {
            // Page content changed — debounce to avoid rapid re-fetches
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(fetchPages, LISTENER_DEBOUNCE_MS)
          }
        },
        error: (err: Error) => console.error('Canvas pages: listener error', err),
      })

    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [client, canvasId, fetchPages])

  return {pages, loading, error}
}

/**
 * Deduplicates pages by merging draft and published versions.
 * Preserves the order from the canvas document's page references.
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

  // Return in the order defined by the canvas document
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
