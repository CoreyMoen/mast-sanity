import {useState, useEffect, useCallback} from 'react'
import {Layer, Card, Flex, Text, Button, Spinner, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  LaunchIcon,
  EditIcon,
  EllipsisVerticalIcon,
} from '@sanity/icons'
import type {PageDocument, PageStatus, PageWithStatus} from '../types'
import {getPreviewPath} from './PageCard'

interface FocusModeProps {
  pages: PageWithStatus[]
  currentIndex: number
  previewOrigin: string
  onNavigate: (index: number) => void
  onClose: () => void
  onEdit: (page: PageDocument) => void
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

export function FocusMode({
  pages,
  currentIndex,
  previewOrigin,
  onNavigate,
  onClose,
  onEdit,
}: FocusModeProps) {
  const [loaded, setLoaded] = useState(false)
  const current = pages[currentIndex]
  const page = current?.page
  const status = current?.status

  const previewPath = page ? getPreviewPath(page) : null
  const previewUrl = previewPath ? `${previewOrigin}${previewPath}` : null

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < pages.length - 1

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setLoaded(false)
      onNavigate(currentIndex - 1)
    }
  }, [hasPrev, currentIndex, onNavigate])

  const goToNext = useCallback(() => {
    if (hasNext) {
      setLoaded(false)
      onNavigate(currentIndex + 1)
    }
  }, [hasNext, currentIndex, onNavigate])

  // Keyboard navigation: Escape to close, arrow keys to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToPrev, goToNext])

  // Reset loaded state when page changes
  useEffect(() => {
    setLoaded(false)
  }, [currentIndex])

  if (!page) return null

  return (
    <Layer zOffset={1000}>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
        }}
      >
        {/* Iframe area */}
        <div
          style={{
            flex: 1,
            padding: '24px 24px 80px',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {previewUrl ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 1400,
                borderRadius: 8,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              {!loaded && (
                <Flex
                  align="center"
                  justify="center"
                  style={{position: 'absolute', inset: 0, zIndex: 1}}
                >
                  <Spinner muted />
                </Flex>
              )}
              <iframe
                src={previewUrl}
                title={page.displayName || 'Page preview'}
                onLoad={() => setLoaded(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  opacity: loaded ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />
            </div>
          ) : (
            <Flex
              align="center"
              justify="center"
              style={{
                width: '100%',
                maxWidth: 1400,
                borderRadius: 8,
                background: 'var(--card-bg-color, #f3f3f3)',
              }}
            >
              <Text size={2} muted>
                No preview available for this document type
              </Text>
            </Flex>
          )}
        </div>

        {/* Floating navigation bar */}
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
          }}
        >
          <Card
            radius={4}
            shadow={4}
            style={{
              backdropFilter: 'blur(12px)',
              background: 'var(--card-bg-color, rgba(255, 255, 255, 0.95))',
            }}
          >
            <Flex align="center" gap={2} padding={2}>
              {/* Prev / Next */}
              <Button
                icon={ChevronLeftIcon}
                mode="bleed"
                disabled={!hasPrev}
                onClick={goToPrev}
                title="Previous page (←)"
              />
              <Button
                icon={ChevronRightIcon}
                mode="bleed"
                disabled={!hasNext}
                onClick={goToNext}
                title="Next page (→)"
              />

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: 'var(--card-border-color, #e0e0e0)',
                  flexShrink: 0,
                }}
              />

              {/* Page info */}
              <Flex align="center" gap={2} paddingX={1}>
                <Text size={1} weight="medium" style={{whiteSpace: 'nowrap'}}>
                  {page.displayName || 'Untitled'}
                </Text>
                <Text size={1} muted style={{whiteSpace: 'nowrap'}}>
                  {currentIndex + 1} of {pages.length}
                </Text>
                {status && (
                  <Card tone={getStatusTone(status)} padding={1} radius={2}>
                    <Text size={0}>{getStatusLabel(status)}</Text>
                  </Card>
                )}
              </Flex>

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: 'var(--card-border-color, #e0e0e0)',
                  flexShrink: 0,
                }}
              />

              {/* Actions */}
              <MenuButton
                button={
                  <Button
                    icon={EllipsisVerticalIcon}
                    mode="bleed"
                    title="More actions"
                  />
                }
                id="focus-mode-menu"
                menu={
                  <Menu>
                    {previewPath && (
                      <MenuItem
                        icon={LaunchIcon}
                        text="Open in new tab"
                        onClick={() => window.open(`${previewOrigin}${previewPath}`, '_blank')}
                      />
                    )}
                    <MenuItem
                      icon={EditIcon}
                      text="Edit document"
                      onClick={() => onEdit(page)}
                    />
                  </Menu>
                }
                popover={{portal: true}}
              />
              <Button
                icon={CloseIcon}
                mode="bleed"
                title="Close focus mode (Esc)"
                onClick={onClose}
              />
            </Flex>
          </Card>
        </div>
      </div>
    </Layer>
  )
}
