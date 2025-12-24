'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import {Pause, Play} from '@phosphor-icons/react'
import {cn} from '@/lib/utils'

// Context for tabs configuration
interface TabsContextValue {
  orientation: 'horizontal' | 'vertical'
}

const TabsContext = React.createContext<TabsContextValue>({orientation: 'horizontal'})

// Root Tabs component with autoplay support
interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  orientation?: 'horizontal' | 'vertical'
  autoplay?: boolean
  autoplayDuration?: number
  pauseOnHover?: boolean
}

const Tabs = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
  (
    {
      className,
      orientation = 'horizontal',
      autoplay = false,
      autoplayDuration = 5000,
      pauseOnHover = true,
      defaultValue,
      children,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState(defaultValue)
    const [isPaused, setIsPaused] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const tabValues = React.useRef<string[]>([])
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

    // Register tab values from children
    React.useEffect(() => {
      const values: string[] = []
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === TabsList) {
          const listChild = child as React.ReactElement<{children?: React.ReactNode}>
          React.Children.forEach(listChild.props.children, (trigger) => {
            if (React.isValidElement(trigger)) {
              const triggerEl = trigger as React.ReactElement<{value?: string}>
              if (triggerEl.props.value) {
                values.push(triggerEl.props.value)
              }
            }
          })
        }
      })
      tabValues.current = values
      if (!value && values.length > 0) {
        setValue(values[0])
      }
    }, [children, value])

    // Autoplay logic
    React.useEffect(() => {
      if (!autoplay || isPaused || (pauseOnHover && isHovered)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        return
      }

      intervalRef.current = setInterval(() => {
        setValue((current) => {
          const currentIndex = tabValues.current.indexOf(current || '')
          const nextIndex = (currentIndex + 1) % tabValues.current.length
          return tabValues.current[nextIndex]
        })
      }, autoplayDuration)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }, [autoplay, autoplayDuration, isPaused, isHovered, pauseOnHover])

    return (
      <TabsContext.Provider value={{orientation}}>
        <TabsPrimitive.Root
          ref={ref}
          value={value}
          onValueChange={setValue}
          orientation={orientation}
          className={cn(
            'w-full',
            orientation === 'vertical' && 'flex gap-6',
            className
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...props}
        >
          {/* Inject autoplay controls */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === TabsList && autoplay) {
              return React.cloneElement(child as React.ReactElement<any>, {
                autoplay: true,
                isPaused,
                onTogglePause: () => setIsPaused(!isPaused),
                autoplayDuration,
              })
            }
            return child
          })}
        </TabsPrimitive.Root>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

// Tabs list (menu)
interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  autoplay?: boolean
  isPaused?: boolean
  onTogglePause?: () => void
  autoplayDuration?: number
}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({className, autoplay, isPaused, onTogglePause, autoplayDuration, children, ...props}, ref) => {
    const {orientation} = React.useContext(TabsContext)

    return (
      <div
        className={cn(
          orientation === 'vertical' && 'flex-shrink-0',
          orientation === 'horizontal' && 'w-full'
        )}
      >
        <TabsPrimitive.List
          ref={ref}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1',
            orientation === 'vertical' && 'flex-col',
            className
          )}
          {...props}
        >
          {children}
          {autoplay && (
            <button
              onClick={onTogglePause}
              className={cn(
                'flex h-9 items-center justify-center px-3 text-gray-500 transition-colors hover:text-black',
                orientation === 'vertical' && 'w-full'
              )}
              aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
            >
              {isPaused ? (
                <Play className="h-4 w-4" weight="fill" />
              ) : (
                <Pause className="h-4 w-4" weight="fill" />
              )}
            </button>
          )}
        </TabsPrimitive.List>
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

// Tab trigger
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({className, ...props}, ref) => {
  const {orientation} = React.useContext(TabsContext)

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-body font-medium transition-all',
        'text-gray-600 hover:text-black',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm',
        orientation === 'vertical' && 'w-full justify-start',
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = 'TabsTrigger'

// Tab content
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({className, ...props}, ref) => {
  const {orientation} = React.useContext(TabsContext)

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        'data-[state=inactive]:hidden',
        'animate-in fade-in-0 duration-300',
        orientation === 'vertical' && 'mt-0 flex-1',
        className
      )}
      {...props}
    />
  )
})
TabsContent.displayName = 'TabsContent'

export {Tabs, TabsList, TabsTrigger, TabsContent}
