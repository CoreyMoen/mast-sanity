import {defineArrayMember, defineField, defineType} from 'sanity'
import {InlineIcon} from '@sanity/icons'

/**
 * Row schema - Flex container within a section.
 * Contains columns and provides alignment and gap settings.
 */
export const row = defineType({
  name: 'row',
  title: 'Row',
  type: 'object',
  icon: InlineIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'settings', title: 'Settings'},
    {name: 'advanced', title: 'Advanced'},
  ],
  fields: [
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'array',
      of: [defineArrayMember({type: 'column', options: {modal: {type: 'dialog', width: 'auto'}}})],
      group: 'content',
      initialValue: () => [
        {
          _type: 'column',
          _key: crypto.randomUUID().slice(0, 8),
          widthDesktop: '6',
          widthTablet: 'inherit',
          widthMobile: '12',
          verticalAlign: 'start',
          padding: '0',
          content: [],
        },
        {
          _type: 'column',
          _key: crypto.randomUUID().slice(0, 8),
          widthDesktop: '6',
          widthTablet: 'inherit',
          widthMobile: '12',
          verticalAlign: 'start',
          padding: '0',
          content: [],
        },
      ],
    }),
    // Settings Group
    defineField({
      name: 'horizontalAlign',
      title: 'Horizontal Alignment',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Start', value: 'start'},
          {title: 'Center', value: 'center'},
          {title: 'End', value: 'end'},
          {title: 'Space Between', value: 'between'},
          {title: 'Space Around', value: 'around'},
          {title: 'Space Evenly', value: 'evenly'},
        ],
        layout: 'radio',
      },
      initialValue: 'start',
    }),
    defineField({
      name: 'verticalAlign',
      title: 'Vertical Alignment',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Top', value: 'start'},
          {title: 'Center', value: 'center'},
          {title: 'Bottom', value: 'end'},
          {title: 'Stretch', value: 'stretch'},
          {title: 'Baseline', value: 'baseline'},
          {title: 'Space Between', value: 'between'},
        ],
        layout: 'radio',
      },
      initialValue: 'stretch',
    }),
    defineField({
      name: 'gap',
      title: 'Column Gap',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Small (8px)', value: '2'},
          {title: 'Medium (16px)', value: '4'},
          {title: 'Large (24px)', value: '6'},
          {title: 'XL (32px)', value: '8'},
          {title: '2XL (48px)', value: '12'},
        ],
      },
      initialValue: '6',
    }),
    defineField({
      name: 'wrap',
      title: 'Wrap Columns',
      type: 'boolean',
      group: 'settings',
      description: 'Allow columns to wrap to next line on smaller screens',
      initialValue: true,
    }),
    defineField({
      name: 'reverseOnMobile',
      title: 'Reverse Order on Mobile',
      type: 'boolean',
      group: 'settings',
      description: 'Reverse the order of columns on mobile devices',
      initialValue: false,
    }),
    // Advanced Group
    defineField({
      name: 'customStyle',
      title: 'Custom CSS',
      type: 'text',
      group: 'advanced',
      description: 'Add custom inline CSS styles (e.g., "margin-top: 2rem; opacity: 0.8;")',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      columns: 'columns',
    },
    prepare({columns}) {
      const colCount = columns?.length || 0
      return {
        title: 'Row',
        subtitle: `${colCount} column${colCount !== 1 ? 's' : ''}`,
      }
    },
  },
})
