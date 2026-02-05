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
import type {Workflow} from './useWorkflows'

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
  /** Undo a previously executed action */
  undoAction: (action: ParsedAction) => Promise<ActionResult>
  /** Fetch frame data from Figma URL */
  handleFetchFigmaFrame: (url: string, workflow?: Workflow) => Promise<ActionResult>
  /** Upload an image from Figma to Sanity */
  handleUploadFigmaImage: (fileKey: string, nodeId: string, filename: string, workflow?: Workflow) => Promise<ActionResult>
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
   * Routes Figma actions to the appropriate handlers, other actions to ContentOperations
   */
  const executeAction = useCallback(
    async (action: ParsedAction): Promise<ActionResult> => {
      setIsExecuting(true)

      // Create abort controller for this action
      const abortController = new AbortController()
      setPendingActions((prev) => new Map(prev).set(action.id, abortController))

      try {
        let result: ActionResult

        // Handle Figma actions separately (they call external API endpoints)
        // Note: Figma actions are only available when the skill has enableFigmaFetch: true,
        // which is validated at the system prompt level (Claude won't suggest these actions
        // unless the Figma instructions are included in the prompt)
        if (action.type === 'fetchFigmaFrame') {
          const url = action.payload.figmaUrl || action.payload.path
          if (!url) {
            result = {
              success: false,
              message: 'Figma URL is required for fetchFigmaFrame action',
            }
          } else {
            // Call the API endpoint directly
            const response = await fetch('/api/figma/fetch-frame', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url }),
            })
            const data = await response.json()
            if (data.success) {
              result = {
                success: true,
                data: {
                  fileKey: data.fileKey,
                  nodeId: data.nodeId,
                  name: data.name,
                  document: data.document,
                  images: data.images,
                },
                message: `Successfully fetched frame "${data.name}" with ${data.images?.length || 0} image(s)`,
              }
            } else {
              result = {
                success: false,
                message: data.error || 'Failed to fetch Figma frame',
              }
            }
          }
        } else if (action.type === 'uploadFigmaImage') {
          const { figmaNodeId, figmaFileKey, filename } = action.payload
          const nodeId = figmaNodeId || action.payload.path
          const fileKey = figmaFileKey
          const name = filename || 'figma-image.png'

          if (!nodeId) {
            result = {
              success: false,
              message: 'Node ID is required for uploadFigmaImage action',
            }
          } else if (!fileKey) {
            result = {
              success: false,
              message: 'File key is required for uploadFigmaImage action. Make sure to include the fileKey from the fetchFigmaFrame response.',
            }
          } else {
            // Call the API endpoint directly
            const response = await fetch('/api/figma/export-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileKey,
                nodeId,
                filename: name,
                scale: 2,
                format: 'png',
              }),
            })
            const data = await response.json()
            if (data.success) {
              result = {
                success: true,
                data: {
                  asset: data.asset,
                  assetId: data.assetId,
                  url: data.url,
                  filename: data.filename,
                },
                message: `Successfully uploaded image "${data.filename}"`,
              }
            } else {
              result = {
                success: false,
                message: data.error || 'Failed to upload Figma image',
              }
            }
          }
        } else {
          // Handle all other actions via ContentOperations
          const operations = getOperations()
          result = await operations.executeAction(action)
        }

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
   * Undo a previously executed action by restoring pre-execution state
   */
  const undoAction = useCallback(
    async (action: ParsedAction): Promise<ActionResult> => {
      setIsExecuting(true)
      try {
        const operations = getOperations()
        const result = await operations.undoAction(action)
        return result
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Undo failed',
        }
      } finally {
        setIsExecuting(false)
      }
    },
    [getOperations]
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
      // Strip drafts. prefix from document ID for navigation
      const cleanId = documentId.replace(/^drafts\./, '')

      if (!documentType) {
        console.warn('[ContentOperations] Cannot navigate without document type')
        return
      }

      // Use Sanity router to navigate within the Studio
      try {
        router.navigateIntent('edit', {
          id: cleanId,
          type: documentType,
        })
      } catch {
        // Fallback to direct URL navigation
        window.location.href = `/structure/${documentType};${cleanId}`
      }
    },
    [router]
  )

  /**
   * Navigate to a document in Presentation/Preview
   * @param documentId - The document ID
   * @param documentType - The document type (e.g., 'page')
   * @param slug - Optional slug for pages (e.g., 'about-us')
   */
  const navigateToPreview = useCallback(
    (documentId: string, documentType?: string, slug?: string) => {
      // For pages, open in Presentation tool using the slug path
      if (documentType === 'page') {
        const slugPath = slug ? `/${slug}` : '/'
        const presentationUrl = `/presentation?preview=${encodeURIComponent(slugPath)}`
        try {
          router.navigateUrl({path: presentationUrl})
        } catch {
          // Fallback to direct URL
          window.location.href = presentationUrl
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

  /**
   * Fetch frame data from a Figma URL
   * Requires the active workflow to have enableFigmaFetch: true
   */
  const handleFetchFigmaFrame = useCallback(
    async (url: string, workflow?: Workflow): Promise<ActionResult> => {
      // Validate that Figma fetch is enabled for this workflow
      if (workflow && !workflow.enableFigmaFetch) {
        return {
          success: false,
          message: 'Figma integration is not enabled for this skill. Enable it in the skill settings.',
        }
      }

      setIsExecuting(true)
      try {
        const response = await fetch('/api/figma/fetch-frame', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        })

        const data = await response.json()

        if (!data.success) {
          return {
            success: false,
            message: data.error || 'Failed to fetch Figma frame',
          }
        }

        return {
          success: true,
          data: {
            fileKey: data.fileKey,
            nodeId: data.nodeId,
            name: data.name,
            document: data.document,
            images: data.images,
          },
          message: `Successfully fetched frame "${data.name}" with ${data.images?.length || 0} image(s)`,
        }
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to fetch Figma frame',
        }
      } finally {
        setIsExecuting(false)
      }
    },
    []
  )

  /**
   * Upload an image from Figma to Sanity
   * Requires the active workflow to have enableFigmaFetch: true
   */
  const handleUploadFigmaImage = useCallback(
    async (fileKey: string, nodeId: string, filename: string, workflow?: Workflow): Promise<ActionResult> => {
      // Validate that Figma fetch is enabled for this workflow
      if (workflow && !workflow.enableFigmaFetch) {
        return {
          success: false,
          message: 'Figma integration is not enabled for this skill. Enable it in the skill settings.',
        }
      }

      setIsExecuting(true)
      try {
        const response = await fetch('/api/figma/export-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileKey,
            nodeId,
            filename,
            scale: 2, // 2x for retina
            format: 'png',
          }),
        })

        const data = await response.json()

        if (!data.success) {
          return {
            success: false,
            message: data.error || 'Failed to upload Figma image',
          }
        }

        return {
          success: true,
          data: {
            asset: data.asset,
            assetId: data.assetId,
            url: data.url,
            filename: data.filename,
          },
          message: `Successfully uploaded image "${data.filename}"`,
        }
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to upload Figma image',
        }
      } finally {
        setIsExecuting(false)
      }
    },
    []
  )

  return {
    executeAction,
    previewAction,
    cancelAction,
    undoAction,
    isExecuting,
    createPageIncrementally,
    addSectionToPage,
    navigateToStructure,
    navigateToPreview,
    publishDocument,
    unpublishDocument,
    handleFetchFigmaFrame,
    handleUploadFigmaImage,
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
