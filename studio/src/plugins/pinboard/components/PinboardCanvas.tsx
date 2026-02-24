import type {ReactNode} from 'react'
import {Flex, Stack, Text, Button, Card} from '@sanity/ui'
import {AddIcon} from '@sanity/icons'
import type {PinboardTransform} from '../types'

interface PinboardCanvasProps {
  transform: PinboardTransform
  containerRef: (node: HTMLDivElement | null) => void
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
  }
  children: ReactNode
  isEmpty: boolean
  onAddPages?: () => void
  onCanvasClick?: () => void
}

export function PinboardCanvas({
  transform,
  containerRef,
  handlers,
  children,
  isEmpty,
  onAddPages,
  onCanvasClick,
}: PinboardCanvasProps) {
  if (isEmpty) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{
          flex: 1,
          backgroundImage:
            'radial-gradient(circle, var(--card-border-color, #e0e0e0) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <Card padding={5} radius={3} shadow={1}>
          <Stack space={4} style={{textAlign: 'center'}}>
            <Text size={2} muted>
              This pinboard is empty
            </Text>
            <Text size={1} muted>
              Add pages to get started
            </Text>
            {onAddPages && (
              <Button icon={AddIcon} text="Add Pages" tone="primary" onClick={onAddPages} />
            )}
          </Stack>
        </Card>
      </Flex>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'grab',
        backgroundImage:
          'radial-gradient(circle, var(--card-border-color, #e0e0e0) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      onMouseDown={handlers.onMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseUp={handlers.onMouseUp}
      onMouseLeave={handlers.onMouseLeave}
      onClick={(e) => {
        // Only fire when clicking the canvas background (not cards or overlays)
        if (e.target === e.currentTarget && onCanvasClick) onCanvasClick()
      }}
    >
      <div
        style={{
          transformOrigin: '0 0',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '24px',
            padding: '40px',
            alignItems: 'flex-start',
            width: 'fit-content',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
