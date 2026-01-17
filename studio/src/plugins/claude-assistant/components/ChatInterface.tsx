/**
 * ChatInterface Component
 *
 * Main chat interface with collapsible sidebar and chat area
 * Can be used standalone or with props passed from ClaudeTool
 *
 * Accessibility features (WCAG 2.1 AA):
 * - ARIA landmarks for main content and sidebar
 * - Live regions for new messages and status updates
 * - Keyboard shortcuts for common actions
 * - Focus management
 *
 * Performance optimizations:
 * - Lazy-loaded SettingsPanel with React.lazy
 * - Suspense boundary with loading fallback
 */

import React, {useCallback, useState, useRef, useEffect, Suspense, useMemo} from 'react'
import {Box, Card, Flex, Stack, Text, Button, Tooltip, Spinner, Menu, MenuButton, MenuItem, MenuDivider} from '@sanity/ui'
import {
  CogIcon,
  TrashIcon,
  ResetIcon,
  MenuIcon,
  AddIcon,
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  DesktopIcon,
  DocumentsIcon,
} from '@sanity/icons'
import type {SanityClient, Schema, CurrentUser} from 'sanity'
import type {
  Conversation,
  InstructionSet,
  Message,
  ParsedAction,
  PluginSettings,
  QuickAction,
  SchemaContext,
  ImageAttachment,
  DocumentContext as DocumentContextType,
} from '../types'
import {MessageList} from './MessageList'
import {MessageInput, WorkflowOption} from './MessageInput'
import {QuickActions} from './QuickActions'
import {ConversationSidebar} from './ConversationSidebar'
import {ImagePickerDialog} from './ImagePickerDialog'
import {DocumentPickerDialog} from './DocumentPicker'
import {useKeyboardShortcuts, announceToScreenReader} from '../hooks/useKeyboardShortcuts'
import type {Workflow} from '../hooks/useWorkflows'

/**
 * Transform Workflow to WorkflowOption for MessageInput
 */
function toWorkflowOption(workflow: Workflow): WorkflowOption {
  return {
    _id: workflow.id,
    name: workflow.name,
    description: workflow.description,
  }
}

// Lazy-loaded SettingsPanel for better initial load performance
const SettingsPanel = React.lazy(() => import('./SettingsPanel').then(module => ({default: module.SettingsPanel})))

/**
 * Loading fallback for lazy-loaded SettingsPanel
 */
function SettingsPanelLoader() {
  return (
    <Card
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
      }}
    >
      <Card padding={4} radius={2} shadow={2}>
        <Flex align="center" gap={3}>
          <Spinner muted />
          <Text muted>Loading settings...</Text>
        </Flex>
      </Card>
    </Card>
  )
}

/**
 * Props for ChatInterface component
 * All props are now passed from the parent ClaudeTool component
 */
export interface ChatInterfaceProps {
  className?: string
  // Sanity context
  client?: SanityClient
  schema?: Schema
  currentUser?: CurrentUser | null
  schemaContext?: SchemaContext | null
  // Settings
  settings: PluginSettings
  onSettingsChange: (settings: PluginSettings) => void
  settingsOpen: boolean
  onOpenSettings: () => void
  onCloseSettings: () => void
  // Conversations
  conversations: Conversation[]
  activeConversation: Conversation | null
  onCreateConversation: () => void | Promise<void>
  onSelectConversation: (id: string | null) => void
  onDeleteConversation: (id: string) => void | Promise<void>
  onRenameConversation?: (id: string, newTitle: string) => void | Promise<void>
  // Chat state
  messages: Message[]
  isLoading: boolean
  error: string | null
  onSendMessage: (content: string, images?: ImageAttachment[]) => Promise<void>
  onClearMessages: () => void
  onRetryLastMessage: () => Promise<void>
  // Actions
  onActionExecute: (action: ParsedAction) => Promise<void>
  onActionUndo?: (action: ParsedAction) => Promise<void>
  // Instructions
  instructions?: InstructionSet[]
  activeInstruction?: InstructionSet | null
  onSetActiveInstruction?: (id: string) => void
  // Workflows
  workflows?: Workflow[]
  selectedWorkflow?: Workflow | null
  onWorkflowSelect?: (workflowId: string | null) => void
  // Document context
  pendingDocuments?: DocumentContextType[]
  onDocumentsChange?: (documents: DocumentContextType[]) => void
  onRemoveDocument?: (documentId: string) => void
  // API config
  apiEndpoint?: string
}

const SIDEBAR_STATE_KEY = 'claude-assistant-sidebar-open'

/**
 * Load sidebar state from localStorage
 */
function loadSidebarState(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY)
    return stored !== 'false'
  } catch {
    return true
  }
}

/**
 * Save sidebar state to localStorage
 */
function saveSidebarState(isOpen: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(isOpen))
  } catch {
    console.warn('Failed to save sidebar state')
  }
}

/**
 * Get time-based greeting with user's first name
 */
function getGreeting(userName?: string): string {
  const hour = new Date().getHours()
  let greeting: string
  if (hour < 12) {
    greeting = 'Good morning'
  } else if (hour < 17) {
    greeting = 'Good afternoon'
  } else {
    greeting = 'Good evening'
  }

  // Add user name if available
  if (userName) {
    greeting += `, ${userName}`
  }

  return greeting
}

/**
 * Document context extracted from conversation actions
 */
interface DocumentContext {
  documentId: string
  documentType?: string
  slug?: string
}

/**
 * Strip the 'drafts.' prefix from a Sanity document ID
 */
function stripDraftsPrefix(id: string): string {
  return id.replace(/^drafts\./, '')
}

/**
 * Extract the most recently referenced document from conversation messages
 * Looks through actions (completed ones first) to find document references
 */
function extractDocumentContext(messages: Message[]): DocumentContext | null {
  // Iterate through messages in reverse order (most recent first)
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message.actions) continue

    // Look through actions in reverse order
    for (let j = message.actions.length - 1; j >= 0; j--) {
      const action = message.actions[j]

      // Prefer completed actions with results
      if (action.status === 'completed' && action.result?.documentId) {
        const resultData = action.result.data as Record<string, unknown> | undefined
        const slugData = resultData?.slug as {current?: string} | undefined
        // Try to get document type from result data, then fall back to payload
        const docType = (resultData?._type as string) || action.payload.documentType

        return {
          documentId: stripDraftsPrefix(action.result.documentId),
          documentType: docType,
          slug: slugData?.current,
        }
      }

      // For completed query actions, extract document info from result data
      if (action.status === 'completed' && action.type === 'query' && action.result?.data) {
        const resultData = action.result.data as Record<string, unknown> | unknown[]
        // Handle single object result
        const doc = Array.isArray(resultData) ? resultData[0] as Record<string, unknown> : resultData
        if (doc && typeof doc === 'object' && doc._id) {
          const slugData = doc.slug as {current?: string} | undefined
          // Try to get type from result data, or infer from query string
          let docType = doc._type as string | undefined
          if (!docType && action.payload.query) {
            // Try to extract type from query filter like: _type == "page"
            const typeMatch = action.payload.query.match(/_type\s*==\s*["'](\w+)["']/)
            if (typeMatch) {
              docType = typeMatch[1]
            }
          }
          return {
            documentId: stripDraftsPrefix(doc._id as string),
            documentType: docType,
            slug: slugData?.current,
          }
        }
      }

      // Fall back to payload documentId if available
      if (action.payload.documentId) {
        return {
          documentId: stripDraftsPrefix(action.payload.documentId),
          documentType: action.payload.documentType,
        }
      }
    }
  }

  return null
}

export function ChatInterface({
  className,
  // Sanity context (optional, for potential future use)
  client,
  schema,
  currentUser,
  schemaContext,
  // Settings
  settings,
  onSettingsChange,
  settingsOpen,
  onOpenSettings,
  onCloseSettings,
  // Conversations
  conversations,
  activeConversation,
  onCreateConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  // Chat state
  messages,
  isLoading,
  error,
  onSendMessage,
  onClearMessages,
  onRetryLastMessage,
  // Actions
  onActionExecute,
  onActionUndo,
  // Instructions (optional)
  instructions,
  activeInstruction,
  onSetActiveInstruction,
  // Workflows (optional)
  workflows,
  selectedWorkflow,
  onWorkflowSelect,
  // Document context (optional, lifted from parent)
  pendingDocuments: pendingDocumentsProp,
  onDocumentsChange: onDocumentsChangeProp,
  onRemoveDocument: onRemoveDocumentProp,
  // API config (optional)
  apiEndpoint,
}: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(loadSidebarState)
  // State for pre-populated input from quick actions
  const [pendingInput, setPendingInput] = useState('')
  // State for pending image attachments
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([])
  // State for image picker dialog
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  // State for selected documents as context (local fallback if not controlled)
  const [localPendingDocuments, setLocalPendingDocuments] = useState<DocumentContextType[]>([])
  // State for document picker dialog
  const [documentPickerOpen, setDocumentPickerOpen] = useState(false)

  // Use controlled or uncontrolled mode for document context
  const pendingDocuments = pendingDocumentsProp ?? localPendingDocuments
  const setPendingDocuments = onDocumentsChangeProp ?? setLocalPendingDocuments

  // Refs for focus management
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  // Track previous message count for announcements
  const prevMessageCountRef = useRef(messages.length)

  // Announce new messages to screen readers
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const newMessage = messages[messages.length - 1]
      if (newMessage) {
        const sender = newMessage.role === 'user' ? 'You' : 'Claude'
        const preview = newMessage.content?.substring(0, 100) || 'New message'
        announceToScreenReader(`${sender}: ${preview}${newMessage.content && newMessage.content.length > 100 ? '...' : ''}`)
      }
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  // Sync showQuickActions with messages - hide when conversation has messages or loading
  // Use useMemo instead of useEffect/useState to avoid flicker
  const shouldShowQuickActions = useMemo(() => {
    // Don't show quick actions if:
    // 1. There are messages in the conversation
    // 2. We're currently loading/sending a message
    // 3. The active conversation has messages (even if local state hasn't synced yet)
    if (messages.length > 0) return false
    if (isLoading) return false
    if (activeConversation && activeConversation.messages.length > 0) return false
    return true
  }, [messages.length, isLoading, activeConversation])

  // Extract document context from conversation for "Continue in..." navigation
  const documentContext = useMemo(() => extractDocumentContext(messages), [messages])

  // Handle quick action selection - pre-populates the input instead of sending immediately
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      setPendingInput(action.prompt)
      // Focus the input after pre-populating
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 50)
    },
    []
  )

  // Handle send message
  const handleSend = useCallback(
    (content: string, images?: ImageAttachment[]) => {
      onSendMessage(content, images)
      // Clear pending input and images after sending
      setPendingInput('')
      setPendingImages([])
    },
    [onSendMessage]
  )

  // Handle image selection from picker
  const handleImageSelect = useCallback((image: ImageAttachment) => {
    setPendingImages((prev) => [...prev, image])
  }, [])

  // Handle removing a pending image
  const handleRemovePendingImage = useCallback((imageId: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== imageId))
  }, [])

  // Handle document selection change
  const handleDocumentsChange = useCallback((documents: DocumentContextType[]) => {
    setPendingDocuments(documents)
  }, [setPendingDocuments])

  // Handle removing a document from context
  const handleRemoveDocument = useCallback((documentId: string) => {
    if (onRemoveDocumentProp) {
      onRemoveDocumentProp(documentId)
    } else {
      setLocalPendingDocuments((prev) => prev.filter((doc) => doc._id !== documentId))
    }
  }, [onRemoveDocumentProp])

  // Handle model change
  const handleModelChange = useCallback(
    (model: string) => {
      onSettingsChange({...settings, model})
    },
    [settings, onSettingsChange]
  )

  // Handle workflow selection from the + menu
  const handleWorkflowSelectFromMenu = useCallback(
    (workflowOption: WorkflowOption) => {
      // Find the full workflow to get the starterPrompt
      const workflow = workflows?.find(w => w.id === workflowOption._id)
      if (workflow) {
        // Set the workflow as active
        onWorkflowSelect?.(workflow.id)
        // Pre-populate input with starter prompt if available
        if (workflow.starterPrompt) {
          setPendingInput(workflow.starterPrompt)
          setTimeout(() => {
            messageInputRef.current?.focus()
          }, 50)
        }
      }
    },
    [workflows, onWorkflowSelect]
  )

  // Transform workflows for MessageInput
  const workflowOptions: WorkflowOption[] = useMemo(
    () => workflows?.map(toWorkflowOption) || [],
    [workflows]
  )

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const newState = !prev
      saveSidebarState(newState)
      return newState
    })
  }, [])

  // Handle new chat
  const handleNewChat = useCallback(() => {
    // Deselect conversation FIRST (synchronously) to ensure home screen shows immediately
    onSelectConversation(null)
    onClearMessages()
    onCreateConversation()
    // Quick actions visibility is computed automatically via useMemo
    announceToScreenReader('New conversation started')
    // Focus the message input after creating a new chat
    setTimeout(() => {
      messageInputRef.current?.focus()
    }, 100)
  }, [onSelectConversation, onClearMessages, onCreateConversation])

  // Handle clear chat (shows quick actions again)
  const handleClearChat = useCallback(() => {
    onClearMessages()
    // Quick actions visibility is computed automatically via useMemo
    announceToScreenReader('Conversation cleared')
  }, [onClearMessages])

  // Focus the message input
  const focusMessageInput = useCallback(() => {
    messageInputRef.current?.focus()
  }, [])

  // API is always considered configured since key is server-side only
  const isConfigured = true

  // Navigate to a different mode with floating chat, opening the relevant document
  const handleContinueInMode = useCallback((mode: 'presentation' | 'structure') => {
    // Store the current conversation ID for the floating chat to pick up
    const conversationId = activeConversation?.id
    if (conversationId) {
      try {
        localStorage.setItem('claude-floating-pending-conversation', conversationId)
        // Also ensure floating chat will be open
        localStorage.setItem('claude-floating-chat-open', 'true')
      } catch {
        // Ignore storage errors
      }
    }

    // Build the URL with document context if available
    let url = `/${mode}`

    if (documentContext && documentContext.documentType) {
      if (mode === 'structure') {
        // Structure URL: /structure/{type};{id}
        url = `/structure/${documentContext.documentType};${documentContext.documentId}`
      } else if (mode === 'presentation') {
        // Presentation URL: /presentation?preview={slug} for pages
        if (documentContext.documentType === 'page' && documentContext.slug) {
          const slugPath = documentContext.slug === 'index' ? '/' : `/${documentContext.slug}`
          url = `/presentation?preview=${encodeURIComponent(slugPath)}`
        } else {
          // For non-pages or pages without slug, fall back to structure mode
          url = `/structure/${documentContext.documentType};${documentContext.documentId}`
        }
      }
    }

    window.location.href = url
  }, [activeConversation?.id, documentContext])

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    shortcuts: [
      {
        key: 'n',
        metaKey: true,
        handler: handleNewChat,
        description: 'New conversation',
      },
      {
        key: '/',
        handler: focusMessageInput,
        description: 'Focus message input',
      },
      {
        key: 'Escape',
        handler: () => {
          if (settingsOpen) {
            onCloseSettings()
          }
        },
        description: 'Close settings dialog',
        allowInInput: true,
      },
    ],
  })

  return (
    <Flex
      style={{height: '100%', overflow: 'hidden'}}
      className={className}
      role="application"
      aria-label="Claude Assistant chat interface"
    >
      {/* Screen reader only live region for announcements */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      {/* Sidebar */}
      {sidebarOpen && (
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversation?.id || null}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
          onCreate={handleNewChat}
          onRename={onRenameConversation}
        />
      )}

      {/* Main Chat Area */}
      <Flex
        direction="column"
        style={{flex: 1, height: '100%', overflow: 'hidden', minWidth: 0}}
        role="main"
        aria-label="Chat conversation"
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
              <Tooltip
                content={
                  <Box padding={2}>
                    <Text size={1}>{sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}</Text>
                  </Box>
                }
                placement="bottom"
                portal
              >
                <Button
                  icon={sidebarOpen ? ChevronLeftIcon : MenuIcon}
                  mode="bleed"
                  onClick={toggleSidebar}
                  aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                />
              </Tooltip>
              <Text size={2} weight="semibold">
                Claude Assistant
              </Text>
            </Flex>

            <Flex gap={2}>
              <Tooltip
                content={
                  <Box padding={2}>
                    <Text size={1}>New chat</Text>
                  </Box>
                }
                placement="bottom"
                portal
              >
                <Button
                  icon={AddIcon}
                  mode="bleed"
                  tone="primary"
                  onClick={handleNewChat}
                  disabled={isLoading}
                  aria-label="New chat"
                />
              </Tooltip>

              {messages.length > 0 && (
                <>
                  <Tooltip
                    content={
                      <Box padding={2}>
                        <Text size={1}>Retry last message</Text>
                      </Box>
                    }
                    placement="bottom"
                    portal
                  >
                    <Button
                      icon={ResetIcon}
                      mode="bleed"
                      onClick={onRetryLastMessage}
                      disabled={isLoading}
                      aria-label="Retry last message"
                    />
                  </Tooltip>
                  <Tooltip
                    content={
                      <Box padding={2}>
                        <Text size={1}>Clear conversation</Text>
                      </Box>
                    }
                    placement="bottom"
                    portal
                  >
                    <Button
                      icon={TrashIcon}
                      mode="bleed"
                      tone="critical"
                      onClick={handleClearChat}
                      disabled={isLoading}
                      aria-label="Clear conversation"
                    />
                  </Tooltip>
                </>
              )}

              <Tooltip
                content={
                  <Box padding={2}>
                    <Text size={1}>Settings</Text>
                  </Box>
                }
                placement="bottom"
                portal
              >
                <Button
                  ref={settingsButtonRef}
                  icon={CogIcon}
                  mode="bleed"
                  onClick={onOpenSettings}
                  aria-label="Settings"
                  aria-haspopup="dialog"
                />
              </Tooltip>

              {/* More options menu */}
              <MenuButton
                id="chat-more-options"
                button={
                  <Button
                    icon={EllipsisVerticalIcon}
                    mode="bleed"
                    aria-label="More options"
                  />
                }
                menu={
                  <Menu>
                    <MenuItem
                      icon={DesktopIcon}
                      text={documentContext ? `Continue in Presentation` : 'Continue in Presentation'}
                      onClick={() => handleContinueInMode('presentation')}
                      disabled={!documentContext}
                    />
                    <MenuItem
                      icon={DocumentsIcon}
                      text={documentContext ? `Continue in Structure` : 'Continue in Structure'}
                      onClick={() => handleContinueInMode('structure')}
                      disabled={!documentContext}
                    />
                    {!documentContext && (
                      <Box padding={2} paddingTop={1}>
                        <Text size={0} muted>
                          Reference a document to enable navigation
                        </Text>
                      </Box>
                    )}
                  </Menu>
                }
                placement="bottom-end"
                popover={{portal: true}}
              />
            </Flex>
          </Flex>
        </Card>

        {/* Error Display */}
        {error && (
          <Card padding={3} tone="critical" style={{flexShrink: 0}}>
            <Flex align="center" gap={2}>
              <Text size={1} style={{flex: 1}}>{error}</Text>
              <Button
                text="Retry"
                mode="ghost"
                tone="critical"
                onClick={onRetryLastMessage}
              />
            </Flex>
          </Card>
        )}

        {/* Main Content Area */}
        {isConfigured && shouldShowQuickActions ? (
          /* Home State: Centered welcome screen */
          <Box
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 24px',
              overflow: 'auto',
            }}
          >
              <Stack space={4} style={{maxWidth: 680, width: '100%'}}>
              {/* Welcome greeting */}
              <Flex direction="column" align="center" style={{marginBottom: 12}}>
                <img
                  src="/static/claude-logo.png"
                  alt="Claude"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                />
                <Text
                  size={4}
                  weight="bold"
                  style={{
                    fontSize: '1.75rem',
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}
                >
                  {getGreeting(currentUser?.name?.split(' ')[0])}
                </Text>
              </Flex>

              {/* Centered message input */}
              <MessageInput
                ref={messageInputRef}
                onSend={handleSend}
                isLoading={isLoading}
                initialValue={pendingInput}
                model={settings.model}
                onModelChange={handleModelChange}
                variant="centered"
                workflows={workflowOptions}
                onWorkflowSelect={handleWorkflowSelectFromMenu}
                onUploadImage={() => setImagePickerOpen(true)}
                pendingImages={pendingImages}
                onRemovePendingImage={handleRemovePendingImage}
                onOpenDocumentPicker={() => setDocumentPickerOpen(true)}
                pendingDocuments={pendingDocuments}
                onRemoveDocument={handleRemoveDocument}
              />

              {/* Quick action buttons - closer to input */}
              <Box style={{marginTop: -4}}>
                <QuickActions onActionSelect={handleQuickAction} />
              </Box>
            </Stack>
          </Box>
        ) : (
          /* Conversation State: Messages + bottom input */
          <>
            <Box
              style={{
                flex: 1,
                overflow: 'auto',
              }}
            >
              <MessageList
                messages={messages}
                isLoading={isLoading}
                onActionExecute={onActionExecute}
                onActionUndo={onActionUndo}
                maxWidth={680}
              />
            </Box>
            <Box
              padding={3}
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box style={{maxWidth: 680, width: '100%'}}>
                <MessageInput
                  ref={messageInputRef}
                  onSend={handleSend}
                  isLoading={isLoading}
                  placeholder="Reply..."
                  model={settings.model}
                  onModelChange={handleModelChange}
                  variant="default"
                  workflows={workflowOptions}
                  onWorkflowSelect={handleWorkflowSelectFromMenu}
                  onUploadImage={() => setImagePickerOpen(true)}
                  pendingImages={pendingImages}
                  onRemovePendingImage={handleRemovePendingImage}
                  onOpenDocumentPicker={() => setDocumentPickerOpen(true)}
                  pendingDocuments={pendingDocuments}
                  onRemoveDocument={handleRemoveDocument}
                />
              </Box>
            </Box>
          </>
        )}
      </Flex>

      {/* Settings Panel - Lazy loaded with Suspense */}
      {settingsOpen && (
        <Suspense fallback={<SettingsPanelLoader />}>
          <SettingsPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            isOpen={settingsOpen}
            onClose={onCloseSettings}
            triggerRef={settingsButtonRef}
          />
        </Suspense>
      )}

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
    </Flex>
  )
}
