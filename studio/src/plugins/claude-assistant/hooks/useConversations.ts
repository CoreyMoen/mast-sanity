/**
 * useConversations Hook
 *
 * Manages conversation persistence using Sanity as the backend storage.
 * Replaces localStorage with Sanity client for cross-device conversation access.
 *
 * Performance optimizations:
 * - Debounced message updates during streaming (500ms)
 * - Cached conversation list
 * - Optimistic UI updates
 */

import {useState, useCallback, useEffect, useRef} from 'react'
import {useClient, useCurrentUser} from 'sanity'
import type {Conversation, Message, UseConversationsReturn, ParsedAction, ActionType, ActionStatus, ActionPayload, ActionResult} from '../types'
import {parseActions} from '../lib/actions'

const CONVERSATIONS_PER_PAGE = 100
const API_VERSION = '2024-01-01'
const MESSAGE_UPDATE_DEBOUNCE_MS = 500

/**
 * Simple debounce function for message updates
 */
function createDebouncer() {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pendingCallback: (() => Promise<void>) | null = null

  return {
    debounce(callback: () => Promise<void>, delay: number): void {
      pendingCallback = callback
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(async () => {
        if (pendingCallback) {
          await pendingCallback()
          pendingCallback = null
        }
        timeoutId = null
      }, delay)
    },
    flush(): Promise<void> {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (pendingCallback) {
        const callback = pendingCallback
        pendingCallback = null
        return callback()
      }
      return Promise.resolve()
    },
    cancel(): void {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      pendingCallback = null
    },
  }
}

/**
 * Sanity message format from claudeConversation schema
 */
interface SanityMessage {
  _key: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  hidden?: boolean
  actions?: Array<{
    _key: string
    type: string
    description?: string
    documentId?: string
    documentType?: string
    status: string
    error?: string
    payloadJson?: string
    resultJson?: string
  }>
}

/**
 * Sanity conversation document format
 */
interface SanityConversation {
  _id: string
  _type: 'claudeConversation'
  title: string
  userId: string
  messages: SanityMessage[]
  lastActivity: string
  archived: boolean
  workflowIds?: string[]
}

/**
 * Generate a unique key for array items
 */
function generateKey(): string {
  return Math.random().toString(36).substring(2, 12)
}

/**
 * Convert Sanity conversation to internal Conversation format
 */
function sanityToConversation(doc: SanityConversation): Conversation {
  return {
    id: doc._id,
    title: doc.title || 'New Conversation',
    messages: (doc.messages || []).map((msg) => {
      // Re-parse actions from content to recover full payload (query text, field descriptions, etc.)
      const parsedFromContent =
        msg.role === 'assistant' && msg.content ? parseActions(msg.content) : []

      return {
        id: msg._key,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        status: 'complete' as const,
        // Preserve hidden field — UI filters at render time
        hidden:
          msg.hidden ||
          (msg.role === 'user' &&
            /^Here are the query results \(\d+ results?\):/.test(msg.content)) ||
          undefined,
        actions:
          parsedFromContent.length > 0
            ? // Use re-parsed actions (full payload) merged with stored status/error/result
              parsedFromContent.map((parsed, idx) => {
                const stored = msg.actions?.[idx]
                const normalizedStatus = stored?.status === 'success' ? 'completed' : stored?.status
                return {
                  ...parsed,
                  status: (normalizedStatus as ActionStatus) || parsed.status,
                  error: stored?.error || parsed.error,
                  result: stored?.resultJson ? safeParse<ActionResult>(stored.resultJson) : parsed.result,
                }
              })
            : // Fallback to stored-only actions
              msg.actions?.map((action): ParsedAction => {
                const payload = action.payloadJson ? safeParse<ActionPayload>(action.payloadJson) : {
                  documentId: action.documentId,
                  documentType: action.documentType,
                }
                const result = action.resultJson ? safeParse<ActionResult>(action.resultJson) : undefined
                return {
                  id: action._key,
                  type: action.type as ActionType,
                  description: action.description || `${action.type} ${action.documentType || 'document'}`,
                  status: action.status as ActionStatus,
                  payload: payload || {},
                  result,
                  error: action.error,
                }
              }),
      }
    }),
    createdAt: new Date(doc.lastActivity || new Date().toISOString()),
    updatedAt: new Date(doc.lastActivity || new Date().toISOString()),
    workflowIds: doc.workflowIds,
  }
}

function safeParse<T = unknown>(json: string): T | undefined {
  try {
    return JSON.parse(json) as T
  } catch {
    return undefined
  }
}

/**
 * Convert internal Message to Sanity message format
 */
function messageToSanity(message: Message): SanityMessage {
  return {
    _key: message.id || generateKey(),
    role: message.role as 'user' | 'assistant',
    content: message.content,
    timestamp: message.timestamp.toISOString(),
    hidden: message.hidden || undefined,
    actions: message.actions?.map((action) => ({
      _key: action.id || generateKey(),
      type: action.type,
      description: action.description,
      documentId: action.payload?.documentId,
      documentType: action.payload?.documentType,
      status: action.status,
      error: action.error,
      payloadJson: action.payload ? JSON.stringify(action.payload) : undefined,
      resultJson: action.result ? JSON.stringify(action.result) : undefined,
    })),
  }
}

export interface UseConversationsOptions {
  /**
   * API endpoint for generating titles with Claude
   */
  apiEndpoint?: string
}

/**
 * Extended return type for Sanity-backed conversations
 */
export interface UseConversationsSanityReturn extends Omit<UseConversationsReturn, 'createConversation'> {
  createConversation: () => Promise<Conversation>
  addMessage: (conversationId: string, message: Message) => Promise<void>
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => Promise<void>
  loadConversation: (conversationId: string) => Promise<Conversation | null>
  generateTitle: (conversationId: string, userMessage: string, assistantResponse: string) => Promise<void>
  updateWorkflowIds: (conversationId: string, workflowIds: string[]) => Promise<void>
  isLoading: boolean
}

/**
 * Hook for managing conversation history with Sanity persistence
 */
export function useConversations(options: UseConversationsOptions = {}): UseConversationsSanityReturn {
  const {apiEndpoint} = options
  const client = useClient({apiVersion: API_VERSION})
  const currentUser = useCurrentUser()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Subscription cleanup ref
  const subscriptionRef = useRef<{unsubscribe: () => void} | null>(null)

  // Debouncer for message updates during streaming
  const messageUpdateDebouncer = useRef(createDebouncer())

  // Flag to skip subscription updates during active message sending (prevents duplicates)
  const isUpdatingRef = useRef(false)

  // Timer ref for isUpdatingRef resets — enables proper cleanup (prevents leaks)
  const isUpdatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Refs to prevent stale closures in async callbacks
  const conversationsRef = useRef<Conversation[]>([])
  const activeConversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  // Cache ref for conversation list to avoid unnecessary refetches
  const conversationsCacheRef = useRef<{
    data: Conversation[]
    timestamp: number
  } | null>(null)
  const CACHE_TTL_MS = 30000 // 30 seconds cache

  // Fetch user's conversations with caching
  useEffect(() => {
    if (!currentUser?.id) {
      setIsLoading(false)
      return
    }

    const fetchConversations = async (bypassCache = false) => {
      // Check cache first (unless bypassing)
      if (!bypassCache && conversationsCacheRef.current) {
        const cacheAge = Date.now() - conversationsCacheRef.current.timestamp
        if (cacheAge < CACHE_TTL_MS) {
          setConversations(conversationsCacheRef.current.data)
          setIsLoading(false)
          return
        }
      }

      try {
        const query = `*[_type == "claudeConversation" && userId == $userId && !archived && count(messages) > 0] | order(lastActivity desc) [0...${CONVERSATIONS_PER_PAGE}] {
          _id,
          title,
          lastActivity,
          userId,
          archived,
          workflowIds,
          "messageCount": count(messages)
        }`

        const results = await client.fetch<SanityConversation[]>(query, {
          userId: currentUser.id,
        })

        // List query only returns metadata (no messages) — full messages loaded via loadConversation
        const converted: Conversation[] = results.map((doc) => ({
          id: doc._id,
          title: doc.title || 'New Conversation',
          messages: [],
          createdAt: new Date(doc.lastActivity || new Date().toISOString()),
          updatedAt: new Date(doc.lastActivity || new Date().toISOString()),
          workflowIds: doc.workflowIds,
        }))

        // Preserve the active conversation if it's not in the results
        // This prevents losing a newly created conversation due to Sanity's eventual consistency
        // or because the query filters out conversations with 0 messages
        setConversations((prev) => {
          let finalConversations = converted

          const currentActiveId = activeConversationIdRef.current
          if (currentActiveId) {
            const activeInResults = converted.find((c) => c.id === currentActiveId)
            if (!activeInResults) {
              // Active conversation isn't in results, preserve it from previous state
              const activeFromPrev = prev.find((c) => c.id === currentActiveId)
              if (activeFromPrev) {
                finalConversations = [activeFromPrev, ...converted]
              }
            }
          }

          // Update cache with the final list (including preserved conversation)
          conversationsCacheRef.current = {
            data: finalConversations,
            timestamp: Date.now(),
          }

          return finalConversations
        })

        // Don't auto-select a conversation - always start fresh on the home screen
        // Users can select a conversation from the sidebar if they want
      } catch (err) {
        console.error('Failed to fetch conversations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()

    // Subscribe to real-time updates
    const subscriptionQuery = `*[_type == "claudeConversation" && userId == $userId && !archived]`

    subscriptionRef.current = client
      .listen(subscriptionQuery, {userId: currentUser.id})
      .subscribe({
        next: () => {
          // Skip subscription updates if we're in the middle of sending a message
          // This prevents duplicate messages from appearing
          if (!isUpdatingRef.current) {
            // Bypass cache on real-time updates
            fetchConversations(true)
          }
        },
        error: (err) => {
          console.error('Subscription error:', err)
        },
      })

    return () => {
      subscriptionRef.current?.unsubscribe()
      // Cancel any pending debounced updates on unmount
      messageUpdateDebouncer.current.cancel()
      // Clear any pending isUpdating timer
      if (isUpdatingTimerRef.current) {
        clearTimeout(isUpdatingTimerRef.current)
        isUpdatingTimerRef.current = null
      }
    }
  }, [client, currentUser?.id])

  /**
   * Get the active conversation
   */
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(async (): Promise<Conversation> => {
    if (!currentUser?.id) {
      throw new Error('User must be logged in to create a conversation')
    }

    // Immediately clear active conversation to show home screen while creating
    setActiveConversationId(null)

    const now = new Date().toISOString()

    // Set flag to skip subscription updates during conversation creation
    // This prevents the subscription from overwriting local state before Sanity indexes the new doc
    isUpdatingRef.current = true

    try {
      const newDoc = await client.create({
        _type: 'claudeConversation' as const,
        title: 'New Conversation',
        userId: currentUser.id,
        messages: [],
        lastActivity: now,
        archived: false,
      })

      const newConversation: Conversation = {
        id: newDoc._id,
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(now),
        updatedAt: new Date(now),
      }

      setConversations((prev) => [newConversation, ...prev])
      setActiveConversationId(newDoc._id)

      // Invalidate cache so future fetches include the new conversation
      conversationsCacheRef.current = null

      return newConversation
    } finally {
      // Reset flag after a longer delay to allow Sanity to index the new document
      if (isUpdatingTimerRef.current) clearTimeout(isUpdatingTimerRef.current)
      isUpdatingTimerRef.current = setTimeout(() => {
        isUpdatingRef.current = false
        isUpdatingTimerRef.current = null
      }, 3000)
    }
  }, [client, currentUser?.id])

  /**
   * Select a conversation (or deselect by passing null)
   */
  const selectConversation = useCallback((id: string | null) => {
    setActiveConversationId(id)
  }, [])

  /**
   * Delete (archive) a conversation
   */
  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await client.patch(id).set({archived: true}).commit()

        setConversations((prev) => {
          const filtered = prev.filter((c) => c.id !== id)

          // If we deleted the active conversation, select another
          if (activeConversationId === id && filtered.length > 0) {
            setActiveConversationId(filtered[0].id)
          } else if (filtered.length === 0) {
            setActiveConversationId(null)
          }

          return filtered
        })
      } catch (err) {
        console.error('Failed to archive conversation:', err)
      }
    },
    [client, activeConversationId]
  )

  /**
   * Update a conversation's title
   */
  const updateConversationTitle = useCallback(
    async (id: string, title: string) => {
      try {
        await client.patch(id).set({title}).commit()

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === id
              ? {...conv, title, updatedAt: new Date()}
              : conv
          )
        )
      } catch (err) {
        console.error('Failed to update conversation title:', err)
      }
    },
    [client]
  )

  /**
   * Load a full conversation by ID
   */
  const loadConversation = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      try {
        const doc = await client.fetch<SanityConversation>(
          `*[_type == "claudeConversation" && _id == $id][0]`,
          {id: conversationId}
        )

        if (!doc) return null

        const conversation = sanityToConversation(doc)

        // Update local state - create a new array AND new object to ensure re-render
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === conversationId)
          if (exists) {
            // Create new array with new conversation object (spread to ensure new reference)
            return prev.map((c) => (c.id === conversationId ? {...conversation} : c))
          }
          // Prepend new conversation
          return [{...conversation}, ...prev]
        })

        // Also ensure the active conversation ID is set (in case it wasn't already)
        setActiveConversationId(conversationId)

        return conversation
      } catch (err) {
        console.error('Failed to load conversation:', err)
        return null
      }
    },
    [client]
  )

  /**
   * Add a message to a conversation
   */
  const addMessage = useCallback(
    async (conversationId: string, message: Message) => {
      const sanityMessage = messageToSanity(message)
      const now = new Date().toISOString()

      // Set flag to skip subscription updates during message sending
      isUpdatingRef.current = true

      try {
        await client
          .patch(conversationId)
          .setIfMissing({messages: []})
          .append('messages', [sanityMessage])
          .set({lastActivity: now})
          .commit()

        // Update local state
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: [...conv.messages, message],
                updatedAt: new Date(),
              }
            }
            return conv
          })
        )
      } catch (err) {
        console.error('Failed to add message:', err)
        throw err
      } finally {
        // Reset flag after a short delay to allow Sanity to finish processing
        if (isUpdatingTimerRef.current) clearTimeout(isUpdatingTimerRef.current)
        isUpdatingTimerRef.current = setTimeout(() => {
          isUpdatingRef.current = false
          isUpdatingTimerRef.current = null
        }, 1000)
      }
    },
    [client]
  )

  /**
   * Update a message in a conversation
   * Uses debouncing during streaming to avoid excessive API calls
   */
  const updateMessage = useCallback(
    async (conversationId: string, messageId: string, updates: Partial<Message>) => {
      // Find the message in conversations ref (avoids stale closure)
      const conversation = conversationsRef.current.find((c) => c.id === conversationId)
      if (!conversation) return

      const messageIndex = conversation.messages.findIndex((m) => m.id === messageId)
      if (messageIndex === -1) return

      // Merge updates into the current message snapshot (avoids stale closure reads later)
      const mergedMessage = {...conversation.messages[messageIndex], ...updates}

      // Optimistic local update (always immediate)
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId ? mergedMessage : msg
              ),
              updatedAt: new Date(),
            }
          }
          return conv
        })
      )

      // For streaming messages, debounce the Sanity update
      const isStreaming = updates.status === 'streaming'

      // Build the Sanity message from the merged snapshot (not from a stale closure re-read)
      const sanityMessage = messageToSanity(mergedMessage)

      const performUpdate = async () => {
        try {
          // Use _key selector instead of array index for reliable patching
          // Array indices can mismatch if local state and Sanity diverge
          await client
            .patch(conversationId)
            .set({[`messages[_key=="${messageId}"]`]: sanityMessage})
            .commit()
        } catch (err) {
          console.error('Failed to update message:', err)
        }
      }

      if (isStreaming) {
        // Debounce updates during streaming
        // Each call replaces the pending callback, so the debounced version
        // always uses the latest mergedMessage and sanityMessage
        messageUpdateDebouncer.current.debounce(performUpdate, MESSAGE_UPDATE_DEBOUNCE_MS)
      } else {
        // Final update (status changed from streaming) - flush any pending and execute immediately
        await messageUpdateDebouncer.current.flush()
        await performUpdate()
      }
    },
    [client]
  )

  /**
   * Generate a title for the conversation using Claude
   */
  const generateTitle = useCallback(
    async (conversationId: string, userMessage: string, assistantResponse: string) => {
      // Default to /api/claude if no apiEndpoint provided
      const baseEndpoint = apiEndpoint || '/api/claude'

      try {
        const response = await fetch(`${baseEndpoint}/generate-title`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userMessage,
            assistantResponse: assistantResponse.slice(0, 200),
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to generate title: ${response.status}`)
        }

        const {title} = await response.json()

        if (title) {
          await updateConversationTitle(conversationId, title)
        }
      } catch (err) {
        console.error('Failed to generate title with Claude:', err)
        // Fallback to simple truncation
        const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
        await updateConversationTitle(conversationId, fallbackTitle)
      }
    },
    [apiEndpoint, updateConversationTitle]
  )

  /**
   * Update workflow IDs for a conversation
   */
  const updateWorkflowIds = useCallback(
    async (conversationId: string, workflowIds: string[]) => {
      try {
        await client.patch(conversationId).set({workflowIds}).commit()

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? {...conv, workflowIds, updatedAt: new Date()}
              : conv
          )
        )
      } catch (err) {
        console.error('Failed to update workflow IDs:', err)
      }
    },
    [client]
  )

  return {
    conversations,
    activeConversation,
    createConversation,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    addMessage,
    updateMessage,
    loadConversation,
    generateTitle,
    updateWorkflowIds,
    isLoading,
  }
}

/**
 * Generate a title from the first message (utility for backward compatibility)
 */
export function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user')
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim()
    if (content.length <= 50) {
      return content
    }
    return content.substring(0, 47) + '...'
  }
  return 'New Conversation'
}
