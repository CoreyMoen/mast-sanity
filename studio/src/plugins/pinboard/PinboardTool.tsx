import {useState, useMemo, useCallback} from 'react'
import {Flex, Spinner, Text, Card, Stack} from '@sanity/ui'
import {usePinboards} from './hooks/usePinboards'
import {usePinboardPages} from './hooks/usePinboardPages'
import {usePinboardTransform} from './hooks/usePinboardTransform'
import {PinboardSidebar} from './components/PinboardSidebar'
import {PinboardCanvas} from './components/PinboardCanvas'
import {PageCard} from './components/PageCard'
import {Toolbar} from './components/Toolbar'
import {PagePickerDialog} from './components/PagePickerDialog'
import type {PageDocument} from './types'

export function PinboardTool() {
  const {
    pinboards,
    loading: pinboardsLoading,
    createPinboard,
    deletePinboard,
    renamePinboard,
    movePinboard,
    addPages: addPagesToPinboard,
    removePage: removePageFromPinboard,
  } = usePinboards()

  const [activePinboardId, setActivePinboardId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  // Resolve effective pinboard: validate selection still exists, fall back to first
  const activePinboardExists = activePinboardId && pinboards.some((c) => c._id === activePinboardId)
  const effectivePinboardId = activePinboardExists ? activePinboardId : (pinboards[0]?._id ?? null)
  const activePinboard = pinboards.find((c) => c._id === effectivePinboardId)

  const {pages, loading: pagesLoading, error: pagesError} = usePinboardPages(effectivePinboardId)
  const {transform, containerRef, handlers, zoomIn, zoomOut, resetTransform} =
    usePinboardTransform()

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages
    const query = searchQuery.toLowerCase()
    return pages.filter(
      ({page}) =>
        page.name?.toLowerCase().includes(query) ||
        page.slug?.current?.toLowerCase().includes(query),
    )
  }, [pages, searchQuery])

  const existingPageIds = useMemo(
    () => pages.map(({page}) => page._id.replace('drafts.', '')),
    [pages],
  )

  const handlePreview = useCallback((page: PageDocument) => {
    const slug = page.slug?.current
    if (slug) {
      window.open(`/presentation?preview=/${slug}`, '_blank')
    }
  }, [])

  const handleEdit = useCallback((page: PageDocument) => {
    const id = page._id.replace('drafts.', '')
    window.open(`/intent/edit/id=${id};type=page`, '_blank')
  }, [])

  const handleRemove = useCallback(
    (page: PageDocument) => {
      if (!effectivePinboardId) return
      const baseId = page._id.replace('drafts.', '')
      removePageFromPinboard(effectivePinboardId, baseId)
    },
    [effectivePinboardId, removePageFromPinboard],
  )

  const handleAddPages = useCallback(
    (pageIds: string[]) => {
      if (!effectivePinboardId) return
      addPagesToPinboard(effectivePinboardId, pageIds)
    },
    [effectivePinboardId, addPagesToPinboard],
  )

  const handleDeletePinboard = useCallback(
    (id: string) => {
      deletePinboard(id)
      // If we deleted the active pinboard, clear selection
      if (id === effectivePinboardId) {
        setActivePinboardId(null)
      }
    },
    [deletePinboard, effectivePinboardId],
  )

  const openPicker = useCallback(() => setPickerOpen(true), [])
  const closePicker = useCallback(() => setPickerOpen(false), [])

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
        onSelect={setActivePinboardId}
        onCreate={createPinboard}
        onDelete={handleDeletePinboard}
        onRename={renamePinboard}
        onMove={movePinboard}
      />

      {/* Main pinboard area */}
      {effectivePinboardId ? (
        <Flex direction="column" style={{flex: 1, minWidth: 0}}>
          <Toolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            scale={transform.scale}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetTransform}
            pageCount={filteredPages.length}
            onAddPages={openPicker}
            pinboardName={activePinboard?.name}
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
              isEmpty={filteredPages.length === 0 && !searchQuery}
              onAddPages={openPicker}
            >
              {filteredPages.map(({page, status}) => (
                <PageCard
                  key={page._id}
                  page={page}
                  status={status}
                  onPreview={handlePreview}
                  onEdit={handleEdit}
                  onRemove={handleRemove}
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

      {/* Page picker dialog */}
      <PagePickerDialog
        isOpen={pickerOpen}
        onClose={closePicker}
        existingPageIds={existingPageIds}
        onAddPages={handleAddPages}
      />
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
