import {useState, useCallback, useMemo, useRef} from 'react'
import type {PinboardTransform} from '../types'

const MIN_SCALE = 0.2
const MAX_SCALE = 3
const ZOOM_STEP = 0.1

export function usePinboardTransform() {
  const [transform, setTransform] = useState<PinboardTransform>({x: 0, y: 0, scale: 1})
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const isPanning = useRef(false)
  const lastPosition = useRef({x: 0, y: 0})
  const wheelCleanup = useRef<(() => void) | null>(null)

  // Callback ref: attaches non-passive wheel listener when the DOM node mounts.
  // This avoids the useEffect timing issue where the element isn't in the DOM yet.
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    // Detach from previous node
    if (wheelCleanup.current) {
      wheelCleanup.current()
      wheelCleanup.current = null
    }

    nodeRef.current = node

    if (node) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault()

        if (e.metaKey || e.ctrlKey) {
          // Zoom when holding Command (Mac) / Ctrl (Windows)
          const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP

          setTransform((prev) => {
            const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta))
            const rect = node.getBoundingClientRect()
            const cursorX = e.clientX - rect.left
            const cursorY = e.clientY - rect.top
            const scaleRatio = newScale / prev.scale

            return {
              x: cursorX - scaleRatio * (cursorX - prev.x),
              y: cursorY - scaleRatio * (cursorY - prev.y),
              scale: newScale,
            }
          })
        } else {
          // Scroll to pan (supports both vertical and horizontal trackpad gestures)
          setTransform((prev) => ({
            ...prev,
            x: prev.x - e.deltaX,
            y: prev.y - e.deltaY,
          }))
        }
      }

      node.addEventListener('wheel', handleWheel, {passive: false})
      wheelCleanup.current = () => node.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start panning if clicking on a card or interactive element
    const isInteractive = (e.target as HTMLElement).closest('[data-page-card], [data-comment-overlay], [data-comment-popover], button, a, input, textarea')
    if (e.button === 1 || (e.button === 0 && !isInteractive)) {
      isPanning.current = true
      lastPosition.current = {x: e.clientX, y: e.clientY}
      if (nodeRef.current) {
        nodeRef.current.style.cursor = 'grabbing'
      }
      e.preventDefault()
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastPosition.current.x
    const dy = e.clientY - lastPosition.current.y
    lastPosition.current = {x: e.clientX, y: e.clientY}

    setTransform((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }))
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    if (nodeRef.current) {
      nodeRef.current.style.cursor = 'grab'
    }
  }, [])

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale + ZOOM_STEP),
    }))
  }, [])

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale - ZOOM_STEP),
    }))
  }, [])

  const resetTransform = useCallback(() => {
    setTransform({x: 0, y: 0, scale: 1})
  }, [])

  const handlers = useMemo(
    () => ({
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    }),
    [handleMouseDown, handleMouseMove, handleMouseUp],
  )

  return {
    transform,
    containerRef,
    handlers,
    zoomIn,
    zoomOut,
    resetTransform,
  }
}
