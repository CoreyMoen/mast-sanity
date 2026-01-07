/**
 * Anthropic API Client Wrapper
 *
 * Handles communication with the Claude API, including streaming responses
 */

import type {
  ClaudeConfig,
  ClaudeRequest,
  ClaudeResponse,
  ClaudeStreamChunk,
} from '../types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export class AnthropicClient {
  private config: ClaudeConfig

  constructor(config: ClaudeConfig) {
    this.config = config
  }

  /**
   * Send a message to Claude and get a complete response
   */
  async sendMessage(request: ClaudeRequest): Promise<ClaudeResponse> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(this.buildRequestBody(request)),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to communicate with Claude API')
    }

    const data = await response.json()
    return this.parseResponse(data)
  }

  /**
   * Send a message to Claude with streaming response
   */
  async *streamMessage(
    request: ClaudeRequest
  ): AsyncGenerator<ClaudeStreamChunk, void, unknown> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...this.buildRequestBody(request),
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to communicate with Claude API')
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const {done, value} = await reader.read()
        if (done) break

        buffer += decoder.decode(value, {stream: true})
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data) as ClaudeStreamChunk
              yield parsed
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Update the client configuration
   */
  updateConfig(config: Partial<ClaudeConfig>): void {
    this.config = {...this.config, ...config}
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    }
  }

  private buildRequestBody(request: ClaudeRequest): Record<string, unknown> {
    return {
      model: this.config.model,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      messages: request.messages,
      ...(request.system && {system: request.system}),
    }
  }

  private parseResponse(data: Record<string, unknown>): ClaudeResponse {
    const content = data.content as Array<{type: string; text: string}>
    const textContent = content.find((c) => c.type === 'text')

    return {
      id: data.id as string,
      content: textContent?.text || '',
      model: data.model as string,
      stopReason: data.stop_reason as string,
      usage: {
        inputTokens: (data.usage as Record<string, number>)?.input_tokens || 0,
        outputTokens: (data.usage as Record<string, number>)?.output_tokens || 0,
      },
    }
  }
}

/**
 * Create a new Anthropic client instance
 */
export function createAnthropicClient(config: ClaudeConfig): AnthropicClient {
  return new AnthropicClient(config)
}

/**
 * Validate an API key format (basic validation)
 */
export function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith('sk-ant-') && apiKey.length > 20
}
