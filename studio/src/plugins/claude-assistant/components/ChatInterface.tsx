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

import React, {useCallback, useState, useRef, useEffect, Suspense} from 'react'
import {Box, Card, Flex, Stack, Text, Button, Tooltip, Spinner} from '@sanity/ui'
import {
  CogIcon,
  TrashIcon,
  ResetIcon,
  MenuIcon,
  AddIcon,
  ChevronLeftIcon,
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
import {MessageInput} from './MessageInput'
import {QuickActions} from './QuickActions'
import {ConversationSidebar} from './ConversationSidebar'
import {useKeyboardShortcuts, announceToScreenReader} from '../hooks/useKeyboardShortcuts'

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
  // API config (optional)
  apiEndpoint,
}: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(loadSidebarState)

  // Refs for focus management
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  // Track previous message count for announcements
  const prevMessageCountRef = useRef(messages.length)

  // Derive showQuickActions directly from messages.length
  // This eliminates the race condition that caused flickering
  const showQuickActions = messages.length === 0

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

  // Handle quick action selection
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      onSendMessage(action.prompt)
    },
    [onSendMessage]
  )

  // Handle send message
  const handleSend = useCallback(
    (content: string) => {
      onSendMessage(content)
    },
    [onSendMessage]
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
    announceToScreenReader('New conversation started')
    // Focus the message input after creating a new chat
    setTimeout(() => {
      messageInputRef.current?.focus()
    }, 100)
  }, [onClearMessages, onCreateConversation])

  // Handle clear chat (shows quick actions again since messages will be empty)
  const handleClearChat = useCallback(() => {
    onClearMessages()
    announceToScreenReader('Conversation cleared')
  }, [onClearMessages])

  // Focus the message input
  const focusMessageInput = useCallback(() => {
    messageInputRef.current?.focus()
  }, [])

  // API is always considered configured since key is server-side only
  const isConfigured = true

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

        {/* Messages Area */}
        <Box style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
          {isConfigured && showQuickActions ? (
            <QuickActions onActionSelect={handleQuickAction} />
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              onActionExecute={onActionExecute}
            />
          )}
        </Box>

        {/* Input */}
        {isConfigured && (
          <MessageInput
            ref={messageInputRef}
            onSend={handleSend}
            isLoading={isLoading}
            placeholder="Ask Claude anything about your content..."
          />
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
