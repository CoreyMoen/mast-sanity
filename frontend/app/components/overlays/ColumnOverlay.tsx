'use client'

import {useState, useEffect, useRef, useId, type ReactNode} from 'react'
import {useIsPresentationTool} from 'next-sanity/hooks'
import {useOverlayHover} from './OverlayHoverContext'

// Map gap values to pixel widths (half of gap on each side)
const gapToPixels: Record<string, number> = {
  '0': 0,
  '2': 4,   // px-1 = 0.25rem = 4px
  '4': 8,   // px-2 = 0.5rem = 8px
  '6': 12,  // px-3 = 0.75rem = 12px
  '8': 16,  // px-4 = 1rem = 16px
  '12': 24, // px-6 = 1.5rem = 24px
}

// SVG pattern with blue color (#4f46e5) - diagonal stripes pattern
const SVG_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='3' viewBox='0 0 3 3' fill='none'%3E%3Cg clip-path='url(%23clip0_481_2070)'%3E%3Cpath d='M2.99997 0.970703L0.969971 3.0007H2.02997L2.99997 2.0307V0.970703Z' fill='%234f46e5'/%3E%3Cpath d='M0.97 0L0 0.97V2.03L2.03 0H0.97Z' fill='%234f46e5'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_481_2070'%3E%3Crect width='3' height='3' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E")`

interface ColumnOverlayProps {
  gap?: string
  children: ReactNode
}

export default function ColumnOverlay({gap = '6', children}: ColumnOverlayProps) {
  const overlayId = useId()
  const [isSelected, setIsSelected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isPresentationTool = useIsPresentationTool()
  const {activeOverlayId, setActiveOverlay} = useOverlayHover()

  const gutterWidth = gapToPixels[gap] || gapToPixels['6']

  // Watch for Sanity's selection state on the parent data-sanity element
  useEffect(() => {
    if (!containerRef.current) return

    // Find the parent element with data-sanity attribute
    const sanityParent = containerRef.current.closest('[data-sanity]')
    if (!sanityParent) return

    // Create a mutation observer to watch for Sanity's overlay selection
    const observer = new MutationObserver(() => {
      // Check if this element has an active overlay (Sanity adds overlay elements)
      const hasActiveOverlay = sanityParent.querySelector('[data-sanity-overlay-element]') !== null
      const parentHasOverlay = sanityParent.closest('[data-sanity-overlay-element]') !== null
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
  const showOverlay = isHovered || isSelected

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

  // Expand the container to include gutter area using negative margins
  // and compensate with padding to keep content in place
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    height: '100%',
    // Expand to fill gutter area
    marginLeft: gutterWidth > 0 ? `-${gutterWidth}px` : undefined,
    marginRight: gutterWidth > 0 ? `-${gutterWidth}px` : undefined,
    // Compensate to keep content in original position
    paddingLeft: gutterWidth > 0 ? `${gutterWidth}px` : undefined,
    paddingRight: gutterWidth > 0 ? `${gutterWidth}px` : undefined,
  }

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {/* Label - positioned at column's outer left edge */}
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: '#4f46e5',
            color: 'white',
            borderRadius: '4px 4px 0 0',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          <span style={{fontSize: '11px', opacity: 0.9}}>{'\u25AF'}</span>
          <span>Column</span>
        </div>
      )}

      {/* Left gutter indicator - at column's outer left edge */}
      {showOverlay && gutterWidth > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${gutterWidth}px`,
            backgroundImage: SVG_PATTERN,
            backgroundRepeat: 'repeat',
            backgroundSize: '4px',
            opacity: 0.7,
            pointerEvents: 'none',
            zIndex: 9998,
          }}
        />
      )}

      {/* Right gutter indicator - at column's outer right edge */}
      {showOverlay && gutterWidth > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: `${gutterWidth}px`,
            backgroundImage: SVG_PATTERN,
            backgroundRepeat: 'repeat',
            backgroundSize: '4px',
            opacity: 0.7,
            pointerEvents: 'none',
            zIndex: 9998,
          }}
        />
      )}

      {children}
    </div>
  )
}
