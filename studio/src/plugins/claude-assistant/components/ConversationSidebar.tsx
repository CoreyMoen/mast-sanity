/**
 * ConversationSidebar Component
 *
 * Displays conversation history grouped by time periods
 * with archive and delete functionality
 *
 * Accessibility features (WCAG 2.1 AA):
 * - role="navigation" for the sidebar
 * - role="listbox" for conversation list
 * - Arrow key navigation between conversations
 * - aria-selected for active conversation
 * - Keyboard accessible menu actions
 *
 * Performance optimizations:
 * - Pagination: Only show first 20 conversations initially
 * - "Load more" functionality to load additional conversations
 * - Memoized grouped conversations to avoid recalculation
 */

import React, {useMemo, useState, useCallback, useRef, KeyboardEvent} from 'react'
import {Box, Button, Card, Flex, Stack, Text, Menu, MenuButton, MenuItem, Tooltip} from '@sanity/ui'
import {
  AddIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  ArchiveIcon,
  RestoreIcon,
  CommentIcon,
} from '@sanity/icons'
import type {Conversation} from '../types'

// Pagination constants
const INITIAL_CONVERSATIONS_COUNT = 20
const LOAD_MORE_COUNT = 20

export interface ConversationSidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onCreate: () => void
  onArchive?: (id: string) => void
  onRestore?: (id: string) => void
}

/**
 * Time period groupings
 */
type TimePeriod = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'older'

interface GroupedConversations {
  today: Conversation[]
  yesterday: Conversation[]
  last7days: Conversation[]
  last30days: Conversation[]
  older: Conversation[]
}

/**
 * Group conversations by time period
 */
function groupConversationsByTime(conversations: Conversation[]): GroupedConversations {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const last7days = new Date(today)
  last7days.setDate(last7days.getDate() - 7)
  const last30days = new Date(today)
  last30days.setDate(last30days.getDate() - 30)

  const groups: GroupedConversations = {
    today: [],
    yesterday: [],
    last7days: [],
    last30days: [],
    older: [],
  }

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updatedAt)

    if (convDate >= today) {
      groups.today.push(conv)
    } else if (convDate >= yesterday) {
      groups.yesterday.push(conv)
    } else if (convDate >= last7days) {
      groups.last7days.push(conv)
    } else if (convDate >= last30days) {
      groups.last30days.push(conv)
    } else {
      groups.older.push(conv)
    }
  })

  return groups
}

/**
 * Period labels for display
 */
const PERIOD_LABELS: Record<TimePeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7days: 'Previous 7 Days',
  last30days: 'Previous 30 Days',
  older: 'Older',
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onCreate,
  onArchive,
  onRestore,
}: ConversationSidebarProps) {
  const [showArchived, setShowArchived] = useState(false)
  const [visibleCount, setVisibleCount] = useState(INITIAL_CONVERSATIONS_COUNT)
  const listRef = useRef<HTMLDivElement>(null)

  // Paginate conversations first, then group
  const {visibleConversations, hasMore, totalCount} = useMemo(() => {
    const total = conversations.length
    const visible = conversations.slice(0, visibleCount)
    return {
      visibleConversations: visible,
      hasMore: visibleCount < total,
      totalCount: total,
    }
  }, [conversations, visibleCount])

  // Group visible conversations by time period (memoized)
  const groupedConversations = useMemo(() => {
    return groupConversationsByTime(visibleConversations)
  }, [visibleConversations])

  // Get periods that have conversations (memoized)
  const activePeriods = useMemo(() => {
    const periods: TimePeriod[] = ['today', 'yesterday', 'last7days', 'last30days', 'older']
    return periods.filter((period) => groupedConversations[period].length > 0)
  }, [groupedConversations])

  // Load more conversations
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT)
  }, [])

  // Handle keyboard navigation in the conversation list
  const handleListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!visibleConversations.length) return

      const currentIndex = visibleConversations.findIndex((c) => c.id === activeConversationId)

      let nextIndex: number | null = null

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          nextIndex = currentIndex > 0 ? currentIndex - 1 : visibleConversations.length - 1
          break
        case 'ArrowDown':
          event.preventDefault()
          nextIndex = currentIndex < visibleConversations.length - 1 ? currentIndex + 1 : 0
          break
        case 'Home':
          event.preventDefault()
          nextIndex = 0
          break
        case 'End':
          event.preventDefault()
          nextIndex = visibleConversations.length - 1
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (activeConversationId) {
            onSelect(activeConversationId)
          }
          return
      }

      if (nextIndex !== null && visibleConversations[nextIndex]) {
        onSelect(visibleConversations[nextIndex].id)
        // Focus the selected item
        const items = listRef.current?.querySelectorAll('[role="option"]')
        if (items && items[nextIndex]) {
          (items[nextIndex] as HTMLElement).focus()
        }
      }
    },
    [visibleConversations, activeConversationId, onSelect]
  )

  return (
    <Card
      style={{
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--card-border-color)',
        flexShrink: 0,
      }}
      role="complementary"
      aria-label="Conversation history"
    >
      {/* Header */}
      <Box padding={3} style={{borderBottom: '1px solid var(--card-border-color)', flexShrink: 0}}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            Conversations
          </Text>
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>New conversation</Text>
              </Box>
            }
            placement="bottom"
            portal
          >
            <Button
              icon={AddIcon}
              mode="bleed"
              tone="primary"
              onClick={onCreate}
              aria-label="New conversation"
            />
          </Tooltip>
        </Flex>
      </Box>

      {/* Conversation list */}
      <Box
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
        role="listbox"
        aria-label="Conversations"
        aria-activedescendant={activeConversationId ? `conversation-${activeConversationId}` : undefined}
        tabIndex={visibleConversations.length > 0 ? 0 : -1}
        onKeyDown={handleListKeyDown}
      >
        {visibleConversations.length === 0 ? (
          <Box padding={4} role="status" aria-label="No conversations">
            <Stack space={3} style={{textAlign: 'center'}}>
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--card-badge-default-bg-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
                aria-hidden="true"
              >
                <Text size={2} muted>
                  <CommentIcon />
                </Text>
              </Box>
              <Text size={1} muted>
                No conversations yet
              </Text>
              <Text size={0} muted>
                Start a new conversation to get help with your content
              </Text>
            </Stack>
          </Box>
        ) : (
          <Stack space={0}>
            {activePeriods.map((period) => (
              <ConversationGroup
                key={period}
                label={PERIOD_LABELS[period]}
                conversations={groupedConversations[period]}
                activeConversationId={activeConversationId}
                onSelect={onSelect}
                onDelete={onDelete}
                onArchive={onArchive}
              />
            ))}

            {/* Load more button */}
            {hasMore && (
              <Box paddingX={2} paddingY={3}>
                <Button
                  text={`Load more (${totalCount - visibleConversations.length} remaining)`}
                  mode="ghost"
                  tone="primary"
                  onClick={handleLoadMore}
                  style={{width: '100%'}}
                  aria-label={`Load ${Math.min(LOAD_MORE_COUNT, totalCount - visibleConversations.length)} more conversations`}
                />
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {/* Footer with archive toggle */}
      {onArchive && (
        <Box
          padding={2}
          style={{
            borderTop: '1px solid var(--card-border-color)',
            flexShrink: 0,
          }}
        >
          <Button
            icon={showArchived ? RestoreIcon : ArchiveIcon}
            text={showArchived ? 'Show Active' : 'Show Archived'}
            mode="bleed"
            tone="default"
            onClick={() => setShowArchived(!showArchived)}
            style={{width: '100%', justifyContent: 'flex-start'}}
          />
        </Box>
      )}
    </Card>
  )
}

/**
 * Conversation group by time period
 */
interface ConversationGroupProps {
  label: string
  conversations: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onArchive?: (id: string) => void
}

function ConversationGroup({
  label,
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onArchive,
}: ConversationGroupProps) {
  if (conversations.length === 0) return null

  const groupId = `conversation-group-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <Box role="group" aria-labelledby={groupId}>
      <Box paddingX={3} paddingY={2}>
        <Text
          id={groupId}
          size={0}
          weight="semibold"
          muted
          style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}
        >
          {label}
        </Text>
      </Box>
      <Stack space={1} paddingX={2} paddingBottom={2}>
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onSelect={() => onSelect(conversation.id)}
            onDelete={() => onDelete(conversation.id)}
            onArchive={onArchive ? () => onArchive(conversation.id) : undefined}
          />
        ))}
      </Stack>
    </Box>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onArchive?: () => void
}

/**
 * Memoized conversation item component
 */
const ConversationItem = React.memo(function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onArchive,
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Handle keyboard interaction
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect()
      }
    },
    [onSelect]
  )

  return (
    <Card
      id={`conversation-${conversation.id}`}
      padding={2}
      radius={2}
      tone={isActive ? 'primary' : 'default'}
      style={{
        cursor: 'pointer',
        backgroundColor: isActive
          ? 'var(--card-badge-primary-bg-color)'
          : isHovered
          ? 'var(--card-bg2-color)'
          : undefined,
        transition: 'background-color 100ms ease',
      }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="option"
      aria-selected={isActive}
      aria-label={`${conversation.title}, ${formatRelativeTime(conversation.updatedAt)}, ${conversation.messages.length} messages`}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={handleKeyDown}
    >
      <Flex align="center" gap={2}>
        <Box style={{flex: 1, minWidth: 0}}>
          <Text
            size={1}
            weight={isActive ? 'semibold' : 'regular'}
            textOverflow="ellipsis"
            style={{
              display: 'block',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {conversation.title}
          </Text>
          <Flex align="center" gap={1} marginTop={1}>
            <ClockIcon style={{width: 10, height: 10, opacity: 0.5}} />
            <Text size={0} muted>
              {formatRelativeTime(conversation.updatedAt)}
            </Text>
            {conversation.messages.length > 0 && (
              <>
                <Text size={0} muted style={{opacity: 0.5}}>|</Text>
                <Text size={0} muted>
                  {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </Flex>
        </Box>

        {(isHovered || isActive) && (
          <MenuButton
            button={
              <Button
                icon={EllipsisVerticalIcon}
                mode="bleed"
                padding={2}
                onClick={(e) => e.stopPropagation()}
                style={{opacity: isHovered || isActive ? 1 : 0}}
                aria-label={`Actions for ${conversation.title}`}
                aria-haspopup="menu"
              />
            }
            id={`conversation-menu-${conversation.id}`}
            menu={
              <Menu aria-label="Conversation actions">
                {onArchive && (
                  <MenuItem
                    icon={ArchiveIcon}
                    text="Archive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onArchive()
                    }}
                  />
                )}
                <MenuItem
                  icon={TrashIcon}
                  text="Delete"
                  tone="critical"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                />
              </Menu>
            }
            popover={{portal: true}}
          />
        )}
      </Flex>
    </Card>
  )
})

/**
 * Format relative time with more detail
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d`

  return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
}
