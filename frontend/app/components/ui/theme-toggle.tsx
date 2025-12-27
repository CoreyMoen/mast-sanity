'use client'

import * as React from 'react'
import {Moon, Sun} from '@phosphor-icons/react'
import {cn} from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-preference'

/**
 * Gets the current effective theme based on system preference
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Gets the stored theme preference or returns 'system' if none
 */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system'
}

/**
 * Sets the theme on the HTML element
 */
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  if (theme === 'system') {
    // Remove data-theme to let CSS light-dark() use OS preference
    root.removeAttribute('data-theme')
  } else {
    // Set explicit theme
    root.setAttribute('data-theme', theme)
  }
}

interface ThemeToggleProps {
  className?: string
  showLabels?: boolean
}

export function ThemeToggle({className, showLabels = false}: ThemeToggleProps) {
  const [theme, setTheme] = React.useState<Theme>('system')
  const [effectiveTheme, setEffectiveTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)

  // Initialize theme on mount
  React.useEffect(() => {
    const stored = getStoredTheme()
    setTheme(stored)
    setEffectiveTheme(stored === 'system' ? getSystemTheme() : stored)
    applyTheme(stored)
    setMounted(true)
  }, [])

  // Listen for system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        setEffectiveTheme(getSystemTheme())
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const toggleTheme = () => {
    // Toggle between light and dark (not system)
    const newTheme: 'light' | 'dark' = effectiveTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    setEffectiveTheme(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <label className="relative inline-flex cursor-pointer items-center">
          <div className="h-[1.5em] w-[3em] rounded-full bg-[var(--primary-border)] opacity-50" />
        </label>
      </div>
    )
  }

  const isDark = effectiveTheme === 'dark'

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Dark mode label/icon (shown when in dark mode) */}
      {showLabels && (
        <span
          className={cn(
            'transition-opacity duration-300',
            isDark ? 'opacity-100' : 'opacity-0 hidden'
          )}
        >
          <Moon
            size={20}
            weight="regular"
            className="text-[var(--primary-foreground)]"
          />
        </span>
      )}

      {/* Toggle switch */}
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={isDark}
          onChange={toggleTheme}
          className="peer sr-only"
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        />
        {/* Track */}
        <div
          className={cn(
            'relative h-[1.5em] w-[3em] rounded-full transition-colors duration-300',
            'bg-[var(--primary-border)]',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-brand)] peer-focus-visible:ring-offset-2'
          )}
        >
          {/* Thumb */}
          <div
            className={cn(
              'absolute top-[0.2em] left-[0.2em] h-[1.1em] w-[1.1em] rounded-full transition-transform duration-300',
              'bg-[var(--primary-foreground)]',
              isDark && 'translate-x-[1.5em]'
            )}
          />
        </div>
      </label>

      {/* Light mode label/icon (shown when in light mode) */}
      {showLabels && (
        <span
          className={cn(
            'transition-opacity duration-300',
            !isDark ? 'opacity-100' : 'opacity-0 hidden'
          )}
        >
          <Sun
            size={20}
            weight="regular"
            className="text-[var(--primary-foreground)]"
          />
        </span>
      )}
    </div>
  )
}

/**
 * Compact theme toggle with just icons
 */
export function ThemeToggleCompact({className}: {className?: string}) {
  const [effectiveTheme, setEffectiveTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const stored = getStoredTheme()
    setEffectiveTheme(stored === 'system' ? getSystemTheme() : stored)
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      const stored = getStoredTheme()
      if (stored === 'system') {
        setEffectiveTheme(getSystemTheme())
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    const newTheme: 'light' | 'dark' = effectiveTheme === 'dark' ? 'light' : 'dark'
    setEffectiveTheme(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) {
    return (
      <button
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
          'text-[var(--muted-foreground)] opacity-50',
          className
        )}
        disabled
      >
        <Sun size={20} weight="regular" />
      </button>
    )
  }

  const isDark = effectiveTheme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300',
        'text-[var(--muted-foreground)] hover:text-[var(--primary-foreground)]',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Moon size={20} weight="regular" />
      ) : (
        <Sun size={20} weight="regular" />
      )}
    </button>
  )
}
