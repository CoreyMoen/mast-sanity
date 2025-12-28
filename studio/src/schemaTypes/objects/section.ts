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
    {name: 'background', title: 'Background'},
    {name: 'layout', title: 'Layout'},
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
      title: 'Content',
      type: 'array',
      description: 'Add rows for complex layouts, or add content blocks directly for simpler sections',
      of: [
        // Layout
        {type: 'row', options: {modal: {type: 'dialog', width: 'auto'}}},
        // Content blocks - can be added directly without row/column wrapper
        {type: 'headingBlock'},
        {type: 'richTextBlock'},
        {type: 'imageBlock'},
        {type: 'spacerBlock'},
        {type: 'dividerBlock'},
        {type: 'sliderBlock'},
        {type: 'tabsBlock'},
        {type: 'buttonBlock'},
      ],
      group: 'content',
    }),
    // Background Group
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      group: 'background',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'primary',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      group: 'background',
      description: 'Optional background image for the section',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'backgroundOverlay',
      title: 'Background Overlay',
      type: 'number',
      group: 'background',
      description: 'Darken the background image (0 = no overlay, 100 = fully black)',
      options: {
        list: [
          {title: 'None', value: 0},
          {title: 'Light (20%)', value: 20},
          {title: 'Medium (40%)', value: 40},
          {title: 'Dark (60%)', value: 60},
          {title: 'Very Dark (80%)', value: 80},
        ],
      },
      initialValue: 0,
      hidden: ({parent}) => !parent?.backgroundImage,
    }),
    // Layout Group
    defineField({
      name: 'minHeight',
      title: 'Minimum Height',
      type: 'string',
      group: 'layout',
      description: 'Set a minimum height for the section',
      options: {
        list: [
          {title: 'Auto (content height)', value: 'auto'},
          {title: 'Small (300px)', value: 'small'},
          {title: 'Medium (500px)', value: 'medium'},
          {title: 'Large (700px)', value: 'large'},
          {title: 'Full Screen (100vh)', value: 'screen'},
          {title: 'Custom', value: 'custom'},
        ],
      },
      initialValue: 'auto',
    }),
    defineField({
      name: 'customMinHeight',
      title: 'Custom Min Height',
      type: 'string',
      group: 'layout',
      description: 'Enter a CSS value (e.g., "400px", "50vh", "80svh")',
      hidden: ({parent}) => parent?.minHeight !== 'custom',
    }),
    defineField({
      name: 'verticalAlign',
      title: 'Vertical Alignment',
      type: 'string',
      group: 'layout',
      description: 'Align content vertically within the section',
      options: {
        list: [
          {title: 'Top', value: 'start'},
          {title: 'Center', value: 'center'},
          {title: 'Bottom', value: 'end'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'start',
      hidden: ({parent}) => parent?.minHeight === 'auto',
    }),
    defineField({
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
      group: 'layout',
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
      group: 'layout',
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
      group: 'layout',
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
      group: 'layout',
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
      backgroundImage: 'backgroundImage',
      minHeight: 'minHeight',
    },
    prepare({label, rows, backgroundImage, minHeight}) {
      const itemCount = rows?.length || 0
      const rowCount = rows?.filter((item: any) => item._type === 'row').length || 0
      const blockCount = itemCount - rowCount
      const parts = []
      if (rowCount > 0) parts.push(`${rowCount} row${rowCount !== 1 ? 's' : ''}`)
      if (blockCount > 0) parts.push(`${blockCount} block${blockCount !== 1 ? 's' : ''}`)
      if (backgroundImage) parts.push('bg-image')
      if (minHeight && minHeight !== 'auto') parts.push(`h:${minHeight}`)
      return {
        title: label || 'Section',
        subtitle: parts.join(' • ') || 'Empty',
        media: backgroundImage,
      }
    },
  },
})
