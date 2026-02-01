import {defineField, defineType} from 'sanity'
import {LaunchIcon} from '@sanity/icons'

/**
 * Button Block schema - Configurable button/link element.
 * Size is controlled globally via CSS variables.
 * Text field supports Content Variables via smartString type.
 */
export const buttonBlock = defineType({
  name: 'buttonBlock',
  title: 'Button',
  type: 'object',
  icon: LaunchIcon,
  fields: [
    defineField({
      name: 'text',
      title: 'Button Text',
      type: 'smartString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'link',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'variant',
      title: 'Style Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Primary (Filled)', value: 'primary'},
          {title: 'Secondary (Outline)', value: 'secondary'},
          {title: 'Ghost (Text Only)', value: 'ghost'},
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Use White for buttons on dark backgrounds',
      options: {
        list: [
          {title: 'Brand', value: 'brand'},
          {title: 'Black', value: 'black'},
          {title: 'White (for dark backgrounds)', value: 'white'},
        ],
        layout: 'radio',
      },
      initialValue: 'brand',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Optional icon to display',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Arrow Right', value: 'arrow-right'},
          {title: 'External Link', value: 'external'},
          {title: 'Download', value: 'download'},
        ],
      },
      initialValue: 'none',
    }),
  ],
  preview: {
    select: {
      textMode: 'text.mode',
      staticValue: 'text.staticValue',
      variableName: 'text.variableRef.name',
      variableKey: 'text.variableRef.key.current',
      variant: 'variant',
    },
    prepare({textMode, staticValue, variableName, variableKey, variant}) {
      let title = 'Button'
      if (textMode === 'variable' && variableName) {
        title = `{{${variableKey || variableName}}}`
      } else if (staticValue) {
        title = staticValue
      }
      return {
        title,
        subtitle: `${variant || 'primary'} button`,
      }
    },
  },
})
