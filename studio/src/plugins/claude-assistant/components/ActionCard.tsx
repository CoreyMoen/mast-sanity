/**
 * ActionCard Component
 *
 * Displays a parsed action from Claude as a compact, collapsible row
 * matching the Claude.ai tool-use UX:
 * - Collapsed (default): chevron + icon + description + status indicator
 * - Expanded (on click): payload, result, inline JSON, navigation, action buttons
 */

import {useEffect, useRef, useCallback, useState} from 'react'
import {Box, Button, Card, Flex, Stack, Text, Code, Spinner} from '@sanity/ui'
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
  ImageIcon,
  ChevronDownIcon,
  ChevronRightIcon,
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
  /** Active conversation ID - used to continue conversation when navigating to Structure/Presentation */
  conversationId?: string
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
    fetchFigmaFrame: <ImageIcon />,
    uploadFigmaImage: <UploadIcon />,
    createPinboard: <AddIcon />,
  }
  return icons[type]
}

/**
 * Get status indicator for the collapsed header row
 */
function StatusIndicator({status}: {status: ActionStatus}) {
  switch (status) {
    case 'executing':
      return <Spinner style={{width: 14, height: 14}} />
    case 'completed':
      return (
        <Box style={{color: 'var(--card-badge-positive-dot-color, #43a047)', display: 'flex', alignItems: 'center'}}>
          <CheckmarkIcon style={{width: 16, height: 16}} />
        </Box>
      )
    case 'failed':
      return (
        <Box style={{color: 'var(--card-badge-critical-dot-color, #e53935)', display: 'flex', alignItems: 'center'}}>
          <WarningOutlineIcon style={{width: 16, height: 16}} />
        </Box>
      )
    case 'cancelled':
      return (
        <Box style={{color: 'var(--card-muted-fg-color)', display: 'flex', alignItems: 'center'}}>
          <CloseIcon style={{width: 16, height: 16}} />
        </Box>
      )
    default:
      return null
  }
}

/**
 * Collapsible JSON preview for result data
 */
function ResultDataPreview({data}: {data: unknown}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const jsonString = JSON.stringify(data, null, 2)
  const lines = jsonString.split('\n')
  const isLong = lines.length > 6

  return (
    <Box marginTop={2}>
      <Flex align="center" gap={1} marginBottom={2}>
        <Text size={0} weight="semibold" muted>
          Result data
        </Text>
        {isLong && (
          <Button
            mode="bleed"
            tone="primary"
            fontSize={0}
            padding={1}
            text={isExpanded ? 'Collapse' : `Expand (${lines.length} lines)`}
            icon={isExpanded ? ChevronDownIcon : ChevronRightIcon}
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          />
        )}
      </Flex>
      <Card padding={2} radius={2} tone="transparent" style={{backgroundColor: 'var(--card-code-bg-color)', overflow: 'hidden'}}>
        <Box style={{maxHeight: isExpanded || !isLong ? 'none' : '120px', overflow: 'hidden', position: 'relative'}}>
          <Code size={0} style={{display: 'block', whiteSpace: 'pre-wrap', overflowX: 'auto'}}>
            {isExpanded || !isLong ? jsonString : lines.slice(0, 6).join('\n') + '\n...'}
          </Code>
          {!isExpanded && isLong && (
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '30px',
                background: 'linear-gradient(transparent, var(--card-code-bg-color, #1a1a1a))',
                pointerEvents: 'none',
              }}
            />
          )}
        </Box>
      </Card>
    </Box>
  )
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
  conversationId,
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

  // Actions can be executed if they are NOT auto-executable (query, explain, navigate, etc.)
  // AND either pending (first execution) or completed successfully (re-execution)
  const canExecute = !shouldAutoExec && (isPending || (isCompleted && action.result?.success))
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

  // Default open when action needs user interaction (has Execute button)
  const [isExpanded, setIsExpanded] = useState(!shouldAutoExec && isPending)

  // Auto-execute non-destructive actions when enabled
  useEffect(() => {
    if (
      autoExecuteEnabled &&
      isPending &&
      shouldAutoExec &&
      !isDestructive &&
      isRecentMessage &&
      !hasAutoExecuted.current &&
      onExecute
    ) {
      hasAutoExecuted.current = true
      onExecute()
    }
  }, [autoExecuteEnabled, isPending, shouldAutoExec, isDestructive, isRecentMessage, onExecute, action.id, action.type])

  // Save conversation ID to localStorage for floating chat to continue
  const saveConversationForFloatingChat = useCallback(() => {
    if (conversationId) {
      try {
        localStorage.setItem('claude-floating-pending-conversation', conversationId)
        localStorage.setItem('claude-floating-chat-open', 'true')
      } catch {
        // Ignore storage errors
      }
    }
  }, [conversationId])

  // Handle opening in Structure tool
  const handleOpenInStructure = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (documentId && onOpenInStructure) {
        onOpenInStructure(documentId, documentType)
      } else if (documentId && documentType) {
        // Save conversation for continuity
        saveConversationForFloatingChat()
        // Navigate to Structure tool using relative URL (requires both type and id)
        window.location.href = `/structure/${documentType};${documentId}`
      }
    },
    [documentId, documentType, onOpenInStructure, saveConversationForFloatingChat]
  )

  // Handle opening in Preview/Presentation
  const handleOpenInPreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (documentId && onOpenInPreview) {
        onOpenInPreview(documentId, documentType)
      } else if (documentType === 'page' && documentSlug?.current) {
        // Save conversation for continuity
        saveConversationForFloatingChat()
        // For pages with a slug, open in Presentation tool
        const slugPath = documentSlug.current === 'index' ? '/' : `/${documentSlug.current}`
        window.location.href = `/presentation?preview=${encodeURIComponent(slugPath)}`
      } else if (documentId && documentType) {
        // Save conversation for continuity
        saveConversationForFloatingChat()
        // For pages without slug or other document types, open in Structure tool
        // This is more reliable than guessing the slug
        window.location.href = `/structure/${documentType};${documentId}`
      }
    },
    [documentId, documentType, documentSlug, onOpenInPreview, saveConversationForFloatingChat]
  )

  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded((prev) => !prev)
  }, [])

  return (
    <Box>
      {/* Collapsed header row */}
      <Flex
        align="center"
        gap={2}
        style={{
          cursor: 'pointer',
          padding: '6px 8px',
          userSelect: 'none',
        }}
        onClick={toggleExpanded}
      >
        {/* Chevron */}
        <Box style={{color: 'var(--card-muted-fg-color)', display: 'flex', alignItems: 'center', flexShrink: 0}}>
          {isExpanded ? <ChevronDownIcon style={{width: 16, height: 16}} /> : <ChevronRightIcon style={{width: 16, height: 16}} />}
        </Box>

        {/* Action type icon */}
        <Box style={{color: 'var(--card-muted-fg-color)', display: 'flex', alignItems: 'center', flexShrink: 0}}>
          {getActionIcon(action.type)}
        </Box>

        {/* Description */}
        <Text size={1} style={{flex: 1, wordBreak: 'break-word'}}>
          {action.description}
        </Text>

        {/* Status indicator */}
        <Box style={{flexShrink: 0}}>
          <StatusIndicator status={action.status} />
        </Box>
      </Flex>

      {/* Expanded content */}
      {isExpanded && (
        <Box style={{padding: '0.5rem 0.5rem 0.5rem 2rem'}}>
          <Stack space={3}>
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
            {showPreview && !!action.payload && (
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

            {/* Result message */}
            {action.result && (
              <Box>
                <Text size={1} style={{color: action.result.success ? 'var(--card-badge-positive-dot-color, #43a047)' : 'var(--card-badge-critical-dot-color, #e53935)'}}>
                  {action.result.message}
                </Text>
                {action.result.documentId && (
                  <Text size={0} muted style={{marginTop: 4}}>
                    Document ID: {action.result.documentId}
                  </Text>
                )}
              </Box>
            )}

            {/* Inline result data (replaces the hidden follow-up message) */}
            {!!action.result?.data && (
              <ResultDataPreview data={action.result.data} />
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

            {/* Open in Pinboard for createPinboard actions */}
            {!hideNavigationLinks && isCompleted && action.result?.success && action.type === 'createPinboard' && action.result.documentId && (
              <Flex gap={2}>
                <Button
                  mode="ghost"
                  tone="primary"
                  text="Open in Pinboard"
                  icon={LaunchIcon}
                  fontSize={1}
                  padding={2}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (conversationId) {
                      saveConversationForFloatingChat()
                    }
                    window.location.href = `/pinboard/${action.result!.documentId}`
                  }}
                />
              </Flex>
            )}

            {/* Action buttons */}
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
        </Box>
      )}
    </Box>
  )
}
