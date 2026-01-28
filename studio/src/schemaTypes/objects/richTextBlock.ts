import {defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons'

/**
 * Rich Text Block schema - Portable text content block.
 * Supports formatted text, links, and various styling options.
 */
export const richTextBlock = defineType({
  name: 'richTextBlock',
  title: 'Rich Text',
  type: 'object',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'advanced', title: 'Advanced'},
  ],
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
      group: 'content',
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
      name: 'size',
      title: 'Text Size',
      type: 'string',
      group: 'content',
      description: 'Visual size of the text (heading sizes use the design system heading variables)',
      options: {
        list: [
          {title: 'Base (default)', value: 'inherit'},
          {title: 'H1', value: 'h1'},
          {title: 'H2', value: 'h2'},
          {title: 'H3', value: 'h3'},
          {title: 'H4', value: 'h4'},
          {title: 'H5', value: 'h5'},
          {title: 'H6', value: 'h6'},
          {title: 'Paragraph XL', value: 'xl'},
          {title: 'Paragraph LG', value: 'lg'},
          {title: 'Paragraph Base', value: 'base'},
          {title: 'Paragraph SM', value: 'sm'},
        ],
      },
      initialValue: 'inherit',
    }),
    defineField({
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
      group: 'content',
      description: 'Constrain the width of text for better readability',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Small (65ch)', value: 'prose'},
          {title: 'Medium (80ch)', value: 'prose-lg'},
          {title: 'Large (90ch)', value: 'prose-xl'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'color',
      title: 'Text Color',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Default', value: 'default'},
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
      content: 'content',
    },
    prepare({content}) {
      // Extract first block text for preview
      const firstBlock = content?.find((block: any) => block._type === 'block')
      const text = firstBlock?.children
        ?.filter((child: any) => child._type === 'span')
        ?.map((span: any) => span.text)
        ?.join('') || ''

      return {
        title: text.slice(0, 50) + (text.length > 50 ? '...' : '') || 'Rich Text',
        subtitle: 'Rich Text Block',
      }
    },
  },
})
