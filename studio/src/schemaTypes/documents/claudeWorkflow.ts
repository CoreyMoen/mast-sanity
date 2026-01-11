import {PlayIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Claude Workflow schema.
 * Stores workflow templates that users can select when starting a chat.
 * Each workflow provides specific context, instructions, and optional starter prompts.
 */
export const claudeWorkflow = defineType({
  name: 'claudeWorkflow',
  title: 'Claude Workflow',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Workflow Name',
      type: 'string',
      description: 'Short name displayed in the workflow selector',
      validation: (rule) => rule.required().max(50),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description shown when selecting this workflow',
      rows: 3,
    }),
    defineField({
      name: 'systemInstructions',
      title: 'System Instructions',
      type: 'text',
      description: 'Additional context and instructions appended to Claude\'s system prompt when this workflow is active',
      rows: 10,
    }),
    defineField({
      name: 'starterPrompt',
      title: 'Starter Prompt',
      type: 'text',
      description: 'Optional prompt that auto-fills when user selects this workflow (user can edit before sending)',
      rows: 4,
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Phosphor icon name for display (e.g., "file-text", "layout", "magnifying-glass")',
      options: {
        list: [
          {title: 'File Text', value: 'file-text'},
          {title: 'Layout', value: 'layout'},
          {title: 'Magnifying Glass', value: 'magnifying-glass'},
          {title: 'Pencil', value: 'pencil'},
          {title: 'Sparkle', value: 'sparkle'},
          {title: 'Lightning', value: 'lightning'},
          {title: 'Gear', value: 'gear'},
          {title: 'Chart Line', value: 'chart-line'},
          {title: 'Users', value: 'users'},
          {title: 'Image', value: 'image'},
        ],
      },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in the workflow selector (lower numbers appear first)',
      initialValue: 50,
    }),
    defineField({
      name: 'roles',
      title: 'Allowed Roles',
      type: 'array',
      description: 'Which roles can use this workflow (leave empty for everyone)',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Administrator', value: 'administrator'},
          {title: 'Editor', value: 'editor'},
          {title: 'Viewer', value: 'viewer'},
        ],
        layout: 'tags',
      },
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this workflow is available for selection',
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      active: 'active',
    },
    prepare({title, subtitle, active}) {
      return {
        title: title || 'Untitled Workflow',
        subtitle: active === false ? '(Inactive) ' + (subtitle || '') : subtitle || '',
        media: PlayIcon,
      }
    },
  },
})
