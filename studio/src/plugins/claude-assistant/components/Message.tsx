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
import {Box, Card, Flex, Text, Stack, Spinner, Code, Button} from '@sanity/ui'
import {ChevronDownIcon, ChevronUpIcon} from '@sanity/icons'
import type {Message as MessageType, ParsedAction} from '../types'
import {ActionCard} from './ActionCard'

/**
 * Collapsible code block component for long content
 * Collapses when:
 * - More than 10 lines
 * - More than 500 characters
 * - Language is JSON (always start collapsed)
 */
function CollapsibleCodeBlock({language, code}: {language: string; code: string}) {
  const lines = code.trim().split('\n')
  const isLongByLines = lines.length > 10
  const isLongByChars = code.length > 500
  const isJSON = language.toLowerCase() === 'json'

  // Determine if the block should be collapsible
  const shouldCollapse = isLongByLines || isLongByChars || isJSON

  // JSON should start collapsed, others based on length
  const [isExpanded, setIsExpanded] = useState(!shouldCollapse)
  const previewLines = 8

  const displayCode = isExpanded
    ? code.trim()
    : lines.slice(0, previewLines).join('\n') + (lines.length > previewLines ? '\n...' : '')

  return (
    <Box marginY={3}>
      <Card padding={3} radius={2} tone="transparent" border style={{backgroundColor: 'var(--card-code-bg-color)'}}>
        <Flex align="center" justify="space-between" marginBottom={2}>
          <Text size={0} muted style={{fontFamily: 'monospace', textTransform: 'uppercase'}}>
            {language}
          </Text>
          {shouldCollapse && (
            <Button
              mode="bleed"
              tone="primary"
              fontSize={0}
              padding={1}
              text={isExpanded ? 'Collapse' : `Expand (${lines.length} lines)`}
              icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          )}
        </Flex>
        <Box style={{maxHeight: isExpanded ? 'none' : '300px', overflow: 'auto'}}>
          <Code size={1} style={{display: 'block', whiteSpace: 'pre-wrap', overflowX: 'auto'}}>
            {displayCode}
          </Code>
        </Box>
        {!isExpanded && shouldCollapse && lines.length > previewLines && (
          <Box marginTop={2} style={{textAlign: 'center'}}>
            <Text size={0} muted>
              {lines.length - previewLines} more lines hidden
            </Text>
          </Box>
        )}
      </Card>
    </Box>
  )
}

export interface MessageProps {
  message: MessageType
  onActionClick?: (action: ParsedAction) => void
  onActionExecute?: (action: ParsedAction) => void
}

/**
 * Simple markdown parser for common patterns
 * Handles: bold, italic, inline code, code blocks, links, lists
 */
function parseMarkdown(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  let key = 0

  // Split by code blocks first
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const parts = content.split(codeBlockRegex)

  let i = 0
  while (i < parts.length) {
    const part = parts[i]

    // Check if this is a code block (pattern: text, language, code, text...)
    if (i > 0 && (i - 1) % 3 === 0) {
      // This is a language identifier, next part is code
      const language = parts[i] || 'text'
      const code = parts[i + 1] || ''
      // Use collapsible component for code blocks
      elements.push(
        <CollapsibleCodeBlock key={key++} language={language} code={code} />
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
        <Text key={key++} size={2} style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5, marginBottom: '0.75rem'}}>
          {currentParagraph}
        </Text>
      )
      currentParagraph = []
    }
  }

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <Box key={key++} as="ul" style={{margin: '0.75rem 0', paddingLeft: 24, listStyleType: 'disc', listStylePosition: 'outside'}}>
          {listItems}
        </Box>
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
        <Box key={key++} as="li" style={{marginBottom: 8, display: 'list-item', lineHeight: 1.5}}>
          <Text size={2} style={{display: 'inline', lineHeight: 'inherit'}}>
            {parseInlineStyles(listMatch[2], key++)}
          </Text>
        </Box>
      )
    } else {
      if (inList) {
        flushList()
      }

      if (line.trim() === '') {
        flushParagraph()
        if (lineIndex < lines.length - 1) {
          elements.push(<Box key={key++} style={{height: '0.75rem'}} />)
        }
      } else {
        // Check for headers
        const headerMatch = line.match(/^(#{1,6})\s+(.*)$/)
        if (headerMatch) {
          flushParagraph()
          const level = headerMatch[1].length
          const headerText = headerMatch[2]
          elements.push(
            <Text
              key={key++}
              size={level <= 2 ? 2 : 1}
              weight="bold"
              style={{marginTop: level <= 2 ? '1rem' : '0.75rem', marginBottom: '0.5rem'}}
            >
              {parseInlineStyles(headerText, key++)}
            </Text>
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

export function Message({message, onActionClick, onActionExecute}: MessageProps) {
  const isUser = message.role === 'user'
  const isStreaming = message.status === 'streaming'
  const isError = message.status === 'error'

  // Parse markdown for all messages (both user and assistant)
  // This ensures code blocks are collapsible in both directions
  const parsedContent = useMemo(() => {
    if (!message.content) {
      return null
    }
    return parseMarkdown(message.content)
  }, [message.content])

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
      padding={3}
      radius={2}
      tone={isError ? 'critical' : 'default'}
      style={{
        backgroundColor: isUser ? 'rgba(255, 255, 255, 0.06)' : undefined,
      }}
      aria-label={accessibleLabel}
    >
      {/* Content */}
      <Stack space={2} style={{minWidth: 0}}>
          {/* Role label with timestamp */}
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              {isUser ? 'You' : 'Claude'}
            </Text>
            <Text size={0} muted>
              {formatTimestamp(message.timestamp)}
            </Text>
            {isStreaming && (
              <Flex align="center" gap={1} role="status" aria-live="polite">
                <Spinner style={{width: 12, height: 12}} aria-hidden="true" />
                <Text size={0} muted>
                  typing
                </Text>
              </Flex>
            )}
          </Flex>

          {/* Message content */}
          <Box>
            {parsedContent}
            {isStreaming && <BlinkingCursor />}
            {isStreaming && !message.content && (
              <Text size={2} muted style={{fontStyle: 'italic'}}>
                Thinking...
              </Text>
            )}
          </Box>

          {/* Actions */}
          {message.actions && message.actions.length > 0 && (
            <Stack space={2} marginTop={2}>
              {message.actions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onExecute={() => onActionExecute?.(action)}
                  onClick={() => onActionClick?.(action)}
                  messageTimestamp={message.timestamp}
                />
              ))}
            </Stack>
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

  // Re-render if callbacks changed (important for action execution)
  if (prevProps.onActionExecute !== nextProps.onActionExecute) {
    return false
  }
  if (prevProps.onActionClick !== nextProps.onActionClick) {
    return false
  }

  // Re-render if actions changed
  if (prevProps.message.actions?.length !== nextProps.message.actions?.length) {
    return false
  }

  // Check if any action statuses changed
  if (prevProps.message.actions && nextProps.message.actions) {
    for (let i = 0; i < prevProps.message.actions.length; i++) {
      if (prevProps.message.actions[i].status !== nextProps.message.actions[i].status) {
        return false
      }
    }
  }

  // Props are equal, skip re-render
  return true
})
