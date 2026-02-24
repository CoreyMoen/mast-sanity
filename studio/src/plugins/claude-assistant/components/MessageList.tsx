/**
 * MessageList Component
 *
 * Displays a scrollable list of chat messages with auto-scroll
 *
 * Accessibility features (WCAG 2.1 AA):
 * - role="log" for conversation container
 * - aria-live="polite" for new message announcements
 * - role="listitem" for each message
 * - Proper aria-labels for screen readers
 *
 * Performance optimizations:
 * - useMemo for message grouping to avoid recalculation
 * - Pagination with "Load earlier messages" for long conversations
 * - Memoized Message components
 */

import {useEffect, useRef, useCallback, useMemo, useState} from 'react'
import {Box, Card, Stack, Text, Flex, Button} from '@sanity/ui'
import type {Message as MessageType, ParsedAction} from '../types'
import {MemoizedMessage} from './Message'

// Number of messages to show initially and load per batch
const INITIAL_MESSAGE_COUNT = 20
const LOAD_MORE_COUNT = 20

export interface MessageListProps {
  messages: MessageType[]
  isLoading: boolean
  onActionClick?: (action: ParsedAction) => void
  onActionExecute?: (action: ParsedAction) => void
  onActionUndo?: (action: ParsedAction) => void
  /** Max width for the message content area */
  maxWidth?: number
  /** Compact mode for floating chat */
  compact?: boolean
  /** Hide navigation links in action cards (used in floating chat) */
  hideNavigationLinks?: boolean
  /** Active conversation ID for continuing conversation when navigating */
  conversationId?: string
}

export function MessageList({
  messages,
  isLoading,
  onActionClick,
  onActionExecute,
  onActionUndo,
  maxWidth = 900,
  compact = false,
  hideNavigationLinks = false,
  conversationId,
}: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  // Track how many messages are visible (for pagination)
  const [visibleCount, setVisibleCount] = useState(INITIAL_MESSAGE_COUNT)

  // Reset visible count when messages change significantly (new conversation)
  useEffect(() => {
    if (messages.length <= INITIAL_MESSAGE_COUNT) {
      setVisibleCount(INITIAL_MESSAGE_COUNT)
    }
  }, [messages.length])

  // Calculate which messages to display (most recent ones, excluding hidden)
  const {visibleMessages, hasEarlierMessages, totalCount} = useMemo(() => {
    const displayable = messages.filter((msg) => !msg.hidden)
    const total = displayable.length
    const startIndex = Math.max(0, total - visibleCount)
    return {
      visibleMessages: displayable.slice(startIndex),
      hasEarlierMessages: startIndex > 0,
      totalCount: total,
    }
  }, [messages, visibleCount])

  // Load earlier messages
  const handleLoadEarlier = useCallback(() => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT)
  }, [])

  // Check if user has scrolled up from bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (container) {
      const threshold = 100
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold
      shouldAutoScroll.current = isNearBottom
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive (if user hasn't scrolled up)
  useEffect(() => {
    if (shouldAutoScroll.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({behavior: 'smooth'})
    }
  }, [messages])

  // Also scroll when loading state changes (to show typing indicator)
  useEffect(() => {
    if (isLoading && shouldAutoScroll.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({behavior: 'smooth'})
    }
  }, [isLoading])

  // Empty state is handled by ChatInterface with QuickActions home screen
  // Return null here to avoid showing a duplicate/old intro screen
  if (messages.length === 0 && !isLoading) {
    return null
  }

  return (
    <Box
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{
        padding: compact ? 12 : 16,
      }}
      role="log"
      aria-label="Conversation with Claude"
      aria-live="polite"
      aria-relevant="additions"
      tabIndex={0}
    >
      <Stack
        space={compact ? 3 : 4}
        style={{maxWidth, margin: '0 auto'}}
        role="list"
        aria-label={`${totalCount} message${totalCount !== 1 ? 's' : ''} in conversation`}
      >
        {/* Load earlier messages button */}
        {hasEarlierMessages && (
          <Flex justify="center" paddingY={2}>
            <Button
              text={`Load earlier messages (${totalCount - visibleMessages.length} hidden)`}
              mode="ghost"
              tone="primary"
              onClick={handleLoadEarlier}
              aria-label={`Load ${Math.min(LOAD_MORE_COUNT, totalCount - visibleMessages.length)} earlier messages`}
            />
          </Flex>
        )}

        {visibleMessages.map((message, index) => {
          const actualIndex = totalCount - visibleMessages.length + index
          const isUser = message.role === 'user'
          return (
            <Flex
              key={message.id}
              justify={isUser ? 'flex-end' : 'flex-start'}
              role="listitem"
              aria-setsize={totalCount}
              aria-posinset={actualIndex + 1}
            >
              <MemoizedMessage
                message={message}
                onActionClick={onActionClick}
                onActionExecute={onActionExecute}
                onActionUndo={onActionUndo}
                hideNavigationLinks={hideNavigationLinks}
                conversationId={conversationId}
              />
            </Flex>
          )
        })}

        {/* Loading indicator when waiting for response */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <Card
            padding={3}
            radius={2}
            role="status"
            aria-live="polite"
            aria-label="Claude is thinking"
          >
            <Flex gap={3} align="center">
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
                Claude is thinking...
              </Text>
            </Flex>
          </Card>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} style={{height: 1}} />
      </Stack>
    </Box>
  )
}

