/**
 * Remote Claude API Types
 *
 * Type definitions for the headless Claude Assistant API endpoint.
 * This API allows external services (like Slack) to interact with Claude
 * using the same instructions and workflows as the Sanity Studio tool.
 */

// ============================================================================
// Action Types (mirrored from studio plugin for server-side use)
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

export interface ActionPayload {
  documentType?: string
  documentId?: string
  fields?: Record<string, unknown>
  query?: string
  path?: string
  explanation?: string
}

export interface ActionResult {
  success: boolean
  data?: unknown
  message?: string
  documentId?: string
  preState?: unknown
}

export interface ParsedAction {
  id: string
  type: ActionType
  description: string
  status: ActionStatus
  payload: ActionPayload
  result?: ActionResult
  error?: string
}

/**
 * Instruction categories that can be included in the prompt
 */
export type InstructionCategory = 'writing' | 'design' | 'technical'

/**
 * Request body for the remote Claude API
 */
export interface RemoteClaudeRequest {
  /**
   * The user's message/request (natural language)
   */
  message: string

  /**
   * Optional: Workflow to apply by name or ID
   * If provided, the workflow's system instructions will be added to the prompt
   */
  workflow?: string

  /**
   * Optional: Which instruction categories to include
   * Defaults to all categories if not specified
   * Set to empty array to skip custom instructions entirely
   */
  includeInstructions?: InstructionCategory[]

  /**
   * Optional: Additional context for the conversation
   */
  context?: {
    /**
     * Document IDs to include as context (will be fetched and summarized)
     */
    documents?: string[]

    /**
     * Additional context text to include in the prompt
     */
    additionalContext?: string
  }

  /**
   * Optional: If true, only plan the actions without executing them
   * Returns the parsed actions without making changes to Sanity
   */
  dryRun?: boolean

  /**
   * Optional: Conversation history for multi-turn interactions
   * Each message should have role ('user' | 'assistant') and content
   */
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>

  /**
   * Optional: Model override (defaults to configured model or claude-sonnet-4)
   */
  model?: string

  /**
   * Optional: Max tokens for response (defaults to 4096)
   */
  maxTokens?: number

  /**
   * Optional: Temperature for response generation (defaults to 0.7)
   */
  temperature?: number
}

/**
 * Executed action result with additional metadata
 */
export interface ExecutedAction {
  /**
   * The original parsed action
   */
  action: ParsedAction

  /**
   * Execution result
   */
  result: ActionResult

  /**
   * Whether this was a dry run (action was not actually executed)
   */
  dryRun: boolean
}

/**
 * Response from the remote Claude API
 */
export interface RemoteClaudeResponse {
  /**
   * Whether the request was successful
   */
  success: boolean

  /**
   * Claude's text response (with action blocks removed)
   */
  response: string

  /**
   * Parsed and executed actions
   */
  actions: ExecutedAction[]

  /**
   * Summary of what was done
   */
  summary: {
    /**
     * Total number of actions parsed
     */
    totalActions: number

    /**
     * Number of actions that succeeded
     */
    successfulActions: number

    /**
     * Number of actions that failed
     */
    failedActions: number

    /**
     * Created document IDs
     */
    createdDocuments: string[]

    /**
     * Updated document IDs
     */
    updatedDocuments: string[]

    /**
     * Deleted document IDs
     */
    deletedDocuments: string[]
  }

  /**
   * Links to created/updated content in Sanity Studio
   */
  studioLinks?: {
    documentId: string
    documentType: string
    structureUrl: string
    presentationUrl?: string
  }[]

  /**
   * Workflow that was applied (if any)
   */
  appliedWorkflow?: {
    id: string
    name: string
  }

  /**
   * Instruction categories that were included
   */
  includedInstructions: InstructionCategory[]

  /**
   * Error message if success is false
   */
  error?: string

  /**
   * Request metadata
   */
  metadata: {
    /**
     * Processing time in milliseconds
     */
    processingTime: number

    /**
     * Model used for the request
     */
    model: string

    /**
     * Whether this was a dry run
     */
    dryRun: boolean
  }
}

/**
 * Sanity workflow document (simplified for API use)
 */
export interface WorkflowDocument {
  _id: string
  name: string
  description?: string
  systemInstructions?: string
  starterPrompt?: string
  active?: boolean
}

/**
 * Sanity instructions document (simplified for API use)
 */
export interface InstructionsDocument {
  _id: string
  _type: 'claudeInstructions'
  writingGuidelines?: unknown
  brandVoice?: unknown
  designSystemRules?: unknown
  technicalConstraints?: unknown
  forbiddenTerms?: string[]
  preferredTerms?: Array<{
    _key: string
    avoid: string
    useInstead: string
  }>
  componentGuidelines?: Array<{
    _key: string
    component: string
    guidelines?: string
    doNot?: string
  }>
  maxNestingDepth?: number
  requiredFields?: Array<{
    _key: string
    component: string
    fields?: string[]
  }>
  writingKeywords?: string
  designKeywords?: string
  technicalKeywords?: string
  includeSectionTemplates?: boolean
  sectionTemplateGuidance?: string
}

/**
 * API Settings document
 */
export interface ApiSettingsDocument {
  _id: string
  model?: string
  maxTokens?: number
  temperature?: number
  enableStreaming?: boolean
}
