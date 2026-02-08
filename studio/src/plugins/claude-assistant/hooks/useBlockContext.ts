/**
 * useBlockContext Hook
 *
 * Listens for postMessage events from the Presentation mode preview iframe.
 * When a user clicks a block overlay in the visual editor, the iframe sends
 * a 'claude-block-context' message with the block's type, path, and content.
 *
 * This hook captures that context so the FloatingChat can include it when
 * sending messages to Claude, giving Claude precise knowledge of which
 * block the user is referring to.
 */

import {useState, useEffect, useCallback, useRef} from 'react'
import type {BlockContext} from '../types'

/** Dedup window in ms — within this window, more specific contexts take priority */
const DEDUP_WINDOW_MS = 500

interface UseBlockContextOptions {
  /** Whether block context capture is active (e.g., chat is open) */
  enabled?: boolean
}

interface UseBlockContextResult {
  /** The most recently clicked block context, or null */
  blockContext: BlockContext | null
  /** Clear the current block context */
  clearBlockContext: () => void
}

/**
 * Estimate how specific a path is by counting its segments.
 * More segments = deeper nesting = more specific block.
 * e.g. "pageBuilder:key" = 1, "pageBuilder:key.rows:key.columns:key.content:key" = 4
 */
function getPathDepth(path: string): number {
  if (!path) return 0
  return path.split('.').length
}

export function useBlockContext({
  enabled = true,
}: UseBlockContextOptions = {}): UseBlockContextResult {
  const [blockContext, setBlockContext] = useState<BlockContext | null>(null)
  const enabledRef = useRef(enabled)
  const lastContextRef = useRef<{timestamp: number; pathDepth: number} | null>(null)

  // Keep ref in sync
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only process when enabled
      if (!enabledRef.current) {
        // Still log if we receive the right message type but are disabled
        if (event.data?.type === 'claude-block-context') {
          console.log('[useBlockContext] Received block context but hook is disabled')
        }
        return
      }

      // Validate message shape
      const data = event.data
      if (!data || typeof data !== 'object') return

      // Log all claude-related messages for debugging
      if (data.type === 'claude-block-context') {
        console.log('[useBlockContext] Received claude-block-context message:', data)
      }

      if (data.type !== 'claude-block-context') return

      const payload = data.payload
      if (!payload || typeof payload.blockType !== 'string') {
        console.log('[useBlockContext] Invalid payload shape:', payload)
        return
      }

      const now = Date.now()
      const newPathDepth = getPathDepth(payload.path || '')

      // Specificity-based dedup: when two messages arrive in quick succession
      // (e.g., click listener sends specific block context, then overlay sends
      // section context), keep the more specific one (deeper path).
      const last = lastContextRef.current
      if (last && (now - last.timestamp) < DEDUP_WINDOW_MS && newPathDepth < last.pathDepth) {
        console.log('[useBlockContext] Ignoring less specific context (depth %d < %d)', newPathDepth, last.pathDepth)
        return
      }

      lastContextRef.current = {timestamp: now, pathDepth: newPathDepth}

      console.log('[useBlockContext] Setting block context:', payload)
      setBlockContext({
        blockType: payload.blockType,
        label: payload.label || payload.blockType,
        icon: payload.icon || undefined,
        path: payload.path || '',
        preview: payload.preview || '',
        fieldValue: payload.fieldValue,
        timestamp: payload.timestamp || Date.now(),
      })
    }

    console.log('[useBlockContext] Adding message listener')
    window.addEventListener('message', handleMessage)
    return () => {
      console.log('[useBlockContext] Removing message listener')
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const clearBlockContext = useCallback(() => {
    setBlockContext(null)
  }, [])

  return {
    blockContext,
    clearBlockContext,
  }
}
