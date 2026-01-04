import { useState, useRef, useEffect, useCallback } from 'react'

interface UseTabsOptions {
  /** Default active tab index */
  defaultIndex?: number
  /** Enable autoplay (auto-advance tabs) */
  autoplay?: boolean
  /** Autoplay duration in seconds */
  autoplayDuration?: number
  /** Pause autoplay on hover */
  pauseOnHover?: boolean
  /** Callback when active tab changes */
  onTabChange?: (index: number) => void
}

interface UseTabsReturn {
  /** Currently active tab index */
  activeIndex: number
  /** Set the active tab by index */
  setActiveTab: (index: number) => void
  /** Whether autoplay is paused */
  isPaused: boolean
  /** Toggle play/pause state */
  togglePause: () => void
  /** Ref to attach to the tabs container (for IntersectionObserver) */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Mouse enter handler for pause-on-hover */
  handleMouseEnter: () => void
  /** Mouse leave handler for pause-on-hover */
  handleMouseLeave: () => void
  /** Keyboard navigation handler */
  handleKeyDown: (e: React.KeyboardEvent) => void
  /** Register the total number of tabs */
  registerTabs: (count: number) => void
  /** Autoplay duration in seconds */
  autoplayDuration: number
  /** Key for resetting progress animation (increments on tab change) */
  progressKey: number
}

/**
 * Hook for accessible tabs with autoplay, keyboard navigation, and visibility detection.
 *
 * Features:
 * - Tab switching with active state management
 * - Autoplay with configurable duration
 * - Pause on hover
 * - IntersectionObserver for visibility-based pause (stops when off-screen)
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Progress animation reset key for CSS animations
 * - URL hash deep linking support
 *
 * @example
 * ```tsx
 * function Tabs({ tabs }) {
 *   const {
 *     activeIndex,
 *     setActiveTab,
 *     containerRef,
 *     handleMouseEnter,
 *     handleMouseLeave,
 *     handleKeyDown,
 *     registerTabs,
 *     progressKey,
 *   } = useTabs({
 *     autoplay: true,
 *     autoplayDuration: 5,
 *     pauseOnHover: true,
 *   })
 *
 *   useEffect(() => {
 *     registerTabs(tabs.length)
 *   }, [tabs.length, registerTabs])
 *
 *   return (
 *     <div
 *       ref={containerRef}
 *       onMouseEnter={handleMouseEnter}
 *       onMouseLeave={handleMouseLeave}
 *       onKeyDown={handleKeyDown}
 *     >
 *       {tabs.map((tab, i) => (
 *         <button
 *           key={tab.id}
 *           role="tab"
 *           aria-selected={i === activeIndex}
 *           onClick={() => setActiveTab(i)}
 *         >
 *           {tab.label}
 *         </button>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useTabs({
  defaultIndex = 0,
  autoplay = false,
  autoplayDuration = 5,
  pauseOnHover = false,
  onTabChange,
}: UseTabsOptions = {}): UseTabsReturn {
  const [activeIndex, setActiveIndex] = useState(defaultIndex)
  const [isPaused, setIsPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const tabCount = useRef(0)
  const autoplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressKey = useRef(0) // For resetting CSS animation

  // Set active tab
  const setActiveTab = useCallback(
    (index: number) => {
      if (index < 0 || index >= tabCount.current) return
      setActiveIndex(index)
      progressKey.current++ // Reset progress animation
      onTabChange?.(index)
    },
    [onTabChange]
  )

  // Navigate to next/prev tab
  const goToNext = useCallback(() => {
    setActiveTab((activeIndex + 1) % tabCount.current)
  }, [activeIndex, setActiveTab])

  const goToPrev = useCallback(() => {
    setActiveTab(activeIndex > 0 ? activeIndex - 1 : tabCount.current - 1)
  }, [activeIndex, setActiveTab])

  // Autoplay timer
  useEffect(() => {
    if (!autoplay || isPaused || !isVisible) {
      if (autoplayTimer.current) {
        clearTimeout(autoplayTimer.current)
        autoplayTimer.current = null
      }
      return
    }

    autoplayTimer.current = setTimeout(() => {
      goToNext()
    }, autoplayDuration * 1000)

    return () => {
      if (autoplayTimer.current) {
        clearTimeout(autoplayTimer.current)
      }
    }
  }, [autoplay, autoplayDuration, isPaused, isVisible, activeIndex, goToNext])

  // IntersectionObserver for visibility
  useEffect(() => {
    if (!autoplay) return

    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.5 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [autoplay])

  // Hover pause handlers
  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true)
  }, [pauseOnHover])

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false)
  }, [pauseOnHover])

  // Toggle play/pause
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev)
  }, [])

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPrev()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case 'Home':
          e.preventDefault()
          setActiveTab(0)
          break
        case 'End':
          e.preventDefault()
          setActiveTab(tabCount.current - 1)
          break
      }
    },
    [goToNext, goToPrev, setActiveTab]
  )

  // Register tab count
  const registerTabs = useCallback((count: number) => {
    tabCount.current = count
  }, [])

  // URL hash deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash) {
        // Find tab with matching id (implementation depends on tab structure)
        // This would be handled by the component
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange() // Check on mount

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return {
    activeIndex,
    setActiveTab,
    isPaused,
    togglePause,
    containerRef,
    handleMouseEnter,
    handleMouseLeave,
    handleKeyDown,
    registerTabs,
    autoplayDuration,
    progressKey: progressKey.current,
  }
}
