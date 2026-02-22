import {Card, Stack, Text, Flex, Button, Badge} from '@sanity/ui'
import {EyeOpenIcon, EditIcon, CloseIcon} from '@sanity/icons'
import type {PageDocument, PageStatus} from '../types'

interface PageCardProps {
  page: PageDocument
  status: PageStatus
  onPreview: (page: PageDocument) => void
  onEdit: (page: PageDocument) => void
  onRemove: (page: PageDocument) => void
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PageCard({page, status, onPreview, onEdit, onRemove}: PageCardProps) {
  const slug = page.slug?.current || '(no slug)'

  return (
    <Card
      data-page-card
      padding={3}
      radius={2}
      shadow={1}
      style={{width: 280, userSelect: 'none', position: 'relative'}}
    >
      {/* Remove button — top right */}
      <Button
        icon={CloseIcon}
        mode="bleed"
        fontSize={0}
        padding={1}
        tone="critical"
        title="Remove from pinboard"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          onRemove(page)
        }}
        style={{position: 'absolute', top: 6, right: 6}}
      />

      <Stack space={3}>
        <Flex align="center" gap={2} style={{paddingRight: 24}}>
          <Text
            size={1}
            weight="semibold"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {page.name || 'Untitled'}
          </Text>
          <Badge tone={getStatusTone(status)} fontSize={0}>
            {getStatusLabel(status)}
          </Badge>
        </Flex>

        <Text size={0} muted style={{fontFamily: 'monospace'}}>
          /{slug}
        </Text>

        <Text size={0} muted>
          Updated {formatDate(page._updatedAt)}
        </Text>

        <Flex gap={2}>
          <Button
            fontSize={1}
            icon={EyeOpenIcon}
            mode="ghost"
            text="Preview"
            tone="primary"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onPreview(page)
            }}
            style={{flex: 1}}
          />
          <Button
            fontSize={1}
            icon={EditIcon}
            mode="ghost"
            text="Edit"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onEdit(page)
            }}
            style={{flex: 1}}
          />
        </Flex>
      </Stack>
    </Card>
  )
}
