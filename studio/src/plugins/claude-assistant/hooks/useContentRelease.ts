/**
 * useContentRelease Hook
 *
 * Manages Sanity Content Releases for the Claude Assistant plugin.
 * When enabled, document mutations are batched into a release per conversation,
 * allowing users to review and publish all changes at once.
 *
 * Requires:
 * - Sanity Enterprise plan with Content Releases enabled
 * - @sanity/client with API version 2025-02-19 or later
 */

import {useState, useCallback, useRef} from 'react'
import type {SanityClient} from 'sanity'
import type {UseContentReleaseReturn} from '../types'

/** API version required for Content Releases */
const RELEASES_API_VERSION = '2025-02-19'

/**
 * Generate a short random release ID (matches Sanity's format)
 */
function generateReleaseId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'r'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Hook for managing Content Releases tied to Claude Assistant conversations.
 *
 * @param client - Sanity client instance (any API version; will be reconfigured internally)
 * @param enabled - Whether release mode is enabled in settings
 */
export function useContentRelease(
  client: SanityClient,
  enabled: boolean
): UseContentReleaseReturn {
  const [releaseId, setReleaseId] = useState<string | null>(null)
  const [releaseTitle, setReleaseTitle] = useState<string | null>(null)
  const [documentCount, setDocumentCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  // Use a ref for the releases-capable client to avoid re-creating on every render
  const releasesClientRef = useRef<SanityClient | null>(null)

  /**
   * Get a client configured for the releases API version
   */
  const getReleasesClient = useCallback((): SanityClient => {
    if (!releasesClientRef.current) {
      releasesClientRef.current = client.withConfig({apiVersion: RELEASES_API_VERSION})
    }
    return releasesClientRef.current
  }, [client])

  /**
   * Create a new release or retrieve the existing one for this conversation.
   * Returns the releaseId on success, null if releases are unavailable.
   */
  const ensureRelease = useCallback(
    async (conversationTitle: string): Promise<string | null> => {
      // If already have a release for this conversation, return it
      if (releaseId) return releaseId

      // If releases are disabled or known to be unavailable, skip
      if (!enabled) return null
      if (isAvailable === false) return null

      setIsProcessing(true)
      setError(null)

      try {
        const releasesClient = getReleasesClient()
        const newReleaseId = generateReleaseId()
        const title = `Claude: ${conversationTitle || 'Untitled'} — ${new Date().toLocaleDateString()}`

        // Use the actions API to create a release
        // This is the low-level approach that works without typed helper methods
        await releasesClient.request({
          method: 'POST',
          uri: `/data/actions/${releasesClient.config().dataset}`,
          body: {
            actions: [
              {
                actionType: 'sanity.action.release.create',
                releaseId: newReleaseId,
                metadata: {
                  title,
                  releaseType: 'asap',
                  description: 'Changes made by Claude Assistant',
                },
              },
            ],
          },
        })

        setReleaseId(newReleaseId)
        setReleaseTitle(title)
        setDocumentCount(0)
        setIsAvailable(true)

        console.log('[ContentRelease] Created release:', newReleaseId, title)
        return newReleaseId
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'

        // Check if this is a feature availability error
        if (
          message.includes('not available') ||
          message.includes('not enabled') ||
          message.includes('permission') ||
          message.includes('forbidden') ||
          message.includes('403') ||
          message.includes('404') ||
          message.includes('not found')
        ) {
          console.warn('[ContentRelease] Content Releases not available:', message)
          setIsAvailable(false)
          setError('Content Releases requires a Sanity Enterprise plan')
        } else {
          console.error('[ContentRelease] Failed to create release:', err)
          setError(`Failed to create release: ${message}`)
        }

        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [releaseId, enabled, isAvailable, getReleasesClient]
  )

  /**
   * Publish the current release, making all batched changes live.
   */
  const publishRelease = useCallback(async (): Promise<boolean> => {
    if (!releaseId) {
      setError('No active release to publish')
      return false
    }

    setIsProcessing(true)
    setError(null)

    try {
      const releasesClient = getReleasesClient()

      await releasesClient.request({
        method: 'POST',
        uri: `/data/actions/${releasesClient.config().dataset}`,
        body: {
          actions: [
            {
              actionType: 'sanity.action.release.publish',
              releaseId,
            },
          ],
        },
      })

      console.log('[ContentRelease] Published release:', releaseId)

      // Clear the release state after publishing
      setReleaseId(null)
      setReleaseTitle(null)
      setDocumentCount(0)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish release'
      console.error('[ContentRelease] Publish failed:', err)
      setError(message)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [releaseId, getReleasesClient])

  /**
   * Increment the document count (called after successfully adding a doc to the release)
   */
  const incrementDocumentCount = useCallback(() => {
    setDocumentCount((prev) => prev + 1)
  }, [])

  return {
    releaseId,
    releaseTitle,
    isReleaseMode: enabled && isAvailable !== false,
    documentCount,
    isProcessing,
    ensureRelease,
    publishRelease,
    error,
    isAvailable,
    incrementDocumentCount,
  }
}
