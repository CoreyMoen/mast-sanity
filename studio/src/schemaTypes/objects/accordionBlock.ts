import {defineArrayMember, defineField, defineType} from 'sanity'
import {StackIcon} from '@sanity/icons'

// Accordion item with title and content
const accordionItem = defineArrayMember({
  name: 'accordionItem',
  title: 'Accordion Item',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Text shown in the accordion trigger',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {type: 'headingBlock'},
        {type: 'richTextBlock'},
        {type: 'imageBlock'},
        {type: 'buttonBlock'},
        {type: 'iconBlock'},
        {type: 'dividerBlock'},
        {type: 'spacerBlock'},
      ],
    }),
    defineField({
      name: 'defaultOpen',
      title: 'Start Open',
      type: 'boolean',
      description: 'Should this item be open by default?',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      content: 'content',
      defaultOpen: 'defaultOpen',
    },
    prepare({title, content, defaultOpen}) {
      const blockCount = content?.length || 0
      return {
        title: title || 'Untitled Item',
        subtitle: `${blockCount} block${blockCount !== 1 ? 's' : ''}${defaultOpen ? ' • Open by default' : ''}`,
      }
    },
  },
})

/**
 * Accordion Block schema - Collapsible content sections.
 * Built to match Mast framework with details/summary elements
 * and plus icon that rotates to X when open.
 */
export const accordionBlock = defineType({
  name: 'accordionBlock',
  title: 'Accordion',
  type: 'object',
  icon: StackIcon,
  groups: [
    {name: 'items', title: 'Items', default: true},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    // Accordion items
    defineField({
      name: 'items',
      title: 'Accordion Items',
      type: 'array',
      group: 'items',
      of: [accordionItem],
      validation: (rule) => rule.min(1).error('At least one accordion item is required'),
    }),

    // Settings
    defineField({
      name: 'allowMultiple',
      title: 'Allow Multiple Open',
      type: 'boolean',
      group: 'settings',
      description: 'Allow multiple items to be open at the same time. When disabled, opening one item closes others.',
      initialValue: true,
    }),
    defineField({
      name: 'titleStyle',
      title: 'Title Style',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Heading 3', value: 'h3'},
          {title: 'Heading 4', value: 'h4'},
          {title: 'Heading 5', value: 'h5'},
          {title: 'Body', value: 'body'},
        ],
        layout: 'radio',
      },
      initialValue: 'h4',
    }),
    defineField({
      name: 'dividers',
      title: 'Show Dividers',
      type: 'boolean',
      group: 'settings',
      description: 'Show dividing lines between accordion items',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      items: 'items',
      allowMultiple: 'allowMultiple',
    },
    prepare({items, allowMultiple}) {
      const itemCount = items?.length || 0
      return {
        title: `Accordion (${itemCount} item${itemCount !== 1 ? 's' : ''})`,
        subtitle: allowMultiple ? 'Multiple open allowed' : 'Single open only',
      }
    },
  },
})
