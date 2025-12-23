import {defineField, defineType} from 'sanity'
import {MenuIcon} from '@sanity/icons'

/**
 * Spacer Block schema - Vertical spacing element.
 * Provides responsive spacing control between content blocks.
 */
export const spacerBlock = defineType({
  name: 'spacerBlock',
  title: 'Spacer',
  type: 'object',
  icon: MenuIcon,
  fields: [
    defineField({
      name: 'sizeDesktop',
      title: 'Desktop Size',
      type: 'string',
      description: 'Spacing on large screens (1024px+)',
      options: {
        list: [
          {title: 'Extra Small (8px)', value: '2'},
          {title: 'Small (16px)', value: '4'},
          {title: 'Medium (24px)', value: '6'},
          {title: 'Large (32px)', value: '8'},
          {title: 'XL (48px)', value: '12'},
          {title: '2XL (64px)', value: '16'},
          {title: '3XL (96px)', value: '24'},
        ],
      },
      initialValue: '8',
    }),
    defineField({
      name: 'sizeMobile',
      title: 'Mobile Size',
      type: 'string',
      description: 'Spacing on small screens (optional, defaults to desktop)',
      options: {
        list: [
          {title: 'Same as Desktop', value: 'inherit'},
          {title: 'Extra Small (8px)', value: '2'},
          {title: 'Small (16px)', value: '4'},
          {title: 'Medium (24px)', value: '6'},
          {title: 'Large (32px)', value: '8'},
          {title: 'XL (48px)', value: '12'},
          {title: '2XL (64px)', value: '16'},
          {title: '3XL (96px)', value: '24'},
        ],
      },
      initialValue: 'inherit',
    }),
  ],
  preview: {
    select: {
      size: 'sizeDesktop',
    },
    prepare({size}) {
      const sizeMap: Record<string, string> = {
        '2': '8px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
        '24': '96px',
      }
      return {
        title: 'Spacer',
        subtitle: sizeMap[size] || '32px',
      }
    },
  },
})
