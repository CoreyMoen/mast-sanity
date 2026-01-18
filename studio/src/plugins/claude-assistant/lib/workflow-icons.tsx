/**
 * Workflow Icon Mapping Utility
 *
 * Maps Phosphor icon names (stored in workflow documents) to Sanity UI icons.
 * Used for displaying workflow icons in Structure mode and the chat interface.
 */

import React from 'react'
import {
  DocumentTextIcon,
  BlockElementIcon,
  SearchIcon,
  EditIcon,
  SparklesIcon,
  BoltIcon,
  CogIcon,
  TrendUpwardIcon,
  UsersIcon,
  ImageIcon,
  PlayIcon,
} from '@sanity/icons'
import type {ComponentType} from 'react'

/**
 * Icon name type for workflow icons
 * These match the options in the claudeWorkflow schema
 */
export type WorkflowIconName =
  | 'file-text'
  | 'layout'
  | 'magnifying-glass'
  | 'pencil'
  | 'sparkle'
  | 'lightning'
  | 'gear'
  | 'chart-line'
  | 'users'
  | 'image'

/**
 * Map of Phosphor icon names to Sanity UI icon components
 */
const WORKFLOW_ICON_MAP: Record<WorkflowIconName, ComponentType> = {
  'file-text': DocumentTextIcon,
  'layout': BlockElementIcon,
  'magnifying-glass': SearchIcon,
  'pencil': EditIcon,
  'sparkle': SparklesIcon,
  'lightning': BoltIcon,
  'gear': CogIcon,
  'chart-line': TrendUpwardIcon,
  'users': UsersIcon,
  'image': ImageIcon,
}

/**
 * Default icon used when no icon is specified or icon name is invalid
 */
export const DEFAULT_WORKFLOW_ICON = PlayIcon

/**
 * Icon used for the workflow feature itself (automation/process)
 */
export const WORKFLOW_FEATURE_ICON = BoltIcon

/**
 * Get the Sanity UI icon component for a workflow icon name
 * @param iconName - The Phosphor icon name from the workflow document
 * @returns The corresponding Sanity UI icon component
 */
export function getWorkflowIcon(iconName?: string | null): ComponentType {
  if (!iconName) return DEFAULT_WORKFLOW_ICON
  return WORKFLOW_ICON_MAP[iconName as WorkflowIconName] || DEFAULT_WORKFLOW_ICON
}

/**
 * Render a workflow icon as a React element
 * @param iconName - The Phosphor icon name from the workflow document
 * @param props - Optional props to pass to the icon component
 * @returns The rendered icon element
 */
export function renderWorkflowIcon(
  iconName?: string | null,
  props?: React.SVGProps<SVGSVGElement>
): React.ReactElement {
  const IconComponent = getWorkflowIcon(iconName)
  return <IconComponent {...props} />
}
