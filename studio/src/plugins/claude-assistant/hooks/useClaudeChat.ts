/**
 * useClaudeChat Hook
 *
 * Manages chat state and communication with Claude API.
 * Integrates with streaming API endpoint and conversation persistence.
 */

import React, {useState, useCallback, useRef, useEffect, useMemo} from 'react'
import type {Message, ParsedAction, SchemaContext, UseClaudeChatReturn, ImageAttachment, DocumentContext} from '../types'
import {parseActions, extractTextContent} from '../lib/actions'
import {buildSystemPrompt} from '../lib/instructions'
import type {Conversation} from '../types'

/**
 * Options for the useClaudeChat hook
 */
export interface UseClaudeChatOptions {
  /**
   * API endpoint for Claude requests (e.g., '/api/claude')
   */
  apiEndpoint: string

  /**
   * Schema context for building system prompts
   */
  schemaContext: SchemaContext | null

  /**
   * Custom instructions to include in system prompt
   */
  customInstructions?: string

  /**
   * Workflow context to append to system prompt
   */
  workflowContext?: string

  /**
   * Selected documents as context for the conversation
   */
  documentContexts?: DocumentContext[]

  /**
   * Raw instructions from Sanity for conditional filtering
   */
  rawInstructions?: unknown

  /**
   * Section templates for design context
   */
  sectionTemplates?: unknown[]

  /**
   * Active conversation to sync messages with
   */
  activeConversation?: Conversation | null

  /**
   * Callback to add a message to the conversation
   */
  onAddMessage?: (conversationId: string, message: Message) => Promise<void>

  /**
   * Callback to update a message in the conversation
   */
  onUpdateMessage?: (conversationId: string, messageId: string, updates: Partial<Message>) => Promise<void>

  /**
   * Callback to generate a title for a new conversation
   */
  onGenerateTitle?: (conversationId: string, userMessage: string, assistantResponse: string) => Promise<void>

  /**
   * Callback when an action is parsed from the response
   */
  onAction?: (action: ParsedAction) => void

  /**
   * Whether streaming is enabled
   */
  enableStreaming?: boolean

  /**
   * Claude model to use (e.g., 'claude-sonnet-4-20250514')
   */
  model?: string

  /**
   * Maximum tokens for Claude's response
   */
  maxTokens?: number

  /**
   * Temperature for response generation (0-1)
   */
  temperature?: number

  /**
   * Whether Figma integration is enabled for the active skill
   */
  enableFigmaFetch?: boolean
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Safely serialize an object, handling circular references
 */
function safeSerialize(obj: unknown): unknown {
  const seen = new WeakSet()

  const replacer = (_key: string, value: unknown): unknown => {
    // Handle primitives
    if (value === null || typeof value !== 'object') {
      return value
    }

    // Skip functions
    if (typeof value === 'function') {
      return undefined
    }

    // Handle circular references
    if (seen.has(value as object)) {
      return undefined
    }
    seen.add(value as object)

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, index) => replacer(String(index), item)).filter((v) => v !== undefined)
    }

    // Handle objects - filter out internal properties
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>)) {
      // Skip internal/private properties that might have circular refs
      if (key.startsWith('_')) continue

      const propValue = (value as Record<string, unknown>)[key]
      const serialized = replacer(key, propValue)
      if (serialized !== undefined) {
        result[key] = serialized
      }
    }
    return result
  }

  try {
    // First pass: clean the object
    const cleaned = replacer('', obj)
    // Second pass: verify it can be JSON stringified
    JSON.stringify(cleaned)
    return cleaned
  } catch {
    // Fallback: return null if we can't serialize
    console.warn('Failed to serialize object for API request')
    return null
  }
}

/**
 * Parse SSE stream data
 */
function parseSSEChunk(chunk: string): Array<{text?: string; done?: boolean; error?: string}> {
  const results: Array<{text?: string; done?: boolean; error?: string}> = []
  const lines = chunk.split('\n').filter((line) => line.startsWith('data: '))

  for (const line of lines) {
    const data = line.replace('data: ', '').trim()

    if (data === '[DONE]') {
      results.push({done: true})
      continue
    }

    try {
      const parsed = JSON.parse(data)
      if (parsed.text) {
        results.push({text: parsed.text})
      }
      if (parsed.error) {
        results.push({error: parsed.error})
      }
    } catch {
      // Skip malformed chunks
    }
  }

  return results
}

/**
 * Hook for managing Claude chat interactions with streaming support
 */
export function useClaudeChat(options: UseClaudeChatOptions): Omit<UseClaudeChatReturn, 'sendMessage'> & {
  sendMessage: (content: string, images?: ImageAttachment[]) => Promise<void>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  cancelStream: () => void
} {
  const {
    apiEndpoint,
    schemaContext,
    customInstructions,
    workflowContext,
    documentContexts,
    rawInstructions,
    sectionTemplates,
    activeConversation,
    onAddMessage,
    onUpdateMessage,
    onGenerateTitle,
    onAction,
    enableStreaming = true,
    model,
    maxTokens,
    temperature,
    enableFigmaFetch,
  } = options

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isFirstMessageRef = useRef(true)
  const lastConversationIdRef = useRef<string | null>(null)

  // Sync messages with active conversation
  // Use activeConversation.id and serialized message IDs for proper dependency tracking
  // This ensures we sync when the conversation changes OR when messages are loaded from server
  const conversationMessageIds = useMemo(() =>
    activeConversation?.messages.map(m => m.id).join(',') || '',
    [activeConversation?.messages]
  )

  useEffect(() => {
    if (activeConversation) {
      // Check if this is a new conversation (ID changed)
      const conversationChanged = lastConversationIdRef.current !== activeConversation.id

      if (conversationChanged) {
        console.log('[useClaudeChat] Conversation changed:', {
          from: lastConversationIdRef.current,
          to: activeConversation.id,
          messageCount: activeConversation.messages.length,
        })
        lastConversationIdRef.current = activeConversation.id

        // Initialize isFirstMessageRef based on whether this conversation has messages
        isFirstMessageRef.current = activeConversation.messages.length === 0

        // ALWAYS sync messages when switching to a different conversation
        // This ensures clicking on a past conversation loads its messages
        console.log('[useClaudeChat] Syncing messages due to conversation change:', {
          conversationId: activeConversation.id,
          messageCount: activeConversation.messages.length,
        })
        setMessages(activeConversation.messages)
        return // Exit early, no need to run additional sync logic
      }

      // For the SAME conversation, only sync when server has more or equal messages
      // This prevents overwriting local messages that haven't been persisted yet (e.g., during streaming)
      const localMessageIds = messages.map(m => m.id).join(',')
      const serverMessageCount = activeConversation.messages.length
      const localMessageCount = messages.length

      // If local has MORE messages than server, local is authoritative
      // (pending messages that haven't been persisted yet)
      const localIsAhead = localMessageCount > serverMessageCount

      // Sync when:
      // 1. Server has more messages than local (messages loaded from server or another client)
      // 2. Server has same count but different messages (rare edge case)
      const shouldSync = !localIsAhead && (
        (serverMessageCount > localMessageCount) ||
        (serverMessageCount === localMessageCount && localMessageIds !== conversationMessageIds)
      )

      if (shouldSync && localMessageIds !== conversationMessageIds) {
        console.log('[useClaudeChat] Syncing messages from activeConversation:', {
          conversationId: activeConversation.id,
          localCount: localMessageCount,
          conversationCount: serverMessageCount,
          reason: serverMessageCount > localMessageCount ? 'server has more messages' : 'same count but different messages',
        })
        setMessages(activeConversation.messages)
      } else if (localMessageIds !== conversationMessageIds) {
        console.log('[useClaudeChat] Skipping sync - local messages are ahead:', {
          conversationId: activeConversation.id,
          localCount: localMessageCount,
          conversationCount: serverMessageCount,
          localIsAhead,
        })
      }
    } else {
      setMessages([])
      isFirstMessageRef.current = true
      lastConversationIdRef.current = null
    }
  }, [activeConversation?.id, conversationMessageIds])

  /**
   * Cancel the current stream
   */
  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  /**
   * Send a message to Claude
   */
  const sendMessage = useCallback(
    async (content: string, images?: ImageAttachment[]) => {
      if (!content.trim() && (!images || images.length === 0)) return
      if (!apiEndpoint) {
        setError('API endpoint is not configured')
        return
      }

      setError(null)
      setIsLoading(true)

      // Capture the conversation ID at the start to use throughout the request
      // This ensures we have it even if activeConversation becomes null during processing
      const conversationId = activeConversation?.id || null

      // Create user message with optional images
      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        status: 'complete',
        images: images && images.length > 0 ? images : undefined,
      }

      // Add user message to local state immediately
      setMessages((prev) => [...prev, userMessage])

      // Persist user message if we have a conversation
      if (conversationId && onAddMessage) {
        try {
          await onAddMessage(conversationId, userMessage)
        } catch (err) {
          console.error('Failed to persist user message:', err)
        }
      }

      // Create placeholder for assistant response
      const assistantMessageId = generateMessageId()
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: enableStreaming ? 'streaming' : 'pending',
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Setup abort controller for cancellation
      abortControllerRef.current = new AbortController()

      try {
        // Build system prompt with conditional instruction inclusion
        // Pass user message and raw instructions to enable keyword-based filtering
        // Include section templates for design context when available
        // Include Figma action docs if enabled for the active skill
        const systemPrompt = buildSystemPrompt({
          schemaContext: schemaContext || {
            documentTypes: [],
            objectTypes: [],
            timestamp: new Date(),
          },
          customInstructions,
          workflowContext,
          documentContexts,
          userMessage: content,
          rawInstructions,
          sectionTemplates,
          enableFigmaFetch,
        })

        // Build conversation history for API
        // Handle messages with images by using the Claude multimodal format
        // Filter out messages with empty content (except images) to avoid API errors
        const allMessages = [...messages, userMessage]
        const filteredMessages = allMessages.filter((msg) => {
          // Keep messages with images (they have content via image metadata)
          if (msg.images && msg.images.length > 0) return true
          // Filter out messages with empty content
          return msg.content && msg.content.trim().length > 0
        })

        // Log if any messages were filtered out (helps debug API errors)
        if (filteredMessages.length !== allMessages.length) {
          console.warn('[useClaudeChat] Filtered out messages with empty content:', {
            before: allMessages.length,
            after: filteredMessages.length,
            removed: allMessages.filter(m => !m.content || m.content.trim().length === 0).map(m => ({
              id: m.id,
              role: m.role,
              status: m.status,
            })),
          })
        }

        const conversationHistory = filteredMessages.map((msg) => {
          // If message has images, use multimodal content format
          if (msg.images && msg.images.length > 0) {
            const contentParts: Array<{type: string; text?: string; source?: {type: string; media_type: string; data: string}}> = []

            // Build image metadata context for Claude
            const imageMetadataLines: string[] = ['[Image Attachments Metadata]']
            for (let i = 0; i < msg.images.length; i++) {
              const image = msg.images[i]
              console.log('[useClaudeChat] Image metadata:', {
                name: image.name,
                source: image.source,
                sanityAssetId: image.sanityAssetId,
                sanityAssetRef: image.sanityAssetRef,
                hasSource: 'source' in image,
                hasAssetId: 'sanityAssetId' in image,
              })
              const lines: string[] = [`Image ${i + 1}:`]
              lines.push(`  - Filename: ${image.name}`)
              if (image.width && image.height) {
                lines.push(`  - Dimensions: ${image.width}x${image.height}`)
              }
              lines.push(`  - Type: ${image.mimeType}`)
              if (image.source === 'library' && image.sanityAssetId) {
                lines.push(`  - Source: Sanity Media Library`)
                lines.push(`  - Asset ID: ${image.sanityAssetId}`)
                lines.push(`  - Asset Reference: {"_type": "reference", "_ref": "${image.sanityAssetId}"}`)
                lines.push(`  - NOTE: This image is already in Sanity. Use the asset reference above directly in image blocks.`)
              } else {
                lines.push(`  - Source: User Upload (not yet in Sanity)`)
                lines.push(`  - NOTE: To use this image on a page, you must first upload it to Sanity using an uploadImage action.`)
              }
              imageMetadataLines.push(lines.join('\n'))
            }
            const imageMetadataText = imageMetadataLines.join('\n\n')

            // Add images first
            for (const image of msg.images) {
              if (image.base64) {
                contentParts.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: image.mimeType,
                    data: image.base64,
                  },
                })
              }
            }

            // Add image metadata and user text content
            const textContent = msg.content
              ? `${imageMetadataText}\n\n[User Message]\n${msg.content}`
              : imageMetadataText
            contentParts.push({
              type: 'text',
              text: textContent,
            })

            return {
              role: msg.role as 'user' | 'assistant',
              content: contentParts,
            }
          }

          // Regular text-only message
          return {
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }
        })

        // Safely serialize schema context to avoid circular references
        const safeSchema = safeSerialize(schemaContext)

        // Make the API request
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            messages: conversationHistory,
            system: systemPrompt,
            schema: safeSchema,
            stream: enableStreaming,
            model,
            maxTokens,
            temperature,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `API request failed: ${response.status}`)
        }

        let fullContent = ''

        if (enableStreaming && response.body) {
          // Handle streaming response
          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const {done, value} = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, {stream: true})
            const parsed = parseSSEChunk(chunk)

            for (const item of parsed) {
              if (item.done) {
                break
              }

              if (item.error) {
                throw new Error(item.error)
              }

              if (item.text) {
                fullContent += item.text

                // Update the streaming message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {...msg, content: fullContent}
                      : msg
                  )
                )
              }
            }
          }
        } else {
          // Handle non-streaming response
          const data = await response.json()
          fullContent = data.content || data.text || ''
        }

        // Parse actions from complete response
        const actions = parseActions(fullContent)
        console.log('[useClaudeChat] Parsed actions from response:', {
          actionCount: actions.length,
          actions: actions.map(a => ({ id: a.id, type: a.type, description: a.description })),
          responseLength: fullContent.length,
        })
        const textContent = extractTextContent(fullContent)

        // Finalize the message
        const finalMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: textContent || fullContent,
          timestamp: new Date(),
          status: 'complete',
          actions: actions.length > 0 ? actions : undefined,
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? finalMessage : msg
          )
        )

        // Persist assistant message if we have a conversation
        if (conversationId && onAddMessage) {
          try {
            await onAddMessage(conversationId, finalMessage)
          } catch (err) {
            console.error('Failed to persist assistant message:', err)
          }
        }

        // Generate title if this is the first exchange
        console.log('[useClaudeChat] Title generation check:', {
          isFirstMessage: isFirstMessageRef.current,
          hasConversation: !!conversationId,
          hasCallback: !!onGenerateTitle,
          conversationId,
        })
        if (isFirstMessageRef.current && conversationId && onGenerateTitle) {
          isFirstMessageRef.current = false
          console.log('[useClaudeChat] Calling onGenerateTitle with:', {
            conversationId,
            userMessageLength: content.length,
            responseLength: fullContent.length,
          })
          try {
            await onGenerateTitle(conversationId, content, fullContent)
          } catch (err) {
            console.error('Failed to generate title:', err)
          }
        } else {
          console.log('[useClaudeChat] Title generation skipped because:', {
            notFirstMessage: !isFirstMessageRef.current,
            noConversation: !conversationId,
            noCallback: !onGenerateTitle,
          })
        }

        // Notify about actions
        actions.forEach((action) => onAction?.(action))

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled - update message to show cancellation
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: msg.content + '\n\n*[Response cancelled]*',
                    status: 'complete' as const,
                  }
                : msg
            )
          )
        } else {
          // Handle error
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
          setError(errorMessage)

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `Error: ${errorMessage}`,
                    status: 'error' as const,
                  }
                : msg
            )
          )
        }
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [
      apiEndpoint,
      messages,
      schemaContext,
      customInstructions,
      workflowContext,
      documentContexts,
      rawInstructions,
      sectionTemplates,
      activeConversation,
      onAddMessage,
      onGenerateTitle,
      onAction,
      enableStreaming,
      model,
      maxTokens,
      temperature,
    ]
  )

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    isFirstMessageRef.current = true
  }, [])

  /**
   * Retry the last message
   */
  const retryLastMessage = useCallback(async () => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')

    if (lastUserMessage) {
      // Remove last assistant message if it exists
      setMessages((prev) => {
        // Find last assistant index (compatible with older ES targets)
        let lastAssistantIndex = -1
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === 'assistant') {
            lastAssistantIndex = i
            break
          }
        }
        if (lastAssistantIndex > -1) {
          return prev.slice(0, lastAssistantIndex)
        }
        return prev.slice(0, -1) // Remove last user message, will be re-sent
      })

      await sendMessage(lastUserMessage.content)
    }
  }, [messages, sendMessage])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
    setMessages,
    cancelStream,
  }
}
