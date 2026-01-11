/**
 * ClaudeTool Component
 *
 * Main tool component for the Claude Assistant plugin
 * This is rendered in the Sanity Studio navigation
 */

import {useCallback, useEffect, useState, useRef} from 'react'
import {Card, useToast} from '@sanity/ui'
import {useClient, useCurrentUser, useSchema} from 'sanity'
import type {Tool} from 'sanity'
import {ChatInterface} from './components/ChatInterface'
import {useConversations} from './hooks/useConversations'
import {useClaudeChat} from './hooks/useClaudeChat'
import {useInstructions} from './hooks/useInstructions'
import {useContentOperations} from './hooks/useContentOperations'
import {useWorkflows, buildWorkflowContext} from './hooks/useWorkflows'
import {extractSchemaContext} from './lib/schema-context'
import type {ClaudeAssistantOptions} from './index'
import type {Message, ParsedAction, PluginSettings, SchemaContext} from './types'
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
    loadConversation,
    addMessage,
    updateMessage,
    generateTitle,
    updateConversationTitle,
  } = useConversations({apiEndpoint})

  // Instructions hook
  const {
    instructions,
    activeInstruction,
    setActiveInstruction,
  } = useInstructions()

  // Workflows hook
  const {
    workflows,
    selectedWorkflow,
    selectWorkflow,
  } = useWorkflows()

  // Extract schema context on mount
  useEffect(() => {
    if (schema) {
      const context = extractSchemaContext(schema)
      setSchemaContext(context)
    }
  }, [schema])

  // Ref to hold setMessages function (to break circular dependency)
  const setMessagesRef = useRef<React.Dispatch<React.SetStateAction<Message[]>> | null>(null)

  // Ref to hold sendMessage function for auto-follow-up after query results
  const sendMessageRef = useRef<((content: string) => Promise<void>) | null>(null)

  // Helper to update action status in messages
  const updateActionStatus = useCallback(
    (actionId: string, status: ParsedAction['status'], result?: ParsedAction['result'], error?: string) => {
      if (setMessagesRef.current) {
        setMessagesRef.current((prev) =>
          prev.map((msg) => {
            if (!msg.actions) return msg
            const updatedActions = msg.actions.map((a) =>
              a.id === actionId ? {...a, status, result, error} : a
            )
            // Only update if something changed
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

  // Handle action execution
  // Only modifying actions (create, update, delete) require confirmation
  // Read-only actions (query, navigate, explain) execute automatically
  const handleAction = useCallback(
    async (action: ParsedAction) => {
      console.log('[ClaudeTool] handleAction called:', {
        actionId: action.id,
        actionType: action.type,
        description: action.description,
        payload: action.payload,
      })

      // Read-only actions execute immediately without confirmation
      const readOnlyActions = ['query', 'navigate', 'explain']
      const isReadOnly = readOnlyActions.includes(action.type)

      // If confirmBeforeExecute is enabled, only confirm for modifying actions
      if (settings.confirmBeforeExecute && !isReadOnly) {
        // For destructive actions (delete), we'll let ActionCard handle inline confirmation
        // For now, skip the browser confirm for all actions - ActionCard has inline buttons
        // This allows the user to see the action details before confirming
      }

      // Update status to executing
      updateActionStatus(action.id, 'executing')
      console.log('[ClaudeTool] Executing action...')

      const result = await executeAction(action)
      console.log('[ClaudeTool] Action result:', result)

      // Update status based on result
      updateActionStatus(
        action.id,
        result.success ? 'completed' : 'failed',
        result,
        result.success ? undefined : result.message
      )

      if (result.success) {
        toast.push({
          status: 'success',
          title: 'Action completed',
          description: result.message,
        })

        // For query actions, automatically send the results back to Claude
        // so it can formulate the next action (like an update) with real _key values
        if (action.type === 'query' && result.data && sendMessageRef.current) {
          console.log('[ClaudeTool] Query completed - sending results back to Claude automatically')

          // Format the results in a way that's easy for Claude to parse
          const resultJson = JSON.stringify(result.data, null, 2)
          const resultCount = Array.isArray(result.data) ? result.data.length : 1

          // Send the query results as a user message so Claude sees them
          // and can now formulate the update action with real _key values
          const followUpMessage = `Here are the query results (${resultCount} result${resultCount !== 1 ? 's' : ''}):

\`\`\`json
${resultJson}
\`\`\`

Now that you have the real document structure with _id and _key values, please proceed with the update action using the exact _key values from these results.`

          // Small delay to ensure UI updates first
          setTimeout(() => {
            console.log('[ClaudeTool] Sending follow-up message to Claude with query results')
            sendMessageRef.current?.(followUpMessage)
          }, 500)
        }
      } else {
        console.error('[ClaudeTool] Action failed:', result.message)
        toast.push({
          status: 'error',
          title: 'Action failed',
          description: result.message,
        })
      }
    },
    [settings.confirmBeforeExecute, executeAction, toast, updateActionStatus]
  )

  // Build workflow context from selected workflow
  const workflowContext = selectedWorkflow
    ? buildWorkflowContext(selectedWorkflow)
    : undefined

  // Initialize chat hook with apiEndpoint from options
  // Note: We don't pass onAction here because action execution happens via ActionCard
  // which calls onActionExecute after the action is rendered in the UI
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
    // onAction is intentionally not set - action execution happens via ActionCard's
    // auto-execute useEffect (for read-only actions) or manual button click (for modifying actions)
    enableStreaming: settings.enableStreaming,
  })

  // Update refs when functions are available
  useEffect(() => {
    setMessagesRef.current = setMessages
  }, [setMessages])

  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

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
    async (id: string) => {
      selectConversation(id)
      // Load the full conversation with messages from Sanity
      await loadConversation(id)
    },
    [selectConversation, loadConversation]
  )

  // Handle conversation rename
  const handleRenameConversation = useCallback(
    async (id: string, newTitle: string) => {
      await updateConversationTitle(id, newTitle)
    },
    [updateConversationTitle]
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
        onRenameConversation={handleRenameConversation}
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
        // Workflows
        workflows={workflows}
        selectedWorkflow={selectedWorkflow}
        onWorkflowSelect={selectWorkflow}
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
