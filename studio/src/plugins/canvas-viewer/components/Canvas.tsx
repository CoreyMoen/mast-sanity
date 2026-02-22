import type {ReactNode, RefObject} from 'react'
import type {CanvasTransform} from '../types'

interface CanvasProps {
  transform: CanvasTransform
  containerRef: RefObject<HTMLDivElement | null>
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
  }
  children: ReactNode
}

export function Canvas({transform, containerRef, handlers, children}: CanvasProps) {
  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'grab',
        // Subtle dot grid background
        backgroundImage:
          'radial-gradient(circle, var(--card-border-color, #e0e0e0) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      onMouseDown={handlers.onMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseUp={handlers.onMouseUp}
      onMouseLeave={handlers.onMouseLeave}
    >
      <div
        style={{
          transformOrigin: '0 0',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 280px)',
            gap: '24px',
            padding: '40px',
            width: 'fit-content',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
