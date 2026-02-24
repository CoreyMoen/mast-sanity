import {useState, useRef, useEffect, useCallback} from 'react'
import {Card, Text, Flex, Button, Stack, Box} from '@sanity/ui'
import {CloseIcon, CheckmarkCircleIcon, TrashIcon, EnterRightIcon, UndoIcon} from '@sanity/icons'
import type {PinboardComment} from '../types'
import {formatRelativeTime} from '../utils'

// -- Props ------------------------------------------------------------------

interface CommentPopoverNewProps {
  mode: 'new'
  xPercent: number
  yPercent: number
  onSubmit: (text: string) => void
  onClose: () => void
}

interface CommentPopoverThreadProps {
  mode: 'thread'
  comment: PinboardComment
  currentUserId: string
  onClose: () => void
  onResolve: (commentKey: string, resolved: boolean) => void
  onDelete: (commentKey: string) => void
  onReply: (commentKey: string, text: string) => void
  onDeleteReply: (commentKey: string, replyKey: string) => void
}

type CommentPopoverProps = CommentPopoverNewProps | CommentPopoverThreadProps

// -- Constants --------------------------------------------------------------

const POPOVER_WIDTH = 280
const MAX_HEIGHT = 400
const FLIP_X_THRESHOLD = 60
const FLIP_Y_THRESHOLD = 30

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

// -- Shared textarea styles -------------------------------------------------

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 60,
  maxHeight: 120,
  padding: '8px 10px',
  border: '1px solid var(--card-border-color, #e0e0e0)',
  borderRadius: 4,
  fontFamily: 'inherit',
  fontSize: 13,
  lineHeight: 1.4,
  resize: 'vertical',
  outline: 'none',
  background: 'var(--card-bg-color, #fff)',
  color: 'var(--card-fg-color, inherit)',
  boxSizing: 'border-box',
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

// -- New Comment Form -------------------------------------------------------

function NewCommentForm({onSubmit, onClose}: {onSubmit: (text: string) => void; onClose: () => void}) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Auto-focus on mount with a small delay to ensure the DOM is ready
    const timer = setTimeout(() => textareaRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (trimmed) {
      onSubmit(trimmed)
    }
  }, [text, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <Stack space={3}>
      <Text size={1} weight="medium">
        New comment
      </Text>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment..."
        style={textareaStyle}
      />
      <Flex gap={2} justify="flex-end">
        <Button fontSize={1} padding={2} mode="ghost" text="Cancel" onClick={onClose} />
        <Button
          fontSize={1}
          padding={2}
          tone="primary"
          text="Submit"
          disabled={!text.trim()}
          onClick={handleSubmit}
        />
      </Flex>
    </Stack>
  )
}

// -- Thread View ------------------------------------------------------------

function ThreadView({
  comment,
  currentUserId,
  onClose,
  onResolve,
  onDelete,
  onReply,
  onDeleteReply,
}: Omit<CommentPopoverThreadProps, 'mode'>) {
  const [replyText, setReplyText] = useState('')
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  const handleReplySubmit = useCallback(() => {
    const trimmed = replyText.trim()
    if (trimmed) {
      onReply(comment._key, trimmed)
      setReplyText('')
    }
  }, [replyText, comment._key, onReply])

  const handleReplyKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleReplySubmit()
      }
    },
    [handleReplySubmit],
  )

  // Auto-scroll to bottom when new replies appear
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [comment.replies?.length])

  return (
    <div style={{display: 'flex', flexDirection: 'column', maxHeight: MAX_HEIGHT}}>
      {/* Header */}
      <Flex align="center" gap={2} style={{padding: '12px 12px 12px', flexShrink: 0}}>
        <AuthorAvatar name={comment.authorName} size={28} />
        <Stack space={1} flex={1} style={{minWidth: 0}}>
          <Text size={1} weight="medium" textOverflow="ellipsis" style={{flex: 1, minWidth: 0}}>
            {comment.authorName}
          </Text>
          <Text size={0} muted>
            {formatRelativeTime(comment.createdAt)}
          </Text>
        </Stack>
        <Button
          icon={CloseIcon}
          mode="bleed"
          fontSize={0}
          padding={1}
          onClick={onClose}
          title="Close"
        />
      </Flex>

      {/* Scrollable thread body */}
      <div
        ref={threadRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 12px',
          minHeight: 0,
        }}
      >
        {/* Comment text — plain <p> to avoid Sanity UI Text crop clipping */}
        <p
          style={{
            margin: '0 0 16px 0',
            fontFamily: 'inherit',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            color: 'var(--card-fg-color, inherit)',
          }}
        >
          {comment.text}
        </p>

        {/* Action buttons */}
        <Flex gap={2} style={{paddingBottom: 18}}>
          <Button
            icon={comment.resolved ? UndoIcon : CheckmarkCircleIcon}
            mode="ghost"
            fontSize={0}
            padding={2}
            text={comment.resolved ? 'Unresolve' : 'Resolve'}
            tone={comment.resolved ? 'default' : 'positive'}
            onClick={() => onResolve(comment._key, !comment.resolved)}
          />
          <Button
            icon={TrashIcon}
            mode="ghost"
            fontSize={0}
            padding={2}
            text="Delete"
            tone="critical"
            onClick={() => onDelete(comment._key)}
          />
        </Flex>

        {/* Divider before replies */}
        {comment.replies && comment.replies.length > 0 && (
          <>
            <div
              style={{
                height: 1,
                background: 'var(--card-border-color, #e0e0e0)',
                marginBottom: 8,
              }}
            />

            {/* Replies */}
            <Stack space={3} style={{paddingBottom: 8}}>
              {comment.replies.map((reply) => (
                <Flex key={reply._key} gap={2} align="flex-start">
                  <AuthorAvatar name={reply.authorName} size={20} />
                  <Stack space={1} flex={1} style={{minWidth: 0}}>
                    <Flex align="center" gap={2}>
                      <Text
                        size={0}
                        weight="medium"
                        textOverflow="ellipsis"
                        style={{flex: 1, minWidth: 0}}
                      >
                        {reply.authorName}
                      </Text>
                      <Text size={0} muted style={{flexShrink: 0}}>
                        {formatRelativeTime(reply.createdAt)}
                      </Text>
                      {reply.authorId === currentUserId && (
                        <Button
                          icon={TrashIcon}
                          mode="bleed"
                          fontSize={0}
                          padding={0}
                          tone="critical"
                          title="Delete reply"
                          style={{marginLeft: 'auto', flexShrink: 0}}
                          onClick={() => onDeleteReply(comment._key, reply._key)}
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
                        color: 'var(--card-fg-color, inherit)',
                      }}
                    >
                      {reply.text}
                    </p>
                  </Stack>
                </Flex>
              ))}
            </Stack>
          </>
        )}
      </div>

      {/* Reply input */}
      <div
        style={{
          padding: '8px 12px 12px',
          borderTop: '1px solid var(--card-border-color, #e0e0e0)',
          flexShrink: 0,
        }}
      >
        <Flex gap={2} align="flex-end">
          <textarea
            ref={replyTextareaRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleReplyKeyDown}
            placeholder="Reply..."
            style={{
              ...textareaStyle,
              minHeight: 36,
              maxHeight: 80,
            }}
          />
          <Button
            icon={EnterRightIcon}
            mode="ghost"
            fontSize={0}
            padding={2}
            tone="primary"
            title="Send reply"
            disabled={!replyText.trim()}
            onClick={handleReplySubmit}
            style={{flexShrink: 0}}
          />
        </Flex>
      </div>
    </div>
  )
}

// -- Main Popover -----------------------------------------------------------

export function CommentPopover(props: CommentPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const xPercent = props.mode === 'new' ? props.xPercent : props.comment.xPercent
  const yPercent = props.mode === 'new' ? props.yPercent : props.comment.yPercent

  // Flip horizontally if close to the right edge
  const flipX = xPercent > FLIP_X_THRESHOLD
  // Flip vertically if close to the top edge
  const flipY = yPercent < FLIP_Y_THRESHOLD

  // Escape key closes the popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        props.onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [props.onClose])

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Don't close if clicking on a comment pin (let the pin handler manage it)
        const target = e.target as HTMLElement
        if (target.closest('[data-comment-pin]')) return
        props.onClose()
      }
    }

    // Use a timeout so the popover's own opening click doesn't close it immediately
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [props.onClose])

  return (
    <div
      ref={containerRef}
      data-comment-popover
      style={{
        position: 'absolute',
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        // Offset from the pin position based on flip direction
        transform: [
          flipX ? `translateX(calc(-100% - 8px))` : 'translateX(8px)',
          flipY ? 'translateY(0)' : 'translateY(calc(-100% + 8px))',
        ].join(' '),
        width: POPOVER_WIDTH,
        zIndex: 20,
        // Prevent the popover from triggering canvas interactions
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Card
        radius={2}
        shadow={2}
        style={{
          maxHeight: MAX_HEIGHT,
        }}
      >
        {props.mode === 'new' ? (
          <Box padding={3}>
            <NewCommentForm onSubmit={props.onSubmit} onClose={props.onClose} />
          </Box>
        ) : (
          <ThreadView
            comment={props.comment}
            currentUserId={props.currentUserId}
            onClose={props.onClose}
            onResolve={props.onResolve}
            onDelete={props.onDelete}
            onReply={props.onReply}
            onDeleteReply={props.onDeleteReply}
          />
        )}
      </Card>
    </div>
  )
}
