import {EditIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Claude Quick Action schema.
 * Stores quick action buttons that appear in the Claude Assistant interface.
 * These are simple shortcuts that pre-populate the message input.
 */
export const claudeQuickAction = defineType({
  name: 'claudeQuickAction',
  title: 'Quick Action',
  type: 'document',
  icon: EditIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Button text (e.g., "Create", "Find", "Edit")',
      validation: (rule) => rule.required().max(20),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'Tooltip text shown on hover',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Icon to display on the button',
      options: {
        list: [
          {title: 'Add/Create', value: 'add'},
          {title: 'Search', value: 'search'},
          {title: 'Edit', value: 'edit'},
          {title: 'Help/Explain', value: 'help'},
          {title: 'Document', value: 'document'},
          {title: 'Trash', value: 'trash'},
          {title: 'Copy', value: 'copy'},
          {title: 'Image', value: 'image'},
          {title: 'Settings', value: 'settings'},
          {title: 'Code', value: 'code'},
        ],
      },
      initialValue: 'add',
    }),
    defineField({
      name: 'prompt',
      title: 'Prompt',
      type: 'text',
      description: 'Text that pre-populates the message input when clicked',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Category for organizing quick actions',
      options: {
        list: [
          {title: 'Content', value: 'content'},
          {title: 'Query', value: 'query'},
          {title: 'Help', value: 'help'},
          {title: 'Navigation', value: 'navigation'},
        ],
      },
      initialValue: 'content',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in the quick actions bar (lower numbers appear first)',
      initialValue: 50,
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this quick action is visible',
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
      title: 'Label',
      name: 'labelAsc',
      by: [{field: 'label', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'description',
      active: 'active',
    },
    prepare({title, subtitle, active}) {
      return {
        title: title || 'Untitled Quick Action',
        subtitle: active === false ? '(Inactive) ' + (subtitle || '') : subtitle || '',
        media: EditIcon,
      }
    },
  },
})
