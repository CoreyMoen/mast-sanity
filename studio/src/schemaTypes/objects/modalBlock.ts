import {defineField, defineType} from 'sanity'
import {LaunchIcon} from '@sanity/icons'

export const modalBlock = defineType({
  name: 'modalBlock',
  title: 'Modal',
  type: 'object',
  icon: LaunchIcon,
  groups: [
    {name: 'trigger', title: 'Trigger Button', default: true},
    {name: 'content', title: 'Modal Content'},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    // Trigger button settings
    defineField({
      name: 'triggerLabel',
      title: 'Button Label',
      type: 'string',
      group: 'trigger',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'triggerVariant',
      title: 'Button Variant',
      type: 'string',
      group: 'trigger',
      options: {
        list: [
          {title: 'Primary (Filled)', value: 'primary'},
          {title: 'Secondary (Outline)', value: 'secondary'},
          {title: 'Ghost (Text only)', value: 'ghost'},
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
    }),
    defineField({
      name: 'triggerColor',
      title: 'Button Color',
      type: 'string',
      group: 'trigger',
      options: {
        list: [
          {title: 'Brand (Orange)', value: 'brand'},
          {title: 'Black', value: 'black'},
          {title: 'Blue', value: 'blue'},
          {title: 'White', value: 'white'},
        ],
        layout: 'radio',
      },
      initialValue: 'brand',
    }),

    // Modal content settings
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Custom Content', value: 'content'},
          {title: 'YouTube Video', value: 'video'},
        ],
        layout: 'radio',
      },
      initialValue: 'content',
    }),
    defineField({
      name: 'modalTitle',
      title: 'Modal Title',
      type: 'string',
      group: 'content',
      description: 'Optional title displayed at the top of the modal',
    }),
    defineField({
      name: 'content',
      title: 'Modal Content',
      type: 'array',
      group: 'content',
      hidden: ({parent}) => parent?.contentType === 'video',
      of: [
        {type: 'headingBlock'},
        {type: 'richTextBlock'},
        {type: 'imageBlock'},
        {type: 'buttonBlock'},
        {type: 'dividerBlock'},
        {type: 'spacerBlock'},
      ],
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube Video URL',
      type: 'url',
      group: 'content',
      description: 'Full YouTube URL (e.g., https://www.youtube.com/watch?v=...)',
      hidden: ({parent}) => parent?.contentType !== 'video',
      validation: (rule) =>
        rule.custom((value, context: any) => {
          if (context.parent?.contentType === 'video' && !value) {
            return 'YouTube URL is required when content type is Video'
          }
          return true
        }),
    }),

    // Settings
    defineField({
      name: 'modalSize',
      title: 'Modal Size',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Small', value: 'sm'},
          {title: 'Medium', value: 'md'},
          {title: 'Large', value: 'lg'},
          {title: 'Extra Large', value: 'xl'},
          {title: 'Full Width', value: 'full'},
        ],
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'modalId',
      title: 'Modal ID (for URL)',
      type: 'string',
      group: 'settings',
      description:
        'Unique ID to open this modal via URL parameter (e.g., ?modal=my-modal). Use lowercase with hyphens.',
      validation: (rule) =>
        rule.regex(/^[a-z0-9-]*$/, {
          name: 'valid-id',
          invert: false,
        }),
    }),
  ],
  preview: {
    select: {
      label: 'triggerLabel',
      contentType: 'contentType',
      title: 'modalTitle',
    },
    prepare({label, contentType, title}) {
      return {
        title: label || 'Modal',
        subtitle: contentType === 'video' ? 'YouTube Video' : title || 'Custom content',
      }
    },
  },
})
