import {useCallback} from 'react'
import type {PinboardComment} from '../types'

interface CommentPinProps {
  comment: PinboardComment
  isActive: boolean
  onSelect: () => void
}

const PIN_SIZE = 24
const RESOLVED_COLOR = '#8C8C8C'
const UNRESOLVED_COLOR = '#2276FC'

export function CommentPin({comment, isActive, onSelect}: CommentPinProps) {
  const color = comment.resolved ? RESOLVED_COLOR : UNRESOLVED_COLOR
  const initial = comment.authorName?.charAt(0)?.toUpperCase() || '?'
  const replyCount = comment.replies?.length ?? 0

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelect()
    },
    [onSelect],
  )

  return (
    <div
      data-comment-pin
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: `${comment.xPercent}%`,
        top: `${comment.yPercent}%`,
        transform: 'translate(-50%, -100%)',
        cursor: 'pointer',
        zIndex: isActive ? 10 : 5,
        // Prevent the pin from being affected by parent transforms
        pointerEvents: 'auto',
      }}
    >
      {/* Teardrop / map-pin shape */}
      <div
        style={{
          width: PIN_SIZE,
          height: PIN_SIZE,
          backgroundColor: color,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isActive
            ? `0 0 0 3px white, 0 0 0 5px ${color}`
            : '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.15s ease',
        }}
      >
        {/* Initial letter — counter-rotated so it reads normally */}
        <span
          style={{
            transform: 'rotate(45deg)',
            color: 'white',
            fontWeight: 700,
            fontSize: 11,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {initial}
        </span>
      </div>

      {/* Reply count badge */}
      {replyCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -8,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: color,
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: 9,
              fontWeight: 700,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {replyCount}
          </span>
        </div>
      )}
    </div>
  )
}
