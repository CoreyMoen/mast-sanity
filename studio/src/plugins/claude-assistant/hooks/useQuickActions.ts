/**
 * useQuickActions Hook
 *
 * Fetches Quick Action buttons from Sanity with caching.
 * Only fetches **published** documents (not drafts).
 * Auto-creates default documents if none exist.
 */

import {useState, useCallback, useEffect, useRef} from 'react'
import {useClient} from 'sanity'
import type {QuickAction, QuickActionCategory} from '../types'

const API_VERSION = '2024-01-01'

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000

/**
 * Sanity quick action document shape
 */
interface SanityQuickAction {
  id: string
  label: string
  description: string
  icon: string
  prompt: string
  category: QuickActionCategory
  order: number
  active: boolean
}

/**
 * Default quick actions - auto-created as Sanity documents when none exist
 */
const DEFAULT_QUICK_ACTIONS_DATA = [
  {
    _id: 'quick-action-create',
    _type: 'claudeQuickAction',
    label: 'Create',
    description: 'Create new content',
    icon: 'add',
    prompt: 'I want to create a new page or document. Help me set up ',
    category: 'content',
    order: 10,
    active: true,
  },
  {
    _id: 'quick-action-find',
    _type: 'claudeQuickAction',
    label: 'Find',
    description: 'Search for content',
    icon: 'search',
    prompt: 'Search my content and find all documents that ',
    category: 'query',
    order: 20,
    active: true,
  },
  {
    _id: 'quick-action-edit',
    _type: 'claudeQuickAction',
    label: 'Edit',
    description: 'Modify existing content',
    icon: 'edit',
    prompt: 'I need to update some existing content. Help me modify ',
    category: 'content',
    order: 30,
    active: true,
  },
  {
    _id: 'quick-action-explain',
    _type: 'claudeQuickAction',
    label: 'Explain',
    description: 'Learn about the schema',
    icon: 'help',
    prompt: 'Explain how the content schema works, specifically ',
    category: 'help',
    order: 40,
    active: true,
  },
]

/**
 * Default quick actions as QuickAction type (for initial state before fetch)
 */
const DEFAULT_QUICK_ACTIONS: QuickAction[] = DEFAULT_QUICK_ACTIONS_DATA.map((action) => ({
  id: action._id,
  label: action.label,
  description: action.description,
  icon: action.icon,
  prompt: action.prompt,
  category: action.category as QuickActionCategory,
}))

/**
 * Cache structure for quick actions
 */
interface QuickActionsCache {
  actions: QuickAction[]
  timestamp: number
}

// Module-level cache to persist across hook instances
let cachedData: QuickActionsCache | null = null

/**
 * Return type for useQuickActions hook
 */
export interface UseQuickActionsReturn {
  quickActions: QuickAction[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  isUsingDefaults: boolean
}

/**
 * Hook for fetching Quick Actions from Sanity
 */
export function useQuickActions(): UseQuickActionsReturn {
  const client = useClient({apiVersion: API_VERSION})

  const [quickActions, setQuickActions] = useState<QuickAction[]>(
    cachedData?.actions ?? DEFAULT_QUICK_ACTIONS
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

  // Create default quick actions in Sanity
  const createDefaultActions = useCallback(async () => {
    console.log('[useQuickActions] Creating default quick actions in Sanity...')
    try {
      // Use transaction to create all defaults atomically
      const transaction = client.transaction()

      for (const action of DEFAULT_QUICK_ACTIONS_DATA) {
        transaction.createIfNotExists(action)
      }

      await transaction.commit()
      console.log('[useQuickActions] Default quick actions created successfully')
      return true
    } catch (err) {
      console.error('[useQuickActions] Failed to create default quick actions:', err)
      return false
    }
  }, [client])

  // Fetch quick actions from Sanity
  const fetchQuickActions = useCallback(async () => {
    // Use cache if valid and not forcing refresh
    if (isCacheValid() && cachedData) {
      setQuickActions(cachedData.actions)
      setIsUsingDefaults(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Query for published documents only (exclude drafts)
      // Published documents don't have 'drafts.' prefix in their _id
      const query = `*[_type == "claudeQuickAction" && active == true && !(_id in path("drafts.**"))] | order(order asc) {
        "id": _id,
        label,
        description,
        icon,
        prompt,
        category,
        order,
        active
      }`

      let results = await client.fetch<SanityQuickAction[]>(query)

      // If no documents exist, auto-create the defaults
      if (!results || results.length === 0) {
        console.log('[useQuickActions] No quick actions found, creating defaults...')
        const created = await createDefaultActions()

        if (created) {
          // Fetch again after creating
          results = await client.fetch<SanityQuickAction[]>(query)
        }
      }

      if (results && results.length > 0) {
        // Transform Sanity documents to QuickAction type
        const actions: QuickAction[] = results.map((action) => ({
          id: action.id,
          label: action.label,
          description: action.description || '',
          icon: action.icon || 'add',
          prompt: action.prompt,
          category: action.category || 'content',
        }))

        // Update cache
        cachedData = {
          actions,
          timestamp: Date.now(),
        }

        setQuickActions(actions)
        setIsUsingDefaults(false)
      } else {
        // Still no documents (creation may have failed), use in-memory defaults
        setQuickActions(DEFAULT_QUICK_ACTIONS)
        setIsUsingDefaults(true)
      }
    } catch (err) {
      console.error('Failed to fetch quick actions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quick actions')
      // Fall back to defaults on error
      setQuickActions(DEFAULT_QUICK_ACTIONS)
      setIsUsingDefaults(true)
    } finally {
      setIsLoading(false)
    }
  }, [client, isCacheValid, createDefaultActions])

  // Fetch quick actions on mount only (once)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchQuickActions()
    }
  }, [fetchQuickActions])

  // Force refetch that bypasses cache
  const refetch = useCallback(async () => {
    cachedData = null
    hasFetchedRef.current = false
    await fetchQuickActions()
  }, [fetchQuickActions])

  return {
    quickActions,
    isLoading,
    error,
    refetch,
    isUsingDefaults,
  }
}

/**
 * Export default actions for use in seed scripts and testing
 */
export {DEFAULT_QUICK_ACTIONS}
