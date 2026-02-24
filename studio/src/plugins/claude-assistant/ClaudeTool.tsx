/**
 * ClaudeTool Component
 *
 * Main tool component for the Claude Assistant plugin
 * This is rendered in the Sanity Studio navigation
 */

import {useCallback, useEffect, useState, useRef} from 'react'
import './styles.css'
import {Card, useToast} from '@sanity/ui'
import {useClient, useCurrentUser, useSchema} from 'sanity'
import {useRouter} from 'sanity/router'
import type {Tool} from 'sanity'
import {ChatInterface} from './components/ChatInterface'
import {WorkflowOption} from './components/MessageInput'
import {useConversations} from './hooks/useConversations'
import {useClaudeChat} from './hooks/useClaudeChat'
import {useInstructions} from './hooks/useInstructions'
import {useApiSettings} from './hooks/useApiSettings'
import {useContentOperations} from './hooks/useContentOperations'
import {useWorkflows} from './hooks/useWorkflows'
import {extractSchemaContext} from './lib/schema-context'
import type {ClaudeAssistantOptions} from './index'
import type {Message, ParsedAction, SchemaContext, ImageAttachment, DocumentContext} from './types'
import type {MessageOptions} from './hooks/useClaudeChat'

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
  const router = useRouter()

  // API settings from Sanity (published documents only)
  const {settings} = useApiSettings()

  // Local state
  const [schemaContext, setSchemaContext] = useState<SchemaContext | null>(null)
  // Selected documents as context for Claude
  const [pendingDocuments, setPendingDocuments] = useState<DocumentContext[]>([])
  // Selected workflows as context for Claude
  const [pendingWorkflows, setPendingWorkflows] = useState<WorkflowOption[]>([])

  // Content operations hook
  const {executeAction, undoAction} = useContentOperations()

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
    updateWorkflowIds,
  } = useConversations({apiEndpoint})

  // Instructions hook
  const {
    instructions,
    activeInstruction,
    setActiveInstruction,
    rawInstructions,
    sectionTemplates,
  } = useInstructions()

  // Workflows hook
  const {
    workflows,
    isLoading: workflowsLoading,
  } = useWorkflows()

  // Extract schema context on mount
  useEffect(() => {
    if (schema) {
      const context = extractSchemaContext(schema)
      setSchemaContext(context)
    }
  }, [schema])

  // Check for pending conversation from floating chat
  useEffect(() => {
    try {
      const pendingConversationId = localStorage.getItem('claude-assistant-pending-conversation')
      if (pendingConversationId) {
        // Clear it so we don't re-select on subsequent mounts
        localStorage.removeItem('claude-assistant-pending-conversation')
        // Select and load the conversation
        selectConversation(pendingConversationId)
        loadConversation(pendingConversationId)
      }
    } catch {
      // Ignore storage errors
    }
  }, [selectConversation, loadConversation])

  // Ref to hold setMessages function (to break circular dependency)
  const setMessagesRef = useRef<React.Dispatch<React.SetStateAction<Message[]>> | null>(null)

  // Ref to hold sendMessage function for auto-follow-up after query results
  // This uses sendMessage directly (not handleSendMessage) to avoid creating duplicate conversations
  const sendMessageRef = useRef<((content: string, images?: ImageAttachment[], documentContextsOverride?: DocumentContext[], messageOptions?: MessageOptions) => Promise<void>) | null>(null)

  // Ref to hold handleSendMessage for user-initiated messages (with conversation creation)
  const handleSendMessageRef = useRef<((content: string, images?: ImageAttachment[]) => Promise<void>) | null>(null)

  // Accumulates query results from concurrent auto-executions for batched sending
  const pendingQueryResultsRef = useRef<Array<{ description: string; data: unknown }>>([])
  const queryResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track active conversation for use in callbacks without stale closures
  const activeConversationRef = useRef(activeConversation)
  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (queryResultTimerRef.current) {
        clearTimeout(queryResultTimerRef.current)
      }
    }
  }, [])

  // Clear pending results when switching conversations
  useEffect(() => {
    if (queryResultTimerRef.current || pendingQueryResultsRef.current.length > 0) {
      if (queryResultTimerRef.current) {
        clearTimeout(queryResultTimerRef.current)
        queryResultTimerRef.current = null
      }
      pendingQueryResultsRef.current = []
    }
  }, [activeConversation?.id])

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

  // Persist action results to the conversation store
  const persistActionResult = useCallback(
    (actionId: string, status: ParsedAction['status'], result?: ParsedAction['result'], error?: string) => {
      const conversationId = activeConversationRef.current?.id
      if (!conversationId || !updateMessage) return
      // Read from the latest state using a functional update pattern
      if (setMessagesRef.current) {
        setMessagesRef.current((prev) => {
          const msg = prev.find((m) => m.actions?.some((a) => a.id === actionId))
          if (msg) {
            const updatedActions = msg.actions!.map((a) =>
              a.id === actionId ? {...a, status, result, error} : a
            )
            updateMessage(conversationId, msg.id, {actions: updatedActions})
          }
          return prev // Don't actually change state, just reading it
        })
      }
    },
    [updateMessage]
  )

  // Handle action execution
  // Only modifying actions (create, update, delete) require confirmation
  // Read-only actions (query, navigate, explain) execute automatically
  const handleAction = useCallback(
    async (action: ParsedAction) => {
      // Update status to executing
      updateActionStatus(action.id, 'executing')

      const result = await executeAction(action)

      // Update status based on result
      updateActionStatus(
        action.id,
        result.success ? 'completed' : 'failed',
        result,
        result.success ? undefined : result.message
      )

      // Persist action result to conversation store
      persistActionResult(
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

        if (action.type === 'query' && result.data && sendMessageRef.current) {
          pendingQueryResultsRef.current.push({
            description: action.description,
            data: result.data,
          })

          if (queryResultTimerRef.current) {
            clearTimeout(queryResultTimerRef.current)
          }

          queryResultTimerRef.current = setTimeout(() => {
            const results = pendingQueryResultsRef.current
            pendingQueryResultsRef.current = []
            queryResultTimerRef.current = null

            if (results.length === 0 || !sendMessageRef.current) return

            let followUpMessage: string
            if (results.length === 1) {
              const r = results[0]
              const resultJson = JSON.stringify(r.data, null, 2)
              const resultCount = Array.isArray(r.data) ? r.data.length : 1
              followUpMessage = `Here are the query results (${resultCount} result${resultCount !== 1 ? 's' : ''}):\n\n\`\`\`json\n${resultJson}\n\`\`\``
            } else {
              const parts = results.map((r, i) => {
                const resultJson = JSON.stringify(r.data, null, 2)
                const resultCount = Array.isArray(r.data) ? r.data.length : 1
                return `### Query ${i + 1}: ${r.description} (${resultCount} result${resultCount !== 1 ? 's' : ''})\n\n\`\`\`json\n${resultJson}\n\`\`\``
              })
              followUpMessage = `Here are the results from ${results.length} queries:\n\n${parts.join('\n\n')}`
            }

            sendMessageRef.current(followUpMessage, undefined, undefined, {hidden: true})
              .catch((err) => {
                toast.push({
                  status: 'error',
                  title: 'Failed to analyze query results',
                  description: err instanceof Error ? err.message : 'Unknown error',
                })
              })
          }, 800)
        }
      } else {
        toast.push({
          status: 'error',
          title: 'Action failed',
          description: result.message,
        })
      }
    },
    [executeAction, toast, updateActionStatus, persistActionResult]
  )

  // Handle undo of a previously executed action
  const handleUndo = useCallback(
    async (action: ParsedAction) => {
      const result = await undoAction(action)

      if (result.success) {
        // Clear the preState so Undo button disappears
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
    [undoAction, toast, updateActionStatus]
  )

  // Build workflow context from pending workflows
  const workflowContext = pendingWorkflows.length > 0
    ? pendingWorkflows
        .filter(w => w.systemInstructions)
        .map(w => `## Workflow: ${w.name}\n\n${w.systemInstructions}`)
        .join('\n\n')
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
    customInstructions: activeInstruction?.content || settings.customInstructions,
    workflowContext,
    documentContexts: pendingDocuments,
    rawInstructions: rawInstructions || undefined,
    sectionTemplates: sectionTemplates || undefined,
    activeConversation,
    onAddMessage: addMessage,
    onUpdateMessage: updateMessage,
    onGenerateTitle: generateTitle,
    // onAction is intentionally not set - action execution happens via ActionCard's
    // auto-execute useEffect (for read-only actions) or manual button click (for modifying actions)
    enableStreaming: settings.enableStreaming,
    model: settings.model,
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
  })

  // Update refs when functions are available
  useEffect(() => {
    setMessagesRef.current = setMessages
  }, [setMessages])

  // sendMessageRef is for follow-up messages (query results) - uses sendMessage directly
  // to avoid creating duplicate conversations
  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  // Track pending message that needs to be sent after conversation is created
  const pendingMessageRef = useRef<{content: string, images?: ImageAttachment[], documents?: DocumentContext[]} | null>(null)

  // Keep sendMessage in a ref so the pending message effect doesn't re-run
  // every time sendMessage is recreated
  const sendMessageForPendingRef = useRef(sendMessage)
  useEffect(() => {
    sendMessageForPendingRef.current = sendMessage
  }, [sendMessage])

  // Effect to send pending message once conversation is ready
  useEffect(() => {
    if (activeConversation && pendingMessageRef.current) {
      const messageToSend = pendingMessageRef.current
      pendingMessageRef.current = null
      // Pass captured documents as override to bypass stale closure
      sendMessageForPendingRef.current(
        messageToSend.content,
        messageToSend.images,
        messageToSend.documents,
      )
    }
  }, [activeConversation])

  // Wrap sendMessage to auto-create conversation if needed
  const handleSendMessage = useCallback(async (content: string, images?: ImageAttachment[]) => {
    // If no active conversation, create one first and queue the message
    if (!activeConversation) {
      // Capture current documents at queue time to avoid stale closure
      pendingMessageRef.current = {content, images, documents: pendingDocuments}
      await createConversation()
      // The useEffect above will send the message once activeConversation updates
    } else {
      // Already have a conversation, send directly
      await sendMessage(content, images)
    }
  }, [activeConversation, createConversation, sendMessage, pendingDocuments])

  // Update handleSendMessageRef for user-initiated messages (with conversation creation)
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage
  }, [handleSendMessage])

  // Navigate to Claude Settings in Structure mode
  const handleOpenSettings = useCallback(() => {
    router.navigateUrl({path: '/structure/claudeSettings'})
  }, [router])

  // Handle new chat creation
  const handleNewChat = useCallback(async () => {
    clearMessages()
    await createConversation()
  }, [clearMessages, createConversation])

  // Handle conversation selection (or deselection when null)
  const handleSelectConversation = useCallback(
    async (id: string | null) => {
      selectConversation(id)
      // Load the full conversation with messages from Sanity (only if selecting, not deselecting)
      if (id) {
        await loadConversation(id)
      }
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


  // Handle document context changes
  const handleDocumentsChange = useCallback((documents: DocumentContext[]) => {
    setPendingDocuments(documents)
  }, [])

  // Handle removing a document from context
  const handleRemoveDocument = useCallback((documentId: string) => {
    setPendingDocuments((prev) => prev.filter((doc) => doc._id !== documentId))
  }, [])

  // Track last conversation ID for workflow restoration
  const lastConversationIdForWorkflowsRef = useRef<string | null>(null)
  // Track if user has manually changed workflows (to prevent auto-restore overwriting)
  const hasManualWorkflowChangeRef = useRef(false)

  // Restore workflows when conversation changes
  useEffect(() => {
    const conversationId = activeConversation?.id || null
    const conversationChanged = lastConversationIdForWorkflowsRef.current !== conversationId

    if (conversationChanged) {
      lastConversationIdForWorkflowsRef.current = conversationId
      hasManualWorkflowChangeRef.current = false

      // Always clear pending workflows when conversation changes
      setPendingWorkflows([])

      // If the conversation has stored workflow IDs, restore them
      if (activeConversation?.workflowIds && activeConversation.workflowIds.length > 0 && workflows.length > 0) {
        const restoredWorkflows = activeConversation.workflowIds
          .map(wfId => workflows.find(w => w.id === wfId))
          .filter((w): w is typeof workflows[number] => w !== undefined)
          .map(w => ({
            _id: w.id,
            name: w.name,
            description: w.description,
            systemInstructions: w.systemInstructions,
            starterPrompt: w.starterPrompt,
          }))

        if (restoredWorkflows.length > 0) {
          setPendingWorkflows(restoredWorkflows)
        }
      }
    }
  }, [activeConversation?.id, activeConversation?.workflowIds, workflows])

  // Handle workflow context changes
  const handleWorkflowsChange = useCallback((newWorkflows: WorkflowOption[]) => {
    setPendingWorkflows(newWorkflows)
    hasManualWorkflowChangeRef.current = true

    // Save workflow IDs to the conversation if we have an active conversation
    if (activeConversation?.id) {
      const workflowIds = newWorkflows.map(w => w._id)
      updateWorkflowIds(activeConversation.id, workflowIds)
    }
  }, [activeConversation?.id, updateWorkflowIds])

  // Handle removing a workflow from context
  const handleRemoveWorkflow = useCallback((workflowId: string) => {
    setPendingWorkflows((prev) => {
      const newWorkflows = prev.filter((w) => w._id !== workflowId)
      // Save updated workflow IDs to the conversation
      if (activeConversation?.id) {
        const workflowIds = newWorkflows.map(w => w._id)
        updateWorkflowIds(activeConversation.id, workflowIds)
      }
      return newWorkflows
    })
    hasManualWorkflowChangeRef.current = true
  }, [activeConversation?.id, updateWorkflowIds])

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
        // Settings (from Sanity - published documents only)
        settings={settings}
        onOpenSettings={handleOpenSettings}
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
        onSendMessage={handleSendMessage}
        onClearMessages={clearMessages}
        onRetryLastMessage={retryLastMessage}
        // Actions
        onActionExecute={handleAction}
        onActionUndo={handleUndo}
        // Instructions
        instructions={instructions}
        activeInstruction={activeInstruction}
        onSetActiveInstruction={setActiveInstruction}
        // Workflows
        workflows={workflows}
        pendingWorkflows={pendingWorkflows}
        onWorkflowsChange={handleWorkflowsChange}
        onRemoveWorkflow={handleRemoveWorkflow}
        workflowsLoading={workflowsLoading}
        // Document context
        pendingDocuments={pendingDocuments}
        onDocumentsChange={handleDocumentsChange}
        onRemoveDocument={handleRemoveDocument}
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
