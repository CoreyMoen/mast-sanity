import {defineField, defineType} from 'sanity'
import {BlockElementIcon} from '@sanity/icons'

/**
 * Card Block schema - Flexible card container for content.
 * Can contain other content blocks and optionally be a clickable link.
 */
export const cardBlock = defineType({
  name: 'cardBlock',
  title: 'Card',
  type: 'object',
  icon: BlockElementIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'style', title: 'Style'},
    {name: 'link', title: 'Link'},
  ],
  fields: [
    defineField({
      name: 'content',
      title: 'Card Content',
      type: 'array',
      group: 'content',
      of: [
        {type: 'headingBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'richTextBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'imageBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'buttonBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'spacerBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'dividerBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
      ],
    }),
    // Style Group
    defineField({
      name: 'variant',
      title: 'Style Variant',
      type: 'string',
      group: 'style',
      options: {
        list: [
          {title: 'Default (White with border)', value: 'default'},
          {title: 'Outline (Transparent with border)', value: 'outline'},
          {title: 'Filled (Gray background)', value: 'filled'},
          {title: 'Ghost (No background or border)', value: 'ghost'},
        ],
        layout: 'radio',
      },
      initialValue: 'default',
    }),
    defineField({
      name: 'padding',
      title: 'Padding',
      type: 'string',
      group: 'style',
      description: 'Padding inside the card (default uses fluid sizing)',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Small', value: 'sm'},
          {title: 'Medium (Default)', value: 'md'},
          {title: 'Large', value: 'lg'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      group: 'style',
      description: 'Optional background image for the card',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'backgroundOverlay',
      title: 'Background Overlay',
      type: 'number',
      group: 'style',
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
    // Link Group
    defineField({
      name: 'href',
      title: 'Link URL',
      type: 'string',
      group: 'link',
      description: 'Makes the entire card clickable. Leave empty for non-clickable card.',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      group: 'link',
      initialValue: false,
      hidden: ({parent}) => !parent?.href,
    }),
    defineField({
      name: 'hoverEffect',
      title: 'Show Hover Effect',
      type: 'boolean',
      group: 'link',
      description: 'Show background color change on hover',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      content: 'content',
      variant: 'variant',
      href: 'href',
    },
    prepare({content, variant, href}) {
      const blockCount = content?.length || 0
      const isClickable = !!href
      return {
        title: 'Card',
        subtitle: `${variant || 'default'}${isClickable ? ' (linked)' : ''} • ${blockCount} block${blockCount !== 1 ? 's' : ''}`,
      }
    },
  },
})
