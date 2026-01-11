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
import {Box, Flex, Button, Text, Tooltip, Menu, MenuButton, MenuItem, MenuDivider} from '@sanity/ui'
import {ArrowUpIcon, AddIcon, ChevronDownIcon, ImageIcon, PlayIcon} from '@sanity/icons'

/** Available Claude models - must match SettingsPanel.tsx AVAILABLE_MODELS */
const CLAUDE_MODELS = [
  {id: 'claude-opus-4-5-20251101', label: 'Opus 4.5', description: 'Most capable'},
  {id: 'claude-sonnet-4-5-20250514', label: 'Sonnet 4.5', description: 'Balanced'},
] as const

/** Workflow type for the dropdown */
export interface WorkflowOption {
  _id: string
  name: string
  description?: string
}

export interface MessageInputProps {
  onSend: (content: string) => void
  isLoading: boolean
  placeholder?: string
  disabled?: boolean
  initialValue?: string
  /** Current model selection */
  model?: string
  /** Callback when model changes */
  onModelChange?: (model: string) => void
  /** Whether to show the model selector */
  showModelSelector?: boolean
  /** Variant: 'default' for bottom-fixed, 'centered' for home screen */
  variant?: 'default' | 'centered'
  /** Available workflows for selection */
  workflows?: WorkflowOption[]
  /** Callback when a workflow is selected */
  onWorkflowSelect?: (workflow: WorkflowOption) => void
  /** Callback when upload image is clicked */
  onUploadImage?: () => void
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(function MessageInput(
  {
    onSend,
    isLoading,
    placeholder = 'How can I help you today?',
    disabled = false,
    initialValue = '',
    model = 'claude-opus-4-5-20251101',
    onModelChange,
    showModelSelector = true,
    variant = 'default',
    workflows = [],
    onWorkflowSelect,
    onUploadImage,
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
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim())
      setValue('')
      if (textAreaRef.current) {
        textAreaRef.current.style.height = '24px'
        textAreaRef.current.focus()
      }
    }
  }, [value, isLoading, disabled, onSend])

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

  const canSend = value.trim().length > 0 && !isLoading && !disabled
  const currentModelLabel = CLAUDE_MODELS.find(m => m.id === model)?.label || 'Opus 4.5'

  const handleModelSelect = useCallback((modelId: string) => {
    onModelChange?.(modelId)
  }, [onModelChange])

  const isCentered = variant === 'centered'
  const hasWorkflows = workflows.length > 0

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
        borderRadius: 12,
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
      {/* Text input area */}
      <div data-input-area style={{padding: '16px 16px 8px 16px'}}>
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
            fontSize: 15,
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
          padding: '8px 12px 12px 12px',
        }}
      >
        {/* Left side: Plus dropdown */}
        <Flex align="center" gap={1}>
          <MenuButton
            id="add-menu"
            button={
              <Button
                icon={AddIcon}
                mode="bleed"
                style={{opacity: 0.7, borderRadius: 8}}
                aria-label="Add content"
              />
            }
            menu={
              <Menu>
                <MenuItem
                  icon={ImageIcon}
                  text="Upload image"
                  disabled={!onUploadImage}
                  onClick={() => onUploadImage?.()}
                />
                {hasWorkflows && (
                  <>
                    <MenuDivider />
                    <Box padding={2} paddingBottom={1}>
                      <Text size={0} weight="semibold" muted>
                        Workflows
                      </Text>
                    </Box>
                    {workflows.map((workflow) => (
                      <MenuItem
                        key={workflow._id}
                        icon={PlayIcon}
                        text={workflow.name}
                        onClick={() => onWorkflowSelect?.(workflow)}
                      />
                    ))}
                  </>
                )}
                {!hasWorkflows && !onUploadImage && (
                  <Box padding={3}>
                    <Text size={1} muted>No options available</Text>
                  </Box>
                )}
              </Menu>
            }
            placement="top-start"
            popover={{portal: true}}
          />
        </Flex>

        {/* Right side: model selector and send button */}
        <Flex align="center" gap={2}>
          {showModelSelector && (
            <MenuButton
              id="model-selector"
              button={
                <Button
                  mode="bleed"
                  style={{
                    height: 32,
                    borderRadius: 8,
                    opacity: 0.8,
                  }}
                >
                  <Flex align="center" gap={1}>
                    <Text size={1} weight="medium">{currentModelLabel}</Text>
                    <ChevronDownIcon style={{fontSize: 12}} />
                  </Flex>
                </Button>
              }
              menu={
                <Menu>
                  {CLAUDE_MODELS.map((m) => (
                    <MenuItem
                      key={m.id}
                      text={m.label}
                      onClick={() => handleModelSelect(m.id)}
                      selected={model === m.id}
                    />
                  ))}
                </Menu>
              }
              placement="top-end"
              popover={{portal: true}}
            />
          )}
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
                opacity: canSend ? 1 : 0.35,
                backgroundColor: canSend ? undefined : 'var(--card-bg2-color)',
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

/** Export model options for use elsewhere */
export {CLAUDE_MODELS}
