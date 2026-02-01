import {defineField, defineType} from 'sanity'
import {TextIcon} from '@sanity/icons'

/**
 * Eyebrow Block schema - Small label text with variant styling.
 * Text field supports Content Variables via smartString type.
 */
export const eyebrowBlock = defineType({
  name: 'eyebrowBlock',
  title: 'Eyebrow',
  type: 'object',
  icon: TextIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'style', title: 'Style'},
    {name: 'advanced', title: 'Advanced'},
  ],
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'smartString',
      description: 'The eyebrow text (will be displayed in uppercase)',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      group: 'style',
      options: {
        list: [
          {title: 'Text Only', value: 'text'},
          {title: 'Overline (with border)', value: 'overline'},
          {title: 'Pill (badge style)', value: 'pill'},
        ],
        layout: 'radio',
      },
      initialValue: 'text',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      group: 'style',
      options: {
        list: [
          {title: 'Default (Black)', value: 'default'},
          {title: 'Brand (Orange)', value: 'brand'},
          {title: 'Blue', value: 'blue'},
          {title: 'Muted (Gray)', value: 'muted'},
        ],
        layout: 'radio',
      },
      initialValue: 'default',
    }),
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      group: 'style',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    // Advanced Group
    defineField({
      name: 'customStyle',
      title: 'Custom CSS',
      type: 'text',
      group: 'advanced',
      description: 'Add custom inline CSS styles (e.g., "margin-bottom: 0; opacity: 0.8;")',
      rows: 3,
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
      const variantLabels: Record<string, string> = {
        text: 'Text',
        overline: 'Overline',
        pill: 'Pill',
      }
      let title = 'Eyebrow'
      if (textMode === 'variable' && variableName) {
        title = `{{${variableKey || variableName}}}`
      } else if (staticValue) {
        title = staticValue
      }
      return {
        title,
        subtitle: variantLabels[variant] || 'Text',
      }
    },
  },
})
