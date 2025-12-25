import {defineField, defineType} from 'sanity'
import {RemoveIcon} from '@sanity/icons'

/**
 * Divider Block schema - Horizontal rule with spacing controls.
 * Uses the project's spacing scale for margin top/bottom.
 */
export const dividerBlock = defineType({
  name: 'dividerBlock',
  title: 'Divider',
  type: 'object',
  icon: RemoveIcon,
  fields: [
    defineField({
      name: 'marginTop',
      title: 'Margin Top',
      type: 'string',
      description: 'Spacing above the divider',
      options: {
        list: [
          {title: 'None (0)', value: '0'},
          {title: 'XS (8px)', value: '2'},
          {title: 'SM (16px)', value: '4'},
          {title: 'MD (24px)', value: '6'},
          {title: 'LG (32px)', value: '8'},
          {title: 'XL (48px)', value: '12'},
          {title: '2XL (64px)', value: '16'},
          {title: '3XL (96px)', value: '24'},
        ],
        layout: 'dropdown',
      },
      initialValue: '8',
    }),
    defineField({
      name: 'marginBottom',
      title: 'Margin Bottom',
      type: 'string',
      description: 'Spacing below the divider',
      options: {
        list: [
          {title: 'None (0)', value: '0'},
          {title: 'XS (8px)', value: '2'},
          {title: 'SM (16px)', value: '4'},
          {title: 'MD (24px)', value: '6'},
          {title: 'LG (32px)', value: '8'},
          {title: 'XL (48px)', value: '12'},
          {title: '2XL (64px)', value: '16'},
          {title: '3XL (96px)', value: '24'},
        ],
        layout: 'dropdown',
      },
      initialValue: '8',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      options: {
        list: [
          {title: 'Default (Gray)', value: 'default'},
          {title: 'Light', value: 'light'},
          {title: 'Dark', value: 'dark'},
          {title: 'Brand', value: 'brand'},
          {title: 'Blue', value: 'blue'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'default',
    }),
  ],
  preview: {
    select: {
      marginTop: 'marginTop',
      marginBottom: 'marginBottom',
      color: 'color',
    },
    prepare({marginTop, marginBottom, color}) {
      return {
        title: 'Divider',
        subtitle: `${color || 'default'} • mt-${marginTop || '8'} mb-${marginBottom || '8'}`,
      }
    },
  },
})
