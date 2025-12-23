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
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
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
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
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
