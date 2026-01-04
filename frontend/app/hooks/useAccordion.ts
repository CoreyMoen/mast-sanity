import { useRef, useEffect, useCallback } from 'react'

interface UseAccordionOptions {
  /** Whether the accordion should start open */
  defaultOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
}

interface UseAccordionReturn {
  /** Ref to attach to the <details> element */
  detailsRef: React.RefObject<HTMLDetailsElement | null>
  /** Ref to attach to the content wrapper div */
  contentRef: React.RefObject<HTMLDivElement | null>
  /** Click handler for the <summary> element */
  handleClick: (e: React.MouseEvent) => void
}

/**
 * Hook for native <details>/<summary> accordion with animated height transitions.
 *
 * Features:
 * - Smooth height animation on open/close
 * - Respects `prefers-reduced-motion` accessibility setting
 * - Optional default open state
 * - Callback for open state changes
 *
 * @example
 * ```tsx
 * function Accordion({ title, children, defaultOpen = false }) {
 *   const { detailsRef, contentRef, handleClick } = useAccordion({ defaultOpen })
 *
 *   return (
 *     <details ref={detailsRef} open={defaultOpen}>
 *       <summary onClick={handleClick}>{title}</summary>
 *       <div ref={contentRef}>
 *         <div className="content-spacer">{children}</div>
 *       </div>
 *     </details>
 *   )
 * }
 * ```
 */
export function useAccordion({
  defaultOpen = false,
  onOpenChange,
}: UseAccordionOptions = {}): UseAccordionReturn {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useRef(false)

  // Check reduced motion preference
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = query.matches

    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches
    }
    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [])

  // Handle animated close
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const details = detailsRef.current
      const content = contentRef.current
      if (!details || !content) return

      if (details.open) {
        e.preventDefault() // Prevent native close

        if (prefersReducedMotion.current) {
          details.open = false
          onOpenChange?.(false)
        } else {
          // Animate close
          content.style.height = `${content.scrollHeight}px`
          content.offsetHeight // Force reflow
          content.style.transition = 'height 0.4s ease-in-out'
          content.style.height = '0px'

          setTimeout(() => {
            details.open = false
            content.style.transition = ''
            onOpenChange?.(false)
          }, 400)
        }
      }
    },
    [onOpenChange]
  )

  // Handle animated open (via toggle event)
  useEffect(() => {
    const details = detailsRef.current
    const content = contentRef.current
    if (!details || !content) return

    const handleToggle = () => {
      if (details.open) {
        onOpenChange?.(true)

        if (prefersReducedMotion.current) {
          content.style.height = 'auto'
        } else {
          const fullHeight = content.scrollHeight
          content.style.transition = 'height 0.4s ease-out'
          content.style.height = `${fullHeight}px`

          setTimeout(() => {
            content.style.height = 'auto'
            content.style.transition = ''
          }, 400)
        }
      }
    }

    details.addEventListener('toggle', handleToggle)
    return () => details.removeEventListener('toggle', handleToggle)
  }, [onOpenChange])

  // Set initial collapsed state
  useEffect(() => {
    const content = contentRef.current
    if (content && !defaultOpen) {
      content.style.height = '0px'
      content.style.overflow = 'clip'
    }
  }, [defaultOpen])

  return { detailsRef, contentRef, handleClick }
}
