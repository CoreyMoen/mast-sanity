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
  UploadIcon,
  CloseIcon,
  CheckmarkIcon,
  WarningOutlineIcon,
  LaunchIcon,
  DocumentIcon,
  RefreshIcon,
  UndoIcon,
} from '@sanity/icons'
import type {ParsedAction, ActionType, ActionStatus} from '../types'
import {isDestructiveAction, shouldAutoExecute} from '../lib/actions'

export interface ActionCardProps {
  action: ParsedAction
  onExecute?: () => void | Promise<void>
  onCancel?: () => void
  onClick?: () => void
  onUndo?: () => void | Promise<void>
  showPreview?: boolean
  /** Called when user wants to open document in Structure tool */
  onOpenInStructure?: (documentId: string, documentType?: string) => void
  /** Called when user wants to open document in Preview/Presentation tool */
  onOpenInPreview?: (documentId: string, documentType?: string) => void
  /** Whether to auto-execute non-destructive actions */
  autoExecuteEnabled?: boolean
  /** Message timestamp - used to prevent auto-execution of old actions */
  messageTimestamp?: Date
  /** Hide navigation links (Open in Structure/Preview) - used in floating chat */
  hideNavigationLinks?: boolean
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
    uploadImage: <UploadIcon />,
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
  onUndo,
  showPreview = true,
  onOpenInStructure,
  onOpenInPreview,
  autoExecuteEnabled = true,
  messageTimestamp,
  hideNavigationLinks = false,
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

  // Track if action has been executed before (has a result or was auto-executed)
  const hasBeenExecuted = !!action.result || hasAutoExecuted.current

  // Actions can be executed if:
  // - They are pending AND not explain type (first execution)
  // - OR they completed successfully (re-execution)
  const canExecute = (isPending && action.type !== 'explain') ||
                     (isCompleted && action.result?.success)
  const needsConfirmation = canExecute && isDestructive && !hasBeenExecuted

  // Undo is available if:
  // - Action completed successfully
  // - Pre-state was captured
  // - onUndo callback is provided
  // - Action type is undoable (update, delete, create)
  const undoableTypes: ActionType[] = ['update', 'delete', 'create']
  const canUndo = isCompleted &&
                  action.result?.success &&
                  action.result?.preState !== undefined &&
                  onUndo &&
                  undoableTypes.includes(action.type)

  // Extract result data for document info
  const resultData = action.result?.data as Record<string, unknown> | undefined
  // Get the document ID (strip drafts. prefix for Structure URLs)
  const rawDocumentId = action.result?.documentId || action.payload.documentId
  const documentId = rawDocumentId?.replace(/^drafts\./, '')
  // Get document type from result data _type, then fall back to payload
  const documentType = (resultData?._type as string) || action.payload.documentType
  // Extract slug from result data if available (for pages)
  const documentSlug = resultData?.slug as {current?: string} | undefined

  // Check if message is recent (within last 10 seconds) to prevent auto-executing old actions
  const isRecentMessage = messageTimestamp
    ? Date.now() - messageTimestamp.getTime() < 10000
    : true // If no timestamp provided, assume it's recent (backwards compatibility)

  // Auto-execute non-destructive actions when enabled
  useEffect(() => {
    console.log('[ActionCard] Auto-execute check:', {
      actionId: action.id,
      actionType: action.type,
      autoExecuteEnabled,
      isPending,
      shouldAutoExec,
      isDestructive,
      isRecentMessage,
      hasAutoExecuted: hasAutoExecuted.current,
      hasOnExecute: !!onExecute,
    })
    if (
      autoExecuteEnabled &&
      isPending &&
      shouldAutoExec &&
      !isDestructive &&
      isRecentMessage &&
      !hasAutoExecuted.current &&
      onExecute
    ) {
      console.log('[ActionCard] Auto-executing action:', action.id, action.type)
      hasAutoExecuted.current = true
      onExecute()
    }
  }, [autoExecuteEnabled, isPending, shouldAutoExec, isDestructive, isRecentMessage, onExecute, action.id, action.type])

  // Handle opening in Structure tool
  const handleOpenInStructure = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (documentId && onOpenInStructure) {
        onOpenInStructure(documentId, documentType)
      } else if (documentId && documentType) {
        // Navigate to Structure tool using relative URL (requires both type and id)
        window.location.href = `/structure/${documentType};${documentId}`
      }
    },
    [documentId, documentType, onOpenInStructure]
  )

  // Handle opening in Preview/Presentation
  const handleOpenInPreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (documentId && onOpenInPreview) {
        onOpenInPreview(documentId, documentType)
      } else if (documentType === 'page') {
        // For pages, open in Presentation tool using the slug path
        const slugPath = documentSlug?.current ? `/${documentSlug.current}` : '/'
        window.location.href = `/presentation?preview=${encodeURIComponent(slugPath)}`
      } else if (documentId && documentType) {
        // For other document types, open in Structure tool (requires both type and id)
        window.location.href = `/structure/${documentType};${documentId}`
      }
    },
    [documentId, documentType, documentSlug, onOpenInPreview]
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
          <Card padding={2} radius={2} tone="transparent" style={{overflow: 'hidden'}}>
            <Stack space={2}>
              {action.payload.documentType && (
                <Text size={0} muted style={{wordBreak: 'break-all'}}>
                  Type: <code>{action.payload.documentType}</code>
                </Text>
              )}
              {action.payload.documentId && (
                <Text size={0} muted style={{wordBreak: 'break-all'}}>
                  ID: <code>{action.payload.documentId}</code>
                </Text>
              )}
              {action.payload.query && (
                <Text size={0} muted style={{fontFamily: 'monospace', wordBreak: 'break-all'}}>
                  {action.payload.query}
                </Text>
              )}
              {action.payload.fields && Object.keys(action.payload.fields).length > 0 && (
                <Text size={0} muted style={{wordBreak: 'break-all'}}>
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

        {/* Success state with navigation links (hidden in floating chat) */}
        {!hideNavigationLinks && isCompleted && action.result?.success && documentId && (
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
        {(canExecute || canCancel || canUndo) && (
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
            {canUndo && (
              <Button
                text="Undo"
                tone="caution"
                mode="ghost"
                icon={UndoIcon}
                onClick={(e) => {
                  e.stopPropagation()
                  onUndo?.()
                }}
              />
            )}
            {canExecute && (
              <Button
                text={
                  needsConfirmation
                    ? 'Confirm & Execute'
                    : hasBeenExecuted
                    ? 'Retry'
                    : 'Execute'
                }
                tone={isDestructive ? 'critical' : 'primary'}
                mode={hasBeenExecuted ? 'ghost' : 'default'}
                icon={
                  needsConfirmation
                    ? CheckmarkIcon
                    : hasBeenExecuted
                    ? RefreshIcon
                    : PlayIcon
                }
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
