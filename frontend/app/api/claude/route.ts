import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// CORS headers for cross-origin requests from Sanity Studio
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

/**
 * Helper to create JSON response with CORS headers
 */
function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  })
}

// Model to use as specified in the spec
const MODEL = 'claude-sonnet-4-20250514'

// Maximum tokens for response
const MAX_TOKENS = 4096

/**
 * Message type from the client
 */
interface Message {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Request body structure
 */
interface ClaudeChatRequest {
  messages: Message[]
  schema?: object
  instructions?: string
  system?: string // Client-provided system prompt (takes precedence)
  stream?: boolean
}

/**
 * Builds the system prompt from schema context and instructions
 */
function buildSystemPrompt(schema?: object, instructions?: string): string {
  const schemaSection = schema
    ? `## Content Schema
The following schema types are available:
${JSON.stringify(schema, null, 2)}`
    : ''

  const instructionsSection = instructions
    ? `## Guidelines and Rules
${instructions}`
    : ''

  return `You are an AI assistant embedded in Sanity Studio, helping users create and manage content.

## Your Capabilities
- Create new documents and pages
- Query existing content using GROQ
- Update and patch documents
- Explain how to use the CMS

${schemaSection}

${instructionsSection}

## Important Constraints
- When creating nested page structures, build incrementally to avoid depth limits
- Always create documents as drafts first
- Validate that referenced documents exist before creating references
- Follow the writing guidelines strictly

## Action Format

When you need to perform content operations, output them in action blocks:

\`\`\`action
{
  "type": "create",
  "documentType": "page",
  "description": "Create 'About Us' page with hero section",
  "data": {
    "title": "About Us",
    "slug": { "current": "about-us" },
    "sections": [...]
  }
}
\`\`\`

For destructive operations, always explain what will happen first:

\`\`\`action
{
  "type": "delete",
  "documentId": "abc123",
  "documentType": "page",
  "description": "Delete the 'Old Landing Page' document"
}
\`\`\`

The user will see a confirmation button for destructive actions (delete, unpublish).

After successful creation or update, I'll provide links for the user to:
- View the document in Structure
- Open the page in Preview

## Response Style

1. Acknowledge the request
2. Explain what you'll do
3. Output action blocks
4. Wait for execution results
5. Confirm completion with links to view the result
`.trim()
}

/**
 * Validates the request body
 */
function validateRequest(body: unknown): body is ClaudeChatRequest {
  if (!body || typeof body !== 'object') {
    return false
  }

  const request = body as ClaudeChatRequest

  if (!Array.isArray(request.messages)) {
    return false
  }

  // Validate each message has required fields
  for (const message of request.messages) {
    if (!message.role || !['user', 'assistant'].includes(message.role)) {
      return false
    }
    if (typeof message.content !== 'string') {
      return false
    }
  }

  return true
}

/**
 * POST handler for streaming chat responses
 * Returns Server-Sent Events (SSE) stream
 */
export async function POST(request: NextRequest) {
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonResponse(
      { error: 'ANTHROPIC_API_KEY environment variable is not configured' },
      500
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonResponse(
      { error: 'Invalid JSON in request body' },
      400
    )
  }

  // Validate request
  if (!validateRequest(body)) {
    return jsonResponse(
      { error: 'Invalid request body. Expected { messages: Array<{ role: "user" | "assistant", content: string }>, schema?: object, instructions?: string }' },
      400
    )
  }

  const { messages, schema, instructions, system } = body

  // Ensure there's at least one message
  if (messages.length === 0) {
    return jsonResponse(
      { error: 'At least one message is required' },
      400
    )
  }

  // Use client-provided system prompt if available, otherwise build one
  // The client's system prompt includes the complete schema context and instructions
  const systemPrompt = system || buildSystemPrompt(schema, instructions)

  try {
    // Create streaming response from Anthropic
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    // Create a TextEncoder for the stream
    const encoder = new TextEncoder()

    // Create a ReadableStream that emits SSE events
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            // Handle text delta events
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ text: event.delta.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }

            // Handle message stop event
            if (event.type === 'message_stop') {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
              controller.close()
            }
          }
        } catch (streamError) {
          // Send error event to client
          const errorData = JSON.stringify({
            error: streamError instanceof Error ? streamError.message : 'Stream error occurred',
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        }
      },
    })

    // Return SSE response with proper headers
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('[Claude API] Error:', error)

    // Handle specific Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      const statusCode = error.status || 500
      const message = error.message || 'Anthropic API error'

      // Handle rate limiting
      if (statusCode === 429) {
        return jsonResponse(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          429
        )
      }

      // Handle authentication errors
      if (statusCode === 401) {
        return jsonResponse(
          { error: 'Invalid API key. Please check your ANTHROPIC_API_KEY configuration.' },
          401
        )
      }

      return jsonResponse({ error: message }, statusCode)
    }

    // Generic error response
    return jsonResponse(
      { error: 'An unexpected error occurred while processing your request' },
      500
    )
  }
}
