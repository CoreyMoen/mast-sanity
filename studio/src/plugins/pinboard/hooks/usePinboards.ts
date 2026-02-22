import {useEffect, useState, useCallback} from 'react'
import {useClient} from 'sanity'
import type {PinboardDocument} from '../types'

const PINBOARDS_QUERY = `*[_type == "pinboard"] | order(order asc, _createdAt asc) {
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

export function usePinboards() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [pinboards, setPinboards] = useState<PinboardDocument[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPinboards = useCallback(async () => {
    try {
      const result = await client.fetch<PinboardDocument[]>(PINBOARDS_QUERY)
      setPinboards(result)
    } catch (err) {
      console.error('Pinboard: failed to fetch pinboards', err)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchPinboards()
  }, [fetchPinboards])

  // Real-time updates for pinboard documents
  useEffect(() => {
    const subscription = client
      .listen('*[_type == "pinboard"]', {}, {includeResult: false})
      .subscribe({
        next: () => fetchPinboards(),
        error: (err: Error) => console.error('Pinboard: listener error', err),
      })
    return () => subscription.unsubscribe()
  }, [client, fetchPinboards])

  const createPinboard = useCallback(
    async (name: string) => {
      const maxOrder =
        pinboards.length > 0 ? Math.max(...pinboards.map((c) => c.order || 0)) : 0
      const doc = await client.create({
        _type: 'pinboard',
        name,
        order: maxOrder + 1,
        pages: [],
      })
      return doc._id
    },
    [client, pinboards],
  )

  const deletePinboard = useCallback(
    async (id: string) => {
      await client.delete(id)
    },
    [client],
  )

  const renamePinboard = useCallback(
    async (id: string, name: string) => {
      await client.patch(id).set({name}).commit()
    },
    [client],
  )

  const movePinboard = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      const index = pinboards.findIndex((c) => c._id === id)
      if (index === -1) return
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      if (swapIndex < 0 || swapIndex >= pinboards.length) return

      const tx = client.transaction()
      tx.patch(pinboards[index]._id, {set: {order: pinboards[swapIndex].order}})
      tx.patch(pinboards[swapIndex]._id, {set: {order: pinboards[index].order}})
      await tx.commit()
    },
    [client, pinboards],
  )

  const addPages = useCallback(
    async (pinboardId: string, pageIds: string[]) => {
      const refs = pageIds.map((id) => ({
        _type: 'reference' as const,
        _ref: id,
        _key: generateKey(),
      }))
      // Fetch current pages to safely append (insert after pages[-1] fails on empty arrays)
      const current = await client.fetch<{pages: unknown[]} | null>(
        `*[_type == "pinboard" && _id == $id][0]{ pages }`,
        {id: pinboardId},
      )
      const hasPages = (current?.pages?.length ?? 0) > 0

      const patch = client.patch(pinboardId).setIfMissing({pages: []})
      if (hasPages) {
        await patch.insert('after', 'pages[-1]', refs).commit()
      } else {
        await patch.set({pages: refs}).commit()
      }
    },
    [client],
  )

  const removePage = useCallback(
    async (pinboardId: string, pageId: string) => {
      // Remove references matching this page ID (handles both draft and published refs)
      await client
        .patch(pinboardId)
        .unset([`pages[_ref=="${pageId}"]`, `pages[_ref=="drafts.${pageId}"]`])
        .commit()
    },
    [client],
  )

  return {
    pinboards,
    loading,
    createPinboard,
    deletePinboard,
    renamePinboard,
    movePinboard,
    addPages,
    removePage,
  }
}
