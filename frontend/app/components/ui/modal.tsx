'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {X} from '@phosphor-icons/react/dist/ssr'
import {cn} from '@/lib/utils'

// Modal root
const Modal = DialogPrimitive.Root

// Modal trigger
const ModalTrigger = DialogPrimitive.Trigger

// Modal portal
const ModalPortal = DialogPrimitive.Portal

// Modal close
const ModalClose = DialogPrimitive.Close

// Modal overlay
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({className, ...props}, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
ModalOverlay.displayName = 'ModalOverlay'

// Modal content
interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
}

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({className, children, size = 'md', showCloseButton = true, ...props}, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'w-[90%] rounded-lg border border-border bg-background p-6 shadow-xl',
        'max-h-[85vh] overflow-y-auto',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'duration-200',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4 rounded-full p-2',
            'text-muted-foreground transition-colors hover:bg-muted-background hover:text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2'
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5" weight="bold" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </ModalPortal>
))
ModalContent.displayName = 'ModalContent'

// Modal header
const ModalHeader = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 pr-8', className)} {...props} />
)
ModalHeader.displayName = 'ModalHeader'

// Modal title
const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({className, ...props}, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-h4 font-medium', className)}
    {...props}
  />
))
ModalTitle.displayName = 'ModalTitle'

// Modal description
const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({className, ...props}, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-body text-muted-foreground', className)}
    {...props}
  />
))
ModalDescription.displayName = 'ModalDescription'

// Modal body
const ModalBody = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('', className)} {...props} />
)
ModalBody.displayName = 'ModalBody'

// Modal footer
const ModalFooter = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-6 flex justify-end gap-3', className)} {...props} />
)
ModalFooter.displayName = 'ModalFooter'

// YouTube Video Modal - specialized for video lightbox
interface VideoModalContentProps extends Omit<ModalContentProps, 'children'> {
  videoId: string
  title?: string
}

const VideoModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  VideoModalContentProps
>(({videoId, title, size = 'xl', ...props}, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'w-[90%] rounded-lg bg-black overflow-hidden shadow-2xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'duration-200',
        sizeClasses[size]
      )}
      {...props}
    >
      <div className="relative aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <DialogPrimitive.Close
        className={cn(
          'absolute -right-3 -top-3 rounded-full bg-white p-2 shadow-lg',
          'text-muted-foreground transition-colors hover:bg-muted-background hover:text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2'
        )}
        aria-label="Close"
      >
        <X className="h-5 w-5" weight="bold" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </ModalPortal>
))
VideoModalContent.displayName = 'VideoModalContent'

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
