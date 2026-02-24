import {useCallback, useRef} from 'react'
import type {PinboardComment} from '../types'
import {CommentPin} from './CommentPin'

interface CommentOverlayProps {
  comments: PinboardComment[]
  activeCommentKey: string | null
  onPlaceComment: (xPercent: number, yPercent: number) => void
  onSelectComment: (commentKey: string) => void
}

/**
 * Custom cursor SVG: a comment bubble shape with rounded top corners and
 * bottom-right corner, sharp bottom-left corner as the click anchor point.
 * Filled with semi-transparent blue. Hotspot at bottom-left (0, 24).
 */
const COMMENT_CURSOR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path d="M2 22 L2 8 Q2 2 8 2 L16 2 Q22 2 22 8 L22 14 Q22 20 16 20 L8 20 Z"
        fill="rgba(34,118,252,0.7)" stroke="white" stroke-width="1.5"/>
</svg>
`.trim()

const CURSOR_DATA_URI = `url("data:image/svg+xml,${encodeURIComponent(COMMENT_CURSOR_SVG)}") 0 24, crosshair`

export function CommentOverlay({
  comments,
  activeCommentKey,
  onPlaceComment,
  onSelectComment,
}: CommentOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't trigger placement when clicking on a pin
      const target = e.target as HTMLElement
      if (target.closest('[data-comment-pin]')) return

      const rect = overlayRef.current?.getBoundingClientRect()
      if (!rect) return

      const xPercent = ((e.clientX - rect.left) / rect.width) * 100
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100

      onPlaceComment(xPercent, yPercent)
    },
    [onPlaceComment],
  )

  return (
    <div
      ref={overlayRef}
      data-comment-overlay
      onClick={handleClick}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        cursor: CURSOR_DATA_URI,
      }}
    >
      {comments.map((comment) => (
        <CommentPin
          key={comment._key}
          comment={comment}
          isActive={activeCommentKey === comment._key}
          onSelect={() => onSelectComment(comment._key)}
        />
      ))}
    </div>
  )
}
