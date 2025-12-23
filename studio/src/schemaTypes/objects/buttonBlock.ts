import {defineField, defineType} from 'sanity'
import {LaunchIcon} from '@sanity/icons'

/**
 * Button Block schema - Configurable button/link element.
 * Supports multiple styles, sizes, and link types.
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
      type: 'string',
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
      options: {
        list: [
          {title: 'Black', value: 'black'},
          {title: 'Brand', value: 'brand'},
          {title: 'Blue', value: 'blue'},
          {title: 'White', value: 'white'},
        ],
      },
      initialValue: 'black',
    }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          {title: 'Small', value: 'sm'},
          {title: 'Medium', value: 'md'},
          {title: 'Large', value: 'lg'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
          {title: 'Full Width', value: 'full'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
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
      title: 'text',
      variant: 'variant',
    },
    prepare({title, variant}) {
      return {
        title: title || 'Button',
        subtitle: `${variant || 'primary'} button`,
      }
    },
  },
})
