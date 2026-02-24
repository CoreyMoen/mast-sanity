import {useState, useMemo, useCallback, useEffect} from 'react'
import {Flex, Spinner, Text, Card, Stack} from '@sanity/ui'
import {useCurrentUser} from 'sanity'
import type {Tool} from 'sanity'
import {useRouter, useRouterState} from 'sanity/router'
import {usePinboards} from './hooks/usePinboards'
import {usePinboardPages} from './hooks/usePinboardPages'
import {usePinboardTransform} from './hooks/usePinboardTransform'
import {usePinboardComments} from './hooks/usePinboardComments'
import {PinboardSidebar} from './components/PinboardSidebar'
import {PinboardCanvas} from './components/PinboardCanvas'
import {PageCard} from './components/PageCard'
import {Toolbar} from './components/Toolbar'
import {PagePickerDialog} from './components/PagePickerDialog'
import {FocusMode} from './components/FocusMode'
import {CommentsPanel} from './components/CommentsPanel'
import type {PageDocument, PendingComment} from './types'

export function PinboardTool({tool}: {tool: Tool<{previewOrigin?: string}>}) {
  const previewOrigin = tool.options?.previewOrigin || process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3001'
  const {
    pinboards,
    loading: pinboardsLoading,
    createPinboard,
    deletePinboard,
    renamePinboard,
    movePinboard,
    addPages: addPagesToPinboard,
    removePage: removePageFromPinboard,
    movePage: movePageInPinboard,
  } = usePinboards()

  const currentUser = useCurrentUser()
  const router = useRouter()
  const routerPinboardId = useRouterState(
    (state) => (state.pinboardId as string) || null,
  )

  const navigateToPinboard = useCallback(
    (id: string | null) => {
      router.navigate(id ? {pinboardId: id} : {})
    },
    [router],
  )

  const [pickerOpen, setPickerOpen] = useState(false)
  const [focusedPageIndex, setFocusedPageIndex] = useState<number | null>(null)
  const [activeCommentKey, setActiveCommentKey] = useState<string | null>(null)
  const [pendingComment, setPendingComment] = useState<PendingComment | null>(null)
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false)

  // Auto-select a pinboard created by Claude Assistant via sessionStorage
  useEffect(() => {
    try {
      const pendingId = sessionStorage.getItem('pinboard-select-after-create')
      if (pendingId && pinboards.some((p) => p._id === pendingId)) {
        navigateToPinboard(pendingId)
        sessionStorage.removeItem('pinboard-select-after-create')
      }
    } catch {
      // Graceful degradation if sessionStorage is unavailable
    }
  }, [pinboards, navigateToPinboard])

  // Resolve effective pinboard: validate selection still exists, fall back to first
  const activePinboardExists = routerPinboardId && pinboards.some((c) => c._id === routerPinboardId)
  const effectivePinboardId = activePinboardExists ? routerPinboardId : (pinboards[0]?._id ?? null)
  const activePinboard = pinboards.find((c) => c._id === effectivePinboardId)

  const {pages, loading: pagesLoading, error: pagesError, refetch: refetchPages} = usePinboardPages(effectivePinboardId)
  const {transform, containerRef, handlers, zoomIn, zoomOut, resetTransform} =
    usePinboardTransform()
  const {
    comments,
    addComment,
    deleteComment,
    resolveComment,
    addReply,
    deleteReply,
  } = usePinboardComments(effectivePinboardId)

  const filteredPages = pages

  const existingPageIds = useMemo(
    () => pages.map(({page}) => page._id.replace('drafts.', '')),
    [pages],
  )

  const handleEdit = useCallback((page: PageDocument) => {
    const slug = page.slug?.current

    // Pages and posts have frontend routes — open in Presentation mode
    if (slug && page._type === 'page') {
      window.open(`/presentation?preview=/${slug}`, '_blank')
    } else if (slug && page._type === 'post') {
      window.open(`/presentation?preview=/posts/${slug}`, '_blank')
    } else {
      // Other types (category, person) — open in Structure mode
      const baseId = page._id.replace('drafts.', '')
      window.open(`/structure/intent/edit/id=${baseId};type=${page._type}`, '_blank')
    }
  }, [])

  const handleRemove = useCallback(
    async (page: PageDocument) => {
      if (!effectivePinboardId) return
      const baseId = page._id.replace('drafts.', '')
      await removePageFromPinboard(effectivePinboardId, baseId)
      refetchPages()
    },
    [effectivePinboardId, removePageFromPinboard, refetchPages],
  )

  const handleMovePage = useCallback(
    async (page: PageDocument, direction: 'left' | 'right') => {
      if (!effectivePinboardId) return
      const baseId = page._id.replace('drafts.', '')
      await movePageInPinboard(effectivePinboardId, baseId, direction)
      refetchPages()
    },
    [effectivePinboardId, movePageInPinboard, refetchPages],
  )

  const handleAddPages = useCallback(
    async (pageIds: string[]) => {
      if (!effectivePinboardId) return
      await addPagesToPinboard(effectivePinboardId, pageIds)
      refetchPages()
    },
    [effectivePinboardId, addPagesToPinboard, refetchPages],
  )

  const handleDeletePinboard = useCallback(
    (id: string) => {
      deletePinboard(id)
      // If we deleted the active pinboard, clear selection
      if (id === effectivePinboardId) {
        navigateToPinboard(null)
      }
    },
    [deletePinboard, effectivePinboardId, navigateToPinboard],
  )

  const handleFocus = useCallback(
    (page: PageDocument) => {
      const index = filteredPages.findIndex(({page: p}) => p._id === page._id)
      if (index !== -1) setFocusedPageIndex(index)
    },
    [filteredPages],
  )

  const closeFocus = useCallback(() => setFocusedPageIndex(null), [])
  const openFocusMode = useCallback(() => setFocusedPageIndex(0), [])

  const openPicker = useCallback(() => setPickerOpen(true), [])
  const closePicker = useCallback(() => setPickerOpen(false), [])

  // Comment handlers
  const handlePlaceComment = useCallback(
    (pageRef: string, xPercent: number, yPercent: number) => {
      setActiveCommentKey(null)
      setPendingComment({pageRef, xPercent, yPercent})
    },
    [],
  )

  const handleSubmitNewComment = useCallback(
    async (text: string) => {
      if (!pendingComment || !currentUser) return
      await addComment({
        pageRef: pendingComment.pageRef,
        xPercent: pendingComment.xPercent,
        yPercent: pendingComment.yPercent,
        authorId: currentUser.id,
        authorName: currentUser.name || currentUser.email || 'Unknown',
        text,
      })
      setPendingComment(null)
    },
    [pendingComment, currentUser, addComment],
  )

  const handleSelectComment = useCallback((commentKey: string) => {
    setPendingComment(null)
    setActiveCommentKey(commentKey)
  }, [])

  const handleCloseComment = useCallback(() => {
    setActiveCommentKey(null)
    setPendingComment(null)
  }, [])

  const handleResolveComment = useCallback(
    async (commentKey: string, resolved: boolean) => {
      await resolveComment(commentKey, resolved)
    },
    [resolveComment],
  )

  const handleDeleteComment = useCallback(
    async (commentKey: string) => {
      await deleteComment(commentKey)
      setActiveCommentKey(null)
    },
    [deleteComment],
  )

  const handleReplyToComment = useCallback(
    async (commentKey: string, text: string) => {
      if (!currentUser) return
      await addReply(commentKey, {
        authorId: currentUser.id,
        authorName: currentUser.name || currentUser.email || 'Unknown',
        text,
      })
    },
    [currentUser, addReply],
  )

  const handleDeleteReply = useCallback(
    async (commentKey: string, replyKey: string) => {
      await deleteReply(commentKey, replyKey)
    },
    [deleteReply],
  )

  const handleCanvasClick = useCallback(() => {
    setActiveCommentKey(null)
    setPendingComment(null)
  }, [])

  const toggleCommentsPanel = useCallback(() => {
    setCommentsPanelOpen((prev) => !prev)
  }, [])

  const unresolvedCommentCount = useMemo(
    () => comments.filter((c) => !c.resolved).length,
    [comments],
  )

  // Loading state
  if (pinboardsLoading) {
    return (
      <Flex align="center" justify="center" style={{height: '100%'}}>
        <Stack space={3} style={{textAlign: 'center'}}>
          <Spinner muted />
          <Text size={1} muted>
            Loading pinboards...
          </Text>
        </Stack>
      </Flex>
    )
  }

  return (
    <Flex style={{height: '100%'}}>
      {/* Left sidebar with pinboard list */}
      <PinboardSidebar
        pinboards={pinboards}
        activePinboardId={effectivePinboardId}
        onSelect={navigateToPinboard}
        onCreate={createPinboard}
        onDelete={handleDeletePinboard}
        onRename={renamePinboard}
        onMove={movePinboard}
      />

      {/* Main pinboard area */}
      {effectivePinboardId ? (
        <Flex direction="column" style={{flex: 1, minWidth: 0}}>
          <Toolbar
            scale={transform.scale}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetTransform}
            pageCount={filteredPages.length}
            onAddPages={openPicker}
            pinboardName={activePinboard?.name}
            commentCount={unresolvedCommentCount}
            commentsPanelOpen={commentsPanelOpen}
            onToggleComments={toggleCommentsPanel}
            onFocusMode={openFocusMode}
          />

          {pagesLoading ? (
            <Flex align="center" justify="center" style={{flex: 1}}>
              <Spinner muted />
            </Flex>
          ) : pagesError ? (
            <Flex align="center" justify="center" style={{flex: 1}}>
              <Card padding={4} radius={3} tone="critical">
                <Stack space={3} style={{textAlign: 'center'}}>
                  <Text size={1}>Failed to load pages</Text>
                  <Text size={1} muted>
                    {pagesError.message}
                  </Text>
                </Stack>
              </Card>
            </Flex>
          ) : (
            <PinboardCanvas
              transform={transform}
              containerRef={containerRef}
              handlers={handlers}
              isEmpty={filteredPages.length === 0}
              onAddPages={openPicker}
              onCanvasClick={handleCanvasClick}
            >
              {filteredPages.map(({page, status}, index) => (
                <PageCard
                  key={page._id}
                  page={page}
                  status={status}
                  previewOrigin={previewOrigin}
                  onEdit={handleEdit}
                  onRemove={handleRemove}
                  onFocus={handleFocus}
                  onMove={handleMovePage}
                  isFirst={index === 0}
                  isLast={index === filteredPages.length - 1}
                  comments={comments}
                  activeCommentKey={activeCommentKey}
                  pendingComment={pendingComment}
                  currentUserId={currentUser?.id}
                  onPlaceComment={handlePlaceComment}
                  onSelectComment={handleSelectComment}
                  onSubmitNewComment={handleSubmitNewComment}
                  onCloseComment={handleCloseComment}
                  onResolveComment={handleResolveComment}
                  onDeleteComment={handleDeleteComment}
                  onReplyToComment={handleReplyToComment}
                  onDeleteReply={handleDeleteReply}
                />
              ))}
            </PinboardCanvas>
          )}
        </Flex>
      ) : (
        <Flex align="center" justify="center" style={{flex: 1}}>
          <Card padding={5} radius={3}>
            <Stack space={3} style={{textAlign: 'center'}}>
              <Text size={2} muted>
                Select a pinboard to get started
              </Text>
              <Text size={1} muted>
                or create a new one from the sidebar
              </Text>
            </Stack>
          </Card>
        </Flex>
      )}

      {/* Comments panel (right sidebar) */}
      {commentsPanelOpen && (
        <CommentsPanel
          comments={comments}
          pages={filteredPages}
          activeCommentKey={activeCommentKey}
          onSelectComment={handleSelectComment}
          onClose={toggleCommentsPanel}
        />
      )}

      {/* Page picker dialog */}
      <PagePickerDialog
        isOpen={pickerOpen}
        onClose={closePicker}
        existingPageIds={existingPageIds}
        onAddPages={handleAddPages}
      />

      {/* Focus mode overlay */}
      {focusedPageIndex !== null && (
        <FocusMode
          pages={filteredPages}
          currentIndex={focusedPageIndex}
          previewOrigin={previewOrigin}
          onNavigate={setFocusedPageIndex}
          onClose={closeFocus}
          onEdit={handleEdit}
        />
      )}
    </Flex>
  )
}

/**
 * Icon for the Pinboard tool in the Studio sidebar.
 * A simple 2x2 grid representing a multi-page pinboard view.
 */
export function PinboardIcon() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="14" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="14" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="14" y="14" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
