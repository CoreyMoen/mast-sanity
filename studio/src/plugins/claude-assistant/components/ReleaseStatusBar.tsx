/**
 * ReleaseStatusBar Component
 *
 * Displays the current Content Release status in the chat interface.
 * Shows the release name, document count, and publish button.
 */

import {Box, Button, Card, Flex, Spinner, Stack, Text, Tooltip} from '@sanity/ui'
import {PublishIcon, WarningOutlineIcon, CheckmarkCircleIcon} from '@sanity/icons'
import type {UseContentReleaseReturn} from '../types'

interface ReleaseStatusBarProps {
  release: UseContentReleaseReturn
  onPublish: () => void
}

export function ReleaseStatusBar({release, onPublish}: ReleaseStatusBarProps) {
  const {
    releaseId,
    releaseTitle,
    isReleaseMode,
    documentCount,
    isProcessing,
    error,
    isAvailable,
  } = release

  // Don't render anything if release mode is disabled
  if (!isReleaseMode) return null

  // Show warning if Content Releases is not available (non-Enterprise)
  if (isAvailable === false) {
    return (
      <Card padding={2} paddingX={3} tone="caution" radius={2}>
        <Flex align="center" gap={2}>
          <WarningOutlineIcon />
          <Text size={0}>
            Content Releases requires a Sanity Enterprise plan. Changes will be saved directly.
          </Text>
        </Flex>
      </Card>
    )
  }

  // Show error state
  if (error && !releaseId) {
    return (
      <Card padding={2} paddingX={3} tone="critical" radius={2}>
        <Flex align="center" gap={2}>
          <WarningOutlineIcon />
          <Text size={0}>{error}</Text>
        </Flex>
      </Card>
    )
  }

  // No active release yet — show a subtle indicator that release mode is on
  if (!releaseId) {
    return (
      <Card padding={2} paddingX={3} tone="transparent" radius={2} border>
        <Flex align="center" gap={2}>
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--card-badge-default-bg-color, #889)',
            }}
          />
          <Text size={0} muted>
            Release mode — changes will be batched for review
          </Text>
        </Flex>
      </Card>
    )
  }

  // Active release with documents
  return (
    <Card padding={2} paddingX={3} tone="positive" radius={2} border>
      <Flex align="center" gap={2} justify="space-between">
        <Flex align="center" gap={2} style={{flex: 1, minWidth: 0}}>
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--card-badge-positive-bg-color, #3d9970)',
              flexShrink: 0,
            }}
          />
          <Stack space={1} style={{minWidth: 0}}>
            <Text
              size={0}
              weight="semibold"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {releaseTitle || 'Content Release'}
            </Text>
            <Text size={0} muted>
              {documentCount} document{documentCount !== 1 ? 's' : ''} pending
            </Text>
          </Stack>
        </Flex>

        {error && (
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>{error}</Text>
              </Box>
            }
            placement="top"
          >
            <Box>
              <WarningOutlineIcon />
            </Box>
          </Tooltip>
        )}

        {documentCount > 0 && (
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>Publish all changes in this release</Text>
              </Box>
            }
            placement="top"
          >
            <Button
              text="Publish All"
              icon={isProcessing ? Spinner : PublishIcon}
              mode="ghost"
              tone="positive"
              fontSize={0}
              padding={2}
              onClick={onPublish}
              disabled={isProcessing}
            />
          </Tooltip>
        )}
      </Flex>
    </Card>
  )
}
