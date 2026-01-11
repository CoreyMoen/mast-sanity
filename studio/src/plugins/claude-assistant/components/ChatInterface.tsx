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
} from '../types'
import {MessageList} from './MessageList'
import {MessageInput, WorkflowOption} from './MessageInput'
import {QuickActions} from './QuickActions'
import {ConversationSidebar} from './ConversationSidebar'
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
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void | Promise<void>
  onRenameConversation?: (id: string, newTitle: string) => void | Promise<void>
  // Chat state
  messages: Message[]
  isLoading: boolean
  error: string | null
  onSendMessage: (content: string) => Promise<void>
  onClearMessages: () => void
  onRetryLastMessage: () => Promise<void>
  // Actions
  onActionExecute: (action: ParsedAction) => Promise<void>
  // Instructions
  instructions?: InstructionSet[]
  activeInstruction?: InstructionSet | null
  onSetActiveInstruction?: (id: string) => void
  // Workflows
  workflows?: Workflow[]
  selectedWorkflow?: Workflow | null
  onWorkflowSelect?: (workflowId: string | null) => void
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
  // Instructions (optional)
  instructions,
  activeInstruction,
  onSetActiveInstruction,
  // Workflows (optional)
  workflows,
  selectedWorkflow,
  onWorkflowSelect,
  // API config (optional)
  apiEndpoint,
}: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(loadSidebarState)
  // State for pre-populated input from quick actions
  const [pendingInput, setPendingInput] = useState('')

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
    (content: string) => {
      onSendMessage(content)
      // Clear pending input after sending
      setPendingInput('')
    },
    [onSendMessage]
  )

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
    onClearMessages()
    onCreateConversation()
    // Quick actions visibility is computed automatically via useMemo
    announceToScreenReader('New conversation started')
    // Focus the message input after creating a new chat
    setTimeout(() => {
      messageInputRef.current?.focus()
    }, 100)
  }, [onClearMessages, onCreateConversation])

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

  // Navigate to a different mode with floating chat
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
    // Navigate to the selected mode
    window.location.href = `/${mode}`
  }, [activeConversation?.id])

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
                      text="Continue in Presentation"
                      onClick={() => handleContinueInMode('presentation')}
                      disabled={!activeConversation}
                    />
                    <MenuItem
                      icon={DocumentsIcon}
                      text="Continue in Structure"
                      onClick={() => handleContinueInMode('structure')}
                      disabled={!activeConversation}
                    />
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
    </Flex>
  )
}
