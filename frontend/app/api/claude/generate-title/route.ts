import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Get allowed CORS origins from environment variable
 * In development, defaults to '*' for convenience
 * In production, set ALLOWED_CORS_ORIGINS to comma-separated list of allowed origins
 * Example: ALLOWED_CORS_ORIGINS=https://your-studio.sanity.studio,http://localhost:3333
 */
function getAllowedOrigins(): string[] {
  const originsEnv = process.env.ALLOWED_CORS_ORIGINS
  if (!originsEnv) {
    // Default to allowing all origins in development
    return ['*']
  }
  return originsEnv.split(',').map(origin => origin.trim())
}

/**
 * Get CORS headers with origin validation
 * Only allows requests from configured origins
 */
function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins()

  let origin: string
  if (allowedOrigins.includes('*')) {
    // Allow all origins (development mode)
    origin = '*'
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    // Request origin is in allowed list
    origin = requestOrigin
  } else {
    // Origin not allowed - return empty string (browser will block)
    origin = ''
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  })
}

/**
 * Helper to create JSON response with CORS headers
 */
function jsonResponse(data: object, status: number = 200, requestOrigin?: string | null) {
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(requestOrigin),
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
  // Extract origin for CORS validation
  const origin = request.headers.get('origin')

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonResponse(
      { error: 'ANTHROPIC_API_KEY environment variable is not configured' },
      500,
      origin
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonResponse(
      { error: 'Invalid JSON in request body' },
      400,
      origin
    )
  }

  // Validate request
  if (!validateRequest(body)) {
    return jsonResponse(
      { error: 'Invalid request body. Expected { userMessage: string, assistantResponse: string }' },
      400,
      origin
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
    const title = message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : 'New Conversation'

    console.log('[generate-title] Generated title:', title)

    return jsonResponse({ title }, 200, origin)
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
          429,
          origin
        )
      }

      // Handle authentication errors
      if (statusCode === 401) {
        return jsonResponse(
          { error: 'Invalid API key. Please check your ANTHROPIC_API_KEY configuration.' },
          401,
          origin
        )
      }

      return jsonResponse({ error: message }, statusCode, origin)
    }

    // Generic error response - still return a fallback title
    const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
    return jsonResponse({ title: fallbackTitle }, 200, origin)
  }
}
