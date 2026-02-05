/**
 * WorkflowPicker Component (Skills Picker)
 *
 * Modal dialog for selecting skills to add as context to conversations.
 * Similar to DocumentPicker but for skill selection.
 */

import React, {useState, useCallback, useMemo} from 'react'
import {
  Box,
  Card,
  Flex,
  Text,
  Button,
  TextInput,
  Checkbox,
  Layer,
  Stack,
} from '@sanity/ui'
import {CloseIcon, SearchIcon, BoltIcon, WarningOutlineIcon} from '@sanity/icons'
import type {WorkflowOption} from './MessageInput'

/**
 * WorkflowPills Component
 *
 * Displays selected workflows as small pill tags with remove buttons
 */
export interface WorkflowPillsProps {
  workflows: WorkflowOption[]
  onRemove: (workflowId: string) => void
  compact?: boolean
}

export function WorkflowPills({workflows, onRemove, compact = false}: WorkflowPillsProps) {
  if (workflows.length === 0) return null

  return (
    <Flex gap={2} wrap="wrap">
      {workflows.map((workflow) => {
        return (
          <Card
            key={workflow._id}
            padding={2}
            radius={2}
            tone="positive"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              maxWidth: compact ? 160 : 200,
            }}
          >
            <span style={{fontSize: 14, flexShrink: 0, opacity: 0.8, display: 'flex'}}>
              <BoltIcon />
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
              title={workflow.name}
            >
              {workflow.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(workflow._id)
              }}
              aria-label={`Remove ${workflow.name}`}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                opacity: 0.7,
                transition: 'opacity 150ms ease',
                flexShrink: 0,
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              <CloseIcon style={{fontSize: 14}} />
            </button>
          </Card>
        )
      })}
    </Flex>
  )
}

/**
 * WorkflowPickerDialog Component
 *
 * Modal dialog for selecting workflows from the available list
 */
export interface WorkflowPickerDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Callback when dialog should close */
  onClose: () => void
  /** All available workflows */
  availableWorkflows: WorkflowOption[]
  /** Currently selected workflows */
  selectedWorkflows: WorkflowOption[]
  /** Callback when workflows are selected/deselected */
  onWorkflowsChange: (workflows: WorkflowOption[]) => void
  /** Whether workflows are loading */
  isLoading?: boolean
}

export function WorkflowPickerDialog({
  isOpen,
  onClose,
  availableWorkflows,
  selectedWorkflows,
  onWorkflowsChange,
  isLoading = false,
}: WorkflowPickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [figmaConfigured, setFigmaConfigured] = useState<boolean | null>(null)

  // Check if any selected workflow has Figma enabled
  const hasFigmaWorkflow = selectedWorkflows.some(w => w.enableFigmaFetch)

  // Check Figma configuration when a Figma-enabled workflow is selected
  React.useEffect(() => {
    if (hasFigmaWorkflow && figmaConfigured === null) {
      fetch('/api/figma/status')
        .then(res => res.json())
        .then(data => setFigmaConfigured(data.configured))
        .catch(() => setFigmaConfigured(false))
    }
  }, [hasFigmaWorkflow, figmaConfigured])

  // Filter workflows based on search query
  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return availableWorkflows
    const query = searchQuery.toLowerCase()
    return availableWorkflows.filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(query) ||
        workflow.description?.toLowerCase().includes(query)
    )
  }, [availableWorkflows, searchQuery])

  const handleToggleWorkflow = useCallback((workflow: WorkflowOption) => {
    const isSelected = selectedWorkflows.some(w => w._id === workflow._id)

    if (isSelected) {
      onWorkflowsChange(selectedWorkflows.filter(w => w._id !== workflow._id))
    } else {
      onWorkflowsChange([...selectedWorkflows, workflow])
    }
  }, [selectedWorkflows, onWorkflowsChange])

  const handleClearAll = useCallback(() => {
    onWorkflowsChange([])
  }, [onWorkflowsChange])

  // Reset search when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <Layer zOffset={1000}>
      <Card
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e: React.MouseEvent) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <Card
          radius={3}
          shadow={4}
          style={{
            width: 420,
            maxWidth: '90vw',
            maxHeight: '70vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Flex
            align="center"
            justify="space-between"
            padding={3}
            style={{borderBottom: '1px solid var(--card-border-color)'}}
          >
            <Flex align="center" gap={2}>
              <BoltIcon style={{fontSize: 18}} />
              <Text weight="semibold">Select Skills</Text>
            </Flex>
            <Button
              icon={CloseIcon}
              mode="bleed"
              onClick={onClose}
              aria-label="Close"
            />
          </Flex>

          {/* Search input */}
          <Box padding={3} style={{borderBottom: '1px solid var(--card-border-color)'}}>
            <TextInput
              icon={SearchIcon}
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              autoFocus
            />
          </Box>

          {/* Figma configuration warning */}
          {hasFigmaWorkflow && figmaConfigured === false && (
            <Box padding={3} style={{borderBottom: '1px solid var(--card-border-color)', backgroundColor: 'var(--card-caution-bg-color)'}}>
              <Flex align="center" gap={2}>
                <WarningOutlineIcon style={{color: 'var(--card-caution-icon-color)', flexShrink: 0}} />
                <Text size={1}>
                  Figma integration requires the <code style={{fontSize: '0.75rem'}}>FIGMA_ACCESS_TOKEN</code> environment variable.{' '}
                  <a
                    href="/docs/figma-setup-guide.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{color: 'inherit', textDecoration: 'underline'}}
                  >
                    Setup guide
                  </a>
                </Text>
              </Flex>
            </Box>
          )}

          {/* Workflow list */}
          <Box
            style={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
            }}
          >
            {isLoading ? (
              <Box padding={4}>
                <Text align="center" muted>
                  Loading skills...
                </Text>
              </Box>
            ) : filteredWorkflows.length === 0 ? (
              <Box padding={4}>
                <Text align="center" muted>
                  {searchQuery ? 'No skills match your search' : 'No skills available'}
                </Text>
              </Box>
            ) : (
              <Stack space={1} padding={2}>
                {filteredWorkflows.map((workflow) => {
                  const isSelected = selectedWorkflows.some(w => w._id === workflow._id)

                  return (
                    <Card
                      key={workflow._id}
                      padding={3}
                      radius={2}
                      tone={isSelected ? 'positive' : 'default'}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease',
                      }}
                      onClick={() => handleToggleWorkflow(workflow)}
                    >
                      <Flex align="flex-start" gap={3}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleWorkflow(workflow)}
                          style={{marginTop: 2}}
                        />
                        <Stack space={2} style={{flex: 1, minWidth: 0}}>
                          <Text size={1} weight="medium" textOverflow="ellipsis">
                            {workflow.name}
                          </Text>
                          {workflow.description && (
                            <Text muted style={{fontSize: '0.75rem'}}>
                              {workflow.description}
                            </Text>
                          )}
                        </Stack>
                      </Flex>
                    </Card>
                  )
                })}
              </Stack>
            )}
          </Box>

          {/* Footer */}
          <Flex
            align="center"
            justify="space-between"
            padding={3}
            style={{borderTop: '1px solid var(--card-border-color)'}}
          >
            <Text size={1} muted>
              {selectedWorkflows.length === 0
                ? 'No skills selected'
                : `${selectedWorkflows.length} skill${selectedWorkflows.length > 1 ? 's' : ''} selected`}
            </Text>
            <Flex gap={2}>
              {selectedWorkflows.length > 0 && (
                <Button
                  text="Clear all"
                  mode="ghost"
                  tone="critical"
                  onClick={handleClearAll}
                />
              )}
              <Button
                text="Done"
                tone="primary"
                onClick={onClose}
              />
            </Flex>
          </Flex>
        </Card>
      </Card>
    </Layer>
  )
}
