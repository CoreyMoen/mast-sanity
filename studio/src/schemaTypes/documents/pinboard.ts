import {defineArrayMember, defineField, defineType} from 'sanity'
import {SquareIcon} from '@sanity/icons'

/**
 * Pinboard document type for the Pinboard plugin.
 * Each pinboard is a named collection of page references that users
 * can view, organize, and collaborate on — similar to Figma pages.
 */
export const pinboard = defineType({
  name: 'pinboard',
  title: 'Pinboard',
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
          to: [{type: 'page'}, {type: 'post'}, {type: 'category'}, {type: 'person'}],
        }),
      ],
    }),
    defineField({
      name: 'comments',
      title: 'Comments',
      type: 'array',
      hidden: true,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pinboardComment',
          fields: [
            defineField({name: 'pageRef', type: 'string'}),
            defineField({name: 'xPercent', type: 'number'}),
            defineField({name: 'yPercent', type: 'number'}),
            defineField({name: 'authorId', type: 'string'}),
            defineField({name: 'authorName', type: 'string'}),
            defineField({name: 'text', type: 'string'}),
            defineField({name: 'createdAt', type: 'datetime'}),
            defineField({name: 'resolved', type: 'boolean', initialValue: false}),
            defineField({
              name: 'replies',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'pinboardReply',
                  fields: [
                    defineField({name: 'authorId', type: 'string'}),
                    defineField({name: 'authorName', type: 'string'}),
                    defineField({name: 'text', type: 'string'}),
                    defineField({name: 'createdAt', type: 'datetime'}),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})
