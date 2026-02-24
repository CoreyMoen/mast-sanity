import {Flex, Button, Text, Card, Badge} from '@sanity/ui'
import {AddIcon, RemoveIcon, UndoIcon, CommentIcon, EyeOpenIcon} from '@sanity/icons'

interface ToolbarProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  pageCount: number
  onAddPages: () => void
  pinboardName?: string
  commentCount?: number
  commentsPanelOpen?: boolean
  onToggleComments?: () => void
  onFocusMode?: () => void
}

export function Toolbar({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  pageCount,
  onAddPages,
  pinboardName,
  commentCount = 0,
  commentsPanelOpen,
  onToggleComments,
  onFocusMode,
}: ToolbarProps) {
  return (
    <Card padding={3} borderBottom style={{flexShrink: 0}}>
      <Flex align="center" gap={3}>
        {pinboardName && (
          <Text size={1} weight="semibold" style={{flexShrink: 0}}>
            {pinboardName}
          </Text>
        )}

        <Badge fontSize={1} mode="outline" style={{flexShrink: 0}}>
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </Badge>

        <Flex flex={1} />

        <Flex align="center" gap={1} style={{flexShrink: 0}}>
          <Button icon={RemoveIcon} mode="bleed" onClick={onZoomOut} title="Zoom out" />
          <Text size={1} muted style={{minWidth: 50, textAlign: 'center'}}>
            {Math.round(scale * 100)}%
          </Text>
          <Button icon={AddIcon} mode="bleed" onClick={onZoomIn} title="Zoom in" />
          <Button icon={UndoIcon} mode="bleed" onClick={onResetZoom} title="Reset zoom" />
        </Flex>

        {onFocusMode && pageCount > 0 && (
          <Button
            icon={EyeOpenIcon}
            mode="ghost"
            fontSize={1}
            onClick={onFocusMode}
            title="Focus mode"
            style={{flexShrink: 0}}
          />
        )}

        {onToggleComments && (
          <Flex align="center" gap={1} style={{flexShrink: 0}}>
            <Button
              icon={CommentIcon}
              mode={commentsPanelOpen ? 'default' : 'ghost'}
              tone={commentsPanelOpen ? 'primary' : 'default'}
              fontSize={1}
              onClick={onToggleComments}
              title="Toggle comments panel"
              text={commentCount > 0 ? String(commentCount) : undefined}
            />
          </Flex>
        )}

        <Button
          icon={AddIcon}
          text="Add Pages"
          mode="ghost"
          tone="primary"
          fontSize={1}
          onClick={onAddPages}
          style={{flexShrink: 0}}
        />
      </Flex>
    </Card>
  )
}
