import {defineType, defineField} from 'sanity'
import {TagIcon, EditIcon} from '@sanity/icons'

/**
 * Smart String Object
 *
 * A flexible string field that supports either:
 * - Static text entered directly
 * - A reference to a text-type Content Variable
 *
 * This allows plain text fields to use global variables while
 * maintaining backward compatibility with direct text entry.
 *
 * Usage in schemas:
 * defineField({
 *   name: 'text',
 *   title: 'Text',
 *   type: 'smartString',
 * })
 */
export const smartString = defineType({
  name: 'smartString',
  title: 'Smart String',
  type: 'object',
  fields: [
    defineField({
      name: 'mode',
      title: 'Source',
      type: 'string',
      options: {
        list: [
          {title: 'Static Text', value: 'static'},
          {title: 'Content Variable', value: 'variable'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'static',
    }),
    defineField({
      name: 'staticValue',
      title: 'Text',
      type: 'string',
      hidden: ({parent}) => parent?.mode !== 'static',
      validation: (Rule) =>
        Rule.custom((value, context: any) => {
          if (context.parent?.mode === 'static' && !value) {
            return 'Text is required'
          }
          return true
        }),
    }),
    defineField({
      name: 'variableRef',
      title: 'Variable',
      type: 'reference',
      to: [{type: 'contentVariable'}],
      hidden: ({parent}) => parent?.mode !== 'variable',
      options: {
        filter: 'variableType == "text"',
      },
      validation: (Rule) =>
        Rule.custom((value, context: any) => {
          if (context.parent?.mode === 'variable' && !value) {
            return 'Variable reference is required'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      mode: 'mode',
      staticValue: 'staticValue',
      variableName: 'variableRef.name',
      variableKey: 'variableRef.key.current',
    },
    prepare({mode, staticValue, variableName, variableKey}) {
      if (mode === 'variable' && variableName) {
        return {
          title: `{{${variableKey || variableName}}}`,
          subtitle: 'Content Variable',
          media: TagIcon,
        }
      }
      return {
        title: staticValue || 'No text',
        subtitle: 'Static',
        media: EditIcon,
      }
    },
  },
})
