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
import {CloseIcon, AddIcon, TrashIcon, ResetIcon, ExpandIcon, DragHandleIcon} from '@sanity/icons'
import {useClient, useCurrentUser, useSchema} from 'sanity'
import {MessageList} from './MessageList'
import {MessageInput} from './MessageInput'
import {useClaudeChat} from '../hooks/useClaudeChat'
import {useConversations} from '../hooks/useConversations'
import {useContentOperations} from '../hooks/useContentOperations'
import {useWorkflows, buildWorkflowContext} from '../hooks/useWorkflows'
import {useInstructions} from '../hooks/useInstructions'
import {useCurrentDocument} from '../hooks/useCurrentDocument'
import {useBlockContext} from '../hooks/useBlockContext'
import {extractSchemaContext} from '../lib/schema-context'
import {DEFAULT_SETTINGS} from '../types'
import type {Message, ParsedAction, PluginSettings, SchemaContext, ImageAttachment, DocumentContext, BlockContext} from '../types'
import type {MessageOptions} from '../hooks/useClaudeChat'
import {ImagePickerDialog} from './ImagePickerDialog'
import {DocumentPickerDialog} from './DocumentPicker'

const SETTINGS_STORAGE_KEY = 'claude-assistant-settings'
const FLOATING_CHAT_OPEN_KEY = 'claude-floating-chat-open'
const FLOATING_CHAT_POSITION_KEY = 'claude-floating-chat-position'
const FLOATING_CHAT_CONVERSATION_KEY = 'claude-floating-active-conversation'

interface Position {
  x: number
  y: number
}

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

/**
 * Load floating chat position from localStorage
 */
function loadFloatingChatPosition(): Position | null {
  try {
    const stored = localStorage.getItem(FLOATING_CHAT_POSITION_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore storage errors
  }
  return null
}

/**
 * Save floating chat position to localStorage
 */
function saveFloatingChatPosition(position: Position): void {
  try {
    localStorage.setItem(FLOATING_CHAT_POSITION_KEY, JSON.stringify(position))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear floating chat position from localStorage
 */
function clearFloatingChatPosition(): void {
  try {
    localStorage.removeItem(FLOATING_CHAT_POSITION_KEY)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load floating chat active conversation from localStorage
 */
function loadFloatingChatConversation(): string | null {
  try {
    return localStorage.getItem(FLOATING_CHAT_CONVERSATION_KEY)
  } catch {
    return null
  }
}

/**
 * Save floating chat active conversation to localStorage
 */
function saveFloatingChatConversation(conversationId: string): void {
  try {
    localStorage.setItem(FLOATING_CHAT_CONVERSATION_KEY, conversationId)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear floating chat active conversation from localStorage
 */
function clearFloatingChatConversation(): void {
  try {
    localStorage.removeItem(FLOATING_CHAT_CONVERSATION_KEY)
  } catch {
    // Ignore storage errors
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
  onDragStart,
  onDrag,
  onDragEnd,
  isDragging,
}: FloatingChatProps & {
  onClose: () => void
  onDragStart: (e: React.MouseEvent) => void
  onDrag: (e: MouseEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}) {
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
  // State for selected documents as context
  const [pendingDocuments, setPendingDocuments] = useState<DocumentContext[]>([])
  // State for document picker dialog
  const [documentPickerOpen, setDocumentPickerOpen] = useState(false)
  // Track if user has manually selected documents (disables auto-detection)
  const [hasManualSelection, setHasManualSelection] = useState(false)

  // Auto-detect current document from URL (Structure or Presentation mode)
  const {currentDocument, mode: currentMode, fieldPath} = useCurrentDocument({
    client,
    enabled: !hasManualSelection,
    pollInterval: 500,
  })

  // Log field path changes for debugging
  useEffect(() => {
    if (fieldPath) {
      console.log('[FloatingChat] Field path detected from URL:', fieldPath)
    }
  }, [fieldPath])

  // Listen for block context from the Presentation mode preview iframe
  const {blockContext, clearBlockContext} = useBlockContext({enabled: true})
  // Ref for reading blockContext inside callbacks without adding it as a dependency
  const blockContextRef = useRef<BlockContext | null>(null)
  blockContextRef.current = blockContext

  // Clear block context when the page/document changes
  const prevDocIdRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const docId = currentDocument?._id
    if (prevDocIdRef.current !== undefined && docId !== prevDocIdRef.current) {
      clearBlockContext()
    }
    prevDocIdRef.current = docId
  }, [currentDocument?._id, clearBlockContext])

  // Sync auto-detected document to pending documents when not in manual mode
  useEffect(() => {
    if (hasManualSelection) return

    if (currentDocument) {
      // Only update if different from current pending
      setPendingDocuments((prev) => {
        if (prev.length === 1 && prev[0]._id === currentDocument._id) {
          return prev // Same document, no update needed
        }
        return [currentDocument]
      })
    } else {
      // No document detected, clear pending (only if we had auto-detected ones)
      setPendingDocuments((prev) => {
        if (prev.length === 0) return prev
        return []
      })
    }
  }, [currentDocument, hasManualSelection])

  const {executeAction, undoAction} = useContentOperations()

  // Instructions hook - same as main tool
  const {activeInstruction, rawInstructions, sectionTemplates} = useInstructions()

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

  // Track if we've already processed the pending conversation
  const hasPendingConversationBeenHandled = useRef(false)

  // Check for pending conversation from main tool OR restore last active conversation
  // This runs once on mount to handle the conversation handoff
  useEffect(() => {
    // Only process once per mount
    if (hasPendingConversationBeenHandled.current) return
    hasPendingConversationBeenHandled.current = true

    const handlePendingConversation = async () => {
      try {
        // First priority: pending conversation from main tool (when user clicks "Continue in Presentation/Structure")
        const pendingConversationId = localStorage.getItem('claude-floating-pending-conversation')
        if (pendingConversationId) {
          // Clear it so we don't re-select on subsequent mounts or page navigations
          localStorage.removeItem('claude-floating-pending-conversation')

          console.log('[FloatingChat] Loading pending conversation from main tool:', pendingConversationId)

          // Select and load the conversation
          selectConversation(pendingConversationId)
          const loaded = await loadConversation(pendingConversationId)

          if (loaded) {
            console.log('[FloatingChat] Successfully loaded pending conversation:', pendingConversationId)
            // Save as active conversation for this session
            saveFloatingChatConversation(pendingConversationId)
          } else {
            console.warn('[FloatingChat] Failed to load pending conversation, it may have been deleted')
          }
          return
        }

        // Second priority: restore last active conversation (when reopening floating chat)
        const savedConversationId = loadFloatingChatConversation()
        if (savedConversationId) {
          console.log('[FloatingChat] Restoring last active conversation:', savedConversationId)
          selectConversation(savedConversationId)
          await loadConversation(savedConversationId)
        }
      } catch (err) {
        console.error('[FloatingChat] Error handling pending conversation:', err)
      }
    }

    handlePendingConversation()
  }, [selectConversation, loadConversation])

  // Save active conversation ID whenever it changes
  useEffect(() => {
    if (activeConversation?.id) {
      saveFloatingChatConversation(activeConversation.id)
    }
  }, [activeConversation?.id])

  const {selectedWorkflow} = useWorkflows()

  // Extract schema context on mount
  useEffect(() => {
    if (schema) {
      const context = extractSchemaContext(schema)
      setSchemaContext(context)
    }
  }, [schema])

  const setMessagesRef = useRef<React.Dispatch<React.SetStateAction<Message[]>> | null>(null)
  const sendMessageRef = useRef<((content: string, images?: ImageAttachment[], documentContextsOverride?: DocumentContext[], messageOptions?: MessageOptions) => Promise<void>) | null>(null)

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
\`\`\``

          setTimeout(() => {
            console.log('[FloatingChat] Sending follow-up with query results:', {
              messageLength: followUpMessage.length,
              hasSendMessage: !!sendMessageRef.current,
            })
            sendMessageRef.current?.(followUpMessage, undefined, undefined, {hidden: true})
              ?.catch((err: unknown) => {
                console.error('[FloatingChat] Follow-up sendMessage failed:', err)
                toast.push({
                  status: 'error',
                  title: 'Failed to analyze query results',
                  description: err instanceof Error ? err.message : 'Unknown error',
                })
              })
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

  const handleUndo = useCallback(
    async (action: ParsedAction) => {
      const result = await undoAction(action)

      if (result.success) {
        // Clear the preState after successful undo so the button disappears
        updateActionStatus(action.id, 'completed', {
          success: true,
          ...action.result,
          preState: undefined,
        })
        toast.push({
          status: 'success',
          title: 'Undo successful',
          description: result.message,
        })
      } else {
        toast.push({
          status: 'error',
          title: 'Undo failed',
          description: result.message,
        })
      }
    },
    [undoAction, updateActionStatus, toast]
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
    documentContexts: pendingDocuments,
    rawInstructions: rawInstructions || undefined,
    sectionTemplates: sectionTemplates || undefined,
    activeConversation,
    onAddMessage: addMessage,
    onUpdateMessage: updateMessage,
    onGenerateTitle: generateTitle,
    enableStreaming: settings.enableStreaming,
    enableFigmaFetch: selectedWorkflow?.enableFigmaFetch,
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
  // When block context is present, prepend it as structured context so Claude knows
  // exactly which block the user is referring to.
  // Reads blockContext from ref to avoid recreating this callback on every block click.
  const handleSendMessage = useCallback(async (content: string, images?: ImageAttachment[]) => {
    let enrichedContent = content

    // If block context is attached, prepend it as structured context
    const currentBlockContext = blockContextRef.current
    if (currentBlockContext) {
      const contextLines = [
        `[Selected Block Context]`,
        `Type: ${currentBlockContext.label} (${currentBlockContext.blockType})`,
      ]
      if (currentBlockContext.path) {
        contextLines.push(`Path: ${currentBlockContext.path}`)
      }
      if (currentBlockContext.preview) {
        contextLines.push(`Content: "${currentBlockContext.preview}"`)
      }
      if (currentBlockContext.fieldValue) {
        // Include field value as JSON for Claude to use in updates
        try {
          const fieldJson = JSON.stringify(currentBlockContext.fieldValue, null, 2)
          if (fieldJson.length < 3000) {
            contextLines.push(`Field Value:\n\`\`\`json\n${fieldJson}\n\`\`\``)
          }
        } catch {
          // Skip if not serializable
        }
      }
      contextLines.push('') // blank line before user message

      enrichedContent = contextLines.join('\n') + '\n' + content
      // Clear block context after including it in the message
      clearBlockContext()
    }

    // If no active conversation, create one first and queue the message
    if (!activeConversation) {
      pendingMessageRef.current = {content: enrichedContent, images}
      await createConversation()
      // The useEffect above will send the message once activeConversation updates
    } else {
      // Already have a conversation, send directly
      await sendMessage(enrichedContent, images)
    }
    // Clear pending images after sending
    setPendingImages([])
  }, [activeConversation, createConversation, sendMessage, clearBlockContext])

  // Handle image selection from picker
  const handleImageSelect = useCallback((image: ImageAttachment) => {
    setPendingImages((prev) => [...prev, image])
  }, [])

  // Handle removing a pending image
  const handleRemovePendingImage = useCallback((imageId: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== imageId))
  }, [])

  // Handle document selection change (from manual picker interaction)
  const handleDocumentsChange = useCallback((documents: DocumentContext[]) => {
    setPendingDocuments(documents)
    // Mark as manual selection to disable auto-detection
    setHasManualSelection(true)
  }, [])

  // Handle removing a document from context
  const handleRemoveDocument = useCallback((documentId: string) => {
    setPendingDocuments((prev) => prev.filter((doc) => doc._id !== documentId))
  }, [])

  // Update sendMessageRef to use the wrapped version
  useEffect(() => {
    sendMessageRef.current = handleSendMessage
  }, [handleSendMessage])

  const handleNewChat = useCallback(async () => {
    clearMessages()
    // Reset manual selection so auto-detection resumes
    setHasManualSelection(false)
    setPendingDocuments([])
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
      {/* Header - Draggable */}
      <Card
        padding={3}
        style={{
          borderBottom: '1px solid var(--card-border-color)',
          flexShrink: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={onDragStart}
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            {/* Drag handle indicator */}
            <Box style={{opacity: 0.4, pointerEvents: 'none'}}>
              <DragHandleIcon style={{width: 16, height: 16}} />
            </Box>
            <img
              src="/static/claude-logo.png"
              alt="Claude"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                pointerEvents: 'none',
              }}
            />
            <Text size={1} weight="semibold" style={{pointerEvents: 'none'}}>
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
            onActionUndo={handleUndo}
            maxWidth={380}
            compact
            hideNavigationLinks
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
          showWorkflowPicker={false}
          onUploadImage={() => setImagePickerOpen(true)}
          pendingImages={pendingImages}
          onRemovePendingImage={handleRemovePendingImage}
          onOpenDocumentPicker={() => setDocumentPickerOpen(true)}
          pendingDocuments={pendingDocuments}
          blockContext={blockContext}
          onClearBlockContext={clearBlockContext}
          onRemoveDocument={handleRemoveDocument}
        />
      </Box>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        isOpen={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={handleImageSelect}
        client={client}
      />

      {/* Document Picker Dialog */}
      <DocumentPickerDialog
        isOpen={documentPickerOpen}
        onClose={() => setDocumentPickerOpen(false)}
        client={client}
        selectedDocuments={pendingDocuments}
        onDocumentsChange={handleDocumentsChange}
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

  // Drag state
  const [position, setPosition] = useState<Position | null>(loadFloatingChatPosition)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{mouseX: number; mouseY: number; posX: number; posY: number} | null>(null)

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    saveFloatingChatState(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    saveFloatingChatState(false)
    // Reset position to default bottom-left corner
    setPosition(null)
    clearFloatingChatPosition()
  }, [])

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev
      saveFloatingChatState(newState)
      return newState
    })
  }, [])

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }

    e.preventDefault()
    setIsDragging(true)

    // Calculate current position (default to bottom-left if not set)
    const currentX = position?.x ?? 24
    const currentY = position?.y ?? 24

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: currentX,
      posY: currentY,
    }
  }, [position])

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return

    const deltaX = e.clientX - dragStartRef.current.mouseX
    const deltaY = e.clientY - dragStartRef.current.mouseY

    // Calculate new position (position is from bottom-left, so invert Y delta)
    let newX = dragStartRef.current.posX + deltaX
    let newY = dragStartRef.current.posY - deltaY

    // Constrain to viewport bounds
    const panelWidth = 420
    const panelHeight = 560
    const margin = 10

    // Ensure panel stays within viewport
    newX = Math.max(margin, Math.min(window.innerWidth - panelWidth - margin, newX))
    newY = Math.max(margin, Math.min(window.innerHeight - panelHeight - margin, newY))

    setPosition({x: newX, y: newY})
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (isDragging && position) {
      saveFloatingChatPosition(position)
    }
    setIsDragging(false)
    dragStartRef.current = null
  }, [isDragging, position])

  // Add global mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', handleDragEnd)
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none'

      return () => {
        window.removeEventListener('mousemove', handleDrag)
        window.removeEventListener('mouseup', handleDragEnd)
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleDrag, handleDragEnd])

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

  // Calculate position styles
  const positionStyle = position
    ? {left: position.x, bottom: position.y}
    : {left: 24, bottom: 24}

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyle,
        zIndex: 10000,
      }}
    >
      {isOpen ? (
        <FloatingChatPanel
          apiEndpoint={apiEndpoint}
          onClose={handleClose}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          isDragging={isDragging}
        />
      ) : (
        <FloatingChatButton onClick={handleOpen} />
      )}
    </div>
  )
}

export default FloatingChat
