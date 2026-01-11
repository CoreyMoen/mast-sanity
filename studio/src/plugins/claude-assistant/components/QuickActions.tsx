/**
 * QuickActions Component
 *
 * Simple pill-style quick action buttons that pre-populate the message input
 * Matches the native Claude UI style
 */

import {Flex, Button} from '@sanity/ui'
import {EditIcon, SearchIcon, DocumentIcon, BulbOutlineIcon} from '@sanity/icons'
import type {QuickAction} from '../types'

export interface QuickActionsProps {
  /** Callback when a quick action is selected - passes the prompt to pre-populate */
  onActionSelect: (action: QuickAction) => void
}

/**
 * Default quick actions with detailed prompts
 */
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create',
    label: 'Create',
    description: 'Create new content',
    icon: 'add',
    prompt: 'I want to create a new page or document. Help me set up ',
    category: 'content',
  },
  {
    id: 'find',
    label: 'Find',
    description: 'Search for content',
    icon: 'search',
    prompt: 'Search my content and find all documents that ',
    category: 'query',
  },
  {
    id: 'edit',
    label: 'Edit',
    description: 'Modify existing content',
    icon: 'edit',
    prompt: 'I need to update some existing content. Help me modify ',
    category: 'content',
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Learn about the schema',
    icon: 'help',
    prompt: 'Explain how the content schema works, specifically ',
    category: 'help',
  },
]

/**
 * Get icon component for action
 */
function getActionIcon(iconName: string) {
  switch (iconName) {
    case 'add':
      return DocumentIcon
    case 'search':
      return SearchIcon
    case 'edit':
      return EditIcon
    case 'help':
      return BulbOutlineIcon
    default:
      return DocumentIcon
  }
}

export function QuickActions({onActionSelect}: QuickActionsProps) {
  return (
    <Flex wrap="wrap" gap={2} justify="center">
      {DEFAULT_QUICK_ACTIONS.map((action) => (
        <Button
          key={action.id}
          mode="ghost"
          tone="default"
          icon={getActionIcon(action.icon)}
          text={action.label}
          onClick={() => onActionSelect(action)}
          style={{
            borderRadius: 8,
          }}
        />
      ))}
    </Flex>
  )
}

/**
 * Export default actions for use elsewhere
 */
export {DEFAULT_QUICK_ACTIONS}
