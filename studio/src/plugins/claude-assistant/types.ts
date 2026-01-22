/**
 * Claude Assistant Plugin Types
 *
 * Core type definitions for the Claude Assistant Sanity Studio plugin
 */

import type {SanityDocument, Schema, SchemaType} from 'sanity'

// ============================================================================
// Message Types
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error'

/**
 * Represents a document selected as context for the conversation
 */
export interface DocumentContext {
  /** Sanity document ID */
  _id: string
  /** Document type (e.g., 'page', 'post') */
  _type: string
  /** Display name/title of the document */
  name: string
  /** URL slug if applicable */
  slug?: string
}

/**
 * Represents an image attachment in a message
 */
export interface ImageAttachment {
  /** Unique identifier for this attachment */
  id: string
  /** Display name of the image (original filename) */
  name: string
  /** MIME type (image/jpeg, image/png, etc.) */
  mimeType: string
  /** Base64-encoded image data for sending to Claude */
  base64?: string
  /** URL for displaying the image (Sanity CDN URL or data URL) */
  url: string
  /** Sanity asset reference ID if from media library (e.g., "image-abc123-1920x1080-jpg") */
  sanityAssetId?: string
  /** Full Sanity asset reference for use in documents */
  sanityAssetRef?: {
    _type: 'reference'
    _ref: string
  }
  /** Image dimensions if known */
  width?: number
  height?: number
  /** Source of the image: 'upload' for user-uploaded, 'library' for Sanity media library */
  source?: 'upload' | 'library'
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  status: MessageStatus
  actions?: ParsedAction[]
  metadata?: MessageMetadata
  /** Image attachments for this message */
  images?: ImageAttachment[]
}

export interface MessageMetadata {
  tokensUsed?: number
  model?: string
  processingTime?: number
}

// ============================================================================
// Action Types
// ============================================================================

export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'query'
  | 'navigate'
  | 'explain'
  | 'uploadImage'

export type ActionStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled'

export interface ParsedAction {
  id: string
  type: ActionType
  description: string
  status: ActionStatus
  payload: ActionPayload
  result?: ActionResult
  error?: string
}

export interface ActionPayload {
  documentType?: string
  documentId?: string
  fields?: Record<string, unknown>
  query?: string
  path?: string
  explanation?: string
  /** For uploadImage action: the image attachment to upload */
  imageAttachment?: ImageAttachment
  /** For uploadImage action: optional filename override */
  filename?: string
}

export interface ActionResult {
  success: boolean
  data?: unknown
  message?: string
  documentId?: string
  /** Pre-execution state of the document (for undo functionality) */
  preState?: unknown
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  context?: ConversationContext
  /** IDs of workflows applied to this conversation */
  workflowIds?: string[]
}

export interface ConversationContext {
  documentId?: string
  documentType?: string
  schemaTypes?: string[]
}

// ============================================================================
// Schema Context Types
// ============================================================================

export interface SchemaInfo {
  name: string
  title: string
  type: string
  fields: FieldInfo[]
  description?: string
}

export interface FieldInfo {
  name: string
  title: string
  type: string
  required: boolean
  description?: string
  options?: Record<string, unknown>
  of?: FieldInfo[]
  to?: Array<{type: string}>
}

export interface SchemaContext {
  documentTypes: SchemaInfo[]
  objectTypes: SchemaInfo[]
  timestamp: Date
}

// ============================================================================
// Claude API Types
// ============================================================================

export interface ClaudeConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

export interface ClaudeRequest {
  messages: Array<{role: string; content: string}>
  system?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export interface ClaudeResponse {
  id: string
  content: string
  model: string
  stopReason: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
}

export interface ClaudeStreamChunk {
  type: 'content_block_delta' | 'message_start' | 'message_stop' | 'error'
  delta?: {
    type: string
    text: string
  }
  error?: {
    message: string
  }
}

// ============================================================================
// Instructions Types
// ============================================================================

export interface InstructionSet {
  id: string
  name: string
  content: string
  isDefault: boolean
  createdAt: Date
}

export interface SystemPromptContext {
  schemaContext: SchemaContext
  customInstructions?: string
  currentDocument?: SanityDocument
  recentActions?: ParsedAction[]
  workflowContext?: string
  /** Selected documents as context for the conversation */
  documentContexts?: DocumentContext[]
  /** User's message content for conditional instruction inclusion */
  userMessage?: string
  /** Raw instructions from Sanity for conditional filtering */
  rawInstructions?: unknown
}

// ============================================================================
// Quick Action Types
// ============================================================================

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  prompt: string
  category: QuickActionCategory
}

export type QuickActionCategory = 'content' | 'query' | 'help' | 'navigation'

// ============================================================================
// Settings Types
// ============================================================================

export interface PluginSettings {
  model: string
  maxTokens: number
  temperature: number
  customInstructions: string
  enableStreaming: boolean
}

export const DEFAULT_SETTINGS: PluginSettings = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
  customInstructions: '',
  enableStreaming: true,
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseClaudeChatReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  retryLastMessage: () => Promise<void>
}

export interface UseConversationsReturn {
  conversations: Conversation[]
  activeConversation: Conversation | null
  createConversation: () => Promise<Conversation>
  selectConversation: (id: string | null) => void
  deleteConversation: (id: string) => Promise<void>
  updateConversationTitle: (id: string, title: string) => Promise<void>
  addMessage?: (conversationId: string, message: Message) => Promise<void>
  updateMessage?: (conversationId: string, messageId: string, updates: Partial<Message>) => Promise<void>
  loadConversation?: (id: string) => Promise<Conversation | null>
  generateTitle?: (conversationId: string, userMessage: string, assistantResponse: string) => Promise<void>
  isLoading?: boolean
}

export interface UseContentOperationsReturn {
  executeAction: (action: ParsedAction) => Promise<ActionResult>
  previewAction: (action: ParsedAction) => Promise<unknown>
  cancelAction: (actionId: string) => void
  isExecuting: boolean
}

export interface UseInstructionsReturn {
  instructions: InstructionSet[]
  activeInstruction: InstructionSet | null
  createInstruction: (name: string, content: string) => InstructionSet
  updateInstruction: (id: string, updates: Partial<InstructionSet>) => void
  deleteInstruction: (id: string) => void
  setActiveInstruction: (id: string) => void
  buildSystemPrompt: (context: SystemPromptContext) => string
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ChatInterfaceProps {
  className?: string
}

export interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  onActionClick?: (action: ParsedAction) => void
}

export interface MessageInputProps {
  onSend: (content: string) => void
  isLoading: boolean
  placeholder?: string
}

export interface MessageProps {
  message: Message
  onActionClick?: (action: ParsedAction) => void
}

export interface ActionCardProps {
  action: ParsedAction
  onExecute?: () => void
  onCancel?: () => void
  showPreview?: boolean
}

export interface QuickActionsProps {
  onActionSelect: (action: QuickAction) => void
}

export interface ConversationSidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

export interface SettingsPanelProps {
  settings: PluginSettings
  onSettingsChange: (settings: PluginSettings) => void
  isOpen: boolean
  onClose: () => void
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export interface ToolContext {
  schema: Schema
  currentDocument?: SanityDocument
}
