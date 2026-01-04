import { useRef, useEffect, useCallback, useState } from 'react'

interface UseModalOptions {
  /** Unique ID for localStorage cooldown tracking */
  id?: string
  /** Whether to auto-open on mount */
  autoOpen?: boolean
  /** Number of days to wait before auto-opening again (0 = no cooldown) */
  cooldownDays?: number
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
}

interface UseModalReturn {
  /** Ref to attach to the <dialog> element */
  dialogRef: React.RefObject<HTMLDialogElement | null>
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Open the modal */
  open: () => void
  /** Close the modal */
  close: () => void
  /** Click handler for backdrop clicks (attach to dialog onClick) */
  handleBackdropClick: (e: React.MouseEvent) => void
}

/**
 * Hook for native <dialog> modal with open/close functionality.
 *
 * Features:
 * - Uses native dialog.showModal() and dialog.close() methods
 * - Click-outside-to-close (backdrop click)
 * - ESC key handling (native dialog behavior with state sync)
 * - Auto-open with optional cooldown period (localStorage)
 *
 * @example
 * ```tsx
 * function Modal({ id, children }) {
 *   const { dialogRef, open, close, handleBackdropClick } = useModal({
 *     id,
 *     autoOpen: false,
 *     cooldownDays: 7,
 *   })
 *
 *   return (
 *     <>
 *       <button onClick={open}>Open</button>
 *       <dialog ref={dialogRef} onClick={handleBackdropClick}>
 *         {children}
 *         <button onClick={close}>Close</button>
 *       </dialog>
 *     </>
 *   )
 * }
 * ```
 */
export function useModal({
  id,
  autoOpen = false,
  cooldownDays = 0,
  onOpenChange,
}: UseModalOptions = {}): UseModalReturn {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Check cooldown from localStorage
  const isInCooldown = useCallback(() => {
    if (!id || cooldownDays <= 0) return false

    try {
      const storageKey = `modal-cooldown-${id}`
      const cooldownUntil = localStorage.getItem(storageKey)

      if (!cooldownUntil) return false

      const now = Date.now()
      const cooldownTime = parseInt(cooldownUntil, 10)

      if (now > cooldownTime) {
        localStorage.removeItem(storageKey)
        return false
      }

      return true
    } catch {
      return false
    }
  }, [id, cooldownDays])

  // Store cooldown timestamp
  const storeCooldown = useCallback(() => {
    if (!id || cooldownDays <= 0) return

    try {
      const storageKey = `modal-cooldown-${id}`
      const cooldownDuration = cooldownDays * 24 * 60 * 60 * 1000
      const cooldownUntil = Date.now() + cooldownDuration
      localStorage.setItem(storageKey, cooldownUntil.toString())
    } catch {
      // Ignore localStorage errors
    }
  }, [id, cooldownDays])

  // Open modal
  const open = useCallback(() => {
    dialogRef.current?.showModal()
    setIsOpen(true)
    onOpenChange?.(true)
  }, [onOpenChange])

  // Close modal
  const close = useCallback(() => {
    dialogRef.current?.close()
    setIsOpen(false)
    storeCooldown()
    onOpenChange?.(false)
  }, [onOpenChange, storeCooldown])

  // Handle click outside
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === dialogRef.current) {
        close()
      }
    },
    [close]
  )

  // Auto-open on mount (if enabled and not in cooldown)
  useEffect(() => {
    if (autoOpen && !isInCooldown()) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        open()
      })
    }
  }, [autoOpen, isInCooldown, open])

  // Handle ESC key (native dialog behavior, but we need to track state)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      setIsOpen(false)
      storeCooldown()
      onOpenChange?.(false)
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onOpenChange, storeCooldown])

  return { dialogRef, isOpen, open, close, handleBackdropClick }
}
