import {useState, useMemo} from 'react'
import {Flex, Spinner, Text, Card, Stack} from '@sanity/ui'
import {usePages} from './hooks/usePages'
import {useCanvasTransform} from './hooks/useCanvasTransform'
import {Canvas} from './components/Canvas'
import {PageCard} from './components/PageCard'
import {Toolbar} from './components/Toolbar'
import type {PageDocument} from './types'

export function CanvasViewerTool() {
  const {pages, loading, error} = usePages()
  const {transform, containerRef, handlers, zoomIn, zoomOut, resetTransform} =
    useCanvasTransform()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages
    const query = searchQuery.toLowerCase()
    return pages.filter(
      ({page}) =>
        page.name?.toLowerCase().includes(query) ||
        page.slug?.current?.toLowerCase().includes(query),
    )
  }, [pages, searchQuery])

  const handlePreview = (page: PageDocument) => {
    const slug = page.slug?.current
    if (slug) {
      // Open in Presentation mode for visual editing
      window.open(`/presentation?preview=/${slug}`, '_blank')
    }
  }

  const handleEdit = (page: PageDocument) => {
    // Open in Structure mode where native commenting works
    const id = page._id.replace('drafts.', '')
    window.open(`/intent/edit/id=${id};type=page`, '_blank')
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{height: '100%'}}>
        <Stack space={3} style={{textAlign: 'center'}}>
          <Spinner muted />
          <Text size={1} muted>
            Loading pages...
          </Text>
        </Stack>
      </Flex>
    )
  }

  if (error) {
    return (
      <Flex align="center" justify="center" style={{height: '100%'}}>
        <Card padding={4} tone="critical" radius={2}>
          <Text>Error loading pages: {error.message}</Text>
        </Card>
      </Flex>
    )
  }

  if (pages.length === 0) {
    return (
      <Flex align="center" justify="center" style={{height: '100%'}}>
        <Card padding={4} radius={2}>
          <Text size={1} muted>
            No pages found. Create a page to see it here.
          </Text>
        </Card>
      </Flex>
    )
  }

  return (
    <Flex direction="column" style={{height: '100%'}}>
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        scale={transform.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetTransform}
        pageCount={filteredPages.length}
      />
      <Canvas transform={transform} containerRef={containerRef} handlers={handlers}>
        {filteredPages.map(({page, status}) => (
          <PageCard
            key={page._id}
            page={page}
            status={status}
            onPreview={handlePreview}
            onEdit={handleEdit}
          />
        ))}
      </Canvas>
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
