'use client'

import * as React from 'react'
import {X} from '@phosphor-icons/react'
import {useModal} from '@/app/hooks'
import '@/app/components/modal.css'

// Size class mappings
const sizeClasses = {
  sm: 'cc-sm',
  md: '',           // Default
  lg: 'cc-lg',
  xl: 'cc-xl',
  full: 'cc-full',
}

// Modal context for sharing state between components
interface ModalContextValue {
  open: () => void
  close: () => void
  isOpen: boolean
  dialogRef: React.RefObject<HTMLDialogElement | null>
  handleBackdropClick: (e: React.MouseEvent) => void
}

const ModalContext = React.createContext<ModalContextValue | null>(null)

function useModalContext() {
  const context = React.useContext(ModalContext)
  if (!context) {
    throw new Error('Modal components must be used within a Modal')
  }
  return context
}

// Modal root
interface ModalProps {
  children: React.ReactNode
  /** Unique ID for localStorage cooldown tracking */
  id?: string
  /** Whether to auto-open on mount */
  autoOpen?: boolean
  /** Number of days to wait before auto-opening again (0 = no cooldown) */
  cooldownDays?: number
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Controlled open state */
  open?: boolean
  /** Default open state for uncontrolled usage */
  defaultOpen?: boolean
}

function Modal({
  children,
  id,
  autoOpen = false,
  cooldownDays = 0,
  onOpenChange,
  open: controlledOpen,
  defaultOpen = false,
}: ModalProps) {
  const modal = useModal({
    id,
    autoOpen: autoOpen || defaultOpen,
    cooldownDays,
    onOpenChange,
  })

  // Handle controlled open state
  React.useEffect(() => {
    if (controlledOpen !== undefined) {
      if (controlledOpen && !modal.isOpen) {
        modal.open()
      } else if (!controlledOpen && modal.isOpen) {
        modal.close()
      }
    }
  }, [controlledOpen, modal])

  return (
    <ModalContext.Provider value={modal}>
      {children}
    </ModalContext.Provider>
  )
}
Modal.displayName = 'Modal'

// Modal trigger - regular component that calls hook's open()
interface ModalTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const ModalTrigger = React.forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({children, asChild, onClick, ...props}, ref) => {
    const {open} = useModalContext()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      open()
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          (children as React.ReactElement<any>).props?.onClick?.(e)
          open()
        },
      })
    }

    return (
      <button ref={ref} type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)
ModalTrigger.displayName = 'ModalTrigger'

// Modal close - button that closes the modal
interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const ModalClose = React.forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({children, asChild, onClick, ...props}, ref) => {
    const {close} = useModalContext()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      close()
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          (children as React.ReactElement<any>).props?.onClick?.(e)
          close()
        },
      })
    }

    return (
      <button ref={ref} type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)
ModalClose.displayName = 'ModalClose'

// Modal content
interface ModalContentProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

const ModalContent = React.forwardRef<HTMLDialogElement, ModalContentProps>(
  ({className, children, size = 'md', showCloseButton = true, ...props}, ref) => {
    const {dialogRef, close, handleBackdropClick} = useModalContext()

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLDialogElement | null) => {
        // Update internal ref
        (dialogRef as React.MutableRefObject<HTMLDialogElement | null>).current = node
        // Update forwarded ref
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [dialogRef, ref]
    )

    const sizeClass = sizeClasses[size]
    const dialogClassName = ['modal', sizeClass, className].filter(Boolean).join(' ')

    return (
      <dialog
        ref={mergedRef}
        className={dialogClassName}
        onClick={handleBackdropClick}
        {...props}
      >
        <div className="modal_content">
          {children}
          {showCloseButton && (
            <button
              type="button"
              className="modal_close-button"
              onClick={close}
              aria-label="Close"
            >
              <X className="modal_close-button_icon" weight="bold" />
            </button>
          )}
        </div>
      </dialog>
    )
  }
)
ModalContent.displayName = 'ModalContent'

// Modal header
const ModalHeader = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['modal_header', className].filter(Boolean).join(' ')} {...props} />
)
ModalHeader.displayName = 'ModalHeader'

// Modal title
const ModalTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({className, ...props}, ref) => (
    <h2
      ref={ref}
      className={['modal_title', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
)
ModalTitle.displayName = 'ModalTitle'

// Modal description
const ModalDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({className, ...props}, ref) => (
    <p
      ref={ref}
      className={['modal_description', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
)
ModalDescription.displayName = 'ModalDescription'

// Modal body
const ModalBody = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['modal_body', className].filter(Boolean).join(' ')} {...props} />
)
ModalBody.displayName = 'ModalBody'

// Modal footer
const ModalFooter = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={['modal_footer', className].filter(Boolean).join(' ')} {...props} />
)
ModalFooter.displayName = 'ModalFooter'

// YouTube Video Modal - specialized for video lightbox
interface VideoModalContentProps extends Omit<ModalContentProps, 'children'> {
  videoId: string
  title?: string
}

const VideoModalContent = React.forwardRef<HTMLDialogElement, VideoModalContentProps>(
  ({videoId, title, size = 'xl', className, ...props}, ref) => {
    const {dialogRef, close, handleBackdropClick} = useModalContext()

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLDialogElement | null) => {
        // Update internal ref
        (dialogRef as React.MutableRefObject<HTMLDialogElement | null>).current = node
        // Update forwarded ref
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [dialogRef, ref]
    )

    const sizeClass = sizeClasses[size]
    const dialogClassName = ['modal', 'cc-video', sizeClass, className].filter(Boolean).join(' ')

    return (
      <dialog
        ref={mergedRef}
        className={dialogClassName}
        onClick={handleBackdropClick}
        {...props}
      >
        <div className="modal_video-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title || 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button
          type="button"
          className="modal_close-button cc-video"
          onClick={close}
          aria-label="Close"
        >
          <X className="modal_close-button_icon" weight="bold" />
        </button>
      </dialog>
    )
  }
)
VideoModalContent.displayName = 'VideoModalContent'

// Legacy exports for backwards compatibility (no-op, since native dialog doesn't need portal/overlay)
const ModalPortal = ({children}: {children: React.ReactNode}) => <>{children}</>
ModalPortal.displayName = 'ModalPortal'

const ModalOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => null // Native dialog handles its own backdrop
)
ModalOverlay.displayName = 'ModalOverlay'

export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalClose,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  VideoModalContent,
}
