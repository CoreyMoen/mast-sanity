import {defineType, defineField} from 'sanity'
import {TagIcon} from '@sanity/icons'

/**
 * Content Variable Document
 *
 * A unified document type for managing reusable content values
 * that can be referenced throughout the site. Supports multiple
 * variable types (text, link, image) with conditional fields.
 *
 * Variables are filtered in reference fields based on their type
 * compatibility with the target field.
 */
export const contentVariable = defineType({
  name: 'contentVariable',
  title: 'Content Variable',
  type: 'document',
  icon: TagIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    // --- Content Group ---
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'content',
      description: 'Display name for this variable (e.g., "Company Support Email")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'key',
      title: 'Key',
      type: 'slug',
      group: 'content',
      description: 'Unique identifier used for referencing (e.g., "support-email")',
      options: {
        source: 'name',
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'variableType',
      title: 'Variable Type',
      type: 'string',
      group: 'content',
      description: 'The type of content this variable holds',
      options: {
        list: [
          {title: 'Text', value: 'text'},
          {title: 'Link', value: 'link'},
          {title: 'Image', value: 'image'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'text',
      validation: (Rule) => Rule.required(),
    }),

    // --- Conditional Value Fields ---
    defineField({
      name: 'textValue',
      title: 'Text Value',
      type: 'string',
      group: 'content',
      description: 'The text content for this variable',
      hidden: ({parent}) => parent?.variableType !== 'text',
      validation: (Rule) =>
        Rule.custom((value, context: any) => {
          if (context.parent?.variableType === 'text' && !value) {
            return 'Text value is required for text variables'
          }
          return true
        }),
    }),
    defineField({
      name: 'linkValue',
      title: 'Link Value',
      type: 'link',
      group: 'content',
      description: 'The link for this variable',
      hidden: ({parent}) => parent?.variableType !== 'link',
      validation: (Rule) =>
        Rule.custom((value, context: any) => {
          if (context.parent?.variableType === 'link' && !value) {
            return 'Link value is required for link variables'
          }
          return true
        }),
    }),
    defineField({
      name: 'imageValue',
      title: 'Image Value',
      type: 'image',
      group: 'content',
      description: 'The image for this variable',
      options: {
        hotspot: true,
      },
      hidden: ({parent}) => parent?.variableType !== 'image',
      validation: (Rule) =>
        Rule.custom((value, context: any) => {
          if (context.parent?.variableType === 'image' && !value?.asset) {
            return 'Image is required for image variables'
          }
          return true
        }),
    }),

    // --- Settings Group ---
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'settings',
      description: 'Optional notes about where/how this variable is used',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      key: 'key.current',
      variableType: 'variableType',
      textValue: 'textValue',
      imageValue: 'imageValue',
    },
    prepare({title, key, variableType, textValue, imageValue}) {
      const typeLabels: Record<string, string> = {
        text: 'Text',
        link: 'Link',
        image: 'Image',
      }

      let subtitle = `${typeLabels[variableType] || variableType}`
      if (key) {
        subtitle += ` · {{${key}}}`
      }
      if (variableType === 'text' && textValue) {
        subtitle += ` · "${textValue.slice(0, 30)}${textValue.length > 30 ? '...' : ''}"`
      }

      return {
        title: title || 'Untitled Variable',
        subtitle,
        media: variableType === 'image' && imageValue ? imageValue : TagIcon,
      }
    },
  },
  orderings: [
    {
      title: 'Name',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
    {
      title: 'Type',
      name: 'typeAsc',
      by: [
        {field: 'variableType', direction: 'asc'},
        {field: 'name', direction: 'asc'},
      ],
    },
  ],
})
