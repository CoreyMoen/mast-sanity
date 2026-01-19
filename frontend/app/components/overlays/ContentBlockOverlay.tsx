'use client'

import {useState, useEffect, useRef, useId, type ReactNode} from 'react'
import {useIsPresentationTool} from 'next-sanity/hooks'
import {useOverlayHover} from './OverlayHoverContext'
import {SANITY_SELECTORS, getBlockLabel, getBlockIcon} from './constants'

interface ContentBlockOverlayProps {
  blockType: string
  children: ReactNode
}

export default function ContentBlockOverlay({blockType, children}: ContentBlockOverlayProps) {
  const overlayId = useId()
  const [isSelected, setIsSelected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isPresentationTool = useIsPresentationTool()
  const {activeOverlayId, setActiveOverlay} = useOverlayHover()

  const label = getBlockLabel(blockType)
  const icon = getBlockIcon(label)

  // Watch for Sanity's selection state on the parent data-sanity element
  useEffect(() => {
    if (!containerRef.current) return

    // Find the parent element with data-sanity attribute
    const sanityParent = containerRef.current.closest(SANITY_SELECTORS.SANITY_ATTRIBUTE)
    if (!sanityParent) return

    // Create a mutation observer to watch for Sanity's overlay selection
    const observer = new MutationObserver(() => {
      // Check if this element has an active overlay (Sanity adds overlay elements)
      const hasActiveOverlay = sanityParent.querySelector(SANITY_SELECTORS.OVERLAY_ELEMENT) !== null
      const parentHasOverlay = sanityParent.closest(SANITY_SELECTORS.OVERLAY_ELEMENT) !== null
      setIsSelected(hasActiveOverlay || parentHasOverlay)
    })

    observer.observe(sanityParent, {
      attributes: true,
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  // Only show overlay in presentation tool (visual editing mode)
  if (!isPresentationTool) {
    return <>{children}</>
  }

  const isHovered = activeOverlayId === overlayId
  const showLabel = isHovered || isSelected

  // Handle mouse events - set this overlay as active
  const handleMouseOver = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveOverlay(overlayId)
  }

  const handleMouseOut = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Only clear if we're actually leaving this container entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      // Only clear if we're still the active overlay
      if (activeOverlayId === overlayId) {
        setActiveOverlay(null)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      style={{position: 'relative'}}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {showLabel && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 3px)',
            left: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: '#5571FB',
            color: 'white',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          <span style={{fontSize: '11px', opacity: 0.9}}>{icon}</span>
          <span>{label}</span>
        </div>
      )}
      {children}
    </div>
  )
}
