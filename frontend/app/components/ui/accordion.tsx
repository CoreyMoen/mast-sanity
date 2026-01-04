'use client'

import * as React from 'react'
import {cn} from '@/lib/utils'
import {useAccordion} from '@/app/hooks'
import '@/app/components/accordion.css'

/**
 * Accordion component - Mast design system accordion
 *
 * Built with native HTML details/summary elements for maximum
 * accessibility and modern browser support. Features the Mast
 * plus icon that rotates 45 degrees to become an X when open.
 *
 * @example
 * <Accordion>
 *   <AccordionItem>
 *     <AccordionTrigger>Question 1</AccordionTrigger>
 *     <AccordionContent>Answer 1</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 *
 * @example - Start with item open
 * <Accordion>
 *   <AccordionItem defaultOpen>
 *     <AccordionTrigger>This starts open</AccordionTrigger>
 *     <AccordionContent>Content visible by default</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 */

// Plus icon SVG that rotates to X when open (matching Mast framework)
function PlusIcon({className}: {className?: string}) {
  return (
    <div className={cn('accordion-icon', className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

// Title size class mappings
const titleClasses = {
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
}

interface AccordionProps {
  children: React.ReactNode
  className?: string
  /** When true, only one item can be open at a time (uses same 'name' attribute) */
  allowMultiple?: boolean
  /** Unique name for exclusive accordion behavior */
  name?: string
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({children, className, allowMultiple = true, name}, ref) => {
    // Generate a unique name for exclusive accordion if needed
    const accordionName = React.useMemo(
      () => (allowMultiple ? undefined : name || `accordion-${Math.random().toString(36).slice(2, 9)}`),
      [allowMultiple, name]
    )

    return (
      <div ref={ref} className={className} role="list">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<AccordionItemProps>, {
              name: accordionName,
            })
          }
          return child
        })}
      </div>
    )
  }
)
Accordion.displayName = 'Accordion'

interface AccordionItemProps {
  children: React.ReactNode
  className?: string
  /** Whether this item should be open by default */
  defaultOpen?: boolean
  /** Name attribute for exclusive accordion behavior (injected by Accordion parent) */
  name?: string
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
}

const AccordionItem = React.forwardRef<HTMLDetailsElement, AccordionItemProps>(
  ({children, className, defaultOpen = false, name, onOpenChange}, ref) => {
    const {detailsRef, contentRef, handleClick} = useAccordion({
      defaultOpen,
      onOpenChange,
    })

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLDetailsElement | null) => {
        (detailsRef as React.MutableRefObject<HTMLDetailsElement | null>).current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [detailsRef, ref]
    )

    return (
      <details
        ref={mergedRef}
        className={cn('accordion-component', className)}
        open={defaultOpen}
        name={name}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // Pass hook refs and handlers to trigger and content
            if (child.type === AccordionTrigger) {
              return React.cloneElement(child as React.ReactElement<AccordionTriggerInternalProps>, {
                onClick: handleClick,
              })
            }
            if (child.type === AccordionContent) {
              return React.cloneElement(child as React.ReactElement<AccordionContentInternalProps>, {
                contentRef,
              })
            }
          }
          return child
        })}
      </details>
    )
  }
)
AccordionItem.displayName = 'AccordionItem'

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
  /** Heading style for the trigger text */
  as?: 'h3' | 'h4' | 'h5' | 'span'
}

interface AccordionTriggerInternalProps extends AccordionTriggerProps {
  onClick?: (e: React.MouseEvent) => void
}

const AccordionTrigger = React.forwardRef<HTMLElement, AccordionTriggerInternalProps>(
  ({children, className, as: Component = 'span', onClick}, ref) => {
    const titleClass = Component !== 'span' ? titleClasses[Component] : titleClasses.h4

    return (
      <summary
        ref={ref as React.Ref<HTMLElement>}
        className={cn('accordion-trigger', className)}
        onClick={onClick}
      >
        <Component className={cn('accordion-title', titleClass)}>
          {children}
        </Component>
        <PlusIcon />
      </summary>
    )
  }
)
AccordionTrigger.displayName = 'AccordionTrigger'

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

interface AccordionContentInternalProps extends AccordionContentProps {
  contentRef?: React.RefObject<HTMLDivElement | null>
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentInternalProps>(
  ({children, className, contentRef}, ref) => {
    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        if (contentRef) {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [contentRef, ref]
    )

    return (
      <div ref={mergedRef} className={cn('accordion-content', className)}>
        <div className="accordion-content_spacer">{children}</div>
      </div>
    )
  }
)
AccordionContent.displayName = 'AccordionContent'

export {Accordion, AccordionItem, AccordionTrigger, AccordionContent}
