import {defineArrayMember, defineField, defineType} from 'sanity'
import {SquareIcon} from '@sanity/icons'

/**
 * Canvas document type for the Canvas Viewer plugin.
 * Each canvas is a named collection of page references that users
 * can view, organize, and collaborate on — similar to Figma pages.
 */
export const canvas = defineType({
  name: 'canvas',
  title: 'Canvas',
  type: 'document',
  icon: SquareIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'pages',
      title: 'Pages',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'page'}],
        }),
      ],
    }),
  ],
})
