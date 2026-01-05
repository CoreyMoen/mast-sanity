import {defineField, defineType} from 'sanity'
import {CircleIcon} from '@sanity/icons'

/**
 * Icon Block schema - Displays Phosphor icons.
 * Supports various icons, sizes, and colors matching the Mast framework.
 */
export const iconBlock = defineType({
  name: 'iconBlock',
  title: 'Icon',
  type: 'object',
  icon: CircleIcon,
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      options: {
        list: [
          // Common UI icons
          {title: 'Check Circle', value: 'check-circle'},
          {title: 'Target', value: 'target'},
          {title: 'Star', value: 'star'},
          {title: 'Trophy', value: 'trophy'},
          {title: 'Arrow Right', value: 'arrow-right'},
          {title: 'Arrow Up Right', value: 'arrow-up-right'},
          {title: 'Arrow Left', value: 'arrow-left'},
          {title: 'Arrow Down', value: 'arrow-down'},
          // Inspired layouts icons
          {title: 'Shuffle Simple', value: 'shuffle-simple'},
          {title: 'Lightbulb Filament', value: 'lightbulb-filament'},
          {title: 'Barbell', value: 'barbell'},
          {title: 'Feather', value: 'feather'},
          // Additional useful icons
          {title: 'Heart', value: 'heart'},
          {title: 'Lightning', value: 'lightning'},
          {title: 'Rocket', value: 'rocket'},
          {title: 'Globe', value: 'globe'},
          {title: 'Users', value: 'users'},
          {title: 'Chart Line Up', value: 'chart-line-up'},
          {title: 'Shield Check', value: 'shield-check'},
          {title: 'Clock', value: 'clock'},
          {title: 'Calendar', value: 'calendar'},
          {title: 'Envelope', value: 'envelope'},
          {title: 'Phone', value: 'phone'},
          {title: 'Map Pin', value: 'map-pin'},
          {title: 'Link', value: 'link'},
          {title: 'Code', value: 'code'},
          {title: 'Gear', value: 'gear'},
          {title: 'Palette', value: 'palette'},
          {title: 'Pencil', value: 'pencil'},
          {title: 'Trash', value: 'trash'},
          {title: 'Download', value: 'download'},
          {title: 'Upload', value: 'upload'},
          {title: 'Eye', value: 'eye'},
          {title: 'Lock', value: 'lock'},
          {title: 'Key', value: 'key'},
          {title: 'Sparkle', value: 'sparkle'},
          {title: 'Fire', value: 'fire'},
          {title: 'Sun', value: 'sun'},
          {title: 'Moon', value: 'moon'},
          {title: 'Moon Stars', value: 'moon-stars'},
          {title: 'Cloud', value: 'cloud'},
          {title: 'Tree', value: 'tree'},
          {title: 'Leaf', value: 'leaf'},
          {title: 'Compass', value: 'compass'},
          {title: 'Anchor', value: 'anchor'},
          {title: 'Boat', value: 'boat'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          {title: 'Small (16px)', value: 'sm'},
          {title: 'Medium (24px)', value: 'md'},
          {title: 'Large (32px)', value: 'lg'},
          {title: 'XL (48px)', value: 'xl'},
        ],
        layout: 'radio',
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      options: {
        list: [
          {title: 'Inherit', value: 'inherit'},
          {title: 'Brand', value: 'brand'},
          {title: 'Blue', value: 'blue'},
          {title: 'Black', value: 'black'},
          {title: 'Gray', value: 'gray'},
        ],
      },
      initialValue: 'inherit',
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
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'marginBottom',
      title: 'Bottom Margin',
      type: 'string',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Small (8px)', value: 'sm'},
          {title: 'Medium (16px)', value: 'md'},
          {title: 'Large (24px)', value: 'lg'},
        ],
      },
      initialValue: 'sm',
    }),
  ],
  preview: {
    select: {
      icon: 'icon',
      size: 'size',
    },
    prepare({icon, size}) {
      return {
        title: icon ? icon.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Icon',
        subtitle: `Icon Block • ${size || 'md'}`,
      }
    },
  },
})
