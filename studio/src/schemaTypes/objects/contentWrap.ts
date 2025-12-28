import {defineField, defineType} from 'sanity'
import {ControlsIcon} from '@sanity/icons'

/**
 * Content Wrap schema - Groups content blocks together.
 * Useful for grouping items when using space-between on a column,
 * so grouped items move together as a unit.
 */
export const contentWrap = defineType({
  name: 'contentWrap',
  title: 'Content Wrap',
  type: 'object',
  icon: ControlsIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'settings', title: 'Settings'},
    {name: 'advanced', title: 'Advanced'},
  ],
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      description: 'Add content blocks to group together',
      of: [
        {type: 'headingBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'richTextBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'imageBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'buttonBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'spacerBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'dividerBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'cardBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'eyebrowBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'iconBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'accordionBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'breadcrumbBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'tableBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'sliderBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'tabsBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'modalBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'inlineVideoBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
        {type: 'marqueeBlock', options: {modal: {type: 'dialog', width: 'auto'}}},
      ],
      group: 'content',
    }),
    // Settings Group
    defineField({
      name: 'gap',
      title: 'Gap Between Items',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Small (8px)', value: '2'},
          {title: 'Medium (16px)', value: '4'},
          {title: 'Large (24px)', value: '6'},
          {title: 'XL (32px)', value: '8'},
        ],
      },
      initialValue: '0',
    }),
    defineField({
      name: 'align',
      title: 'Horizontal Alignment',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Start', value: 'start'},
          {title: 'Center', value: 'center'},
          {title: 'End', value: 'end'},
          {title: 'Stretch', value: 'stretch'},
        ],
        layout: 'radio',
      },
      initialValue: 'stretch',
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
      const blockCount = content?.length || 0
      return {
        title: 'Content Wrap',
        subtitle: `${blockCount} item${blockCount !== 1 ? 's' : ''}`,
      }
    },
  },
})
