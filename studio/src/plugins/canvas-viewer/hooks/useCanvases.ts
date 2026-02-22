import {useEffect, useState, useCallback} from 'react'
import {useClient} from 'sanity'
import type {CanvasDocument} from '../types'

const CANVASES_QUERY = `*[_type == "canvas"] | order(order asc, _createdAt asc) {
  _id,
  _type,
  _createdAt,
  _updatedAt,
  name,
  description,
  order,
  "pageCount": count(pages)
}`

const generateKey = () => Math.random().toString(36).substring(2, 12)

export function useCanvases() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [canvases, setCanvases] = useState<CanvasDocument[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCanvases = useCallback(async () => {
    try {
      const result = await client.fetch<CanvasDocument[]>(CANVASES_QUERY)
      setCanvases(result)
    } catch (err) {
      console.error('Canvas viewer: failed to fetch canvases', err)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchCanvases()
  }, [fetchCanvases])

  // Real-time updates for canvas documents
  useEffect(() => {
    const subscription = client
      .listen('*[_type == "canvas"]', {}, {includeResult: false})
      .subscribe({
        next: () => fetchCanvases(),
        error: (err: Error) => console.error('Canvas viewer: listener error', err),
      })
    return () => subscription.unsubscribe()
  }, [client, fetchCanvases])

  const createCanvas = useCallback(
    async (name: string) => {
      const maxOrder =
        canvases.length > 0 ? Math.max(...canvases.map((c) => c.order || 0)) : 0
      const doc = await client.create({
        _type: 'canvas',
        name,
        order: maxOrder + 1,
        pages: [],
      })
      return doc._id
    },
    [client, canvases],
  )

  const deleteCanvas = useCallback(
    async (id: string) => {
      await client.delete(id)
    },
    [client],
  )

  const renameCanvas = useCallback(
    async (id: string, name: string) => {
      await client.patch(id).set({name}).commit()
    },
    [client],
  )

  const moveCanvas = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      const index = canvases.findIndex((c) => c._id === id)
      if (index === -1) return
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      if (swapIndex < 0 || swapIndex >= canvases.length) return

      const tx = client.transaction()
      tx.patch(canvases[index]._id, {set: {order: canvases[swapIndex].order}})
      tx.patch(canvases[swapIndex]._id, {set: {order: canvases[index].order}})
      await tx.commit()
    },
    [client, canvases],
  )

  const addPages = useCallback(
    async (canvasId: string, pageIds: string[]) => {
      const refs = pageIds.map((id) => ({
        _type: 'reference' as const,
        _ref: id,
        _key: generateKey(),
      }))
      await client
        .patch(canvasId)
        .setIfMissing({pages: []})
        .insert('after', 'pages[-1]', refs)
        .commit()
    },
    [client],
  )

  const removePage = useCallback(
    async (canvasId: string, pageId: string) => {
      // Remove references matching this page ID (handles both draft and published refs)
      await client
        .patch(canvasId)
        .unset([`pages[_ref=="${pageId}"]`, `pages[_ref=="drafts.${pageId}"]`])
        .commit()
    },
    [client],
  )

  return {
    canvases,
    loading,
    createCanvas,
    deleteCanvas,
    renameCanvas,
    moveCanvas,
    addPages,
    removePage,
  }
}
