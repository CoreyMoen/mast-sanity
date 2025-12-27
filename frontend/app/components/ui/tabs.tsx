'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import {Pause, Play, CaretDown} from '@phosphor-icons/react'
import {cn} from '@/lib/utils'

// Context for tabs configuration
interface TabsContextValue {
  orientation: 'horizontal' | 'vertical'
  menuPosition: 'above' | 'below' | 'left' | 'right'
  autoplay: boolean
  autoplayDuration: number
  showProgress: boolean
  isPaused: boolean
  activeValue: string | undefined
}

const TabsContext = React.createContext<TabsContextValue>({
  orientation: 'horizontal',
  menuPosition: 'above',
  autoplay: false,
  autoplayDuration: 5000,
  showProgress: true,
  isPaused: false,
  activeValue: undefined,
})

// Root Tabs component with autoplay support
interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  orientation?: 'horizontal' | 'vertical'
  menuPosition?: 'above' | 'below' | 'left' | 'right'
  autoplay?: boolean
  autoplayDuration?: number
  pauseOnHover?: boolean
  showProgress?: boolean
  mobileDropdown?: boolean
}

const Tabs = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
  (
    {
      className,
      orientation = 'horizontal',
      menuPosition = 'above',
      autoplay = false,
      autoplayDuration = 5000,
      pauseOnHover = true,
      showProgress = true,
      mobileDropdown = false,
      defaultValue,
      children,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState(defaultValue)
    const [isPaused, setIsPaused] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const tabValues = React.useRef<string[]>([])
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null)
    const progressRef = React.useRef<NodeJS.Timeout | null>(null)

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

    // Reset progress when value changes
    React.useEffect(() => {
      setProgress(0)
    }, [value])

    // Autoplay logic with progress tracking
    React.useEffect(() => {
      if (!autoplay || isPaused || (pauseOnHover && isHovered)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        if (progressRef.current) {
          clearInterval(progressRef.current)
          progressRef.current = null
        }
        return
      }

      // Update progress every 50ms for smooth animation
      const progressInterval = 50
      const totalSteps = autoplayDuration / progressInterval

      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (100 / totalSteps)
          return next >= 100 ? 100 : next
        })
      }, progressInterval)

      intervalRef.current = setInterval(() => {
        setProgress(0)
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
        if (progressRef.current) {
          clearInterval(progressRef.current)
        }
      }
    }, [autoplay, autoplayDuration, isPaused, isHovered, pauseOnHover])

    // Determine layout direction based on menu position
    const isVerticalLayout = menuPosition === 'left' || menuPosition === 'right'
    const isReversed = menuPosition === 'below' || menuPosition === 'right'

    return (
      <TabsContext.Provider
        value={{
          orientation,
          menuPosition,
          autoplay,
          autoplayDuration,
          showProgress,
          isPaused,
          activeValue: value,
        }}
      >
        <TabsPrimitive.Root
          ref={ref}
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue)
            setProgress(0)
          }}
          orientation={orientation}
          className={cn(
            'w-full',
            isVerticalLayout && 'flex gap-6',
            isReversed && isVerticalLayout && 'flex-row-reverse',
            isReversed && !isVerticalLayout && 'flex flex-col-reverse',
            className
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...props}
        >
          {/* Inject autoplay controls and progress */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === TabsList) {
              return React.cloneElement(child as React.ReactElement<TabsListProps>, {
                autoplay,
                isPaused,
                onTogglePause: () => setIsPaused(!isPaused),
                autoplayDuration,
                showProgress,
                progress,
                activeValue: value,
                mobileDropdown,
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
  showProgress?: boolean
  progress?: number
  activeValue?: string
  mobileDropdown?: boolean
}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  (
    {
      className,
      autoplay,
      isPaused,
      onTogglePause,
      autoplayDuration,
      showProgress,
      progress,
      activeValue,
      mobileDropdown,
      children,
      ...props
    },
    ref
  ) => {
    const {orientation, menuPosition} = React.useContext(TabsContext)
    const [dropdownOpen, setDropdownOpen] = React.useState(false)
    const isVerticalLayout = menuPosition === 'left' || menuPosition === 'right'

    // Get active tab label for mobile dropdown
    const activeLabel = React.useMemo(() => {
      let label = 'Select tab'
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const triggerEl = child as React.ReactElement<{value?: string; children?: React.ReactNode}>
          if (triggerEl.props.value === activeValue) {
            label = String(triggerEl.props.children) || 'Tab'
          }
        }
      })
      return label
    }, [children, activeValue])

    return (
      <div
        className={cn(
          isVerticalLayout && 'flex-shrink-0',
          !isVerticalLayout && 'w-full'
        )}
      >
        {/* Mobile dropdown toggle */}
        {mobileDropdown && (
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg bg-gray-100 px-4 py-3 text-body font-medium md:hidden',
              dropdownOpen && 'rounded-b-none'
            )}
          >
            <span>{activeLabel}</span>
            <CaretDown
              className={cn(
                'h-4 w-4 transition-transform',
                dropdownOpen && 'rotate-180'
              )}
              weight="bold"
            />
          </button>
        )}

        <TabsPrimitive.List
          ref={ref}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1',
            orientation === 'vertical' && 'flex-col',
            mobileDropdown && 'hidden md:inline-flex',
            mobileDropdown && dropdownOpen && 'flex flex-col rounded-t-none',
            className
          )}
          {...props}
        >
          {/* Clone children to add progress indicator */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              const triggerEl = child as React.ReactElement<{value?: string}>
              const isActive = triggerEl.props.value === activeValue
              return React.cloneElement(child as React.ReactElement<any>, {
                showProgress: autoplay && showProgress && isActive,
                progress: isActive ? progress : 0,
                onClick: mobileDropdown ? () => setDropdownOpen(false) : undefined,
              })
            }
            return child
          })}
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

// Tab trigger with progress indicator
interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  showProgress?: boolean
  progress?: number
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({className, showProgress, progress = 0, children, ...props}, ref) => {
  const {orientation} = React.useContext(TabsContext)

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-body font-medium transition-all',
        'text-gray-600 hover:text-black',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm',
        orientation === 'vertical' && 'w-full justify-start',
        className
      )}
      {...props}
    >
      {children}
      {/* Progress indicator bar */}
      {showProgress && (
        <div
          className={cn(
            'absolute bg-brand transition-all',
            orientation === 'horizontal'
              ? 'bottom-0 left-0 h-0.5'
              : 'top-0 bottom-0 left-0 w-0.5'
          )}
          style={{
            [orientation === 'horizontal' ? 'width' : 'height']: `${progress}%`,
          }}
        />
      )}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = 'TabsTrigger'

// Tab content
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({className, ...props}, ref) => {
  const {menuPosition} = React.useContext(TabsContext)
  const isVerticalLayout = menuPosition === 'left' || menuPosition === 'right'

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        'data-[state=inactive]:hidden',
        'animate-in fade-in-0 duration-300',
        isVerticalLayout && 'mt-0 flex-1',
        className
      )}
      {...props}
    />
  )
})
TabsContent.displayName = 'TabsContent'

export {Tabs, TabsList, TabsTrigger, TabsContent}
