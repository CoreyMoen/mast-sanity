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
import {RobotIcon} from '@sanity/icons'
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
}

export function MessageList({
  messages,
  isLoading,
  onActionClick,
  onActionExecute,
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

  // Calculate which messages to display (most recent ones)
  const {visibleMessages, hasEarlierMessages, totalCount} = useMemo(() => {
    const total = messages.length
    const startIndex = Math.max(0, total - visibleCount)
    return {
      visibleMessages: messages.slice(startIndex),
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

  // Empty state - this shouldn't show when QuickActions is visible
  if (messages.length === 0 && !isLoading) {
    return (
      <Box
        padding={4}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
        }}
        role="status"
        aria-label="No messages yet"
      >
        <Box
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'var(--card-badge-primary-bg-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
          aria-hidden="true"
        >
          <Text size={4} style={{display: 'flex', color: 'var(--card-badge-primary-fg-color)'}}>
            <RobotIcon />
          </Text>
        </Box>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Claude Assistant
          </Text>
          <Text size={2} muted style={{maxWidth: 400}}>
            Ask me anything about your content. I can help you create, update, query, and manage documents in Sanity.
          </Text>
        </Stack>
      </Box>
    )
  }

  return (
    <Box
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
      }}
      role="log"
      aria-label="Conversation with Claude"
      aria-live="polite"
      aria-relevant="additions"
      tabIndex={0}
    >
      <Stack
        space={3}
        style={{maxWidth: 900, margin: '0 auto'}}
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
          return (
            <div key={message.id} role="listitem" aria-setsize={totalCount} aria-posinset={actualIndex + 1}>
              <MemoizedMessage
                message={message}
                onActionClick={onActionClick}
                onActionExecute={onActionExecute}
              />
            </div>
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
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'var(--card-badge-primary-bg-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <Text size={2} style={{display: 'flex', color: 'var(--card-badge-primary-fg-color)'}}>
                  <RobotIcon />
                </Text>
              </Box>
              <Flex align="center" gap={2}>
                <Box
                  style={{
                    display: 'flex',
                    gap: 4,
                  }}
                  aria-hidden="true"
                >
                  <TypingDot delay={0} />
                  <TypingDot delay={150} />
                  <TypingDot delay={300} />
                </Box>
                <Text size={1} muted>
                  Claude is thinking...
                </Text>
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} style={{height: 1}} />
      </Stack>
    </Box>
  )
}

/**
 * Animated typing dot for loading indicator
 */
function TypingDot({delay}: {delay: number}) {
  return (
    <Box
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: 'var(--card-badge-primary-bg-color)',
        animation: `typingBounce 1.4s infinite ease-in-out both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <style>
        {`
          @keyframes typingBounce {
            0%, 80%, 100% {
              transform: scale(0.6);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </Box>
  )
}
