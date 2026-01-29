/**
 * Remote Claude API Endpoint
 *
 * A headless API for interacting with Claude using the same instructions
 * and workflows as the Sanity Studio Claude Assistant tool.
 *
 * This endpoint enables external services (like Slack) to:
 * - Send natural language requests
 * - Use the same Writing, Design, and Technical instructions
 * - Apply specific workflows by name
 * - Create, update, and query content in Sanity
 *
 * Authentication: Requires CLAUDE_REMOTE_API_SECRET in the Authorization header
 *
 * @example
 * POST /api/claude/remote
 * Authorization: Bearer your-secret-key
 * Content-Type: application/json
 *
 * {
 *   "message": "Create a landing page for our Q1 campaign with a hero section",
 *   "workflow": "landing-page-workflow"
 * }
 */

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import {
  createSanityClient,
  loadInstructions,
  loadApiSettings,
  loadWorkflow,
  loadDocumentsForContext,
} from './sanity-loader'
import { buildSystemPrompt } from './prompt-builder'
import type {
  RemoteClaudeRequest,
  RemoteClaudeResponse,
  ExecutedAction,
  InstructionCategory,
} from './types'

// Import local utilities for server-side action parsing and execution
import { parseActions } from './action-parser'
import { executeAction } from './content-operations'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Default values
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const DEFAULT_MAX_TOKENS = 4096
const DEFAULT_TEMPERATURE = 0.7

/**
 * Validate the API secret
 */
function validateAuth(request: NextRequest): { valid: boolean; error?: string } {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' }
  }

  const secret = process.env.CLAUDE_REMOTE_API_SECRET
  if (!secret) {
    return { valid: false, error: 'CLAUDE_REMOTE_API_SECRET not configured on server' }
  }

  // Support both "Bearer <token>" and just "<token>"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader

  if (token !== secret) {
    return { valid: false, error: 'Invalid API secret' }
  }

  return { valid: true }
}

/**
 * Validate the request body
 */
function validateRequest(body: unknown): { valid: boolean; error?: string; data?: RemoteClaudeRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const request = body as RemoteClaudeRequest

  if (!request.message || typeof request.message !== 'string') {
    return { valid: false, error: 'message field is required and must be a string' }
  }

  if (request.message.trim().length === 0) {
    return { valid: false, error: 'message cannot be empty' }
  }

  // Validate optional fields
  if (request.workflow !== undefined && typeof request.workflow !== 'string') {
    return { valid: false, error: 'workflow must be a string (name or ID)' }
  }

  if (request.includeInstructions !== undefined) {
    if (!Array.isArray(request.includeInstructions)) {
      return { valid: false, error: 'includeInstructions must be an array' }
    }
    const validCategories: InstructionCategory[] = ['writing', 'design', 'technical']
    for (const cat of request.includeInstructions) {
      if (!validCategories.includes(cat)) {
        return { valid: false, error: `Invalid instruction category: ${cat}. Valid: ${validCategories.join(', ')}` }
      }
    }
  }

  if (request.conversationHistory !== undefined) {
    if (!Array.isArray(request.conversationHistory)) {
      return { valid: false, error: 'conversationHistory must be an array' }
    }
    for (const msg of request.conversationHistory) {
      if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
        return { valid: false, error: 'Each message in conversationHistory must have role "user" or "assistant"' }
      }
      if (typeof msg.content !== 'string') {
        return { valid: false, error: 'Each message in conversationHistory must have string content' }
      }
    }
  }

  return { valid: true, data: request }
}

/**
 * Extract text content from Claude's response (without action blocks)
 */
function extractTextContent(content: string): string {
  // Remove action blocks
  let text = content.replace(/```action\s*[\s\S]*?```/g, '')
  // Remove inline actions
  text = text.replace(/\[ACTION\]\s*{[\s\S]*?}\s*\[\/ACTION\]/g, '')
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

/**
 * Generate Studio URLs for documents
 */
function generateStudioLinks(
  documentIds: string[],
  documentTypes: Map<string, string>
): RemoteClaudeResponse['studioLinks'] {
  const studioUrl = process.env.SANITY_STUDIO_URL || process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || ''

  return documentIds.map(docId => {
    const docType = documentTypes.get(docId) || 'document'
    const baseDocId = docId.replace(/^drafts\./, '')

    return {
      documentId: docId,
      documentType: docType,
      structureUrl: `${studioUrl}/structure/${docType};${docId}`,
      presentationUrl: docType === 'page' ? `${studioUrl}/presentation?preview=/${baseDocId}` : undefined,
    }
  })
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * POST handler - Main API endpoint
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  // Validate authentication
  const authResult = validateAuth(request)
  if (!authResult.valid) {
    return NextResponse.json(
      { success: false, error: authResult.error } as Partial<RemoteClaudeResponse>,
      { status: 401 }
    )
  }

  // Check for required environment variables
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'ANTHROPIC_API_KEY not configured' } as Partial<RemoteClaudeResponse>,
      { status: 500 }
    )
  }

  // Parse request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON in request body' } as Partial<RemoteClaudeResponse>,
      { status: 400 }
    )
  }

  // Validate request
  const validation = validateRequest(body)
  if (!validation.valid || !validation.data) {
    return NextResponse.json(
      { success: false, error: validation.error } as Partial<RemoteClaudeResponse>,
      { status: 400 }
    )
  }

  const requestData = validation.data

  try {
    // Initialize Sanity client
    const sanityClient = createSanityClient()

    // Load data from Sanity in parallel
    const [instructions, apiSettings, workflow, contextDocuments] = await Promise.all([
      loadInstructions(sanityClient),
      loadApiSettings(sanityClient),
      requestData.workflow ? loadWorkflow(sanityClient, requestData.workflow) : Promise.resolve(null),
      requestData.context?.documents
        ? loadDocumentsForContext(sanityClient, requestData.context.documents)
        : Promise.resolve([]),
    ])

    // Check if workflow was requested but not found
    if (requestData.workflow && !workflow) {
      return NextResponse.json(
        {
          success: false,
          error: `Workflow not found: "${requestData.workflow}". Make sure the workflow exists and is active.`,
        } as Partial<RemoteClaudeResponse>,
        { status: 404 }
      )
    }

    // Build the system prompt
    const { prompt: systemPrompt, includedCategories } = buildSystemPrompt({
      userMessage: requestData.message,
      instructions,
      workflow,
      includeCategories: requestData.includeInstructions,
      contextDocuments: contextDocuments.map(doc => ({
        ...doc,
        slug: typeof doc.slug === 'object' && doc.slug ? (doc.slug as { current: string }).current : doc.slug as string | undefined,
      })),
      additionalContext: requestData.context?.additionalContext,
    })

    // Build messages array
    const messages: Anthropic.MessageParam[] = []

    // Add conversation history if provided
    if (requestData.conversationHistory) {
      for (const msg of requestData.conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      }
    }

    // Add the current user message
    messages.push({
      role: 'user',
      content: requestData.message,
    })

    // Determine model and settings
    const model = requestData.model || apiSettings?.model || DEFAULT_MODEL
    const maxTokens = requestData.maxTokens || apiSettings?.maxTokens || DEFAULT_MAX_TOKENS
    const temperature = requestData.temperature ?? apiSettings?.temperature ?? DEFAULT_TEMPERATURE

    // Call Claude API
    const claudeResponse = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
    })

    // Extract the response content
    const responseContent = claudeResponse.content
      .filter((block: { type: string }): block is Anthropic.TextBlock => block.type === 'text')
      .map((block: Anthropic.TextBlock) => block.text)
      .join('\n')

    // Parse actions from the response
    const parsedActions = parseActions(responseContent)

    // Execute actions (unless dry run)
    const executedActions: ExecutedAction[] = []
    const createdDocuments: string[] = []
    const updatedDocuments: string[] = []
    const deletedDocuments: string[] = []
    const documentTypes = new Map<string, string>()

    if (!requestData.dryRun && parsedActions.length > 0) {
      for (const action of parsedActions) {
        try {
          const result = await executeAction(sanityClient, action)

          executedActions.push({
            action: { ...action, status: result.success ? 'completed' : 'failed', result },
            result,
            dryRun: false,
          })

          // Track document changes
          if (result.success && result.documentId) {
            if (action.type === 'create') {
              createdDocuments.push(result.documentId)
              if (action.payload.documentType) {
                documentTypes.set(result.documentId, action.payload.documentType)
              }
            } else if (action.type === 'update') {
              updatedDocuments.push(result.documentId)
            } else if (action.type === 'delete') {
              deletedDocuments.push(result.documentId)
            }
          }
        } catch (error) {
          executedActions.push({
            action: {
              ...action,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            result: {
              success: false,
              message: error instanceof Error ? error.message : 'Action execution failed',
            },
            dryRun: false,
          })
        }
      }
    } else if (requestData.dryRun) {
      // For dry run, just include the parsed actions without executing
      for (const action of parsedActions) {
        executedActions.push({
          action: { ...action, status: 'pending' },
          result: { success: true, message: 'Dry run - action not executed' },
          dryRun: true,
        })
      }
    }

    // Calculate success metrics
    const successfulActions = executedActions.filter(a => a.result.success).length
    const failedActions = executedActions.filter(a => !a.result.success).length

    // Generate studio links for created/updated documents
    const allAffectedDocuments = [...createdDocuments, ...updatedDocuments]
    const studioLinks = allAffectedDocuments.length > 0
      ? generateStudioLinks(allAffectedDocuments, documentTypes)
      : undefined

    // Build response
    const response: RemoteClaudeResponse = {
      success: true,
      response: extractTextContent(responseContent),
      actions: executedActions,
      summary: {
        totalActions: parsedActions.length,
        successfulActions,
        failedActions,
        createdDocuments,
        updatedDocuments,
        deletedDocuments,
      },
      studioLinks,
      appliedWorkflow: workflow ? { id: workflow._id, name: workflow.name } : undefined,
      includedInstructions: includedCategories,
      metadata: {
        processingTime: Date.now() - startTime,
        model,
        dryRun: requestData.dryRun || false,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Remote Claude API] Error:', error)

    // Handle Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      const statusCode = error.status || 500

      if (statusCode === 429) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded. Please wait and try again.',
            metadata: { processingTime: Date.now() - startTime, model: DEFAULT_MODEL, dryRun: false },
          } as Partial<RemoteClaudeResponse>,
          { status: 429 }
        )
      }

      if (statusCode === 401) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid Anthropic API key',
            metadata: { processingTime: Date.now() - startTime, model: DEFAULT_MODEL, dryRun: false },
          } as Partial<RemoteClaudeResponse>,
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          metadata: { processingTime: Date.now() - startTime, model: DEFAULT_MODEL, dryRun: false },
        } as Partial<RemoteClaudeResponse>,
        { status: statusCode }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        metadata: { processingTime: Date.now() - startTime, model: DEFAULT_MODEL, dryRun: false },
      } as Partial<RemoteClaudeResponse>,
      { status: 500 }
    )
  }
}
