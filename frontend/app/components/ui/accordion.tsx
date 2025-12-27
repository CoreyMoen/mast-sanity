'use client'

import * as React from 'react'
import {cn} from '@/lib/utils'

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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 32 32"
      fill="none"
      className={cn('accordion-icon shrink-0 transition-transform duration-300', className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z"
        fill="currentColor"
      />
    </svg>
  )
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
      <div ref={ref} className={cn('divide-y divide-border', className)} role="list">
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
}

const AccordionItem = React.forwardRef<HTMLDetailsElement, AccordionItemProps>(
  ({children, className, defaultOpen = false, name}, ref) => {
    return (
      <details
        ref={ref}
        className={cn('accordion-component group', className)}
        open={defaultOpen}
        name={name}
      >
        {children}
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

const AccordionTrigger = React.forwardRef<HTMLElement, AccordionTriggerProps>(
  ({children, className, as: Component = 'span'}, ref) => {
    return (
      <summary
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          'accordion-trigger flex cursor-pointer items-center justify-between py-4',
          'list-none [&::-webkit-details-marker]:hidden',
          'hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          className
        )}
      >
        <Component
          className={cn(
            'accordion-title',
            Component === 'h3' && 'text-h3',
            Component === 'h4' && 'text-h4',
            Component === 'h5' && 'text-h5',
            Component === 'span' && 'text-h4'
          )}
        >
          {children}
        </Component>
        <PlusIcon className="text-muted-foreground group-open:rotate-45" />
      </summary>
    )
  }
)
AccordionTrigger.displayName = 'AccordionTrigger'

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({children, className}, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'accordion-content overflow-hidden',
          // Animate height using CSS grid trick
          'grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out',
          'group-open:grid-rows-[1fr]',
          className
        )}
      >
        <div className="overflow-hidden">
          <div className="accordion-content_spacer pb-4">{children}</div>
        </div>
      </div>
    )
  }
)
AccordionContent.displayName = 'AccordionContent'

export {Accordion, AccordionItem, AccordionTrigger, AccordionContent}
