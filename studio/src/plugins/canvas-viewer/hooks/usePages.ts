import {useEffect, useState, useCallback} from 'react'
import {useClient} from 'sanity'
import type {PageDocument, PageWithStatus} from '../types'

const PAGES_QUERY = `*[_type == "page"] | order(_updatedAt desc) {
  _id,
  _type,
  _createdAt,
  _updatedAt,
  name,
  slug
}`

/**
 * Deduplicates pages by merging draft and published versions.
 * Returns a list of unique pages with their publish status.
 */
function deduplicatePages(pages: PageDocument[]): PageWithStatus[] {
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

  return Array.from(byId.values()).map(({published, draft}) => {
    if (draft && published) {
      return {page: draft, status: 'modified' as const}
    }
    if (draft) {
      return {page: draft, status: 'draft' as const}
    }
    return {page: published!, status: 'published' as const}
  })
}

export function usePages() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [pages, setPages] = useState<PageWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true)
      const result = await client.fetch<PageDocument[]>(PAGES_QUERY)
      setPages(deduplicatePages(result))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pages'))
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // Listen for real-time updates to pages
  useEffect(() => {
    const subscription = client
      .listen('*[_type == "page"]', {}, {includeResult: false})
      .subscribe({
        next: () => {
          fetchPages()
        },
        error: (err: Error) => {
          console.error('Canvas viewer: real-time listener error', err)
        },
      })

    return () => subscription.unsubscribe()
  }, [client, fetchPages])

  return {pages, loading, error, refetch: fetchPages}
}
