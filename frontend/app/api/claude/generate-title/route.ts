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

// Low max tokens for title generation
const MAX_TOKENS = 50

/**
 * Request body structure for title generation
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

  if (typeof request.userMessage !== 'string' || !request.userMessage.trim()) {
    return false
  }

  if (typeof request.assistantResponse !== 'string') {
    return false
  }

  return true
}

/**
 * POST handler for generating conversation titles
 * Returns: { title: string }
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

  // Truncate assistant response for the prompt (keep first 200 chars)
  const truncatedResponse = assistantResponse.slice(0, 200)
  const responseSuffix = assistantResponse.length > 200 ? '...' : ''

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: `Generate a short, descriptive title (3-6 words) for this conversation. Return ONLY the title, no quotes or punctuation.

User's message: "${userMessage}"

Assistant's response summary: "${truncatedResponse}${responseSuffix}"`,
        },
      ],
    })

    // Extract title from response
    let title = 'New conversation'

    if (response.content.length > 0) {
      const firstBlock = response.content[0]
      if (firstBlock.type === 'text') {
        // Clean up the title - remove quotes, extra whitespace, and punctuation
        title = firstBlock.text
          .trim()
          .replace(/^["']|["']$/g, '') // Remove surrounding quotes
          .replace(/[.!?]$/, '') // Remove trailing punctuation
          .trim()

        // Ensure title isn't empty after cleanup
        if (!title) {
          title = 'New conversation'
        }

        // Truncate if too long (shouldn't happen with max_tokens, but just in case)
        if (title.length > 60) {
          title = title.slice(0, 57) + '...'
        }
      }
    }

    return jsonResponse({ title })
  } catch (error) {
    console.error('[Claude Title API] Error:', error)

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

    // Return fallback title on error rather than failing completely
    // This allows the conversation to continue even if title generation fails
    return jsonResponse({ title: 'New conversation' })
  }
}
