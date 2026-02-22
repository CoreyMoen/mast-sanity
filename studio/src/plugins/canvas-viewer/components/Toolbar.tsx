import {Flex, Button, TextInput, Text, Card, Box} from '@sanity/ui'
import {SearchIcon, AddIcon, RemoveIcon, UndoIcon} from '@sanity/icons'

interface ToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  pageCount: number
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  pageCount,
}: ToolbarProps) {
  return (
    <Card padding={3} borderBottom style={{flexShrink: 0}}>
      <Flex align="center" gap={3}>
        <Box flex={1} style={{maxWidth: 300}}>
          <TextInput
            icon={SearchIcon}
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(e.currentTarget.value)
            }
            fontSize={1}
          />
        </Box>

        <Flex align="center" gap={1}>
          <Button icon={RemoveIcon} mode="bleed" onClick={onZoomOut} title="Zoom out" />
          <Text size={1} muted style={{minWidth: 50, textAlign: 'center'}}>
            {Math.round(scale * 100)}%
          </Text>
          <Button icon={AddIcon} mode="bleed" onClick={onZoomIn} title="Zoom in" />
          <Button icon={UndoIcon} mode="bleed" onClick={onResetZoom} title="Reset zoom" />
        </Flex>

        <Text size={1} muted>
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </Text>
      </Flex>
    </Card>
  )
}
