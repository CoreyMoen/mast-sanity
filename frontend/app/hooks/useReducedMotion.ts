import { useState, useEffect } from 'react'

/**
 * Hook that returns whether the user prefers reduced motion.
 * Listens to the `prefers-reduced-motion` media query and updates reactively.
 *
 * @returns {boolean} True if the user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(query.matches)

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}
