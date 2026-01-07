/**
 * useContentOperations Hook
 *
 * Handles executing Sanity content operations from Claude's actions.
 * Supports incremental page creation to avoid nesting depth limits.
 */

import {useState, useCallback, useRef} from 'react'
import {useClient} from 'sanity'
import {useRouter} from 'sanity/router'
import type {ParsedAction, ActionResult, UseContentOperationsReturn} from '../types'
import {ContentOperations, type PageStructure, type SectionStructure} from '../lib/operations'

/**
 * Extended return type with additional functionality
 */
export interface UseContentOperationsExtendedReturn extends UseContentOperationsReturn {
  /** Create a page incrementally to avoid nesting depth limits */
  createPageIncrementally: (pageStructure: PageStructure) => Promise<ActionResult>
  /** Add a section to an existing page */
  addSectionToPage: (documentId: string, section: SectionStructure) => Promise<ActionResult>
  /** Navigate to a document in Structure tool */
  navigateToStructure: (documentId: string, documentType?: string) => void
  /** Navigate to a document in Presentation/Preview */
  navigateToPreview: (documentId: string, documentType?: string) => void
  /** Publish a document */
  publishDocument: (documentId: string) => Promise<ActionResult>
  /** Unpublish a document */
  unpublishDocument: (documentId: string) => Promise<ActionResult>
}

/**
 * Hook for executing content operations in Sanity
 */
export function useContentOperations(): UseContentOperationsExtendedReturn {
  const client = useClient({apiVersion: '2024-01-01'})
  const router = useRouter()
  const [isExecuting, setIsExecuting] = useState(false)
  const [pendingActions, setPendingActions] = useState<Map<string, AbortController>>(
    new Map()
  )

  const operationsRef = useRef<ContentOperations | null>(null)

  // Get or create operations instance
  const getOperations = useCallback(() => {
    if (!operationsRef.current) {
      operationsRef.current = new ContentOperations(client)
    }
    return operationsRef.current
  }, [client])

  /**
   * Execute a parsed action
   */
  const executeAction = useCallback(
    async (action: ParsedAction): Promise<ActionResult> => {
      setIsExecuting(true)

      // Create abort controller for this action
      const abortController = new AbortController()
      setPendingActions((prev) => new Map(prev).set(action.id, abortController))

      try {
        const operations = getOperations()
        const result = await operations.executeAction(action)

        return result
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error occurred',
        }
      } finally {
        setIsExecuting(false)
        setPendingActions((prev) => {
          const updated = new Map(prev)
          updated.delete(action.id)
          return updated
        })
      }
    },
    [getOperations]
  )

  /**
   * Preview what an action would do
   */
  const previewAction = useCallback(
    async (action: ParsedAction): Promise<unknown> => {
      try {
        const operations = getOperations()
        return await operations.previewAction(action)
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : 'Failed to preview action',
        }
      }
    },
    [getOperations]
  )

  /**
   * Cancel a pending action
   */
  const cancelAction = useCallback(
    (actionId: string) => {
      const controller = pendingActions.get(actionId)
      if (controller) {
        controller.abort()
        setPendingActions((prev) => {
          const updated = new Map(prev)
          updated.delete(actionId)
          return updated
        })
      }
    },
    [pendingActions]
  )

  /**
   * Create a page incrementally to avoid nesting depth limits
   */
  const createPageIncrementally = useCallback(
    async (pageStructure: PageStructure): Promise<ActionResult> => {
      setIsExecuting(true)
      try {
        const operations = getOperations()
        const result = await operations.createPageIncrementally(pageStructure)
        return result
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error
            ? `Failed to create page: ${err.message}`
            : 'Failed to create page: Unknown error',
        }
      } finally {
        setIsExecuting(false)
      }
    },
    [getOperations]
  )

  /**
   * Add a section to an existing page
   */
  const addSectionToPage = useCallback(
    async (documentId: string, section: SectionStructure): Promise<ActionResult> => {
      setIsExecuting(true)
      try {
        const operations = getOperations()
        const result = await operations.addSectionToPage(documentId, section)
        return result
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error
            ? `Failed to add section: ${err.message}`
            : 'Failed to add section: Unknown error',
        }
      } finally {
        setIsExecuting(false)
      }
    },
    [getOperations]
  )

  /**
   * Navigate to a document in Structure tool
   */
  const navigateToStructure = useCallback(
    (documentId: string, documentType?: string) => {
      // Use Sanity router to navigate within the Studio
      try {
        router.navigateIntent('edit', {
          id: documentId,
          type: documentType || 'document',
        })
      } catch {
        // Fallback to direct URL navigation
        const typeSegment = documentType || 'document'
        window.location.href = `/structure/${typeSegment};${documentId}`
      }
    },
    [router]
  )

  /**
   * Navigate to a document in Presentation/Preview
   */
  const navigateToPreview = useCallback(
    (documentId: string, documentType?: string) => {
      // For pages, open in Presentation tool
      if (documentType === 'page') {
        // Navigate to Presentation tool using URL path with query params
        try {
          router.navigateUrl({path: `/presentation?id=${documentId}`})
        } catch {
          // Fallback to direct URL
          window.location.href = `/presentation?id=${documentId}`
        }
      } else {
        // For other types, open in Structure tool
        navigateToStructure(documentId, documentType)
      }
    },
    [router, navigateToStructure]
  )

  /**
   * Publish a document
   */
  const publishDocument = useCallback(
    async (documentId: string): Promise<ActionResult> => {
      setIsExecuting(true)
      try {
        const operations = getOperations()
        const result = await operations.publishDocument(documentId)
        return result
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error
            ? `Failed to publish: ${err.message}`
            : 'Failed to publish: Unknown error',
        }
      } finally {
        setIsExecuting(false)
      }
    },
    [getOperations]
  )

  /**
   * Unpublish a document
   */
  const unpublishDocument = useCallback(
    async (documentId: string): Promise<ActionResult> => {
      setIsExecuting(true)
      try {
        const operations = getOperations()
        const result = await operations.unpublishDocument(documentId)
        return result
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error
            ? `Failed to unpublish: ${err.message}`
            : 'Failed to unpublish: Unknown error',
        }
      } finally {
        setIsExecuting(false)
      }
    },
    [getOperations]
  )

  return {
    executeAction,
    previewAction,
    cancelAction,
    isExecuting,
    createPageIncrementally,
    addSectionToPage,
    navigateToStructure,
    navigateToPreview,
    publishDocument,
    unpublishDocument,
  }
}

/**
 * Hook for batch operations
 */
export function useBatchOperations() {
  const {executeAction} = useContentOperations()
  const [results, setResults] = useState<Map<string, ActionResult>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Execute multiple actions in sequence
   */
  const executeActions = useCallback(
    async (actions: ParsedAction[]): Promise<Map<string, ActionResult>> => {
      setIsProcessing(true)
      const resultsMap = new Map<string, ActionResult>()

      for (const action of actions) {
        const result = await executeAction(action)
        resultsMap.set(action.id, result)
        setResults(new Map(resultsMap))

        // Stop if an action fails
        if (!result.success) {
          break
        }
      }

      setIsProcessing(false)
      return resultsMap
    },
    [executeAction]
  )

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults(new Map())
  }, [])

  return {
    executeActions,
    results,
    isProcessing,
    clearResults,
  }
}
