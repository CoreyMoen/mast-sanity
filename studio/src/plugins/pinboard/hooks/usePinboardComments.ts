import {useEffect, useState, useCallback, useRef} from 'react'
import {useClient} from 'sanity'
import type {PinboardComment} from '../types'
import {generateKey} from '../utils'

const COMMENTS_QUERY = `*[_type == "pinboard" && _id == $pinboardId][0]{
  "comments": coalesce(comments, [])
}`

export function usePinboardComments(pinboardId: string | null) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [comments, setComments] = useState<PinboardComment[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchComments = useCallback(async () => {
    if (!pinboardId) {
      setComments([])
      return
    }
    try {
      const result = await client.fetch<{comments: PinboardComment[]}>(COMMENTS_QUERY, {pinboardId})
      setComments(result?.comments ?? [])
    } catch (err) {
      console.error('Pinboard: failed to fetch comments', err)
    } finally {
      setLoading(false)
    }
  }, [client, pinboardId])

  useEffect(() => {
    if (!pinboardId) {
      setComments([])
      return
    }
    setLoading(true)
    fetchComments()
  }, [pinboardId, fetchComments])

  // Real-time updates — debounced to avoid excessive refetches
  useEffect(() => {
    if (!pinboardId) return

    const subscription = client
      .listen(`*[_type == "pinboard" && _id == $pinboardId]`, {pinboardId}, {includeResult: false})
      .subscribe({
        next: () => {
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => fetchComments(), 300)
        },
        error: (err: Error) => console.error('Pinboard: comments listener error', err),
      })

    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [client, pinboardId, fetchComments])

  const addComment = useCallback(
    async (comment: {
      pageRef: string
      xPercent: number
      yPercent: number
      authorId: string
      authorName: string
      text: string
    }) => {
      if (!pinboardId) return
      const newComment = {
        _type: 'pinboardComment' as const,
        _key: generateKey(),
        ...comment,
        createdAt: new Date().toISOString(),
        resolved: false,
        replies: [],
      }

      // Safe append: check if comments array exists
      const current = await client.fetch<{comments: unknown[]} | null>(
        `*[_type == "pinboard" && _id == $id][0]{ comments }`,
        {id: pinboardId},
      )
      const hasComments = (current?.comments?.length ?? 0) > 0

      const patch = client.patch(pinboardId).setIfMissing({comments: []})
      if (hasComments) {
        await patch.insert('after', 'comments[-1]', [newComment]).commit()
      } else {
        await patch.set({comments: [newComment]}).commit()
      }
      await fetchComments()
    },
    [client, pinboardId, fetchComments],
  )

  const deleteComment = useCallback(
    async (commentKey: string) => {
      if (!pinboardId) return
      await client
        .patch(pinboardId)
        .unset([`comments[_key=="${commentKey}"]`])
        .commit()
      await fetchComments()
    },
    [client, pinboardId, fetchComments],
  )

  const resolveComment = useCallback(
    async (commentKey: string, resolved: boolean) => {
      if (!pinboardId) return
      await client
        .patch(pinboardId)
        .set({[`comments[_key=="${commentKey}"].resolved`]: resolved})
        .commit()
      await fetchComments()
    },
    [client, pinboardId, fetchComments],
  )

  const addReply = useCallback(
    async (commentKey: string, reply: {authorId: string; authorName: string; text: string}) => {
      if (!pinboardId) return
      const newReply = {
        _type: 'pinboardReply' as const,
        _key: generateKey(),
        ...reply,
        createdAt: new Date().toISOString(),
      }

      // Safe append for nested replies array
      const current = await client.fetch<{replies: unknown[]} | null>(
        `*[_type == "pinboard" && _id == $id][0].comments[_key == $key][0]{ replies }`,
        {id: pinboardId, key: commentKey},
      )
      const hasReplies = (current?.replies?.length ?? 0) > 0

      const patch = client
        .patch(pinboardId)
        .setIfMissing({[`comments[_key=="${commentKey}"].replies`]: []})
      if (hasReplies) {
        await patch
          .insert('after', `comments[_key=="${commentKey}"].replies[-1]`, [newReply])
          .commit()
      } else {
        await patch.set({[`comments[_key=="${commentKey}"].replies`]: [newReply]}).commit()
      }
      await fetchComments()
    },
    [client, pinboardId, fetchComments],
  )

  const deleteReply = useCallback(
    async (commentKey: string, replyKey: string) => {
      if (!pinboardId) return
      await client
        .patch(pinboardId)
        .unset([`comments[_key=="${commentKey}"].replies[_key=="${replyKey}"]`])
        .commit()
      await fetchComments()
    },
    [client, pinboardId, fetchComments],
  )

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    resolveComment,
    addReply,
    deleteReply,
  }
}
