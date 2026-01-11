import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// CORS headers for cross-origin requests from Sanity Studio
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// Model to use for title generation (use faster, cheaper model)
const MODEL = 'claude-3-5-haiku-20241022'

// Maximum tokens for title (keep it short)
const MAX_TOKENS = 50

/**
 * Request body structure
 */
interface GenerateTitleRequest {
  userMessage: string
  assistantResponse: string
}

/**
 * Validates the request body
 */
function validateRequest(body: unknown): body is GenerateTitleRequest {
  if (!body || typeof body !== 'object') {
    return false
  }

  const request = body as GenerateTitleRequest

  if (typeof request.userMessage !== 'string' || typeof request.assistantResponse !== 'string') {
    return false
  }

  return true
}

/**
 * POST handler for generating conversation titles
 * Uses Claude to generate a short, descriptive title from the first exchange
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
      { error: 'Invalid request body. Expected { userMessage: string, assistantResponse: string }' },
      400
    )
  }

  const { userMessage, assistantResponse } = body

  try {
    // Generate title using Claude
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: `Based on this conversation exchange, generate a short, descriptive title (maximum 6 words):

User: ${userMessage}Assistant: ${assistantResponse}

Your response should ONLY be the title text itself, nothing else.
Example good responses:
- "Fix authentication bug"
- "Add dark mode toggle"
- "Update user profile page"
- "Query customer data"`,
        },
      ],
    })

    // Extract title from response
    const title =message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : 'New Conversation'

    console.log('[generate-title] Generated title:', title)

    return jsonResponse({ title })
  } catch (error) {
    console.error('[generate-title] Error:', error)

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

    // Generic error response - still return a fallback title
    const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
    return jsonResponse({ title: fallbackTitle })
  }
}
