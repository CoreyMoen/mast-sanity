/**
 * useKeyboardShortcuts Hook
 *
 * Provides global keyboard shortcut handling for the Claude Assistant plugin.
 * Follows WCAG 2.1 AA guidelines for keyboard accessibility.
 */

import {useEffect, useCallback, useRef} from 'react'

export interface KeyboardShortcut {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  handler: () => void
  description: string
  /** Whether the shortcut should work when focus is in an input/textarea */
  allowInInput?: boolean
}

export interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean
  /** Shortcuts to register */
  shortcuts: KeyboardShortcut[]
}

/**
 * Check if the active element is an input or textarea
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false
  const tagName = element.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    element.getAttribute('contenteditable') === 'true'
  )
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts({enabled = true, shortcuts}: UseKeyboardShortcutsOptions): void {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const activeElement = document.activeElement
      const inInput = isInputElement(activeElement)

      for (const shortcut of shortcutsRef.current) {
        // Skip shortcuts that shouldn't work in inputs
        if (inInput && !shortcut.allowInInput) continue

        // Check for modifier keys
        const metaOrCtrl = event.metaKey || event.ctrlKey
        const requiresMetaOrCtrl = shortcut.metaKey || shortcut.ctrlKey

        // Match the shortcut
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const metaCtrlMatch = requiresMetaOrCtrl ? metaOrCtrl : !metaOrCtrl
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey

        if (keyMatch && metaCtrlMatch && shiftMatch && altMatch) {
          event.preventDefault()
          event.stopPropagation()
          shortcut.handler()
          return
        }
      }
    },
    [enabled]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [enabled, handleKeyDown])
}

/**
 * Hook for focus management in accessible components
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isActive: boolean): void {
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // Return focus to previous element when trap is deactivated
      if (!isActive && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus()
        previousActiveElementRef.current = null
      }
      return
    }

    // Store the previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement

    const container = containerRef.current

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const selector =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      return Array.from(container.querySelectorAll<HTMLElement>(selector))
    }

    // Focus the first focusable element or the container itself
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    } else {
      container.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab: Move focus backwards
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: Move focus forwards
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, containerRef])
}

/**
 * Hook for roving tabindex pattern in list navigation
 */
export function useRovingTabindex<T extends HTMLElement>(
  items: Array<{id: string; ref: React.RefObject<T>}>,
  activeId: string | null,
  onSelect: (id: string) => void,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): {
  getTabIndex: (id: string) => number
  handleKeyDown: (event: React.KeyboardEvent, id: string) => void
} {
  const getTabIndex = useCallback(
    (id: string): number => {
      // First item gets tabindex 0 if none is active
      if (activeId === null) {
        return items[0]?.id === id ? 0 : -1
      }
      return id === activeId ? 0 : -1
    },
    [activeId, items]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentId: string) => {
      const currentIndex = items.findIndex((item) => item.id === currentId)
      if (currentIndex === -1) return

      let nextIndex: number | null = null

      const isVertical = orientation === 'vertical'
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'

      switch (event.key) {
        case prevKey:
          event.preventDefault()
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
          break
        case nextKey:
          event.preventDefault()
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
          break
        case 'Home':
          event.preventDefault()
          nextIndex = 0
          break
        case 'End':
          event.preventDefault()
          nextIndex = items.length - 1
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          onSelect(currentId)
          return
      }

      if (nextIndex !== null) {
        const nextItem = items[nextIndex]
        if (nextItem?.ref.current) {
          nextItem.ref.current.focus()
          onSelect(nextItem.id)
        }
      }
    },
    [items, onSelect, orientation]
  )

  return {getTabIndex, handleKeyDown}
}

/**
 * Announce message to screen readers via live region
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement is made
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}
