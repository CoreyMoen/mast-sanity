/**
 * QuickActions Component
 *
 * Simple pill-style quick action buttons that pre-populate the message input.
 * Loads actions from Sanity with fallback to defaults.
 */

import {Flex, Button, Spinner} from '@sanity/ui'
import {
  EditIcon,
  SearchIcon,
  DocumentIcon,
  BulbOutlineIcon,
  TrashIcon,
  CopyIcon,
  ImageIcon,
  CogIcon,
  CodeBlockIcon,
} from '@sanity/icons'
import type {QuickAction} from '../types'
import {useQuickActions, DEFAULT_QUICK_ACTIONS} from '../hooks/useQuickActions'

export interface QuickActionsProps {
  /** Callback when a quick action is selected - passes the prompt to pre-populate */
  onActionSelect: (action: QuickAction) => void
}

/**
 * Get icon component for action
 */
function getActionIcon(iconName: string) {
  switch (iconName) {
    case 'add':
    case 'document':
      return DocumentIcon
    case 'search':
      return SearchIcon
    case 'edit':
      return EditIcon
    case 'help':
      return BulbOutlineIcon
    case 'trash':
      return TrashIcon
    case 'copy':
      return CopyIcon
    case 'image':
      return ImageIcon
    case 'settings':
      return CogIcon
    case 'code':
      return CodeBlockIcon
    default:
      return DocumentIcon
  }
}

export function QuickActions({onActionSelect}: QuickActionsProps) {
  const {quickActions, isLoading} = useQuickActions()

  if (isLoading) {
    return (
      <Flex justify="center" padding={2}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Flex wrap="wrap" gap={2} justify="center">
      {quickActions.map((action) => (
        <Button
          key={action.id}
          mode="ghost"
          tone="default"
          icon={getActionIcon(action.icon)}
          text={action.label}
          title={action.description}
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
 * Export default actions for use elsewhere (seed scripts, testing)
 */
export {DEFAULT_QUICK_ACTIONS}
