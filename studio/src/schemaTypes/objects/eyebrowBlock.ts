import {defineField, defineType} from 'sanity'
import {TextIcon} from '@sanity/icons'

export const eyebrowBlock = defineType({
  name: 'eyebrowBlock',
  title: 'Eyebrow',
  type: 'object',
  icon: TextIcon,
  groups: [
    {name: 'content', title: 'Content'},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'string',
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
    defineField({
      name: 'marginBottom',
      title: 'Bottom Margin',
      type: 'string',
      group: 'style',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'XS (4px)', value: '1'},
          {title: 'SM (8px)', value: '2'},
          {title: 'MD (16px)', value: '4'},
          {title: 'LG (24px)', value: '6'},
          {title: 'XL (32px)', value: '8'},
        ],
      },
      initialValue: '4',
    }),
  ],
  preview: {
    select: {
      text: 'text',
      variant: 'variant',
    },
    prepare({text, variant}) {
      const variantLabels: Record<string, string> = {
        text: 'Text',
        overline: 'Overline',
        pill: 'Pill',
      }
      return {
        title: text || 'Eyebrow',
        subtitle: variantLabels[variant] || 'Text',
      }
    },
  },
})
