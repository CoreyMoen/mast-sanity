/**
 * MessageInput Component
 *
 * Text input for sending messages to Claude with auto-resize
 * Designed to match native Claude UI - single unified box with toolbar inside
 *
 * Accessibility features (WCAG 2.1 AA):
 * - Proper aria-label for the textarea
 * - Keyboard shortcuts (Cmd/Ctrl+Enter to send, Enter to send)
 * - Focus management via forwardRef
 */

import {useState, useCallback, useRef, useEffect, KeyboardEvent, forwardRef, useImperativeHandle} from 'react'
import {Box, Flex, Button, Text, Tooltip, Card} from '@sanity/ui'
import {ArrowUpIcon, ImageIcon, CloseIcon, DocumentIcon, BoltIcon} from '@sanity/icons'
import type {ImageAttachment, DocumentContext} from '../types'
import {DocumentPills} from './DocumentPicker'
import {WorkflowPills} from './WorkflowPicker'

/** Workflow type for the picker */
export interface WorkflowOption {
  _id: string
  name: string
  description?: string
  systemInstructions?: string
  starterPrompt?: string
}

export interface MessageInputProps {
  onSend: (content: string, images?: ImageAttachment[]) => void
  isLoading: boolean
  placeholder?: string
  disabled?: boolean
  initialValue?: string
  /** Variant: 'default' for bottom-fixed, 'centered' for home screen, 'compact' for floating chat */
  variant?: 'default' | 'centered' | 'compact'
  /** Callback when upload image is clicked */
  onUploadImage?: () => void
  /** Currently attached images (pending send) */
  pendingImages?: ImageAttachment[]
  /** Callback to remove a pending image */
  onRemovePendingImage?: (imageId: string) => void
  /** Callback when document picker is clicked */
  onOpenDocumentPicker?: () => void
  /** Currently selected documents as context */
  pendingDocuments?: DocumentContext[]
  /** Callback to remove a document from context */
  onRemoveDocument?: (documentId: string) => void
  /** Whether to show the document picker button */
  showDocumentPicker?: boolean
  /** Callback when workflow picker is clicked */
  onOpenWorkflowPicker?: () => void
  /** Currently selected workflows as context */
  pendingWorkflows?: WorkflowOption[]
  /** Callback to remove a workflow from context */
  onRemoveWorkflow?: (workflowId: string) => void
  /** Whether to show the workflow picker button */
  showWorkflowPicker?: boolean
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(function MessageInput(
  {
    onSend,
    isLoading,
    placeholder = 'How can I help you today?',
    disabled = false,
    initialValue = '',
    variant = 'default',
    onUploadImage,
    pendingImages = [],
    onRemovePendingImage,
    onOpenDocumentPicker,
    pendingDocuments = [],
    onRemoveDocument,
    showDocumentPicker = true,
    onOpenWorkflowPicker,
    pendingWorkflows = [],
    onRemoveWorkflow,
    showWorkflowPicker = true,
  },
  ref
) {
  const [value, setValue] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(false)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Expose the textarea ref to parent components
  useImperativeHandle(ref, () => textAreaRef.current as HTMLTextAreaElement)

  // Update value when initialValue changes (from quick actions)
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue)
      // Focus and move cursor to end
      if (textAreaRef.current) {
        textAreaRef.current.focus()
        textAreaRef.current.setSelectionRange(initialValue.length, initialValue.length)
      }
    }
  }, [initialValue])

  // Auto-resize textarea based on content
  const adjustTextAreaHeight = useCallback(() => {
    const textArea = textAreaRef.current
    if (textArea) {
      textArea.style.height = 'auto'
      const newHeight = Math.min(textArea.scrollHeight, 200)
      textArea.style.height = `${Math.max(24, newHeight)}px`
    }
  }, [])

  useEffect(() => {
    adjustTextAreaHeight()
  }, [value, adjustTextAreaHeight])

  const handleSend = useCallback(() => {
    const hasContent = value.trim() || pendingImages.length > 0
    if (hasContent && !isLoading && !disabled) {
      onSend(value.trim(), pendingImages.length > 0 ? pendingImages : undefined)
      setValue('')
      if (textAreaRef.current) {
        textAreaRef.current.style.height = '24px'
        textAreaRef.current.focus()
      }
    }
  }, [value, isLoading, disabled, onSend, pendingImages])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey
      if (event.key === 'Enter') {
        if (isCmdOrCtrl || !event.shiftKey) {
          event.preventDefault()
          handleSend()
        }
      }
    },
    [handleSend]
  )

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.currentTarget.value)
  }, [])

  const canSend = (value.trim().length > 0 || pendingImages.length > 0) && !isLoading && !disabled

  const isCentered = variant === 'centered'
  const isCompact = variant === 'compact'

  // Click container to focus textarea
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).closest('[data-input-area]')) {
      textAreaRef.current?.focus()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      role="form"
      aria-label="Send message to Claude"
      style={{
        border: `1px solid ${isFocused ? 'var(--card-focus-ring-color)' : 'var(--card-border-color)'}`,
        borderRadius: isCompact ? 8 : 12,
        backgroundColor: 'var(--card-bg-color)',
        boxShadow: isCentered ? '0 2px 8px rgba(0,0,0,0.08)' : undefined,
        flexShrink: 0,
        maxWidth: isCentered ? 680 : undefined,
        width: '100%',
        margin: isCentered ? '0 auto' : undefined,
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        cursor: 'text',
      }}
    >
      {/* Pending images preview */}
      {pendingImages.length > 0 && (
        <Flex
          gap={3}
          wrap="wrap"
          style={{
            padding: isCompact ? '12px 12px 0 12px' : '14px 16px 0 16px',
          }}
        >
          {pendingImages.map((image) => (
            <Card
              key={image.id}
              radius={2}
              shadow={1}
              style={{
                position: 'relative',
                width: isCompact ? 80 : 100,
                height: isCompact ? 80 : 100,
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid var(--card-border-color)',
              }}
            >
              <img
                src={image.url}
                alt={image.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Always visible close button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemovePendingImage?.(image.id)
                }}
                aria-label={`Remove ${image.name}`}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background-color 150ms ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.85)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)')}
              >
                <CloseIcon style={{fontSize: 14}} />
              </button>
            </Card>
          ))}
        </Flex>
      )}

      {/* Selected documents pills */}
      {pendingDocuments.length > 0 && (
        <Box
          style={{
            padding: isCompact ? '12px 12px 0 12px' : '14px 16px 0 16px',
          }}
        >
          <DocumentPills
            documents={pendingDocuments}
            onRemove={(docId) => onRemoveDocument?.(docId)}
            compact={isCompact}
          />
        </Box>
      )}

      {/* Selected workflows pills */}
      {pendingWorkflows.length > 0 && (
        <Box
          style={{
            padding: isCompact ? '12px 12px 0 12px' : '14px 16px 0 16px',
          }}
        >
          <WorkflowPills
            workflows={pendingWorkflows}
            onRemove={(workflowId) => onRemoveWorkflow?.(workflowId)}
            compact={isCompact}
          />
        </Box>
      )}

      {/* Text input area */}
      <div data-input-area style={{padding: isCompact ? '10px 12px 6px 12px' : '16px 16px 8px 16px'}}>
        <textarea
          ref={textAreaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          rows={1}
          aria-label="Message to Claude"
          style={{
            width: '100%',
            resize: 'none',
            minHeight: 24,
            maxHeight: 200,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: isCompact ? 14 : 15,
            lineHeight: 1.5,
            fontFamily: 'inherit',
            color: 'var(--card-fg-color)',
            padding: 0,
            margin: 0,
          }}
        />
      </div>

      {/* Bottom toolbar */}
      <Flex
        align="center"
        justify="space-between"
        style={{
          padding: isCompact ? '6px 10px 10px 10px' : '8px 12px 12px 12px',
        }}
      >
        {/* Left side: workflow, image, and document buttons */}
        <Flex align="center" gap={1}>
          {/* Workflow picker button */}
          {showWorkflowPicker && (
            <Tooltip
              content={
                <Box padding={2}>
                  <Text size={1}>Add workflow</Text>
                </Box>
              }
              placement="top"
              portal
            >
              <Button
                icon={BoltIcon}
                mode="bleed"
                style={{
                  opacity: pendingWorkflows.length > 0 ? 1 : 0.7,
                  borderRadius: 8,
                }}
                aria-label="Add workflow"
                onClick={() => onOpenWorkflowPicker?.()}
              />
            </Tooltip>
          )}
          {/* Image upload button */}
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>Add image</Text>
              </Box>
            }
            placement="top"
            portal
          >
            <Button
              icon={ImageIcon}
              mode="bleed"
              style={{opacity: 0.7, borderRadius: 8}}
              aria-label="Add image"
              onClick={() => onUploadImage?.()}
            />
          </Tooltip>
          {/* Document picker button */}
          {showDocumentPicker && (
            <Tooltip
              content={
                <Box padding={2}>
                  <Text size={1}>Add document context</Text>
                </Box>
              }
              placement="top"
              portal
            >
              <Button
                icon={DocumentIcon}
                mode="bleed"
                style={{
                  opacity: pendingDocuments.length > 0 ? 1 : 0.7,
                  borderRadius: 8,
                }}
                aria-label="Add document context"
                onClick={() => onOpenDocumentPicker?.()}
              />
            </Tooltip>
          )}
        </Flex>

        {/* Right side: send button */}
        <Flex align="center" gap={2}>
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>
                  {canSend ? 'Send message' : 'Type a message'}
                </Text>
              </Box>
            }
            placement="top"
            portal
          >
            <Button
              icon={ArrowUpIcon}
              mode={canSend ? 'default' : 'ghost'}
              tone="primary"
              disabled={!canSend}
              onClick={handleSend}
              style={{
                height: 32,
                width: 32,
                minWidth: 32,
                padding: 0,
                borderRadius: 8,
                opacity: canSend ? 1 : 0.5,
                backgroundColor: canSend ? undefined : 'var(--card-border-color)',
                color: canSend ? undefined : 'var(--card-fg-color)',
                transition: 'all 150ms ease',
              }}
              aria-label="Send message"
            />
          </Tooltip>
        </Flex>
      </Flex>
    </div>
  )
})
