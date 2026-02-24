/**
 * Message Component
 *
 * Renders a single chat message from user or assistant with markdown support
 *
 * Accessibility features (WCAG 2.1 AA):
 * - Proper aria-label identifying message sender
 * - Screen reader friendly timestamps
 * - Accessible code blocks
 * - Status announcements for streaming messages
 *
 * Performance optimizations:
 * - React.memo with custom comparison for efficient re-renders
 * - useMemo for parsed markdown content
 */

import React, {useMemo, useState} from 'react'
import {Box, Card, Flex, Text, Stack, Code, Button} from '@sanity/ui'
import {ChevronDownIcon, ChevronUpIcon, ChevronRightIcon} from '@sanity/icons'
import type {Message as MessageType, ParsedAction} from '../types'
import {extractTextContent} from '../lib/actions'
import {ActionCard} from './ActionCard'

/**
 * Collapsible code block component for long content
 * Collapses when:
 * - More than 10 lines
 * - More than 500 characters
 * - Language is JSON (always start collapsed)
 * - Streaming (always start collapsed with streaming indicator)
 */
function CollapsibleCodeBlock({language, code, isStreaming = false}: {language: string; code: string; isStreaming?: boolean}) {
  const lines = code.trim().split('\n')
  const isLongByLines = lines.length > 10
  const isLongByChars = code.length > 500
  const isJSON = language.toLowerCase() === 'json'

  // Determine if the block should be collapsible
  // Streaming blocks are always collapsible
  const shouldCollapse = isLongByLines || isLongByChars || isJSON || isStreaming

  // Start collapsed when streaming, JSON, or long content
  const [isExpanded, setIsExpanded] = useState(!shouldCollapse)
  const previewLines = 8

  // For streaming, show the last few lines as a preview of activity
  const getStreamingPreview = () => {
    if (!isStreaming || lines.length === 0) return ''
    // Show last 3 lines or all lines if fewer
    const previewCount = Math.min(3, lines.length)
    const lastLines = lines.slice(-previewCount)
    return lastLines.join('\n')
  }

  const displayCode = isExpanded
    ? code.trim()
    : isStreaming && !isExpanded
    ? getStreamingPreview()
    : lines.slice(0, previewLines).join('\n') + (lines.length > previewLines ? '\n...' : '')

  return (
    <Box marginY={3}>
      <Card padding={3} radius={2} tone="transparent" border style={{backgroundColor: 'var(--card-code-bg-color)'}}>
        <Flex align="center" justify="space-between" marginBottom={2}>
          <Flex align="center" gap={2}>
            <Text size={0} muted style={{fontFamily: 'monospace', textTransform: 'uppercase'}}>
              {language}
            </Text>
            {isStreaming && (
              <Flex align="center" gap={1}>
                <Box
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--card-badge-caution-bg-color, #f5a623)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <Text size={0} muted style={{fontStyle: 'italic'}}>
                  generating...
                </Text>
              </Flex>
            )}
          </Flex>
          {shouldCollapse && (
            <Button
              mode="bleed"
              tone="primary"
              fontSize={0}
              padding={1}
              text={isExpanded ? 'Collapse' : isStreaming ? `Expand (${lines.length} lines)` : `Expand (${lines.length} lines)`}
              icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          )}
        </Flex>
        <Box style={{maxHeight: isExpanded ? 'none' : '120px', overflow: 'hidden', position: 'relative'}}>
          <Code size={0} style={{display: 'block', whiteSpace: 'pre-wrap', overflowX: 'auto', opacity: isStreaming && !isExpanded ? 0.7 : 1}}>
            {displayCode}
          </Code>
          {/* Fade overlay when collapsed and streaming */}
          {!isExpanded && isStreaming && (
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40px',
                background: 'linear-gradient(transparent, var(--card-code-bg-color, #1a1a1a))',
                pointerEvents: 'none',
              }}
            />
          )}
        </Box>
        {!isExpanded && shouldCollapse && !isStreaming && lines.length > previewLines && (
          <Box marginTop={2} style={{textAlign: 'center'}}>
            <Text size={0} muted>
              {lines.length - previewLines} more lines hidden
            </Text>
          </Box>
        )}
      </Card>
      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Box>
  )
}

export interface MessageProps {
  message: MessageType
  onActionClick?: (action: ParsedAction) => void
  onActionExecute?: (action: ParsedAction) => void
  onActionUndo?: (action: ParsedAction) => void
  /** Hide navigation links in action cards (used in floating chat) */
  hideNavigationLinks?: boolean
  /** Active conversation ID for continuing conversation when navigating */
  conversationId?: string
}

/**
 * Simple markdown parser for common patterns
 * Handles: bold, italic, inline code, code blocks, links, lists
 * Supports streaming detection for incomplete code blocks
 */
function parseMarkdown(content: string, isStreaming: boolean = false): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  let key = 0

  // Check for incomplete code block at the end (streaming case)
  // Pattern: ``` followed by optional language and content, but no closing ```
  const incompleteCodeBlockMatch = content.match(/```(\w+)?\n([\s\S]*)$/)
  const hasIncompleteBlock = isStreaming && incompleteCodeBlockMatch && !content.endsWith('```')

  // If there's an incomplete block, we need to handle it separately
  let contentToParseNormally = content
  let incompleteBlockLanguage = ''
  let incompleteBlockCode = ''

  if (hasIncompleteBlock) {
    // Find the position of the last incomplete code block
    const lastOpeningIndex = content.lastIndexOf('```')
    if (lastOpeningIndex !== -1) {
      // Check if this opening ``` has a matching closing ```
      const afterOpening = content.slice(lastOpeningIndex + 3)
      const hasClosing = afterOpening.includes('```')

      if (!hasClosing) {
        // This is an incomplete block - parse content before it normally
        contentToParseNormally = content.slice(0, lastOpeningIndex)

        // Extract language and code from the incomplete block
        const incompleteMatch = afterOpening.match(/^(\w+)?\n?([\s\S]*)$/)
        if (incompleteMatch) {
          incompleteBlockLanguage = incompleteMatch[1] || 'code'
          incompleteBlockCode = incompleteMatch[2] || ''
        }
      }
    }
  }

  // Split by complete code blocks first
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const parts = contentToParseNormally.split(codeBlockRegex)

  let i = 0
  while (i < parts.length) {
    const part = parts[i]

    // Check if this is a code block (pattern: text, language, code, text...)
    if (i > 0 && (i - 1) % 3 === 0) {
      // This is a language identifier, next part is code
      const language = parts[i] || 'text'
      const code = parts[i + 1] || ''
      // Use collapsible component for complete code blocks
      elements.push(
        <CollapsibleCodeBlock key={key++} language={language} code={code} isStreaming={false} />
      )
      i += 2
      continue
    }

    // Parse inline elements
    if (part) {
      elements.push(...parseInlineMarkdown(part, key))
      key += 100 // Increment to avoid key collisions
    }
    i++
  }

  // Add the incomplete/streaming code block at the end
  if (hasIncompleteBlock && incompleteBlockCode) {
    elements.push(
      <CollapsibleCodeBlock
        key={key++}
        language={incompleteBlockLanguage}
        code={incompleteBlockCode}
        isStreaming={true}
      />
    )
  }

  return elements
}

/**
 * Parse inline markdown elements (bold, italic, code, links, lists)
 */
function parseInlineMarkdown(text: string, startKey: number): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  let key = startKey

  // Split by lines to handle lists
  const lines = text.split('\n')
  let currentParagraph: React.ReactNode[] = []
  let inList = false
  let listItems: React.ReactNode[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push(
        <div key={key++} style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5, fontSize: '0.9375rem'}}>
          {currentParagraph}
        </div>
      )
      currentParagraph = []
    }
  }

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} style={{margin: 0, paddingLeft: 24, listStyleType: 'disc', listStylePosition: 'outside'}}>
          {listItems}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  lines.forEach((line, lineIndex) => {
    // Check for list items (- or * or numbered)
    const listMatch = line.match(/^(\s*)[-*]\s+(.*)$/) || line.match(/^(\s*)\d+\.\s+(.*)$/)

    if (listMatch) {
      flushParagraph()
      inList = true
      listItems.push(
        <li key={key++} style={{marginBottom: 4, lineHeight: 1.5, fontSize: '0.9375rem'}}>
          {parseInlineStyles(listMatch[2], key++)}
        </li>
      )
    } else {
      if (inList) {
        flushList()
      }

      if (line.trim() === '') {
        flushParagraph()
        // No spacer needed - flexbox gap handles spacing between elements
      } else {
        // Check for headers
        const headerMatch = line.match(/^(#{1,6})\s+(.*)$/)
        if (headerMatch) {
          flushParagraph()
          const level = headerMatch[1].length
          const headerText = headerMatch[2]
          elements.push(
            <div
              key={key++}
              style={{
                fontSize: level <= 2 ? '0.9375rem' : '0.8125rem',
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {parseInlineStyles(headerText, key++)}
            </div>
          )
        } else {
          if (currentParagraph.length > 0) {
            currentParagraph.push('\n')
          }
          currentParagraph.push(parseInlineStyles(line, key++))
        }
      }
    }
  })

  flushList()
  flushParagraph()

  return elements
}

/**
 * Parse inline styles (bold, italic, code, links)
 */
function parseInlineStyles(text: string, startKey: number): React.ReactNode {
  const elements: React.ReactNode[] = []
  let key = startKey

  // Combined regex for inline patterns
  const inlineRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g

  let lastIndex = 0
  let match

  while ((match = inlineRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // Bold **text**
      elements.push(
        <span key={key++} style={{fontWeight: 600}}>
          {match[2]}
        </span>
      )
    } else if (match[3]) {
      // Italic *text*
      elements.push(
        <span key={key++} style={{fontStyle: 'italic'}}>
          {match[4]}
        </span>
      )
    } else if (match[5]) {
      // Inline code `code`
      elements.push(
        <code
          key={key++}
          style={{
            backgroundColor: 'var(--card-code-bg-color)',
            padding: '2px 6px',
            borderRadius: 3,
            fontFamily: 'monospace',
            fontSize: '0.9em',
          }}
        >
          {match[6]}
        </code>
      )
    } else if (match[7]) {
      // Link [text](url)
      elements.push(
        <a
          key={key++}
          href={match[9]}
          target="_blank"
          rel="noopener noreferrer"
          style={{color: 'var(--card-link-color)', textDecoration: 'underline'}}
        >
          {match[8]}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex))
  }

  return elements.length === 1 && typeof elements[0] === 'string' ? elements[0] : elements
}

/**
 * Blinking cursor component for streaming state
 */
function BlinkingCursor() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 16,
        backgroundColor: 'currentColor',
        marginLeft: 2,
        animation: 'blink 1s step-end infinite',
      }}
    >
      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
      </style>
    </span>
  )
}

/**
 * ActionGroup - wraps actions in a collapsible "Used N tools" group when there are 2+ actions.
 * Single actions render directly without the group header.
 */
function ActionGroup({
  actions,
  onActionExecute,
  onActionClick,
  onActionUndo,
  messageTimestamp,
  hideNavigationLinks,
  conversationId,
}: {
  actions: ParsedAction[]
  onActionExecute?: (action: ParsedAction) => void
  onActionClick?: (action: ParsedAction) => void
  onActionUndo?: (action: ParsedAction) => void
  messageTimestamp?: Date
  hideNavigationLinks?: boolean
  conversationId?: string
}) {
  const [isGroupExpanded, setIsGroupExpanded] = useState(false)

  const borderStyle = {
    border: '1px solid var(--card-border-color)',
    borderRadius: '0.25rem',
  }

  // Single action: render directly without group header
  if (actions.length === 1) {
    const action = actions[0]
    return (
      <Box marginTop={2} style={borderStyle}>
        <ActionCard
          key={action.id}
          action={action}
          onExecute={() => onActionExecute?.(action)}
          onClick={() => onActionClick?.(action)}
          onUndo={() => onActionUndo?.(action)}
          messageTimestamp={messageTimestamp}
          hideNavigationLinks={hideNavigationLinks}
          conversationId={conversationId}
        />
      </Box>
    )
  }

  // Multiple actions: wrap in collapsible group
  return (
    <Box marginTop={2} style={borderStyle}>
      {/* Group header */}
      <Flex
        align="center"
        gap={2}
        style={{
          cursor: 'pointer',
          padding: '6px 8px',
          userSelect: 'none',
        }}
        onClick={() => setIsGroupExpanded((prev) => !prev)}
      >
        <Box style={{color: 'var(--card-muted-fg-color)', display: 'flex', alignItems: 'center', flexShrink: 0}}>
          {isGroupExpanded
            ? <ChevronDownIcon style={{width: 16, height: 16}} />
            : <ChevronRightIcon style={{width: 16, height: 16}} />
          }
        </Box>
        <Text size={1} muted>
          Used {actions.length} tools
        </Text>
      </Flex>

      {/* Expanded action list */}
      {isGroupExpanded && (
        <Box paddingLeft={2}>
          <Stack space={1}>
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onExecute={() => onActionExecute?.(action)}
                onClick={() => onActionClick?.(action)}
                onUndo={() => onActionUndo?.(action)}
                messageTimestamp={messageTimestamp}
                hideNavigationLinks={hideNavigationLinks}
                conversationId={conversationId}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export function Message({message, onActionClick, onActionExecute, onActionUndo, hideNavigationLinks, conversationId}: MessageProps) {
  const isUser = message.role === 'user'
  const isStreaming = message.status === 'streaming'
  const isError = message.status === 'error'

  // Parse markdown for all messages (both user and assistant)
  // This ensures code blocks are collapsible in both directions
  // Pass isStreaming to detect and render incomplete code blocks
  const parsedContent = useMemo(() => {
    if (!message.content) {
      return null
    }
    const displayContent =
      message.role === 'assistant' ? extractTextContent(message.content) : message.content
    return parseMarkdown(displayContent, isStreaming)
  }, [message.content, isStreaming, message.role])

  // Create accessible label for the message
  const accessibleLabel = useMemo(() => {
    const sender = isUser ? 'You' : 'Claude'
    const time = formatTimestampForScreenReader(message.timestamp)
    const status = isStreaming ? ', currently typing' : isError ? ', error' : ''
    const contentPreview = message.content
      ? `: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`
      : ''
    return `${sender}, ${time}${status}${contentPreview}`
  }, [isUser, message.timestamp, message.content, isStreaming, isError])

  return (
    <Card
      tone={isError ? 'critical' : 'default'}
      style={{
        // User messages: slightly less vertical padding, Claude messages: uniform padding
        padding: isUser ? '0.75rem 1rem' : '1rem',
        // User messages: visible background in both light and dark modes
        backgroundColor: isUser ? 'var(--card-hairline-soft-color, rgba(128, 128, 128, 0.15))' : undefined,
        // User messages: 12px border radius to match chat input
        borderRadius: isUser ? 12 : 4,
        // User messages: auto-width based on content, max 85% of container
        // Assistant messages: full width so action accordions stretch edge-to-edge
        ...(isUser ? {
          width: 'fit-content',
          maxWidth: '85%',
        } : {
          width: '100%',
        }),
      }}
      aria-label={accessibleLabel}
    >
      {/* Content */}
      <Stack space={3} style={{minWidth: 0}}>

          {/* Images */}
          {message.images && message.images.length > 0 && (
            <Flex gap={2} wrap="wrap" marginBottom={2}>
              {message.images.map((image) => (
                <Card
                  key={image.id}
                  radius={2}
                  shadow={1}
                  style={{
                    overflow: 'hidden',
                    width: 120,
                    height: 120,
                    flexShrink: 0,
                    cursor: 'pointer',
                    border: '1px solid var(--card-border-color)',
                  }}
                  onClick={() => window.open(image.url, '_blank')}
                  title={`${image.name}${image.sanityAssetId ? ` (${image.sanityAssetId})` : ''}`}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Card>
              ))}
            </Flex>
          )}

          {/*
            Flex layout prevents margin collapsing between sibling elements.
            Gap provides consistent spacing, and we zero out individual margins.
            Using !important to override Sanity UI Box component styles.
          */}
          <style>{`
            .message-content {
              display: flex !important;
              flex-direction: column !important;
              gap: 0.75rem !important;
            }
            .message-content > * {
              margin-top: 0 !important;
              margin-bottom: 0 !important;
            }
          `}</style>
          {/* Message content */}
          <Box className="message-content">
            {parsedContent}
          </Box>

          {/* Streaming indicator below content */}
          {isStreaming && (
            <Flex align="center" gap={3} role="status" aria-live="polite">
              <img
                src="/static/claude-writing-animation.gif"
                alt=""
                aria-hidden="true"
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                }}
              />
              <Text size={1} muted>
                {message.content ? 'Typing...' : 'Thinking...'}
              </Text>
            </Flex>
          )}

          {/* Actions */}
          {message.actions && message.actions.length > 0 && (
            <ActionGroup
              actions={message.actions}
              onActionExecute={onActionExecute}
              onActionClick={onActionClick}
              onActionUndo={onActionUndo}
              messageTimestamp={message.timestamp}
              hideNavigationLinks={hideNavigationLinks}
              conversationId={conversationId}
            />
          )}

          {/* Metadata (tokens, model) */}
          {message.metadata && (message.metadata.tokensUsed || message.metadata.model) && (
            <Flex gap={2} marginTop={1}>
              {message.metadata.tokensUsed && (
                <Text size={0} muted>
                  {message.metadata.tokensUsed.toLocaleString()} tokens
                </Text>
              )}
              {message.metadata.tokensUsed && message.metadata.model && (
                <Text size={0} muted>|</Text>
              )}
              {message.metadata.model && (
                <Text size={0} muted>
                  {message.metadata.model}
                </Text>
              )}
            </Flex>
          )}
      </Stack>
    </Card>
  )
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // Less than a minute
  if (diff < 60000) {
    return 'Just now'
  }

  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  }

  // Same day
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
  }

  // Yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`
  }

  // Different day
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format timestamp for screen readers with more verbose output
 */
function formatTimestampForScreenReader(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // Less than a minute
  if (diff < 60000) {
    return 'just now'
  }

  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  }

  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }

  // Yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `yesterday at ${date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}`
  }

  // Different day
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Memoized Message component with custom comparison
 * Only re-renders when content, status, actions, or callbacks change
 */
export const MemoizedMessage = React.memo(Message, (prevProps, nextProps) => {
  // Re-render if content changed
  if (prevProps.message.content !== nextProps.message.content) {
    return false
  }

  // Re-render if status changed (e.g., streaming -> complete)
  if (prevProps.message.status !== nextProps.message.status) {
    return false
  }

  // Re-render if images changed
  if (prevProps.message.images?.length !== nextProps.message.images?.length) {
    return false
  }

  // Re-render if callbacks changed (important for action execution)
  if (prevProps.onActionExecute !== nextProps.onActionExecute) {
    return false
  }
  if (prevProps.onActionClick !== nextProps.onActionClick) {
    return false
  }

  // Re-render if hideNavigationLinks changed
  if (prevProps.hideNavigationLinks !== nextProps.hideNavigationLinks) {
    return false
  }

  // Re-render if onActionUndo changed
  if (prevProps.onActionUndo !== nextProps.onActionUndo) {
    return false
  }

  // Re-render if actions changed
  if (prevProps.message.actions?.length !== nextProps.message.actions?.length) {
    return false
  }

  // Check if any action statuses or results changed
  if (prevProps.message.actions && nextProps.message.actions) {
    for (let i = 0; i < prevProps.message.actions.length; i++) {
      if (prevProps.message.actions[i].status !== nextProps.message.actions[i].status) {
        return false
      }
      if (prevProps.message.actions[i].result !== nextProps.message.actions[i].result) {
        return false
      }
    }
  }

  // Props are equal, skip re-render
  return true
})
