'use client'

import * as React from 'react'
import {Pause, Play, CaretDown} from '@phosphor-icons/react'
import {useTabs} from '@/app/hooks'
import '@/app/components/tabs.css'

// Class mappings for orientation and menu position
const orientationClasses = {
  horizontal: '',
  vertical: 'cc-vertical',
}

const menuPositionClasses = {
  above: '',
  below: 'cc-menu-below',
  left: 'cc-menu-left',
  right: 'cc-menu-right',
}

// Context for tabs configuration
interface TabsContextValue {
  orientation: 'horizontal' | 'vertical'
  menuPosition: 'above' | 'below' | 'left' | 'right'
  activeIndex: number
  setActiveTab: (index: number) => void
  autoplay: boolean
  autoplayDuration: number
  isPaused: boolean
  progressKey: number
}

const TabsContext = React.createContext<TabsContextValue>({
  orientation: 'horizontal',
  menuPosition: 'above',
  activeIndex: 0,
  setActiveTab: () => {},
  autoplay: false,
  autoplayDuration: 5,
  isPaused: false,
  progressKey: 0,
})

// Root Tabs component with autoplay support
interface TabsProps {
  orientation?: 'horizontal' | 'vertical'
  menuPosition?: 'above' | 'below' | 'left' | 'right'
  autoplay?: boolean
  autoplayDuration?: number
  pauseOnHover?: boolean
  mobileDropdown?: boolean
  defaultIndex?: number
  className?: string
  children: React.ReactNode
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      className,
      orientation = 'horizontal',
      menuPosition = 'above',
      autoplay = false,
      autoplayDuration = 5,
      pauseOnHover = true,
      mobileDropdown = false,
      defaultIndex = 0,
      children,
      ...props
    },
    ref
  ) => {
    // Count tabs from children
    const tabCount = React.useMemo(() => {
      let count = 0
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === TabsList) {
          const listChild = child as React.ReactElement<{children?: React.ReactNode}>
          React.Children.forEach(listChild.props.children, (trigger) => {
            if (React.isValidElement(trigger) && trigger.type === TabsTrigger) {
              count++
            }
          })
        }
      })
      return count
    }, [children])

    const {
      activeIndex,
      setActiveTab,
      isPaused,
      togglePause,
      containerRef,
      handleMouseEnter,
      handleMouseLeave,
      handleKeyDown,
      registerTabs,
      progressKey,
    } = useTabs({
      defaultIndex,
      autoplay,
      autoplayDuration,
      pauseOnHover,
    })

    // Register tab count
    React.useEffect(() => {
      registerTabs(tabCount)
    }, [tabCount, registerTabs])

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        // Update containerRef
        if (containerRef && 'current' in containerRef) {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
        // Update forwarded ref
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [containerRef, ref]
    )

    // Build class names
    const wrapperClasses = [
      'tabs-component',
      orientationClasses[orientation],
      menuPositionClasses[menuPosition],
      isPaused ? 'autoplay-paused' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <TabsContext.Provider
        value={{
          orientation,
          menuPosition,
          activeIndex,
          setActiveTab,
          autoplay,
          autoplayDuration,
          isPaused,
          progressKey,
        }}
      >
        <div
          ref={combinedRef}
          className={wrapperClasses}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onKeyDown={handleKeyDown}
          style={autoplay ? {'--autoplay-duration': `${autoplayDuration}s`} as React.CSSProperties : undefined}
          {...props}
        >
          {/* Inject autoplay controls */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === TabsList) {
              return React.cloneElement(child as React.ReactElement<TabsListProps>, {
                autoplay,
                isPaused,
                onTogglePause: togglePause,
                mobileDropdown,
              })
            }
            return child
          })}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

// Tabs list (menu)
interface TabsListProps {
  autoplay?: boolean
  isPaused?: boolean
  onTogglePause?: () => void
  mobileDropdown?: boolean
  className?: string
  children?: React.ReactNode
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  (
    {
      className,
      autoplay,
      isPaused,
      onTogglePause,
      mobileDropdown,
      children,
      ...props
    },
    ref
  ) => {
    const {orientation, activeIndex} = React.useContext(TabsContext)
    const [dropdownOpen, setDropdownOpen] = React.useState(false)

    // Get active tab label for mobile dropdown
    const activeLabel = React.useMemo(() => {
      let label = 'Select tab'
      let index = 0
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === TabsTrigger) {
          if (index === activeIndex) {
            const triggerEl = child as React.ReactElement<{children?: React.ReactNode}>
            label = String(triggerEl.props.children) || 'Tab'
          }
          index++
        }
      })
      return label
    }, [children, activeIndex])

    // Build class names for menu
    const menuClasses = [
      'tabs-menu',
      orientation === 'vertical' ? 'cc-vertical' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    // Track tab index for children
    let tabIndex = 0

    return (
      <div
        ref={ref}
        className={menuClasses}
        role="tablist"
        aria-orientation={orientation}
        data-tabs-autoplay={autoplay ? 'true' : undefined}
        data-tab-mobile-dropdown={mobileDropdown ? 'true' : undefined}
        {...props}
      >
        {/* Mobile dropdown toggle */}
        {mobileDropdown && (
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`tabs-menu_dropdown-toggle ${dropdownOpen ? 'cc-open' : ''}`}
            aria-expanded={dropdownOpen}
          >
            <span>{activeLabel}</span>
            <CaretDown className="tabs-menu_dropdown-arrow" weight="bold" />
          </button>
        )}

        {/* Tab links wrapper for mobile dropdown */}
        <div className={mobileDropdown ? `tabs-menu_dropdown-menu ${dropdownOpen ? 'cc-open' : ''}` : undefined}>
          {/* Clone children to pass index */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === TabsTrigger) {
              const currentIndex = tabIndex++
              return React.cloneElement(child as React.ReactElement<TabsTriggerInternalProps>, {
                _index: currentIndex,
                _onClick: mobileDropdown ? () => setDropdownOpen(false) : undefined,
              })
            }
            return child
          })}
        </div>

        {/* Autoplay toggle button */}
        {autoplay && (
          <button
            onClick={onTogglePause}
            className="tabs-autoplay-toggle"
            aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
          >
            <span className="tabs-autoplay-toggle_pause">
              <Pause weight="fill" />
            </span>
            <span className="tabs-autoplay-toggle_play">
              <Play weight="fill" />
            </span>
          </button>
        )}
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

// Tab trigger internal props (passed by TabsList)
interface TabsTriggerInternalProps {
  _index?: number
  _onClick?: () => void
}

// Tab trigger with progress indicator
interface TabsTriggerProps extends TabsTriggerInternalProps {
  className?: string
  children?: React.ReactNode
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({className, children, _index = 0, _onClick, ...props}, ref) => {
    const {activeIndex, setActiveTab, autoplay} = React.useContext(TabsContext)
    const isActive = _index === activeIndex

    const handleClick = () => {
      setActiveTab(_index)
      _onClick?.()
    }

    // Build class names
    const triggerClasses = [
      'tabs-link',
      isActive ? 'cc-active' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        className={triggerClasses}
        onClick={handleClick}
        {...props}
      >
        {children}
        {/* Progress indicator bar for autoplay */}
        {autoplay && <span className="tabs-autoplay-progress" />}
      </button>
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

// Tab content panel
interface TabsContentProps {
  index: number
  className?: string
  children?: React.ReactNode
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({className, index, children, ...props}, ref) => {
    const {activeIndex, progressKey} = React.useContext(TabsContext)
    const isActive = index === activeIndex

    // Build class names
    const contentClasses = [
      'tabs-pane',
      isActive ? 'cc-active' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={ref}
        role="tabpanel"
        aria-hidden={!isActive}
        tabIndex={isActive ? 0 : -1}
        className={contentClasses}
        key={isActive ? progressKey : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = 'TabsContent'

export {Tabs, TabsList, TabsTrigger, TabsContent}
