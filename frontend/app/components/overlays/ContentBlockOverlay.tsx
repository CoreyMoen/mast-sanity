'use client'

import {useState, useEffect, useRef, type ReactNode} from 'react'
import {useIsPresentationTool} from 'next-sanity/hooks'

// Map schema types to friendly display names
const typeLabels: Record<string, string> = {
  headingBlock: 'Heading',
  richTextBlock: 'Rich Text',
  imageBlock: 'Image',
  buttonBlock: 'Button',
  spacerBlock: 'Spacer',
}

// Map types to icons
const typeIcons: Record<string, string> = {
  Heading: 'H',
  'Rich Text': '\u00B6',
  Image: '\uD83D\uDDBC',
  Button: '\u2B1A',
  Spacer: '\u2195',
}

interface ContentBlockOverlayProps {
  blockType: string
  children: ReactNode
}

export default function ContentBlockOverlay({blockType, children}: ContentBlockOverlayProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isPresentationTool = useIsPresentationTool()

  const label = typeLabels[blockType] || blockType
  const icon = typeIcons[label] || '\u25C7'

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

  const showLabel = isHovered || isSelected

  return (
    <div
      ref={containerRef}
      style={{position: 'relative'}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showLabel && (
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
          <span style={{fontSize: '11px', opacity: 0.9}}>{icon}</span>
          <span>{label}</span>
        </div>
      )}
      {children}
    </div>
  )
}
