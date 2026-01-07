'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import {Pause, Play, CaretDown} from '@phosphor-icons/react'
import {cn} from '@/lib/utils'

// Context for tabs configuration
interface TabsContextValue {
  orientation: 'horizontal' | 'vertical'
  menuPosition: 'above' | 'below' | 'left' | 'right'
  contentGap: string
  autoplay: boolean
  autoplayDuration: number
  showProgress: boolean
  isPaused: boolean
  activeValue: string | undefined
  onTogglePause: () => void
  progress: number
}

const TabsContext = React.createContext<TabsContextValue>({
  orientation: 'horizontal',
  menuPosition: 'above',
  contentGap: '4',
  autoplay: false,
  autoplayDuration: 5000,
  showProgress: true,
  isPaused: false,
  activeValue: undefined,
  onTogglePause: () => {},
  progress: 0,
})

// Root Tabs component with autoplay support
interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  orientation?: 'horizontal' | 'vertical'
  menuPosition?: 'above' | 'below' | 'left' | 'right'
  contentGap?: string
  autoplay?: boolean
  autoplayDuration?: number
  pauseOnHover?: boolean
  showProgress?: boolean
  mobileDropdown?: boolean
}

// Gap classes for spacing between menu and content
const gapClasses: Record<string, string> = {
  '0': 'gap-0',
  '2': 'gap-2',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
  '12': 'gap-12',
}

const marginTopClasses: Record<string, string> = {
  '0': 'mt-0',
  '2': 'mt-2',
  '4': 'mt-4',
  '6': 'mt-6',
  '8': 'mt-8',
  '12': 'mt-12',
}

const Tabs = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
  (
    {
      className,
      orientation = 'horizontal',
      menuPosition = 'above',
      contentGap = '4',
      autoplay = false,
      autoplayDuration = 5000,
      pauseOnHover = true,
      showProgress = true,
      mobileDropdown = false,
      defaultValue,
      children,
      id,
      ...props
    },
    ref
  ) => {
    // Use React's useId for stable SSR-compatible ID generation
    const generatedId = React.useId()
    const tabsId = id || generatedId
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
    const gapClass = gapClasses[contentGap] || gapClasses['4']

    const handleTogglePause = () => setIsPaused(!isPaused)

    return (
      <TabsContext.Provider
        value={{
          orientation,
          menuPosition,
          contentGap,
          autoplay,
          autoplayDuration,
          showProgress,
          isPaused,
          activeValue: value,
          onTogglePause: handleTogglePause,
          progress,
        }}
      >
        <TabsPrimitive.Root
          ref={ref}
          id={tabsId}
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue)
            setProgress(0)
          }}
          orientation={orientation}
          className={cn(
            'w-full',
            isVerticalLayout && `flex ${gapClass}`,
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
      isPaused: _isPaused, // Extract to prevent passing to DOM
      autoplayDuration: _autoplayDuration, // Extract to prevent passing to DOM
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
              'flex w-full items-center justify-between rounded-lg bg-muted-background px-4 py-3 text-body font-medium md:hidden',
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
            // Mast-style: full width, no background, border-bottom line
            'flex w-full border-b border-border',
            orientation === 'vertical' && 'flex-col border-b-0 border-r',
            mobileDropdown && 'hidden md:flex',
            mobileDropdown && dropdownOpen && 'flex flex-col',
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
  icon?: React.ReactNode
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({className, showProgress, progress = 0, icon, children, ...props}, ref) => {
  const {orientation} = React.useContext(TabsContext)

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        // Mast-style: text with bottom border on active, no background
        'relative flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-body font-medium transition-colors cursor-pointer',
        'text-muted-foreground hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // Active state: bottom border instead of background
        'data-[state=active]:text-foreground',
        orientation === 'vertical' && 'flex-1-0-auto justify-start border-r-2 border-transparent data-[state=active]:border-r-foreground',
        orientation === 'horizontal' && 'border-b-2 border-transparent -mb-[1px] data-[state=active]:border-b-foreground',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {/* Progress indicator bar - overlaps the active border */}
      {showProgress && (
        <div
          className={cn(
            'absolute bg-brand',
            orientation === 'horizontal'
              ? 'bottom-0 left-0 h-0.5 -mb-[2px]'
              : 'top-0 right-0 w-0.5'
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

// Tab content with fade animation
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({className, ...props}, ref) => {
  const {menuPosition, contentGap} = React.useContext(TabsContext)
  const isVerticalLayout = menuPosition === 'left' || menuPosition === 'right'
  const marginClass = marginTopClasses[contentGap] || marginTopClasses['4']

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        'data-[state=inactive]:hidden',
        'data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-200',
        isVerticalLayout ? 'mt-0 flex-1' : marginClass,
        className
      )}
      {...props}
    />
  )
})
TabsContent.displayName = 'TabsContent'

// Separate Play/Pause button component for positioning outside TabsList
const TabsPlayPause = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({className, ...props}, ref) => {
  const {autoplay, isPaused, onTogglePause} = React.useContext(TabsContext)

  if (!autoplay) return null

  return (
    <button
      ref={ref}
      onClick={onTogglePause}
      className={cn(
        'inline-flex items-center justify-center w-10 h-10 border border-border text-muted-foreground transition-colors hover:text-foreground hover:bg-muted-background rounded-[var(--component-button-radius)]',
        className
      )}
      aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
      {...props}
    >
      {isPaused ? (
        <Play className="h-4 w-4" weight="fill" />
      ) : (
        <Pause className="h-4 w-4" weight="fill" />
      )}
    </button>
  )
})
TabsPlayPause.displayName = 'TabsPlayPause'

export {Tabs, TabsList, TabsTrigger, TabsContent, TabsPlayPause}
