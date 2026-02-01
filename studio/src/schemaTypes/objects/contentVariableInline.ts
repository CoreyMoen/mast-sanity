import {defineType, defineField} from 'sanity'
import {TagIcon} from '@sanity/icons'

/**
 * Content Variable Inline Object
 *
 * An inline object for Portable Text that allows embedding
 * content variables directly within rich text content.
 *
 * This enables dynamic text insertion like:
 * "Contact us at {{support-email}} for help"
 *
 * Usage in Portable Text schemas:
 * defineField({
 *   name: 'content',
 *   type: 'array',
 *   of: [
 *     {
 *       type: 'block',
 *       of: [
 *         {type: 'contentVariableInline'},
 *       ],
 *     },
 *   ],
 * })
 */
export const contentVariableInline = defineType({
  name: 'contentVariableInline',
  title: 'Content Variable',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'reference',
      title: 'Variable',
      type: 'reference',
      to: [{type: 'contentVariable'}],
      options: {
        // Only show text-type variables for inline text insertion
        filter: 'variableType == "text"',
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      name: 'reference.name',
      key: 'reference.key.current',
      value: 'reference.textValue',
    },
    prepare({name, key, value}) {
      return {
        title: `{{${key || name || 'variable'}}}`,
        subtitle: value ? `"${value.slice(0, 40)}${value.length > 40 ? '...' : ''}"` : 'Text Variable',
        media: TagIcon,
      }
    },
  },
})
