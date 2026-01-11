/**
 * Claude Assistant Plugin for Sanity Studio
 *
 * An AI-powered assistant that helps content editors create, manage,
 * and query content in Sanity using natural language.
 *
 * @example
 * ```ts
 * // sanity.config.ts
 * import {claudeAssistant} from './src/plugins/claude-assistant'
 *
 * export default defineConfig({
 *   plugins: [
 *     claudeAssistant(),
 *   ],
 * })
 * ```
 */

import {definePlugin, type Tool} from 'sanity'
import {ClaudeTool, ClaudeToolIcon} from './ClaudeTool'

/**
 * Plugin configuration options
 */
export interface ClaudeAssistantOptions {
  /**
   * Tool title displayed in the Studio navigation
   * @default 'Claude'
   */
  title?: string

  /**
   * Custom API endpoint for Claude requests
   * Use this to proxy requests through your own backend
   */
  apiEndpoint?: string
}

/**
 * Claude Assistant plugin factory
 *
 * Creates a Sanity plugin that adds the Claude Assistant tool to Studio
 */
export const claudeAssistant = definePlugin<ClaudeAssistantOptions | void>(
  (options) => {
    const {title = 'Claude', apiEndpoint} = options || {}

    return {
      name: 'claude-assistant',
      tools: [
        {
          name: 'claude',
          title,
          icon: ClaudeToolIcon,
          component: ClaudeTool,
          options: {
            apiEndpoint,
          },
        } satisfies Tool<ClaudeAssistantOptions>,
      ],
    }
  }
)

// Re-export types for external use
export type {
  Message as MessageType,
  Conversation,
  ParsedAction,
  ActionType,
  ActionStatus,
  PluginSettings,
  QuickAction,
  SchemaContext,
  SchemaInfo,
  FieldInfo,
} from './types'

// Re-export components for potential customization
export {ClaudeTool, ClaudeToolIcon} from './ClaudeTool'
export {ChatInterface} from './components/ChatInterface'
export {MessageList} from './components/MessageList'
export {MessageInput} from './components/MessageInput'
export {Message as MessageComponent} from './components/Message'
export {ActionCard} from './components/ActionCard'
export {QuickActions} from './components/QuickActions'
export {ConversationSidebar} from './components/ConversationSidebar'
export {SettingsPanel} from './components/SettingsPanel'
export {FloatingChat} from './components/FloatingChat'
export {StudioLayout, createStudioLayout} from './components/StudioLayout'

// Re-export hooks for custom implementations
export {useClaudeChat} from './hooks/useClaudeChat'
export {useConversations} from './hooks/useConversations'
export {useContentOperations} from './hooks/useContentOperations'
export {useInstructions} from './hooks/useInstructions'

// Re-export utilities
export {AnthropicClient, createAnthropicClient} from './lib/anthropic'
export {ContentOperations, createContentOperations} from './lib/operations'
export {extractSchemaContext, formatSchemaForPrompt} from './lib/schema-context'
export {parseActions, validateAction} from './lib/actions'
export {buildSystemPrompt, getExamplePrompts} from './lib/instructions'
export {formatInstructionsForClaude} from './lib/format-instructions'

// Re-export hook options types
export type {UseConversationsOptions, UseConversationsSanityReturn} from './hooks/useConversations'
export type {UseClaudeChatOptions} from './hooks/useClaudeChat'
