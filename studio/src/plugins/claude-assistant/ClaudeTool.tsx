/**
 * ClaudeTool Component
 *
 * Main tool component for the Claude Assistant plugin
 * This is rendered in the Sanity Studio navigation
 */

import {useCallback, useEffect, useState} from 'react'
import {Card, useToast} from '@sanity/ui'
import {useClient, useCurrentUser, useSchema} from 'sanity'
import type {Tool} from 'sanity'
import {ChatInterface} from './components/ChatInterface'
import {useConversations} from './hooks/useConversations'
import {useClaudeChat} from './hooks/useClaudeChat'
import {useInstructions} from './hooks/useInstructions'
import {useContentOperations} from './hooks/useContentOperations'
import {extractSchemaContext} from './lib/schema-context'
import type {ClaudeAssistantOptions} from './index'
import type {ParsedAction, PluginSettings, SchemaContext} from './types'
import {DEFAULT_SETTINGS} from './types'

const SETTINGS_STORAGE_KEY = 'claude-assistant-settings'

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
 * Save settings to localStorage
 */
function saveSettings(settings: PluginSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    console.warn('Failed to save settings to localStorage')
  }
}

/**
 * Props passed to the tool component from Sanity
 */
interface ClaudeToolProps {
  tool: Tool<ClaudeAssistantOptions>
}

/**
 * Main Claude Tool Component
 *
 * Renders the full-height chat interface within the Sanity Studio tool pane
 * Integrates all hooks and passes context to ChatInterface
 */
export function ClaudeTool(props: ClaudeToolProps) {
  const {tool} = props
  const options = tool.options || {}
  const {apiEndpoint} = options

  // Sanity hooks
  const client = useClient({apiVersion: '2024-01-01'})
  const schema = useSchema()
  const currentUser = useCurrentUser()
  const toast = useToast()

  // Local state
  const [settings, setSettings] = useState<PluginSettings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [schemaContext, setSchemaContext] = useState<SchemaContext | null>(null)

  // Content operations hook
  const {executeAction} = useContentOperations()

  // Conversation management hook
  const {
    conversations,
    activeConversation,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useConversations()

  // Instructions hook
  const {
    instructions,
    activeInstruction,
    setActiveInstruction,
  } = useInstructions()

  // Extract schema context on mount
  useEffect(() => {
    if (schema) {
      const context = extractSchemaContext(schema)
      setSchemaContext(context)
    }
  }, [schema])

  // Handle action execution
  // Only modifying actions (create, update, delete) require confirmation
  // Read-only actions (query, navigate, explain) execute automatically
  const handleAction = useCallback(
    async (action: ParsedAction) => {
      // Read-only actions execute immediately without confirmation
      const readOnlyActions = ['query', 'navigate', 'explain']
      const isReadOnly = readOnlyActions.includes(action.type)

      // If confirmBeforeExecute is enabled, only confirm for modifying actions
      if (settings.confirmBeforeExecute && !isReadOnly) {
        // For destructive actions (delete), we'll let ActionCard handle inline confirmation
        // For now, skip the browser confirm for all actions - ActionCard has inline buttons
        // This allows the user to see the action details before confirming
      }

      const result = await executeAction(action)

      if (result.success) {
        toast.push({
          status: 'success',
          title: 'Action completed',
          description: result.message,
        })
      } else {
        toast.push({
          status: 'error',
          title: 'Action failed',
          description: result.message,
        })
      }
    },
    [settings.confirmBeforeExecute, executeAction, toast]
  )

  // Initialize chat hook with apiEndpoint from options
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  } = useClaudeChat({
    apiEndpoint: apiEndpoint || '/api/claude',
    schemaContext,
    customInstructions: settings.customInstructions,
    activeConversation,
    onAction: handleAction,
    enableStreaming: settings.enableStreaming,
  })

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: PluginSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }, [])

  // Handle new chat creation
  const handleNewChat = useCallback(async () => {
    clearMessages()
    await createConversation()
  }, [clearMessages, createConversation])

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    (id: string) => {
      selectConversation(id)
      // Note: In a full implementation, you would also load the messages
      // from the selected conversation into the chat state
    },
    [selectConversation]
  )

  // Handle settings panel open
  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  // Handle settings panel close
  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false)
  }, [])

  return (
    <Card
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ChatInterface
        // Sanity context
        client={client}
        schema={schema}
        currentUser={currentUser}
        schemaContext={schemaContext}
        // Settings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        settingsOpen={settingsOpen}
        onOpenSettings={handleOpenSettings}
        onCloseSettings={handleCloseSettings}
        // Conversations
        conversations={conversations}
        activeConversation={activeConversation}
        onCreateConversation={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={deleteConversation}
        // Chat state
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={sendMessage}
        onClearMessages={clearMessages}
        onRetryLastMessage={retryLastMessage}
        // Actions
        onActionExecute={handleAction}
        // Instructions
        instructions={instructions}
        activeInstruction={activeInstruction}
        onSetActiveInstruction={setActiveInstruction}
        // API config
        apiEndpoint={apiEndpoint}
      />
    </Card>
  )
}

/**
 * Tool Icon Component
 *
 * Custom icon for the Claude tool in the Studio navigation
 */
export function ClaudeToolIcon() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
        fill="currentColor"
      />
      <path
        d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}
