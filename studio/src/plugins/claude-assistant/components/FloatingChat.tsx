/**
 * FloatingChat Component
 *
 * A simplified, floating version of the Claude chat interface
 * designed to appear as a bottom-right overlay across all Studio views.
 * Similar to Intercom-style chat widgets.
 *
 * Features:
 * - Collapsible floating button + expandable chat panel
 * - No conversation sidebar (simplified UX)
 * - Works across Structure, Presentation, and other tools
 * - Persists state across tool navigation
 * - Shares settings with main Claude tool via localStorage
 */

import React, {useCallback, useState, useRef, useEffect} from 'react'
import {Box, Card, Flex, Stack, Text, Button, Tooltip, useToast} from '@sanity/ui'
import {CloseIcon, AddIcon, TrashIcon, ResetIcon, ExpandIcon} from '@sanity/icons'
import {useClient, useCurrentUser, useSchema} from 'sanity'
import {MessageList} from './MessageList'
import {MessageInput} from './MessageInput'
import {useClaudeChat} from '../hooks/useClaudeChat'
import {useConversations} from '../hooks/useConversations'
import {useContentOperations} from '../hooks/useContentOperations'
import {useWorkflows, buildWorkflowContext} from '../hooks/useWorkflows'
import {useInstructions} from '../hooks/useInstructions'
import {extractSchemaContext} from '../lib/schema-context'
import {DEFAULT_SETTINGS} from '../types'
import type {Message, ParsedAction, PluginSettings, SchemaContext, ImageAttachment} from '../types'
import {ImagePickerDialog} from './ImagePickerDialog'

const SETTINGS_STORAGE_KEY = 'claude-assistant-settings'
const FLOATING_CHAT_OPEN_KEY = 'claude-floating-chat-open'

/**
 * Load settings from localStorage
 */
function loadSettings(): PluginSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      return {...DEFAULT_SETTINGS, ...JSON.parse(stored)}
    }
  } catch {
    console.warn('Failed to load settings from localStorage')
  }
  return DEFAULT_SETTINGS
}

/**
 * Load floating chat open state from localStorage
 */
function loadFloatingChatState(): boolean {
  try {
    return localStorage.getItem(FLOATING_CHAT_OPEN_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Save floating chat open state to localStorage
 */
function saveFloatingChatState(isOpen: boolean): void {
  try {
    localStorage.setItem(FLOATING_CHAT_OPEN_KEY, String(isOpen))
  } catch {
    console.warn('Failed to save floating chat state')
  }
}

interface FloatingChatProps {
  apiEndpoint?: string
}

/**
 * Save settings to localStorage (shared with main tool)
 */
function saveSettings(settings: PluginSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    console.warn('Failed to save settings to localStorage')
  }
}

/**
 * Hook to sync settings with localStorage (bidirectional sync with main tool)
 */
function useSharedSettings(): [PluginSettings, (settings: PluginSettings) => void] {
  const [settings, setSettings] = useState<PluginSettings>(loadSettings)

  useEffect(() => {
    // Listen for storage events (when main tool saves settings)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY && event.newValue) {
        try {
          const newSettings = {...DEFAULT_SETTINGS, ...JSON.parse(event.newValue)}
          setSettings(newSettings)
        } catch {
          console.warn('Failed to parse settings from storage event')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Also reload settings when component mounts (in case they changed while unmounted)
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  // Update settings both locally and in localStorage
  const updateSettings = useCallback((newSettings: PluginSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }, [])

  return [settings, updateSettings]
}

/**
 * Floating Chat Panel - The actual chat interface
 */
function FloatingChatPanel({
  apiEndpoint,
  onClose,
}: FloatingChatProps & {onClose: () => void}) {
  const schema = useSchema()
  const currentUser = useCurrentUser()
  const client = useClient({apiVersion: '2024-01-01'})
  const toast = useToast()

  // Use shared settings that sync with main tool (bidirectional)
  const [settings, updateSettings] = useSharedSettings()
  const [schemaContext, setSchemaContext] = useState<SchemaContext | null>(null)

  // State for pending image attachments
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([])
  // State for image picker dialog
  const [imagePickerOpen, setImagePickerOpen] = useState(false)

  const {executeAction} = useContentOperations()

  // Instructions hook - same as main tool
  const {activeInstruction} = useInstructions()

  const {
    conversations,
    activeConversation,
    createConversation,
    selectConversation,
    loadConversation,
    addMessage,
    updateMessage,
    generateTitle,
  } = useConversations({apiEndpoint})

  // Check for pending conversation from main tool (when user clicks "Continue in Presentation/Structure")
  useEffect(() => {
    try {
      const pendingConversationId = localStorage.getItem('claude-floating-pending-conversation')
      if (pendingConversationId) {
        // Clear it so we don't re-select on subsequent mounts
        localStorage.removeItem('claude-floating-pending-conversation')
        // Select and load the conversation
        selectConversation(pendingConversationId)
        loadConversation(pendingConversationId)
      }
    } catch {
      // Ignore storage errors
    }
  }, [selectConversation, loadConversation])

  const {selectedWorkflow} = useWorkflows()

  // Extract schema context on mount
  useEffect(() => {
    if (schema) {
      const context = extractSchemaContext(schema)
      setSchemaContext(context)
    }
  }, [schema])

  const setMessagesRef = useRef<React.Dispatch<React.SetStateAction<Message[]>> | null>(null)
  const sendMessageRef = useRef<((content: string) => Promise<void>) | null>(null)

  const updateActionStatus = useCallback(
    (actionId: string, status: ParsedAction['status'], result?: ParsedAction['result'], error?: string) => {
      if (setMessagesRef.current) {
        setMessagesRef.current((prev) =>
          prev.map((msg) => {
            if (!msg.actions) return msg
            const updatedActions = msg.actions.map((a) =>
              a.id === actionId ? {...a, status, result, error} : a
            )
            if (updatedActions.some((a, i) => a !== msg.actions![i])) {
              return {...msg, actions: updatedActions}
            }
            return msg
          })
        )
      }
    },
    []
  )

  const handleAction = useCallback(
    async (action: ParsedAction) => {
      // Note: confirmBeforeExecute is respected - ActionCard handles inline confirmation
      // for modifying actions, while read-only actions (query, navigate, explain) auto-execute
      updateActionStatus(action.id, 'executing')

      const result = await executeAction(action)

      updateActionStatus(
        action.id,
        result.success ? 'completed' : 'failed',
        result,
        result.success ? undefined : result.message
      )

      // Show toast notifications (same as main tool)
      if (result.success) {
        toast.push({
          status: 'success',
          title: 'Action completed',
          description: result.message,
        })

        // Auto-follow-up for query results
        if (action.type === 'query' && result.data && sendMessageRef.current) {
          const resultJson = JSON.stringify(result.data, null, 2)
          const resultCount = Array.isArray(result.data) ? result.data.length : 1

          const followUpMessage = `Here are the query results (${resultCount} result${resultCount !== 1 ? 's' : ''}):

\`\`\`json
${resultJson}
\`\`\`

Now that you have the real document structure with _id and _key values, please proceed with the update action using the exact _key values from these results.`

          setTimeout(() => {
            sendMessageRef.current?.(followUpMessage)
          }, 500)
        }
      } else {
        toast.push({
          status: 'error',
          title: 'Action failed',
          description: result.message,
        })
      }
    },
    [executeAction, updateActionStatus, toast]
  )

  const workflowContext = selectedWorkflow
    ? buildWorkflowContext(selectedWorkflow)
    : undefined

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
    setMessages,
  } = useClaudeChat({
    apiEndpoint: apiEndpoint || '/api/claude',
    schemaContext,
    customInstructions: settings.customInstructions,
    workflowContext,
    activeConversation,
    onAddMessage: addMessage,
    onUpdateMessage: updateMessage,
    onGenerateTitle: generateTitle,
    enableStreaming: settings.enableStreaming,
  })

  useEffect(() => {
    setMessagesRef.current = setMessages
  }, [setMessages])

  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  // Track pending message that needs to be sent after conversation is created
  const pendingMessageRef = useRef<{content: string; images?: ImageAttachment[]} | null>(null)

  // Effect to send pending message once conversation is ready
  useEffect(() => {
    if (activeConversation && pendingMessageRef.current) {
      const messageToSend = pendingMessageRef.current
      pendingMessageRef.current = null
      // Small delay to ensure state is fully settled
      setTimeout(() => {
        sendMessage(messageToSend.content, messageToSend.images)
      }, 100)
    }
  }, [activeConversation, sendMessage])

  // Wrap sendMessage to auto-create conversation if needed
  const handleSendMessage = useCallback(async (content: string, images?: ImageAttachment[]) => {
    // If no active conversation, create one first and queue the message
    if (!activeConversation) {
      pendingMessageRef.current = {content, images}
      await createConversation()
      // The useEffect above will send the message once activeConversation updates
    } else {
      // Already have a conversation, send directly
      await sendMessage(content, images)
    }
    // Clear pending images after sending
    setPendingImages([])
  }, [activeConversation, createConversation, sendMessage])

  // Handle image selection from picker
  const handleImageSelect = useCallback((image: ImageAttachment) => {
    setPendingImages((prev) => [...prev, image])
  }, [])

  // Handle removing a pending image
  const handleRemovePendingImage = useCallback((imageId: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== imageId))
  }, [])

  // Update sendMessageRef to use the wrapped version
  useEffect(() => {
    sendMessageRef.current = handleSendMessage
  }, [handleSendMessage])

  const handleNewChat = useCallback(async () => {
    clearMessages()
    await createConversation()
  }, [clearMessages, createConversation])

  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  // Open full Claude tool with current conversation
  const handleOpenFullTool = useCallback(() => {
    // Navigate to Claude tool - the conversation will be available there
    // since they share the same Sanity storage
    const conversationId = activeConversation?.id
    if (conversationId) {
      // Store the conversation ID to auto-select when Claude tool loads
      try {
        localStorage.setItem('claude-assistant-pending-conversation', conversationId)
      } catch {
        // Ignore storage errors
      }
    }
    // Navigate to Claude tool
    window.location.href = '/claude'
  }, [activeConversation?.id])

  return (
    <Card
      shadow={4}
      radius={3}
      style={{
        width: 420,
        height: 560,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Card
        padding={3}
        style={{
          borderBottom: '1px solid var(--card-border-color)',
          flexShrink: 0,
        }}
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <img
              src="/static/claude-logo.png"
              alt="Claude"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
              }}
            />
            <Text size={1} weight="semibold">
              Claude Assistant
            </Text>
          </Flex>

          <Flex gap={1}>
            <Tooltip
              content={<Box padding={2}><Text size={1}>New chat</Text></Box>}
              placement="top"
              portal
            >
              <Button
                icon={AddIcon}
                mode="bleed"
                tone="primary"
                onClick={handleNewChat}
                disabled={isLoading}
                fontSize={1}
                padding={2}
              />
            </Tooltip>

            <Tooltip
              content={<Box padding={2}><Text size={1}>Open full view</Text></Box>}
              placement="top"
              portal
            >
              <Button
                icon={ExpandIcon}
                mode="bleed"
                onClick={handleOpenFullTool}
                fontSize={1}
                padding={2}
              />
            </Tooltip>

            {messages.length > 0 && (
              <>
                <Tooltip
                  content={<Box padding={2}><Text size={1}>Retry</Text></Box>}
                  placement="top"
                  portal
                >
                  <Button
                    icon={ResetIcon}
                    mode="bleed"
                    onClick={retryLastMessage}
                    disabled={isLoading}
                    fontSize={1}
                    padding={2}
                  />
                </Tooltip>
                <Tooltip
                  content={<Box padding={2}><Text size={1}>Clear</Text></Box>}
                  placement="top"
                  portal
                >
                  <Button
                    icon={TrashIcon}
                    mode="bleed"
                    tone="critical"
                    onClick={clearMessages}
                    disabled={isLoading}
                    fontSize={1}
                    padding={2}
                  />
                </Tooltip>
              </>
            )}

            <Tooltip
              content={<Box padding={2}><Text size={1}>Close</Text></Box>}
              placement="top"
              portal
            >
              <Button
                icon={CloseIcon}
                mode="bleed"
                onClick={onClose}
                fontSize={1}
                padding={2}
              />
            </Tooltip>
          </Flex>
        </Flex>
      </Card>

      {/* Error Display */}
      {error && (
        <Card padding={2} tone="critical" style={{flexShrink: 0}}>
          <Text size={1}>{error}</Text>
        </Card>
      )}

      {/* Messages */}
      <Box style={{flex: 1, overflow: 'auto'}}>
        {messages.length === 0 ? (
          <Flex
            align="center"
            justify="center"
            style={{height: '100%', padding: 24}}
          >
            <Stack space={3} style={{textAlign: 'center'}}>
              <Text size={1} muted>
                Hi{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}! How can I help you today?
              </Text>
              <Text size={0} muted>
                Ask me to create, update, or query content
              </Text>
            </Stack>
          </Flex>
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onActionExecute={handleAction}
            maxWidth={380}
            compact
          />
        )}
      </Box>

      {/* Input */}
      <Box
        padding={2}
        style={{
          borderTop: '1px solid var(--card-border-color)',
          flexShrink: 0,
        }}
      >
        <MessageInput
          ref={messageInputRef}
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder="Ask Claude..."
          variant="compact"
          showAddButton={false}
          showModelSelector={false}
          onUploadImage={() => setImagePickerOpen(true)}
          pendingImages={pendingImages}
          onRemovePendingImage={handleRemovePendingImage}
        />
      </Box>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        isOpen={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={handleImageSelect}
        client={client}
      />
    </Card>
  )
}

/**
 * Floating Chat Button - The collapsed state
 */
function FloatingChatButton({onClick}: {onClick: () => void}) {
  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>Open Claude Assistant</Text>
        </Box>
      }
      placement="left"
      portal
    >
      <button
        onClick={onClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'block',
        }}
      >
        <img
          src="/static/claude-logo.png"
          alt="Claude"
          style={{
            width: 40,
            height: 40,
            display: 'block',
          }}
        />
      </button>
    </Tooltip>
  )
}

/**
 * Main Floating Chat Component
 *
 * Manages the open/closed state and renders either the button or the panel
 */
export function FloatingChat({apiEndpoint}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(loadFloatingChatState)

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    saveFloatingChatState(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    saveFloatingChatState(false)
  }, [])

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev
      saveFloatingChatState(newState)
      return newState
    })
  }, [])

  // Global keyboard shortcut: Cmd/Ctrl + Shift + K to toggle chat
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'k') {
        event.preventDefault()
        handleToggle()
      }
      // Escape to close when open
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggle, handleClose, isOpen])

  // Check if we're already on the Claude tool page
  // In that case, don't show the floating chat to avoid redundancy
  const [isClaudeTool, setIsClaudeTool] = useState(false)

  useEffect(() => {
    const checkLocation = () => {
      const path = window.location.pathname
      setIsClaudeTool(path.includes('/claude'))
    }

    checkLocation()

    // Listen for navigation changes
    const observer = new MutationObserver(checkLocation)
    observer.observe(document.body, {childList: true, subtree: true})

    return () => observer.disconnect()
  }, [])

  // Don't render on the Claude tool page
  if (isClaudeTool) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 10000,
      }}
    >
      {isOpen ? (
        <FloatingChatPanel apiEndpoint={apiEndpoint} onClose={handleClose} />
      ) : (
        <FloatingChatButton onClick={handleOpen} />
      )}
    </div>
  )
}

export default FloatingChat
