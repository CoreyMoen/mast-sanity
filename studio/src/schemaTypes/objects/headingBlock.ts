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
  fields: [
    defineField({
      name: 'text',
      title: 'Heading Text',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'level',
      title: 'Heading Level',
      type: 'string',
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
      description: 'Visual size (can differ from semantic level)',
      options: {
        list: [
          {title: 'Extra Large', value: 'xl'},
          {title: 'Large', value: 'lg'},
          {title: 'Medium', value: 'md'},
          {title: 'Small', value: 'sm'},
          {title: 'Extra Small', value: 'xs'},
        ],
      },
      initialValue: 'lg',
    }),
    defineField({
      name: 'align',
      title: 'Text Alignment',
      type: 'string',
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
