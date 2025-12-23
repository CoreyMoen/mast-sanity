import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons'

/**
 * Image Block schema - Configurable image element.
 * Supports sizing, alt text, captions, and various display options.
 */
export const imageBlock = defineType({
  name: 'imageBlock',
  title: 'Image',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      description: 'Important for SEO and accessibility',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption displayed below the image',
    }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          {title: 'Full Width', value: 'full'},
          {title: 'Large', value: 'lg'},
          {title: 'Medium', value: 'md'},
          {title: 'Small', value: 'sm'},
          {title: 'Thumbnail', value: 'thumb'},
        ],
      },
      initialValue: 'full',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect Ratio',
      type: 'string',
      options: {
        list: [
          {title: 'Original', value: 'original'},
          {title: '16:9 (Widescreen)', value: '16/9'},
          {title: '4:3 (Standard)', value: '4/3'},
          {title: '1:1 (Square)', value: '1/1'},
          {title: '3:4 (Portrait)', value: '3/4'},
          {title: '9:16 (Vertical)', value: '9/16'},
        ],
      },
      initialValue: 'original',
    }),
    defineField({
      name: 'rounded',
      title: 'Rounded Corners',
      type: 'string',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Small', value: 'sm'},
          {title: 'Medium', value: 'md'},
          {title: 'Large', value: 'lg'},
          {title: 'Full (Circle)', value: 'full'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'shadow',
      title: 'Shadow',
      type: 'boolean',
      description: 'Add a subtle shadow around the image',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'alt',
      media: 'image',
    },
    prepare({title, media}) {
      return {
        title: title || 'Image',
        subtitle: 'Image Block',
        media,
      }
    },
  },
})
