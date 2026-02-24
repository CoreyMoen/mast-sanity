import {useState, useMemo, useCallback} from 'react'
import {Card, Text, Flex, Button, Stack, Box, TextInput, Badge} from '@sanity/ui'
import {CloseIcon, SearchIcon, CommentIcon, CheckmarkCircleIcon} from '@sanity/icons'
import type {PinboardComment, PageWithStatus} from '../types'
import {formatRelativeTime} from '../utils'

// -- Props ------------------------------------------------------------------

interface CommentsPanelProps {
  comments: PinboardComment[]
  pages: PageWithStatus[]
  activeCommentKey: string | null
  onSelectComment: (commentKey: string) => void
  onClose: () => void
}

// -- Constants --------------------------------------------------------------

type FilterTab = 'all' | 'open' | 'resolved'

const AVATAR_COLORS = [
  '#2276FC',
  '#E54D2E',
  '#30A46C',
  '#E5484D',
  '#6E56CF',
  '#F76B15',
  '#0091FF',
  '#AB4ABA',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// -- Avatar -----------------------------------------------------------------

function AuthorAvatar({name, size = 24}: {name: string; size?: number}) {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const color = getAvatarColor(name || '?')

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: size * 0.45,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {initial}
      </span>
    </div>
  )
}

// -- Comment Item -----------------------------------------------------------

interface CommentItemProps {
  comment: PinboardComment
  isActive: boolean
  onSelect: (commentKey: string) => void
}

function CommentItem({comment, isActive, onSelect}: CommentItemProps) {
  const truncatedText =
    comment.text.length > 80 ? comment.text.slice(0, 80) + '...' : comment.text
  const replyCount = comment.replies?.length || 0

  return (
    <Card
      padding={3}
      radius={2}
      tone={isActive ? 'primary' : 'default'}
      pressed={isActive}
      style={{cursor: 'pointer'}}
      onClick={() => onSelect(comment._key)}
    >
      <Flex gap={2} align="flex-start">
        <AuthorAvatar name={comment.authorName} size={24} />
        <Stack space={2} style={{flex: 1, minWidth: 0}}>
          <Flex align="center" gap={2}>
            <Text
              size={1}
              weight="medium"
              textOverflow="ellipsis"
              style={{flex: 1, minWidth: 0}}
            >
              {comment.authorName}
            </Text>
            <Text size={0} muted style={{flexShrink: 0}}>
              {formatRelativeTime(comment.createdAt)}
            </Text>
            {comment.resolved && (
              <CheckmarkCircleIcon
                style={{
                  color: '#30A46C',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              />
            )}
          </Flex>
          <p
            style={{
              margin: 0,
              fontFamily: 'inherit',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              color: 'var(--card-muted-fg-color, inherit)',
            }}
          >
            {truncatedText}
          </p>
          {replyCount > 0 && (
            <Badge fontSize={0} mode="outline">
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </Badge>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}

// -- Main Panel -------------------------------------------------------------

export function CommentsPanel({
  comments,
  pages,
  activeCommentKey,
  onSelectComment,
  onClose,
}: CommentsPanelProps) {
  const [filter, setFilter] = useState<FilterTab>('open')
  const [search, setSearch] = useState('')

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value)
  }, [])

  // Build a page lookup map (keyed by base ID without drafts. prefix)
  const pageMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const {page} of pages) {
      const baseId = page._id.replace('drafts.', '')
      map.set(baseId, page.displayName)
    }
    return map
  }, [pages])

  // Filter and search comments
  const filteredComments = useMemo(() => {
    let result = comments

    // Apply filter tab
    if (filter === 'open') {
      result = result.filter((c) => !c.resolved)
    } else if (filter === 'resolved') {
      result = result.filter((c) => c.resolved)
    }

    // Apply search
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((c) => {
        if (c.text.toLowerCase().includes(query)) return true
        if (c.authorName.toLowerCase().includes(query)) return true
        if (c.replies?.some((r) => r.text.toLowerCase().includes(query))) return true
        if (c.replies?.some((r) => r.authorName.toLowerCase().includes(query))) return true
        return false
      })
    }

    return result
  }, [comments, filter, search])

  // Group filtered comments by page
  const groupedComments = useMemo(() => {
    const groups = new Map<string, PinboardComment[]>()

    for (const comment of filteredComments) {
      const pageId = comment.pageRef
      if (!groups.has(pageId)) {
        groups.set(pageId, [])
      }
      groups.get(pageId)!.push(comment)
    }

    return groups
  }, [filteredComments])

  const hasAnyComments = comments.length > 0
  const hasFilteredComments = filteredComments.length > 0

  return (
    <Card
      borderLeft
      style={{
        width: 300,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header — matches Sidebar header height */}
      <Card padding={3} borderBottom style={{flexShrink: 0}}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              Comments
            </Text>
            {hasAnyComments && (
              <Badge fontSize={0} mode="outline">
                {filteredComments.length}
              </Badge>
            )}
          </Flex>
          <Button
            icon={CloseIcon}
            mode="bleed"
            fontSize={1}
            onClick={onClose}
            title="Close comments panel"
          />
        </Flex>
      </Card>

      {/* Search */}
      <Box padding={3} paddingBottom={2} style={{flexShrink: 0}}>
        <TextInput
          icon={SearchIcon}
          placeholder="Search comments..."
          value={search}
          onChange={handleSearchChange}
          fontSize={1}
        />
      </Box>

      {/* Filter tabs */}
      <Flex gap={1} padding={3} paddingTop={0} style={{flexShrink: 0}}>
        <Button
          text="All"
          mode={filter === 'all' ? 'default' : 'ghost'}
          tone={filter === 'all' ? 'primary' : 'default'}
          fontSize={0}
          padding={2}
          style={{flex: 1}}
          onClick={() => setFilter('all')}
        />
        <Button
          text="Open"
          mode={filter === 'open' ? 'default' : 'ghost'}
          tone={filter === 'open' ? 'primary' : 'default'}
          fontSize={0}
          padding={2}
          style={{flex: 1}}
          onClick={() => setFilter('open')}
        />
        <Button
          text="Resolved"
          mode={filter === 'resolved' ? 'default' : 'ghost'}
          tone={filter === 'resolved' ? 'primary' : 'default'}
          fontSize={0}
          padding={2}
          style={{flex: 1}}
          onClick={() => setFilter('resolved')}
        />
      </Flex>

      {/* Comment list */}
      <Box style={{flex: 1, overflowY: 'auto'}}>
        {hasFilteredComments ? (
          <Stack padding={2} space={3}>
            {Array.from(groupedComments.entries()).map(([pageId, pageComments]) => {
              const pageName = pageMap.get(pageId) || 'Page removed'

              return (
                <Stack key={pageId} space={1}>
                  {/* Page group header */}
                  <Box padding={2} paddingBottom={1}>
                    <Text
                      size={0}
                      weight="semibold"
                      muted
                      textOverflow="ellipsis"
                      style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}
                    >
                      {pageName}
                    </Text>
                  </Box>

                  {/* Comments in this group */}
                  {pageComments.map((comment) => (
                    <CommentItem
                      key={comment._key}
                      comment={comment}
                      isActive={activeCommentKey === comment._key}
                      onSelect={onSelectComment}
                    />
                  ))}
                </Stack>
              )
            })}
          </Stack>
        ) : (
          <Box padding={4}>
            <Stack space={3} style={{textAlign: 'center'}}>
              <Flex justify="center">
                <CommentIcon style={{fontSize: 32, color: 'var(--card-muted-fg-color)'}} />
              </Flex>
              <Text size={1} muted>
                {hasAnyComments ? 'No matching comments' : 'No comments yet'}
              </Text>
            </Stack>
          </Box>
        )}
      </Box>
    </Card>
  )
}
