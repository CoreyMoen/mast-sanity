import {defineType, defineField} from 'sanity'
import {TagIcon} from '@sanity/icons'

/**
 * Content Variable Link Annotation
 *
 * A Portable Text annotation that allows linking text to a
 * link-type Content Variable. This enables creating links
 * that reference global link variables.
 *
 * Usage in Portable Text schemas:
 * defineField({
 *   name: 'content',
 *   type: 'array',
 *   of: [
 *     {
 *       type: 'block',
 *       marks: {
 *         annotations: [
 *           {type: 'contentVariableLinkAnnotation'},
 *         ],
 *       },
 *     },
 *   ],
 * })
 */
export const contentVariableLinkAnnotation = defineType({
  name: 'contentVariableLinkAnnotation',
  title: 'Variable Link',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'reference',
      title: 'Link Variable',
      type: 'reference',
      to: [{type: 'contentVariable'}],
      options: {
        // Only show link-type variables
        filter: 'variableType == "link"',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
