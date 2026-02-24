import {useEffect, useState, useCallback, useRef} from 'react'
import {useClient} from 'sanity'
import {PINBOARD_DOC_TYPES} from '../types'
import type {PageDocument, PageWithStatus} from '../types'

const LISTENER_DEBOUNCE_MS = 500

/** GROQ type filter for all supported document types */
const TYPE_FILTER = PINBOARD_DOC_TYPES.map((t) => `"${t}"`).join(', ')

/** GROQ projection that normalizes type-specific name fields into displayName */
const DOC_PROJECTION = `{
  _id, _type, _createdAt, _updatedAt,
  "displayName": select(
    _type == "person" => coalesce(firstName, "") + " " + coalesce(lastName, ""),
    _type == "post" => title,
    _type == "category" => title,
    name
  ),
  slug
}`

/**
 * Fetches and deduplicates documents for a specific pinboard.
 * Gets references from the pinboard document, then fetches
 * the actual documents (including draft versions).
 */
export function usePinboardPages(pinboardId: string | null) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [pages, setPages] = useState<PageWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)
  // Track current page reference IDs to avoid unnecessary refetches
  // when non-page fields (e.g. comments) change on the pinboard document
  const pageIdsRef = useRef<string[]>([])

  const fetchPages = useCallback(async () => {
    if (!pinboardId) {
      setPages([])
      setError(null)
      return
    }

    const requestId = ++requestIdRef.current

    try {
      setLoading(true)

      // Get the document reference IDs from the pinboard
      const pinboard = await client.fetch<{pageIds: string[]} | null>(
        `*[_type == "pinboard" && _id == $pinboardId][0]{ "pageIds": pages[]._ref }`,
        {pinboardId},
      )

      // Bail if a newer request has been issued (user switched pinboards)
      if (requestId !== requestIdRef.current) return

      const pageIds = pinboard?.pageIds || []
      pageIdsRef.current = pageIds
      if (pageIds.length === 0) {
        setPages([])
        setError(null)
        return
      }

      // Fetch actual documents including drafts
      const allIds = pageIds.flatMap((id) => [id, `drafts.${id}`])
      const result = await client.fetch<PageDocument[]>(
        `*[_type in [${TYPE_FILTER}] && _id in $ids] | order(_updatedAt desc) ${DOC_PROJECTION}`,
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
        `*[_type in [${TYPE_FILTER}] || (_type == "pinboard" && _id == $pinboardId)]`,
        {pinboardId},
        {includeResult: false},
      )
      .subscribe({
        next: (event) => {
          const isPinboardChange =
            'documentId' in event &&
            (event.documentId === pinboardId || event.documentId === `drafts.${pinboardId}`)

          if (isPinboardChange) {
            // Pinboard document changed — but only refetch pages if the pages
            // array actually changed (skip comment-only mutations to avoid
            // remounting all iframes)
            client
              .fetch<{pageIds: string[]} | null>(
                `*[_type == "pinboard" && _id == $pinboardId][0]{ "pageIds": pages[]._ref }`,
                {pinboardId},
              )
              .then((result) => {
                const newPageIds = result?.pageIds || []
                const currentPageIds = pageIdsRef.current
                const changed =
                  newPageIds.length !== currentPageIds.length ||
                  newPageIds.some((id, i) => id !== currentPageIds[i])
                if (changed) {
                  fetchPages()
                }
              })
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

  return {pages, loading, error, refetch: fetchPages}
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
