import {useState, useCallback, useRef, useEffect} from 'react'
import type {PinboardTransform} from '../types'

const MIN_SCALE = 0.2
const MAX_SCALE = 3
const ZOOM_STEP = 0.1

export function usePinboardTransform() {
  const [transform, setTransform] = useState<PinboardTransform>({x: 0, y: 0, scale: 1})
  const containerRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastPosition = useRef({x: 0, y: 0})

  // Wheel zoom — uses native event listener with passive: false so we can preventDefault
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP

      setTransform((prev) => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta))
        // Zoom toward cursor position
        const rect = el.getBoundingClientRect()
        const cursorX = e.clientX - rect.left
        const cursorY = e.clientY - rect.top
        const scaleRatio = newScale / prev.scale

        return {
          x: cursorX - scaleRatio * (cursorX - prev.x),
          y: cursorY - scaleRatio * (cursorY - prev.y),
          scale: newScale,
        }
      })
    }

    el.addEventListener('wheel', handleWheel, {passive: false})
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start panning if clicking on a card or interactive element
    const isInteractive = (e.target as HTMLElement).closest('[data-page-card], button, a, input')
    if (e.button === 1 || (e.button === 0 && !isInteractive)) {
      isPanning.current = true
      lastPosition.current = {x: e.clientX, y: e.clientY}
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing'
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
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
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

  return {
    transform,
    containerRef,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
    zoomIn,
    zoomOut,
    resetTransform,
  }
}
