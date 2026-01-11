import {defineField, defineType} from 'sanity'
import {TextIcon} from '@sanity/icons'

/**
 * Heading Block schema - Configurable heading element.
 * Supports different heading levels, sizes, and alignment.
 */
export const headingBlock = defineType({
  name: 'headingBlock',
  title: 'Heading',
  type: 'object',
  icon: TextIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'advanced', title: 'Advanced'},
  ],
  fields: [
    defineField({
      name: 'text',
      title: 'Heading Text',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'level',
      title: 'Heading Level',
      type: 'string',
      group: 'content',
      description: 'Semantic HTML heading level (h1-h6)',
      options: {
        list: [
          {title: 'H1', value: 'h1'},
          {title: 'H2', value: 'h2'},
          {title: 'H3', value: 'h3'},
          {title: 'H4', value: 'h4'},
          {title: 'H5', value: 'h5'},
          {title: 'H6', value: 'h6'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'h2',
    }),
    defineField({
      name: 'size',
      title: 'Visual Size',
      type: 'string',
      group: 'content',
      description: 'Override the visual size (default inherits from heading level)',
      options: {
        list: [
          {title: 'Inherit from Level', value: 'inherit'},
          {title: 'H1 (44-88px)', value: 'h1'},
          {title: 'H2 (32-61px)', value: 'h2'},
          {title: 'H3 (24-37px)', value: 'h3'},
          {title: 'H4 (21-24px)', value: 'h4'},
          {title: 'H5 (18-19px)', value: 'h5'},
          {title: 'H6 (14-16px)', value: 'h6'},
        ],
        layout: 'dropdown',
      },
      initialValue: 'inherit',
    }),
    defineField({
      name: 'align',
      title: 'Text Alignment',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'color',
      title: 'Text Color',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Default (Black)', value: 'default'},
          {title: 'Gray', value: 'gray'},
          {title: 'White', value: 'white'},
          {title: 'Brand', value: 'brand'},
          {title: 'Blue', value: 'blue'},
        ],
      },
      initialValue: 'default',
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
      title: 'text',
      level: 'level',
    },
    prepare({title, level}) {
      return {
        title: title || 'Heading',
        subtitle: level?.toUpperCase() || 'H2',
      }
    },
  },
})
