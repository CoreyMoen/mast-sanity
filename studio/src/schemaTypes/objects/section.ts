import {defineField, defineType} from 'sanity'
import {BlockElementIcon} from '@sanity/icons'

/**
 * Section schema - Top-level layout container for page builder.
 * Contains rows and provides background, padding, and width settings.
 */
export const section = defineType({
  name: 'section',
  title: 'Section',
  type: 'object',
  icon: BlockElementIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    defineField({
      name: 'label',
      title: 'Section Label',
      type: 'string',
      description: 'Internal label for this section (not displayed on page)',
      group: 'content',
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [{type: 'row'}],
      group: 'content',
    }),
    // Settings Group
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'White', value: 'white'},
          {title: 'Light Gray', value: 'gray-50'},
          {title: 'Gray', value: 'gray-100'},
          {title: 'Dark Gray', value: 'gray-800'},
          {title: 'Black', value: 'black'},
          {title: 'Brand', value: 'brand'},
          {title: 'Blue', value: 'blue'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Full Width', value: 'full'},
          {title: 'Container (Default)', value: 'container'},
          {title: 'Small (640px)', value: 'sm'},
          {title: 'Medium (768px)', value: 'md'},
          {title: 'Large (1024px)', value: 'lg'},
          {title: 'XL (1280px)', value: 'xl'},
          {title: '2XL (1536px)', value: '2xl'},
        ],
      },
      initialValue: 'container',
    }),
    defineField({
      name: 'paddingTop',
      title: 'Padding Top',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Small (16px)', value: '4'},
          {title: 'Medium (32px)', value: '8'},
          {title: 'Large (48px)', value: '12'},
          {title: 'XL (64px)', value: '16'},
          {title: '2XL (96px)', value: '24'},
        ],
      },
      initialValue: '12',
    }),
    defineField({
      name: 'paddingBottom',
      title: 'Padding Bottom',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Small (16px)', value: '4'},
          {title: 'Medium (32px)', value: '8'},
          {title: 'Large (48px)', value: '12'},
          {title: 'XL (64px)', value: '16'},
          {title: '2XL (96px)', value: '24'},
        ],
      },
      initialValue: '12',
    }),
    defineField({
      name: 'paddingX',
      title: 'Horizontal Padding',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Small (16px)', value: '4'},
          {title: 'Medium (24px)', value: '6'},
          {title: 'Large (32px)', value: '8'},
        ],
      },
      initialValue: '6',
    }),
  ],
  preview: {
    select: {
      label: 'label',
      rows: 'rows',
    },
    prepare({label, rows}) {
      const rowCount = rows?.length || 0
      return {
        title: label || 'Section',
        subtitle: `${rowCount} row${rowCount !== 1 ? 's' : ''}`,
      }
    },
  },
})
