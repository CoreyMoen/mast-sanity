/**
 * MessageInput Component
 *
 * Text input for sending messages to Claude with auto-resize
 *
 * Accessibility features (WCAG 2.1 AA):
 * - Proper aria-label for the textarea
 * - Keyboard shortcuts (Cmd/Ctrl+Enter to send, Enter to send)
 * - Focus management via forwardRef
 * - Clear keyboard instructions for users
 */

import {useState, useCallback, useRef, useEffect, KeyboardEvent, forwardRef, useImperativeHandle} from 'react'
import {Box, Card, Flex, TextArea, Button, Text, Tooltip} from '@sanity/ui'
import {ArrowRightIcon} from '@sanity/icons'

export interface MessageInputProps {
  onSend: (content: string) => void
  isLoading: boolean
  placeholder?: string
  disabled?: boolean
  initialValue?: string
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(function MessageInput(
  {
    onSend,
    isLoading,
    placeholder = 'Ask Claude anything...',
    disabled = false,
    initialValue = '',
  },
  ref
) {
  const [value, setValue] = useState(initialValue)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

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
      // Reset height to recalculate
      textArea.style.height = 'auto'
      // Set to scroll height but cap at max
      const newHeight = Math.min(textArea.scrollHeight, 200)
      textArea.style.height = `${Math.max(40, newHeight)}px`
    }
  }, [])

  useEffect(() => {
    adjustTextAreaHeight()
  }, [value, adjustTextAreaHeight])

  const handleSend = useCallback(() => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim())
      setValue('')

      // Reset textarea height
      if (textAreaRef.current) {
        textAreaRef.current.style.height = '40px'
        textAreaRef.current.focus()
      }
    }
  }, [value, isLoading, disabled, onSend])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Cmd/Ctrl+Enter (always) or Enter (without Shift)
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
  const charCount = value.length

  return (
    <Card
      padding={3}
      style={{
        borderTop: '1px solid var(--card-border-color)',
        flexShrink: 0,
      }}
      role="form"
      aria-label="Send message to Claude"
    >
      <Flex gap={2} align="flex-end">
        <Box style={{flex: 1, position: 'relative'}}>
          <TextArea
            ref={textAreaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            rows={1}
            aria-label="Message to Claude"
            aria-describedby="message-input-help"
            style={{
              resize: 'none',
              minHeight: 40,
              maxHeight: 200,
              paddingRight: 48,
              transition: 'border-color 150ms ease',
            }}
          />
        </Box>
        <Tooltip
          content={
            <Box padding={2}>
              <Text size={1}>
                {canSend ? 'Send message' : 'Type a message to send'}
              </Text>
            </Box>
          }
          placement="top"
          portal
        >
          <Button
            icon={ArrowRightIcon}
            mode={canSend ? 'default' : 'ghost'}
            tone="primary"
            disabled={!canSend}
            onClick={handleSend}
            style={{
              height: 40,
              width: 40,
              transition: 'all 150ms ease',
            }}
            aria-label="Send message"
          />
        </Tooltip>
      </Flex>
      <Flex marginTop={2} justify="space-between" align="center" id="message-input-help">
        <Text size={0} muted>
          Press <kbd style={{
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: 'var(--card-code-bg-color)',
            fontFamily: 'inherit',
            fontSize: 'inherit',
          }}>Enter</kbd> or <kbd style={{
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: 'var(--card-code-bg-color)',
            fontFamily: 'inherit',
            fontSize: 'inherit',
          }}>Cmd/Ctrl+Enter</kbd> to send, <kbd style={{
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: 'var(--card-code-bg-color)',
            fontFamily: 'inherit',
            fontSize: 'inherit',
          }}>Shift+Enter</kbd> for new line
        </Text>
        {charCount > 0 && (
          <Text size={0} muted aria-live="polite" aria-atomic="true">
            {charCount.toLocaleString()} characters
          </Text>
        )}
      </Flex>
    </Card>
  )
})
