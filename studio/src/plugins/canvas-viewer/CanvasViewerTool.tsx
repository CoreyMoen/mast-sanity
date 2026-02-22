import {useState, useMemo, useCallback} from 'react'
import {Flex, Spinner, Text, Card, Stack} from '@sanity/ui'
import {useCanvases} from './hooks/useCanvases'
import {useCanvasPages} from './hooks/useCanvasPages'
import {useCanvasTransform} from './hooks/useCanvasTransform'
import {CanvasSidebar} from './components/CanvasSidebar'
import {Canvas} from './components/Canvas'
import {PageCard} from './components/PageCard'
import {Toolbar} from './components/Toolbar'
import {PagePickerDialog} from './components/PagePickerDialog'
import type {PageDocument} from './types'

export function CanvasViewerTool() {
  const {
    canvases,
    loading: canvasesLoading,
    createCanvas,
    deleteCanvas,
    renameCanvas,
    moveCanvas,
    addPages: addPagesToCanvas,
    removePage: removePageFromCanvas,
  } = useCanvases()

  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  // Resolve effective canvas: validate selection still exists, fall back to first
  const activeCanvasExists = activeCanvasId && canvases.some((c) => c._id === activeCanvasId)
  const effectiveCanvasId = activeCanvasExists ? activeCanvasId : (canvases[0]?._id ?? null)
  const activeCanvas = canvases.find((c) => c._id === effectiveCanvasId)

  const {pages, loading: pagesLoading} = useCanvasPages(effectiveCanvasId)
  const {transform, containerRef, handlers, zoomIn, zoomOut, resetTransform} =
    useCanvasTransform()

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
      if (!effectiveCanvasId) return
      const baseId = page._id.replace('drafts.', '')
      removePageFromCanvas(effectiveCanvasId, baseId)
    },
    [effectiveCanvasId, removePageFromCanvas],
  )

  const handleAddPages = useCallback(
    (pageIds: string[]) => {
      if (!effectiveCanvasId) return
      addPagesToCanvas(effectiveCanvasId, pageIds)
    },
    [effectiveCanvasId, addPagesToCanvas],
  )

  const handleDeleteCanvas = useCallback(
    (id: string) => {
      deleteCanvas(id)
      // If we deleted the active canvas, clear selection
      if (id === effectiveCanvasId) {
        setActiveCanvasId(null)
      }
    },
    [deleteCanvas, effectiveCanvasId],
  )

  const openPicker = useCallback(() => setPickerOpen(true), [])
  const closePicker = useCallback(() => setPickerOpen(false), [])

  // Loading state
  if (canvasesLoading) {
    return (
      <Flex align="center" justify="center" style={{height: '100%'}}>
        <Stack space={3} style={{textAlign: 'center'}}>
          <Spinner muted />
          <Text size={1} muted>
            Loading canvases...
          </Text>
        </Stack>
      </Flex>
    )
  }

  return (
    <Flex style={{height: '100%'}}>
      {/* Left sidebar with canvas list */}
      <CanvasSidebar
        canvases={canvases}
        activeCanvasId={effectiveCanvasId}
        onSelect={setActiveCanvasId}
        onCreate={createCanvas}
        onDelete={handleDeleteCanvas}
        onRename={renameCanvas}
        onMove={moveCanvas}
      />

      {/* Main canvas area */}
      {effectiveCanvasId ? (
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
            canvasName={activeCanvas?.name}
          />

          {pagesLoading ? (
            <Flex align="center" justify="center" style={{flex: 1}}>
              <Spinner muted />
            </Flex>
          ) : (
            <Canvas
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
            </Canvas>
          )}
        </Flex>
      ) : (
        <Flex align="center" justify="center" style={{flex: 1}}>
          <Card padding={5} radius={3}>
            <Stack space={3} style={{textAlign: 'center'}}>
              <Text size={2} muted>
                Select a canvas to get started
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
 * Icon for the Canvas Viewer tool in the Studio sidebar.
 * A simple 2x2 grid representing a multi-page canvas view.
 */
export function CanvasViewerIcon() {
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
