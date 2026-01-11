/**
 * QuickActions Component
 *
 * Welcome screen with styled quick action cards for common operations
 * and optional workflow selector
 */

import {Box, Card, Flex, Grid, Stack, Text, Badge} from '@sanity/ui'
import {HelpCircleIcon, PlayIcon} from '@sanity/icons'
import type {QuickAction} from '../types'
import type {Workflow} from '../hooks/useWorkflows'

export interface QuickActionsProps {
  onActionSelect: (action: QuickAction) => void
  /** Available workflows for selection */
  workflows?: Workflow[]
  /** Currently selected workflow */
  selectedWorkflow?: Workflow | null
  /** Callback when a workflow is selected */
  onWorkflowSelect?: (workflowId: string | null) => void
}

/**
 * Claude Logo Component - Uses PNG from static folder
 */
function ClaudeLogo({size = 80}: {size?: number}) {
  return (
    <img
      src="/static/claude-logo.png"
      alt="Claude"
      width={size}
      height={size}
      style={{borderRadius: size * 0.22}}
    />
  )
}

/**
 * Default quick actions - reduced to 3 key actions
 */
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-page',
    label: 'Create a page',
    description: 'Build a new page with sections and content blocks',
    icon: 'add',
    prompt: 'Help me create a new page. Ask me what content I want to include and guide me through setting up sections and blocks.',
    category: 'content',
  },
  {
    id: 'find-content',
    label: 'Find content',
    description: 'Search across all documents and content types',
    icon: 'search',
    prompt: 'Help me find content in this Sanity project. What type of document or content are you looking for?',
    category: 'query',
  },
  {
    id: 'edit-existing',
    label: 'Edit existing',
    description: 'Modify existing documents or content',
    icon: 'edit',
    prompt: 'Help me edit an existing document. Which document would you like to modify?',
    category: 'content',
  },
]

/**
 * Quick action card component
 */
function QuickActionCard({
  action,
  onSelect,
}: {
  action: QuickAction
  onSelect: () => void
}) {
  return (
    <Card
      padding={4}
      radius={2}
      shadow={1}
      style={{
        cursor: 'pointer',
        transition: 'all 150ms ease',
        border: '1px solid var(--card-border-color)',
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        const target = e.currentTarget
        target.style.transform = 'translateY(-2px)'
        target.style.boxShadow = 'var(--card-shadow-2)'
        target.style.borderColor = 'var(--card-focus-ring-color)'
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget
        target.style.transform = 'translateY(0)'
        target.style.boxShadow = 'var(--card-shadow-1)'
        target.style.borderColor = 'var(--card-border-color)'
      }}
    >
      <Stack space={3}>
        <Text size={2} weight="semibold">
          {action.label}
        </Text>
        <Text size={1} muted>
          {action.description}
        </Text>
      </Stack>
    </Card>
  )
}

/**
 * Workflow card component
 */
function WorkflowCard({
  workflow,
  isSelected,
  onSelect,
}: {
  workflow: Workflow
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      padding={3}
      radius={2}
      shadow={isSelected ? 2 : 1}
      tone={isSelected ? 'primary' : 'default'}
      style={{
        cursor: 'pointer',
        transition: 'all 150ms ease',
        border: isSelected
          ? '2px solid var(--card-focus-ring-color)'
          : '1px solid var(--card-border-color)',
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isSelected) {
          const target = e.currentTarget
          target.style.borderColor = 'var(--card-focus-ring-color)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          const target = e.currentTarget
          target.style.borderColor = 'var(--card-border-color)'
        }
      }}
    >
      <Flex gap={3} align="center">
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: isSelected
              ? 'var(--card-bg-color)'
              : 'var(--card-badge-default-bg-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <PlayIcon />
        </Box>
        <Stack space={1} style={{flex: 1, minWidth: 0}}>
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold" style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
              {workflow.name}
            </Text>
            {isSelected && (
              <Badge tone="primary" fontSize={0}>
                Active
              </Badge>
            )}
          </Flex>
          {workflow.description && (
            <Text size={0} muted style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
              {workflow.description}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}

export function QuickActions({
  onActionSelect,
  workflows = [],
  selectedWorkflow,
  onWorkflowSelect,
}: QuickActionsProps) {
  const hasWorkflows = workflows.length > 0

  return (
    <Box
      style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <Stack space={5} style={{maxWidth: 800, width: '100%'}}>
        {/* Welcome header */}
        <Flex direction="column" align="center" gap={4}>
          <Box style={{display: 'flex', color: 'var(--card-fg-color)'}}>
            <ClaudeLogo size={64} />
          </Box>
          <Stack space={3} style={{textAlign: 'center', marginBottom: 8}}>
            <Text size={3} weight="bold">
              How can I help you today?
            </Text>
            <Text size={2} muted>
              {hasWorkflows
                ? 'Select a workflow or quick action to get started'
                : 'Select a quick action below or type your own message'}
            </Text>
          </Stack>
        </Flex>

        {/* Workflow selector (if workflows exist) */}
        {hasWorkflows && onWorkflowSelect && (
          <Stack space={3}>
            <Flex align="center" justify="space-between">
              <Text size={1} weight="semibold" muted>
                Workflows
              </Text>
              {selectedWorkflow && (
                <Card
                  as="button"
                  padding={1}
                  radius={2}
                  tone="default"
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                  }}
                  onClick={() => onWorkflowSelect(null)}
                >
                  <Text size={0} muted>
                    Clear selection
                  </Text>
                </Card>
              )}
            </Flex>
            <Grid columns={[1, 2]} gap={3}>
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  isSelected={selectedWorkflow?.id === workflow.id}
                  onSelect={() =>
                    onWorkflowSelect(
                      selectedWorkflow?.id === workflow.id ? null : workflow.id
                    )
                  }
                />
              ))}
            </Grid>
          </Stack>
        )}

        {/* Quick action cards */}
        <Stack space={3}>
          <Text size={1} weight="semibold" muted>
            Quick Actions
          </Text>
          <Grid columns={[1, 2, 3]} gap={4}>
            {DEFAULT_QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.id}
                action={action}
                onSelect={() => onActionSelect(action)}
              />
            ))}
          </Grid>
        </Stack>

        {/* Tips section */}
        <Card padding={4} radius={2} tone="primary" style={{backgroundColor: 'var(--card-badge-default-bg-color)'}}>
          <Flex gap={3} align="flex-start">
            <Box style={{flexShrink: 0, paddingTop: 2}}>
              <Text size={2} muted>
                <HelpCircleIcon />
              </Text>
            </Box>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Tips for better results
              </Text>
              <Text size={1} muted>
                Be specific about what you want to create or find. Mention document types, field names, or describe the content you need. You can also paste GROQ queries for help debugging them.
              </Text>
            </Stack>
          </Flex>
        </Card>
      </Stack>
    </Box>
  )
}

/**
 * Export default actions for use elsewhere
 */
export {DEFAULT_QUICK_ACTIONS}
