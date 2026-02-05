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
 */

import React, {useCallback, useState, useRef, useEffect, useMemo} from 'react'
import {Box, Card, Flex, Stack, Text, Button, Tooltip, Spinner, Menu, MenuButton, MenuItem, Dialog, Label} from '@sanity/ui'
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
import {WorkflowPickerDialog} from './WorkflowPicker'
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
    systemInstructions: workflow.systemInstructions,
    starterPrompt: workflow.starterPrompt,
    enableFigmaFetch: workflow.enableFigmaFetch,
  }
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
  // Settings (from Sanity - published documents only)
  settings: PluginSettings
  onOpenSettings: () => void
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
  pendingWorkflows?: WorkflowOption[]
  onWorkflowsChange?: (workflows: WorkflowOption[]) => void
  onRemoveWorkflow?: (workflowId: string) => void
  workflowsLoading?: boolean
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
interface ExtractedDocumentContext {
  documentId: string
  documentType?: string
  slug?: string
  name?: string
}

/**
 * Enhanced document context with fetched data (slug may be loaded asynchronously)
 */
interface EnhancedDocumentContext extends ExtractedDocumentContext {
  isLoading?: boolean
}

/**
 * Strip the 'drafts.' prefix from a Sanity document ID
 */
function stripDraftsPrefix(id: string): string {
  return id.replace(/^drafts\./, '')
}

/**
 * Extract ALL unique documents referenced in conversation messages
 * Returns an array of document contexts, most recent first
 */
function extractAllDocumentContexts(messages: Message[]): ExtractedDocumentContext[] {
  const documentMap = new Map<string, ExtractedDocumentContext>()

  // Iterate through all messages
  for (const message of messages) {
    // First, try to extract from message content (for query results displayed as text)
    if (message.content) {
      // Look for JSON-like patterns with "_id" in the message content
      // This handles cases where query results are displayed as text without structured actions
      const idMatches = message.content.match(/"_id"\s*:\s*"([^"]+)"/g)
      const typeMatches = message.content.match(/"_type"\s*:\s*"([^"]+)"/g)
      const nameMatches = message.content.match(/"name"\s*:\s*"([^"]+)"/g)

      if (idMatches) {
        for (let i = 0; i < idMatches.length; i++) {
          const idMatch = idMatches[i].match(/"_id"\s*:\s*"([^"]+)"/)
          if (idMatch) {
            const docId = stripDraftsPrefix(idMatch[1])
            // Try to get corresponding type and name from nearby matches
            const typeMatch = typeMatches?.[i]?.match(/"_type"\s*:\s*"([^"]+)"/)
            const nameMatch = nameMatches?.[i]?.match(/"name"\s*:\s*"([^"]+)"/)

            if (!documentMap.has(docId)) {
              documentMap.set(docId, {
                documentId: docId,
                documentType: typeMatch?.[1],
                name: nameMatch?.[1],
              })
            }
          }
        }
      }
    }

    // Then, process structured actions (more reliable when available)
    if (!message.actions) continue

    for (const action of message.actions) {
      // Check if action is completed (or 'success' for old schema data)
      const isCompleted = action.status === 'completed' || (action.status as string) === 'success'

      // First check payload.documentId (always available if action had a document target)
      if (action.payload?.documentId) {
        const docId = stripDraftsPrefix(action.payload.documentId)
        if (!documentMap.has(docId)) {
          documentMap.set(docId, {
            documentId: docId,
            documentType: action.payload.documentType,
          })
        }
      }

      // Then check result data if available (for richer context like slug)
      if (isCompleted && action.result?.documentId) {
        const docId = stripDraftsPrefix(action.result.documentId)
        const resultData = action.result.data as Record<string, unknown> | undefined
        const slugData = resultData?.slug as {current?: string} | undefined
        const docType = (resultData?._type as string) || action.payload?.documentType

        // Update with richer data
        documentMap.set(docId, {
          documentId: docId,
          documentType: docType,
          slug: slugData?.current,
          name: resultData?.name as string | undefined,
        })
      }

      // For query actions, extract from result data
      if (isCompleted && action.type === 'query' && action.result?.data) {
        const resultData = action.result.data as Record<string, unknown> | unknown[]
        const docs = Array.isArray(resultData) ? resultData : [resultData]

        for (const doc of docs) {
          if (doc && typeof doc === 'object' && (doc as Record<string, unknown>)._id) {
            const docObj = doc as Record<string, unknown>
            const docId = stripDraftsPrefix(docObj._id as string)
            const slugData = docObj.slug as {current?: string} | undefined

            let docType = docObj._type as string | undefined
            if (!docType && action.payload?.query) {
              const typeMatch = action.payload.query.match(/_type\s*==\s*["'](\w+)["']/)
              if (typeMatch) {
                docType = typeMatch[1]
              }
            }

            if (!documentMap.has(docId)) {
              documentMap.set(docId, {
                documentId: docId,
                documentType: docType,
                slug: slugData?.current,
                name: docObj.name as string | undefined,
              })
            }
          }
        }
      }
    }
  }

  // Return array, most recent entries last (they overwrite in Map)
  return Array.from(documentMap.values()).reverse()
}

/**
 * Extract the most recently referenced document from conversation messages
 * Looks through actions (completed ones first) to find document references
 */
function extractDocumentContext(messages: Message[]): ExtractedDocumentContext | null {
  const allDocs = extractAllDocumentContexts(messages)
  return allDocs.length > 0 ? allDocs[0] : null
}

export function ChatInterface({
  className,
  // Sanity context (optional, for potential future use)
  client,
  schema,
  currentUser,
  schemaContext,
  // Settings (from Sanity - published documents only)
  settings,
  onOpenSettings,
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
  pendingWorkflows: pendingWorkflowsProp,
  onWorkflowsChange: onWorkflowsChangeProp,
  onRemoveWorkflow: onRemoveWorkflowProp,
  workflowsLoading,
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
  // State for selected workflows as context (local fallback if not controlled)
  const [localPendingWorkflows, setLocalPendingWorkflows] = useState<WorkflowOption[]>([])
  // State for workflow picker dialog
  const [workflowPickerOpen, setWorkflowPickerOpen] = useState(false)
  // State for document selection modal when continuing to Presentation/Structure
  const [documentSelectModalOpen, setDocumentSelectModalOpen] = useState(false)
  const [pendingNavigationMode, setPendingNavigationMode] = useState<'presentation' | 'structure' | null>(null)

  // Use controlled or uncontrolled mode for document context
  const pendingDocuments = pendingDocumentsProp ?? localPendingDocuments
  const setPendingDocuments = onDocumentsChangeProp ?? setLocalPendingDocuments

  // Use controlled or uncontrolled mode for workflow context
  const pendingWorkflows = pendingWorkflowsProp ?? localPendingWorkflows
  const setPendingWorkflows = onWorkflowsChangeProp ?? setLocalPendingWorkflows

  // Refs for focus management
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
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
  const extractedDocumentContext = useMemo(() => extractDocumentContext(messages), [messages])

  // Enhanced document context state (with fetched slug if needed)
  const [enhancedDocumentContext, setEnhancedDocumentContext] = useState<EnhancedDocumentContext | null>(null)

  // Fetch slug when we have a page documentId but no slug
  useEffect(() => {
    // Also check pendingDocuments first - they take priority and already have slug
    if (pendingDocuments.length > 0) {
      const doc = pendingDocuments[0]
      setEnhancedDocumentContext({
        documentId: doc._id,
        documentType: doc._type,
        slug: doc.slug,
      })
      return
    }

    if (!extractedDocumentContext) {
      setEnhancedDocumentContext(null)
      return
    }

    // If we already have a slug, use it directly
    if (extractedDocumentContext.slug) {
      setEnhancedDocumentContext(extractedDocumentContext)
      return
    }

    // If it's a page and we have client, fetch the slug
    if (extractedDocumentContext.documentType === 'page' && extractedDocumentContext.documentId && client) {
      setEnhancedDocumentContext({...extractedDocumentContext, isLoading: true})

      // Fetch the document to get its slug
      client
        .fetch<{slug?: {current?: string}}>(
          `*[_id == $id || _id == "drafts." + $id][0]{slug}`,
          {id: extractedDocumentContext.documentId}
        )
        .then((result) => {
          setEnhancedDocumentContext({
            ...extractedDocumentContext,
            slug: result?.slug?.current,
            isLoading: false,
          })
        })
        .catch(() => {
          // On error, use what we have
          setEnhancedDocumentContext({...extractedDocumentContext, isLoading: false})
        })
    } else {
      // Not a page or no client, use extracted context as-is
      setEnhancedDocumentContext(extractedDocumentContext)
    }
  }, [extractedDocumentContext, pendingDocuments, client])

  // Use enhanced document context for navigation
  const documentContext = enhancedDocumentContext

  // Extract all documents from conversation history for auto-population
  const allExtractedDocuments = useMemo(() => extractAllDocumentContexts(messages), [messages])

  // Track if user has manually modified document selection
  const [hasManualDocumentSelection, setHasManualDocumentSelection] = useState(false)
  const lastConversationIdRef = useRef<string | null>(null)

  // Auto-populate pendingDocuments when loading a conversation with document history
  useEffect(() => {
    const conversationId = activeConversation?.id || null
    const conversationChanged = lastConversationIdRef.current !== conversationId

    if (conversationChanged) {
      lastConversationIdRef.current = conversationId
      // Reset manual selection flag when conversation changes
      setHasManualDocumentSelection(false)

      // ALWAYS clear pending documents when conversation changes
      // This prevents stale data from the previous conversation showing
      // The effect will re-run after messages sync with the new conversation's data
      setPendingDocuments([])

      // Don't auto-populate yet - wait for messages to sync
      // The effect will re-run when allExtractedDocuments updates
      return
    }

    // Only auto-populate if:
    // 1. We have extracted documents from messages
    // 2. User hasn't manually modified the selection
    // 3. pendingDocuments is empty OR conversation just changed
    const shouldAutoPopulate = allExtractedDocuments.length > 0 &&
      !hasManualDocumentSelection &&
      (pendingDocuments.length === 0 || conversationChanged) &&
      client

    if (shouldAutoPopulate) {
      // Fetch full document info for each extracted document
      const fetchDocumentContexts = async () => {
        const docsToFetch = allExtractedDocuments.slice(0, 5) // Limit to 5 documents
        const fetchedDocs: DocumentContextType[] = []

        for (const extractedDoc of docsToFetch) {
          try {
            const doc = await client.fetch<{_id: string; _type: string; name?: string; title?: string; slug?: {current?: string}}>(
              `*[_id == $id || _id == "drafts." + $id][0]{_id, _type, name, title, slug}`,
              {id: extractedDoc.documentId}
            )
            if (doc) {
              fetchedDocs.push({
                _id: doc._id.replace(/^drafts\./, ''),
                _type: doc._type,
                name: doc.name || doc.title || extractedDoc.documentType || 'Document',
                slug: doc.slug?.current,
              })
            }
          } catch {
            // If fetch fails, use what we have
            if (extractedDoc.documentId && extractedDoc.documentType) {
              fetchedDocs.push({
                _id: extractedDoc.documentId,
                _type: extractedDoc.documentType,
                name: extractedDoc.name || extractedDoc.documentType || 'Document',
                slug: extractedDoc.slug,
              })
            }
          }
        }

        if (fetchedDocs.length > 0) {
          setPendingDocuments(fetchedDocs)
        }
      }

      fetchDocumentContexts()
    }
  }, [allExtractedDocuments, activeConversation?.id, hasManualDocumentSelection, pendingDocuments.length, client, setPendingDocuments])

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
    // Mark as manual selection to prevent auto-population from overwriting
    setHasManualDocumentSelection(true)
  }, [setPendingDocuments])

  // Handle removing a document from context
  const handleRemoveDocument = useCallback((documentId: string) => {
    if (onRemoveDocumentProp) {
      onRemoveDocumentProp(documentId)
    } else {
      setLocalPendingDocuments((prev) => prev.filter((doc) => doc._id !== documentId))
    }
  }, [onRemoveDocumentProp])


  // Handle workflow selection change from picker
  const handleWorkflowsChange = useCallback((newWorkflows: WorkflowOption[]) => {
    setPendingWorkflows(newWorkflows)
    // If a new workflow was added and it has a starter prompt, pre-populate input
    if (newWorkflows.length > pendingWorkflows.length) {
      const addedWorkflow = newWorkflows[newWorkflows.length - 1]
      if (addedWorkflow?.starterPrompt && !pendingInput) {
        setPendingInput(addedWorkflow.starterPrompt)
        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 50)
      }
    }
  }, [setPendingWorkflows, pendingWorkflows.length, pendingInput])

  // Handle removing a workflow from context
  const handleRemoveWorkflow = useCallback((workflowId: string) => {
    if (onRemoveWorkflowProp) {
      onRemoveWorkflowProp(workflowId)
    } else {
      setLocalPendingWorkflows((prev) => prev.filter((w) => w._id !== workflowId))
    }
  }, [onRemoveWorkflowProp])

  // Transform workflows for WorkflowPicker
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

  // Navigate to a specific document in a given mode
  const navigateToDocument = useCallback(async (mode: 'presentation' | 'structure', doc: DocumentContextType) => {
    // Store the current conversation ID for the floating chat to pick up
    const conversationId = activeConversation?.id
    if (conversationId) {
      try {
        localStorage.setItem('claude-floating-pending-conversation', conversationId)
        localStorage.setItem('claude-floating-chat-open', 'true')
      } catch {
        // Ignore storage errors
      }
    }

    let url = `/${mode}`

    if (doc._type) {
      if (mode === 'structure') {
        // Structure URL: /structure/{type};{id}
        url = `/structure/${doc._type};${doc._id}`
      } else if (mode === 'presentation') {
        // Presentation URL: /presentation?preview={slug} for pages
        if (doc._type === 'page') {
          let slug = doc.slug

          // If we don't have a slug yet, try to fetch it
          if (!slug && client && doc._id) {
            try {
              const result = await client.fetch<{slug?: {current?: string}}>(
                `*[_id == $id || _id == "drafts." + $id][0]{slug}`,
                {id: doc._id}
              )
              slug = result?.slug?.current
            } catch {
              // Ignore fetch errors
            }
          }

          if (slug) {
            const slugPath = slug === 'index' ? '/' : `/${slug}`
            url = `/presentation?preview=${encodeURIComponent(slugPath)}`
          } else {
            // Fall back to structure mode if we still don't have a slug
            url = `/structure/${doc._type};${doc._id}`
          }
        } else {
          // For non-pages, use structure mode
          url = `/structure/${doc._type};${doc._id}`
        }
      }
    }

    window.location.href = url
  }, [activeConversation?.id, client])

  // Handle document selection from modal
  const handleDocumentSelectForNavigation = useCallback((doc: DocumentContextType) => {
    setDocumentSelectModalOpen(false)
    if (pendingNavigationMode) {
      navigateToDocument(pendingNavigationMode, doc)
    }
    setPendingNavigationMode(null)
  }, [navigateToDocument, pendingNavigationMode])

  // Navigate to a different mode with floating chat, opening the relevant document
  const handleContinueInMode = useCallback(async (mode: 'presentation' | 'structure') => {
    // If we have multiple documents, show modal to let user choose
    if (pendingDocuments.length > 1) {
      setPendingNavigationMode(mode)
      setDocumentSelectModalOpen(true)
      return
    }

    // If we have exactly one document, navigate directly
    if (pendingDocuments.length === 1) {
      await navigateToDocument(mode, pendingDocuments[0])
      return
    }

    // If we have enhanced document context (from messages), use it
    if (documentContext && documentContext.documentType) {
      const doc: DocumentContextType = {
        _id: documentContext.documentId,
        _type: documentContext.documentType,
        name: documentContext.name || documentContext.documentType,
        slug: documentContext.slug,
      }
      await navigateToDocument(mode, doc)
      return
    }

    // Fallback: just navigate to the mode without a specific document
    const conversationId = activeConversation?.id
    if (conversationId) {
      try {
        localStorage.setItem('claude-floating-pending-conversation', conversationId)
        localStorage.setItem('claude-floating-chat-open', 'true')
      } catch {
        // Ignore storage errors
      }
    }
    window.location.href = `/${mode}`
  }, [pendingDocuments, documentContext, navigateToDocument, activeConversation?.id])

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
                    <Text size={1}>Claude Settings</Text>
                  </Box>
                }
                placement="bottom"
                portal
              >
                <Button
                  icon={CogIcon}
                  mode="bleed"
                  onClick={onOpenSettings}
                  aria-label="Open Claude Settings"
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
                      text={documentContext?.isLoading ? 'Loading...' : 'Continue in Presentation'}
                      onClick={() => handleContinueInMode('presentation')}
                      disabled={!documentContext || documentContext.isLoading}
                    />
                    <MenuItem
                      icon={DocumentsIcon}
                      text={documentContext?.isLoading ? 'Loading...' : 'Continue in Structure'}
                      onClick={() => handleContinueInMode('structure')}
                      disabled={!documentContext || documentContext.isLoading}
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
                variant="centered"
                onUploadImage={() => setImagePickerOpen(true)}
                pendingImages={pendingImages}
                onRemovePendingImage={handleRemovePendingImage}
                onOpenDocumentPicker={() => setDocumentPickerOpen(true)}
                pendingDocuments={pendingDocuments}
                onRemoveDocument={handleRemoveDocument}
                onOpenWorkflowPicker={() => setWorkflowPickerOpen(true)}
                pendingWorkflows={pendingWorkflows}
                onRemoveWorkflow={handleRemoveWorkflow}
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
                conversationId={activeConversation?.id}
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
                  variant="default"
                  onUploadImage={() => setImagePickerOpen(true)}
                  pendingImages={pendingImages}
                  onRemovePendingImage={handleRemovePendingImage}
                  onOpenDocumentPicker={() => setDocumentPickerOpen(true)}
                  pendingDocuments={pendingDocuments}
                  onRemoveDocument={handleRemoveDocument}
                  onOpenWorkflowPicker={() => setWorkflowPickerOpen(true)}
                  pendingWorkflows={pendingWorkflows}
                  onRemoveWorkflow={handleRemoveWorkflow}
                />
              </Box>
            </Box>
          </>
        )}
      </Flex>

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

      {/* Workflow Picker Dialog */}
      <WorkflowPickerDialog
        isOpen={workflowPickerOpen}
        onClose={() => setWorkflowPickerOpen(false)}
        availableWorkflows={workflowOptions}
        selectedWorkflows={pendingWorkflows}
        onWorkflowsChange={handleWorkflowsChange}
        isLoading={workflowsLoading}
      />

      {/* Document Selection Modal for Continue in Presentation/Structure */}
      {documentSelectModalOpen && (
        <Dialog
          id="document-select-modal"
          header={`Select document to open in ${pendingNavigationMode === 'presentation' ? 'Presentation' : 'Structure'}`}
          onClose={() => {
            setDocumentSelectModalOpen(false)
            setPendingNavigationMode(null)
          }}
          width={1}
        >
          <Box padding={4}>
            <Stack space={3}>
              <Text size={1} muted>
                This conversation references multiple documents. Select which one to continue with:
              </Text>
              <Stack space={2}>
                {pendingDocuments.map((doc) => (
                  <Card
                    key={doc._id}
                    padding={3}
                    radius={2}
                    border
                    tone="default"
                    style={{cursor: 'pointer'}}
                    onClick={() => handleDocumentSelectForNavigation(doc)}
                  >
                    <Flex align="center" justify="space-between">
                      <Stack space={2}>
                        <Text size={1} weight="semibold">
                          {doc.name || doc._type}
                        </Text>
                        <Flex gap={2}>
                          <Label size={0} muted>
                            {doc._type}
                          </Label>
                          {doc.slug && (
                            <Text size={0} muted>
                              /{doc.slug}
                            </Text>
                          )}
                        </Flex>
                      </Stack>
                      <Button
                        mode="ghost"
                        tone="primary"
                        text="Open"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDocumentSelectForNavigation(doc)
                        }}
                      />
                    </Flex>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Flex>
  )
}
