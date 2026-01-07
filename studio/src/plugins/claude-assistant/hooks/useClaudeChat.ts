/**
 * useClaudeChat Hook
 *
 * Manages chat state and communication with Claude API.
 * Integrates with streaming API endpoint and conversation persistence.
 */

import {useState, useCallback, useRef, useEffect} from 'react'
import type {Message, ParsedAction, SchemaContext, UseClaudeChatReturn} from '../types'
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
export function useClaudeChat(options: UseClaudeChatOptions): UseClaudeChatReturn & {
  setMessages: (messages: Message[]) => void
  cancelStream: () => void
} {
  const {
    apiEndpoint,
    schemaContext,
    customInstructions,
    activeConversation,
    onAddMessage,
    onUpdateMessage,
    onGenerateTitle,
    onAction,
    enableStreaming = true,
  } = options

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isFirstMessageRef = useRef(true)

  // Sync messages with active conversation
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages)
      isFirstMessageRef.current = activeConversation.messages.length === 0
    } else {
      setMessages([])
      isFirstMessageRef.current = true
    }
  }, [activeConversation?.id])

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
    async (content: string) => {
      if (!content.trim()) return
      if (!apiEndpoint) {
        setError('API endpoint is not configured')
        return
      }

      setError(null)
      setIsLoading(true)

      // Create user message
      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        status: 'complete',
      }

      // Add user message to local state immediately
      setMessages((prev) => [...prev, userMessage])

      // Persist user message if we have a conversation
      if (activeConversation && onAddMessage) {
        try {
          await onAddMessage(activeConversation.id, userMessage)
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
        // Build system prompt
        const systemPrompt = buildSystemPrompt({
          schemaContext: schemaContext || {
            documentTypes: [],
            objectTypes: [],
            timestamp: new Date(),
          },
          customInstructions,
        })

        // Build conversation history for API
        const conversationHistory = [...messages, userMessage].map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))

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
        if (activeConversation && onAddMessage) {
          try {
            await onAddMessage(activeConversation.id, finalMessage)
          } catch (err) {
            console.error('Failed to persist assistant message:', err)
          }
        }

        // Generate title if this is the first exchange
        if (isFirstMessageRef.current && activeConversation && onGenerateTitle) {
          isFirstMessageRef.current = false
          try {
            await onGenerateTitle(activeConversation.id, content, fullContent)
          } catch (err) {
            console.error('Failed to generate title:', err)
          }
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
      activeConversation,
      onAddMessage,
      onGenerateTitle,
      onAction,
      enableStreaming,
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
