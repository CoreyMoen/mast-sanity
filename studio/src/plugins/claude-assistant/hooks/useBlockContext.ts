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

export function useBlockContext({
  enabled = true,
}: UseBlockContextOptions = {}): UseBlockContextResult {
  const [blockContext, setBlockContext] = useState<BlockContext | null>(null)
  const enabledRef = useRef(enabled)

  // Keep ref in sync
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only process when enabled
      if (!enabledRef.current) return

      // Validate message shape
      const data = event.data
      if (!data || typeof data !== 'object' || data.type !== 'claude-block-context') return

      const payload = data.payload
      if (!payload || typeof payload.blockType !== 'string') return

      setBlockContext({
        blockType: payload.blockType,
        label: payload.label || payload.blockType,
        path: payload.path || '',
        preview: payload.preview || '',
        fieldValue: payload.fieldValue,
        timestamp: payload.timestamp || Date.now(),
      })
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const clearBlockContext = useCallback(() => {
    setBlockContext(null)
  }, [])

  return {
    blockContext,
    clearBlockContext,
  }
}
