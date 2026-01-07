/**
 * ActionCard Component
 *
 * Displays a parsed action from Claude with:
 * - Confirmation UI for destructive actions (delete, unpublish)
 * - Auto-execution for non-destructive actions
 * - Success/error states with meaningful feedback
 * - Links to open document in Structure and Preview
 */

import {useEffect, useRef, useCallback} from 'react'
import {Box, Button, Card, Flex, Stack, Text, Badge, Spinner} from '@sanity/ui'
import {
  AddIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  LinkIcon,
  InfoOutlineIcon,
  PlayIcon,
  CloseIcon,
  CheckmarkIcon,
  WarningOutlineIcon,
  LaunchIcon,
  DocumentIcon,
} from '@sanity/icons'
import type {ParsedAction, ActionType, ActionStatus} from '../types'
import {isDestructiveAction, shouldAutoExecute} from '../lib/actions'

export interface ActionCardProps {
  action: ParsedAction
  onExecute?: () => void | Promise<void>
  onCancel?: () => void
  onClick?: () => void
  showPreview?: boolean
  /** Called when user wants to open document in Structure tool */
  onOpenInStructure?: (documentId: string, documentType?: string) => void
  /** Called when user wants to open document in Preview/Presentation tool */
  onOpenInPreview?: (documentId: string, documentType?: string) => void
  /** Whether to auto-execute non-destructive actions */
  autoExecuteEnabled?: boolean
}

/**
 * Get icon for action type
 */
function getActionIcon(type: ActionType) {
  const icons: Record<ActionType, React.ReactNode> = {
    create: <AddIcon />,
    update: <EditIcon />,
    delete: <TrashIcon />,
    query: <SearchIcon />,
    navigate: <LinkIcon />,
    explain: <InfoOutlineIcon />,
  }
  return icons[type]
}

/**
 * Get badge tone for action status
 */
function getStatusTone(status: ActionStatus): 'default' | 'primary' | 'positive' | 'critical' | 'caution' {
  const tones: Record<ActionStatus, 'default' | 'primary' | 'positive' | 'critical' | 'caution'> = {
    pending: 'default',
    executing: 'primary',
    completed: 'positive',
    failed: 'critical',
    cancelled: 'caution',
  }
  return tones[status]
}

/**
 * Get status icon
 */
function getStatusIcon(status: ActionStatus) {
  switch (status) {
    case 'executing':
      return <Spinner />
    case 'completed':
      return <CheckmarkIcon />
    case 'failed':
      return <WarningOutlineIcon />
    case 'cancelled':
      return <CloseIcon />
    default:
      return null
  }
}

export function ActionCard({
  action,
  onExecute,
  onCancel,
  onClick,
  showPreview = true,
  onOpenInStructure,
  onOpenInPreview,
  autoExecuteEnabled = true,
}: ActionCardProps) {
  const hasAutoExecuted = useRef(false)

  const isExecuting = action.status === 'executing'
  const isCompleted = action.status === 'completed'
  const isFailed = action.status === 'failed'
  const isPending = action.status === 'pending'
  const canCancel = action.status === 'executing'

  // Determine if this action is destructive and needs confirmation
  const isDestructive = isDestructiveAction(action)
  const shouldAutoExec = shouldAutoExecute(action)

  // Pending actions that are not explain can be executed
  // Destructive actions require confirmation
  const canExecute = isPending && action.type !== 'explain'
  const needsConfirmation = canExecute && isDestructive

  // Get the document ID from result or payload
  const documentId = action.result?.documentId || action.payload.documentId
  const documentType = action.payload.documentType

  // Auto-execute non-destructive actions when enabled
  useEffect(() => {
    if (
      autoExecuteEnabled &&
      isPending &&
      shouldAutoExec &&
      !isDestructive &&
      !hasAutoExecuted.current &&
      onExecute
    ) {
      hasAutoExecuted.current = true
      onExecute()
    }
  }, [autoExecuteEnabled, isPending, shouldAutoExec, isDestructive, onExecute])

  // Handle opening in Structure tool
  const handleOpenInStructure = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (documentId && onOpenInStructure) {
        onOpenInStructure(documentId, documentType)
      } else if (documentId) {
        // Default: navigate using window.location
        const typeSegment = documentType || 'document'
        window.location.href = `/structure/${typeSegment};${documentId}`
      }
    },
    [documentId, documentType, onOpenInStructure]
  )

  // Handle opening in Preview
  const handleOpenInPreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (documentId && onOpenInPreview) {
        onOpenInPreview(documentId, documentType)
      } else if (documentId) {
        // Default: open in Presentation tool
        // Try to determine the preview URL based on document type
        const previewPath = documentType === 'page' ? `/presentation?preview=true&id=${documentId}` : `/structure/${documentType || 'document'};${documentId}`
        window.location.href = previewPath
      }
    },
    [documentId, documentType, onOpenInPreview]
  )

  // Determine card tone based on action type and status
  const getTone = (): 'default' | 'caution' | 'critical' | 'positive' => {
    if (isCompleted && action.result?.success) return 'positive'
    if (isFailed || (action.result && !action.result.success)) return 'critical'
    if (isDestructive) return 'caution'
    return 'default'
  }

  return (
    <Card
      padding={3}
      radius={2}
      border
      tone={getTone()}
      style={{cursor: onClick ? 'pointer' : 'default'}}
      onClick={onClick}
    >
      <Stack space={3}>
        {/* Header */}
        <Flex align="center" gap={2}>
          <Box style={{color: 'var(--card-icon-color)'}}>
            {getActionIcon(action.type)}
          </Box>
          <Text size={1} weight="semibold" style={{flex: 1}}>
            {action.description}
          </Text>
          <Badge tone={getStatusTone(action.status)} fontSize={0}>
            <Flex align="center" gap={1}>
              {getStatusIcon(action.status)}
              <span>{action.status}</span>
            </Flex>
          </Badge>
        </Flex>

        {/* Destructive action warning */}
        {needsConfirmation && (
          <Card padding={2} radius={2} tone="caution">
            <Flex align="center" gap={2}>
              <WarningOutlineIcon />
              <Text size={1}>
                This action requires confirmation. Please review before executing.
              </Text>
            </Flex>
          </Card>
        )}

        {/* Payload preview */}
        {showPreview && action.payload && (
          <Card padding={2} radius={2} tone="transparent">
            <Stack space={2}>
              {action.payload.documentType && (
                <Text size={0} muted>
                  Type: <code>{action.payload.documentType}</code>
                </Text>
              )}
              {action.payload.documentId && (
                <Text size={0} muted>
                  ID: <code>{action.payload.documentId}</code>
                </Text>
              )}
              {action.payload.query && (
                <Text size={0} muted style={{fontFamily: 'monospace'}}>
                  {action.payload.query}
                </Text>
              )}
              {action.payload.fields && Object.keys(action.payload.fields).length > 0 && (
                <Text size={0} muted>
                  Fields: {Object.keys(action.payload.fields).join(', ')}
                </Text>
              )}
            </Stack>
          </Card>
        )}

        {/* Result */}
        {action.result && (
          <Card
            padding={2}
            radius={2}
            tone={action.result.success ? 'positive' : 'critical'}
          >
            <Stack space={2}>
              <Text size={1}>{action.result.message}</Text>
              {action.result.documentId && (
                <Text size={0} muted>
                  Document ID: {action.result.documentId}
                </Text>
              )}
            </Stack>
          </Card>
        )}

        {/* Error */}
        {action.error && (
          <Card padding={2} radius={2} tone="critical">
            <Text size={1}>{action.error}</Text>
          </Card>
        )}

        {/* Success state with navigation links */}
        {isCompleted && action.result?.success && documentId && (
          <Flex gap={2} wrap="wrap">
            <Button
              mode="ghost"
              tone="primary"
              text="Open in Structure"
              icon={DocumentIcon}
              fontSize={1}
              padding={2}
              onClick={handleOpenInStructure}
            />
            {documentType === 'page' && (
              <Button
                mode="ghost"
                tone="primary"
                text="Open Preview"
                icon={LaunchIcon}
                fontSize={1}
                padding={2}
                onClick={handleOpenInPreview}
              />
            )}
          </Flex>
        )}

        {/* Action buttons for pending actions */}
        {(canExecute || canCancel) && (
          <Flex gap={2} justify="flex-end">
            {canCancel && (
              <Button
                text="Cancel"
                tone="default"
                mode="ghost"
                icon={CloseIcon}
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel?.()
                }}
              />
            )}
            {canExecute && (
              <Button
                text={needsConfirmation ? 'Confirm & Execute' : 'Execute'}
                tone={isDestructive ? 'critical' : 'primary'}
                icon={needsConfirmation ? CheckmarkIcon : PlayIcon}
                onClick={(e) => {
                  e.stopPropagation()
                  onExecute?.()
                }}
              />
            )}
          </Flex>
        )}
      </Stack>
    </Card>
  )
}
