import {useState, useRef, useEffect} from 'react'
import {Card, Text, Flex, Button, Badge, Spinner, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {
  LaunchIcon,
  EditIcon,
  CloseIcon,
  EyeOpenIcon,
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@sanity/icons'
import type {PageDocument, PageStatus, PinboardComment, PendingComment} from '../types'
import {CommentOverlay} from './CommentOverlay'
import {CommentPopover} from './CommentPopover'

/** Simulated desktop viewport width for the iframe */
const VIEWPORT_WIDTH = 1600
/** Simulated desktop viewport height — the iframe starts at this size so 100vh is correct */
const VIEWPORT_HEIGHT = 900
/** Display width of each card on the canvas */
const CARD_WIDTH = 300
/** Scale factor to fit the viewport into the card width */
const SCALE = CARD_WIDTH / VIEWPORT_WIDTH

/** Returns the frontend path for a document, or null if it has no previewable page */
export function getPreviewPath(page: PageDocument): string | null {
  const slug = page.slug?.current
  if (!slug) return null

  switch (page._type) {
    case 'page':
      return slug === 'home' ? '/' : `/${slug}`
    case 'post':
      return `/posts/${slug}`
    default:
      return null
  }
}

interface PageCardProps {
  page: PageDocument
  status: PageStatus
  previewOrigin: string
  onEdit: (page: PageDocument) => void
  onRemove: (page: PageDocument) => void
  onFocus?: (page: PageDocument) => void
  onMove?: (page: PageDocument, direction: 'left' | 'right') => void
  isFirst?: boolean
  isLast?: boolean
  // Comment props
  comments?: PinboardComment[]
  activeCommentKey?: string | null
  pendingComment?: PendingComment | null
  currentUserId?: string
  onPlaceComment?: (pageRef: string, xPercent: number, yPercent: number) => void
  onSelectComment?: (commentKey: string) => void
  onSubmitNewComment?: (text: string) => void
  onCloseComment?: () => void
  onResolveComment?: (commentKey: string, resolved: boolean) => void
  onDeleteComment?: (commentKey: string) => void
  onReplyToComment?: (commentKey: string, text: string) => void
  onDeleteReply?: (commentKey: string, replyKey: string) => void
}

function getStatusTone(status: PageStatus): 'positive' | 'caution' | 'primary' {
  switch (status) {
    case 'published':
      return 'positive'
    case 'draft':
      return 'caution'
    case 'modified':
      return 'primary'
  }
}

function getStatusLabel(status: PageStatus): string {
  switch (status) {
    case 'published':
      return 'Published'
    case 'draft':
      return 'Draft'
    case 'modified':
      return 'Modified'
  }
}

export function PageCard({
  page,
  status,
  previewOrigin,
  onEdit,
  onRemove,
  onFocus,
  onMove,
  isFirst,
  isLast,
  comments,
  activeCommentKey,
  pendingComment,
  currentUserId,
  onPlaceComment,
  onSelectComment,
  onSubmitNewComment,
  onCloseComment,
  onResolveComment,
  onDeleteComment,
  onReplyToComment,
  onDeleteReply,
}: PageCardProps) {
  const previewPath = getPreviewPath(page)
  const previewUrl = previewPath ? `${previewOrigin}${previewPath}?pinboard=1` : null
  const [loaded, setLoaded] = useState(false)
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for postMessage from the iframe reporting its scrollHeight
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'pinboard-height') return
      if (iframeRef.current && e.source === iframeRef.current.contentWindow) {
        setContentHeight(e.data.height)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleLoad = () => {
    setLoaded(true)
    // Request height after a short delay to let the page finish rendering
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({type: 'pinboard-request-height'}, '*')
    }, 500)
  }

  // Phase 1: iframe renders at real viewport size (1600×900) so 100vh is correct.
  // Phase 2: once we know the true scrollHeight, expand iframe to show the full page.
  // CSS overrides in the iframe lock vh-dependent values so the layout stays stable.
  const iframeHeight = contentHeight || VIEWPORT_HEIGHT
  const displayHeight = contentHeight ? contentHeight * SCALE : VIEWPORT_HEIGHT * SCALE
  const isReady = loaded && contentHeight !== null

  const basePageId = page._id.replace('drafts.', '')
  const pageComments = comments?.filter((c) => c.pageRef === basePageId) ?? []
  const activeComment = activeCommentKey
    ? pageComments.find((c) => c._key === activeCommentKey) ?? null
    : null
  const isPendingOnThisCard = pendingComment?.pageRef === basePageId

  return (
    <div style={{width: CARD_WIDTH, flexShrink: 0, position: 'relative'}}>
      {/* Header: name, type badge, status badge, and action buttons */}
      <Flex align="center" gap={2} style={{paddingBottom: '8px'}}>
        <Text size={0} weight="medium" textOverflow="ellipsis" style={{flex: 1, minWidth: 0}}>
          {page.displayName || 'Untitled'}
        </Text>
        {page._type !== 'page' && (
          <Badge fontSize={0} mode="outline" style={{flexShrink: 0}}>
            {page._type}
          </Badge>
        )}
        <Badge tone={getStatusTone(status)} fontSize={0} style={{flexShrink: 0}}>
          {getStatusLabel(status)}
        </Badge>
        <Flex gap={0} style={{flexShrink: 0}}>
          {onMove && !isFirst && (
            <Button
              icon={ChevronLeftIcon}
              mode="bleed"
              fontSize={0}
              padding={1}
              title="Move left"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onMove(page, 'left')
              }}
            />
          )}
          {onMove && !isLast && (
            <Button
              icon={ChevronRightIcon}
              mode="bleed"
              fontSize={0}
              padding={1}
              title="Move right"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onMove(page, 'right')
              }}
            />
          )}
          <MenuButton
            button={
              <Button
                icon={EllipsisVerticalIcon}
                mode="bleed"
                fontSize={0}
                padding={1}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            }
            id={`page-card-menu-${page._id}`}
            menu={
              <Menu>
                {previewPath && onFocus && (
                  <MenuItem
                    icon={EyeOpenIcon}
                    text="Focus mode"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFocus(page)
                    }}
                  />
                )}
                {previewPath && (
                  <MenuItem
                    icon={LaunchIcon}
                    text="Open in new tab"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(`${previewOrigin}${previewPath}`, '_blank')
                    }}
                  />
                )}
                <MenuItem
                  icon={EditIcon}
                  text="Edit document"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(page)
                  }}
                />
                <MenuItem
                  icon={CloseIcon}
                  text="Remove from pinboard"
                  tone="critical"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(page)
                  }}
                />
              </Menu>
            }
            popover={{portal: true}}
          />
        </Flex>
      </Flex>

      {/* Preview area — iframe for previewable types, static card for others */}
      <Card
        data-page-card
        radius={2}
        shadow={1}
        style={{overflow: 'hidden', userSelect: 'none'}}
      >
        {previewUrl ? (
          <div
            style={{
              position: 'relative',
              width: CARD_WIDTH,
              height: displayHeight,
              overflow: 'hidden',
              background: 'var(--card-bg-color, #f3f3f3)',
            }}
          >
            {!isReady && (
              <Flex
                align="center"
                justify="center"
                style={{position: 'absolute', inset: 0, zIndex: 1}}
              >
                <Spinner muted />
              </Flex>
            )}
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title={page.displayName || 'Page preview'}
              onLoad={handleLoad}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: VIEWPORT_WIDTH,
                height: iframeHeight,
                transform: `scale(${SCALE})`,
                transformOrigin: '0 0',
                border: 'none',
                pointerEvents: 'none',
                opacity: isReady ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
            {/* Comment overlay — only after iframe has reported its final height */}
            {isReady && onPlaceComment && onSelectComment && (
              <CommentOverlay
                comments={pageComments}
                activeCommentKey={activeCommentKey ?? null}
                onPlaceComment={(x, y) => onPlaceComment(basePageId, x, y)}
                onSelectComment={onSelectComment}
              />
            )}
          </div>
        ) : (
          <Flex
            align="center"
            justify="center"
            style={{
              width: CARD_WIDTH,
              height: 120,
              background: 'var(--card-bg-color, #f3f3f3)',
            }}
          >
            <Text size={1} muted>
              No preview available
            </Text>
          </Flex>
        )}
      </Card>

      {/* Comment popover — new comment form */}
      {isPendingOnThisCard && pendingComment && onSubmitNewComment && onCloseComment && (
        <CommentPopover
          mode="new"
          xPercent={pendingComment.xPercent}
          yPercent={pendingComment.yPercent}
          onSubmit={onSubmitNewComment}
          onClose={onCloseComment}
        />
      )}

      {/* Comment popover — existing thread */}
      {activeComment && !isPendingOnThisCard && onCloseComment && onResolveComment && onDeleteComment && onReplyToComment && onDeleteReply && currentUserId && (
        <CommentPopover
          mode="thread"
          comment={activeComment}
          currentUserId={currentUserId}
          onClose={onCloseComment}
          onResolve={onResolveComment}
          onDelete={onDeleteComment}
          onReply={onReplyToComment}
          onDeleteReply={onDeleteReply}
        />
      )}
    </div>
  )
}
