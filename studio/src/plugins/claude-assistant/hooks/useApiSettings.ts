/**
 * useApiSettings Hook
 *
 * Fetches Claude API Settings from Sanity with caching.
 * Only fetches **published** documents (not drafts).
 * Auto-creates default document if none exists.
 */

import {useState, useCallback, useEffect, useRef} from 'react'
import {useClient} from 'sanity'
import type {PluginSettings} from '../types'
import {DEFAULT_SETTINGS} from '../types'

const API_VERSION = '2024-01-01'

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000

/**
 * Sanity API settings document shape
 */
interface SanityApiSettings {
  _id: string
  _type: 'claudeApiSettings'
  model?: string
  maxTokens?: number
  temperature?: number
  enableStreaming?: boolean
}

/**
 * Default API settings document data (for auto-creation)
 */
const DEFAULT_API_SETTINGS_DOC = {
  _id: 'claudeApiSettings',
  _type: 'claudeApiSettings',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
  enableStreaming: true,
}

/**
 * Cache structure for API settings
 */
interface ApiSettingsCache {
  settings: PluginSettings
  timestamp: number
}

// Module-level cache to persist across hook instances
let cachedData: ApiSettingsCache | null = null

/**
 * Return type for useApiSettings hook
 */
export interface UseApiSettingsReturn {
  settings: PluginSettings
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  isUsingDefaults: boolean
}

/**
 * Hook for fetching API Settings from Sanity
 * Only fetches **published** documents (filters out drafts)
 */
export function useApiSettings(): UseApiSettingsReturn {
  const client = useClient({apiVersion: API_VERSION})

  const [settings, setSettings] = useState<PluginSettings>(
    cachedData?.settings ?? DEFAULT_SETTINGS
  )
  const [isLoading, setIsLoading] = useState(!cachedData)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDefaults, setIsUsingDefaults] = useState(!cachedData)

  // Track if we've already fetched to prevent re-fetching
  const hasFetchedRef = useRef(false)

  // Check if cache is still valid
  const isCacheValid = useCallback(() => {
    if (!cachedData) return false
    return Date.now() - cachedData.timestamp < CACHE_TTL
  }, [])

  // Create default API settings in Sanity
  const createDefaultSettings = useCallback(async () => {
    console.log('[useApiSettings] Creating default API settings in Sanity...')
    try {
      await client.createIfNotExists(DEFAULT_API_SETTINGS_DOC)
      console.log('[useApiSettings] Default API settings created successfully')
      return true
    } catch (err) {
      console.error('[useApiSettings] Failed to create default API settings:', err)
      return false
    }
  }, [client])

  // Fetch API settings from Sanity (published only)
  const fetchApiSettings = useCallback(async () => {
    // Use cache if valid and not forcing refresh
    if (isCacheValid() && cachedData) {
      setSettings(cachedData.settings)
      setIsUsingDefaults(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Query for published document only (exclude drafts)
      // Published documents don't have 'drafts.' prefix in their _id
      const query = `*[_type == "claudeApiSettings" && !(_id in path("drafts.**"))][0] {
        _id,
        model,
        maxTokens,
        temperature,
        enableStreaming
      }`

      let result = await client.fetch<SanityApiSettings | null>(query)

      // If no published document exists, auto-create the defaults
      if (!result) {
        console.log('[useApiSettings] No published API settings found, creating defaults...')
        const created = await createDefaultSettings()

        if (created) {
          // Fetch again after creating
          result = await client.fetch<SanityApiSettings | null>(query)
        }
      }

      if (result) {
        // Transform Sanity document to PluginSettings type
        const apiSettings: PluginSettings = {
          model: result.model ?? DEFAULT_SETTINGS.model,
          maxTokens: result.maxTokens ?? DEFAULT_SETTINGS.maxTokens,
          temperature: result.temperature ?? DEFAULT_SETTINGS.temperature,
          enableStreaming: result.enableStreaming ?? DEFAULT_SETTINGS.enableStreaming,
          // customInstructions is kept in localStorage (user preference, not shared)
          customInstructions: '',
        }

        // Update cache
        cachedData = {
          settings: apiSettings,
          timestamp: Date.now(),
        }

        setSettings(apiSettings)
        setIsUsingDefaults(false)
      } else {
        // Still no document (creation may have failed or not published), use defaults
        setSettings(DEFAULT_SETTINGS)
        setIsUsingDefaults(true)
      }
    } catch (err) {
      console.error('Failed to fetch API settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load API settings')
      // Fall back to defaults on error
      setSettings(DEFAULT_SETTINGS)
      setIsUsingDefaults(true)
    } finally {
      setIsLoading(false)
    }
  }, [client, isCacheValid, createDefaultSettings])

  // Fetch API settings on mount only (once)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchApiSettings()
    }
  }, [fetchApiSettings])

  // Force refetch that bypasses cache
  const refetch = useCallback(async () => {
    cachedData = null
    hasFetchedRef.current = false
    await fetchApiSettings()
  }, [fetchApiSettings])

  return {
    settings,
    isLoading,
    error,
    refetch,
    isUsingDefaults,
  }
}
