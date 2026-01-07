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
import type {Conversation, Message, UseConversationsReturn, ParsedAction, ActionType, ActionStatus} from '../types'

const CONVERSATIONS_PER_PAGE = 20
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
  actions?: Array<{
    _key: string
    type: string
    documentId?: string
    documentType?: string
    status: string
    error?: string
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
    messages: (doc.messages || []).map((msg) => ({
      id: msg._key,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      status: 'complete' as const,
      actions: msg.actions?.map((action): ParsedAction => ({
        id: action._key,
        type: action.type as ActionType,
        description: `${action.type} ${action.documentType || 'document'}`,
        status: action.status as ActionStatus,
        payload: {
          documentId: action.documentId,
          documentType: action.documentType,
        },
        error: action.error,
      })),
    })),
    createdAt: new Date(doc.lastActivity || new Date().toISOString()),
    updatedAt: new Date(doc.lastActivity || new Date().toISOString()),
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
    actions: message.actions?.map((action) => ({
      _key: action.id || generateKey(),
      type: action.type,
      documentId: action.payload?.documentId,
      documentType: action.payload?.documentType,
      status: action.status,
      error: action.error,
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
        const query = `*[_type == "claudeConversation" && userId == $userId && !archived] | order(lastActivity desc) [0...${CONVERSATIONS_PER_PAGE}] {
          _id,
          title,
          lastActivity,
          userId,
          archived,
          "messageCount": count(messages),
          messages
        }`

        const results = await client.fetch<SanityConversation[]>(query, {
          userId: currentUser.id,
        })

        const converted = results.map(sanityToConversation)

        // Update cache
        conversationsCacheRef.current = {
          data: converted,
          timestamp: Date.now(),
        }

        setConversations(converted)

        // Set most recent as active if exists and no active conversation
        if (converted.length > 0 && !activeConversationId) {
          setActiveConversationId(converted[0].id)
        }
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
          // Bypass cache on real-time updates
          fetchConversations(true)
        },
        error: (err) => {
          console.error('Subscription error:', err)
        },
      })

    return () => {
      subscriptionRef.current?.unsubscribe()
      // Cancel any pending debounced updates on unmount
      messageUpdateDebouncer.current.cancel()
    }
  }, [client, currentUser?.id, activeConversationId])

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

    const now = new Date().toISOString()

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

    return newConversation
  }, [client, currentUser?.id])

  /**
   * Select a conversation
   */
  const selectConversation = useCallback((id: string) => {
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

        // Update local state
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === conversationId)
          if (exists) {
            return prev.map((c) => (c.id === conversationId ? conversation : c))
          }
          return [conversation, ...prev]
        })

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
      // Find the message index
      const conversation = conversations.find((c) => c.id === conversationId)
      if (!conversation) return

      const messageIndex = conversation.messages.findIndex((m) => m.id === messageId)
      if (messageIndex === -1) return

      // Optimistic local update (always immediate)
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId ? {...msg, ...updates} : msg
              ),
              updatedAt: new Date(),
            }
          }
          return conv
        })
      )

      // For streaming messages, debounce the Sanity update
      const isStreaming = updates.status === 'streaming'

      const performUpdate = async () => {
        // Re-find the conversation to get the latest message state
        const latestConversation = conversations.find((c) => c.id === conversationId)
        if (!latestConversation) return

        const latestMessageIndex = latestConversation.messages.findIndex((m) => m.id === messageId)
        if (latestMessageIndex === -1) return

        const updatedMessage = {...latestConversation.messages[latestMessageIndex], ...updates}
        const sanityMessage = messageToSanity(updatedMessage)

        try {
          await client
            .patch(conversationId)
            .set({[`messages[${latestMessageIndex}]`]: sanityMessage})
            .commit()
        } catch (err) {
          console.error('Failed to update message:', err)
          throw err
        }
      }

      if (isStreaming) {
        // Debounce updates during streaming
        messageUpdateDebouncer.current.debounce(performUpdate, MESSAGE_UPDATE_DEBOUNCE_MS)
      } else {
        // Final update (status changed from streaming) - flush any pending and execute immediately
        await messageUpdateDebouncer.current.flush()
        await performUpdate()
      }
    },
    [client, conversations]
  )

  /**
   * Generate a title for the conversation using Claude
   */
  const generateTitle = useCallback(
    async (conversationId: string, userMessage: string, assistantResponse: string) => {
      if (!apiEndpoint) {
        // Fallback to simple truncation if no API endpoint
        const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
        await updateConversationTitle(conversationId, fallbackTitle)
        return
      }

      try {
        const response = await fetch(`${apiEndpoint}/generate-title`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userMessage,
            assistantResponse: assistantResponse.slice(0, 200),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate title')
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
