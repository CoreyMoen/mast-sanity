import {defineField, defineType} from 'sanity'
import {TextColumns} from '@phosphor-icons/react'

export const marqueeBlock = defineType({
  name: 'marqueeBlock',
  title: 'Marquee',
  type: 'object',
  icon: TextColumns,
  fields: [
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {type: 'headingBlock'},
        {type: 'richTextBlock'},
        {type: 'imageBlock'},
        {type: 'iconBlock'},
        {type: 'cardBlock'},
      ],
      description: 'Content items to scroll in the marquee',
    }),
    defineField({
      name: 'orientation',
      title: 'Orientation',
      type: 'string',
      options: {
        list: [
          {title: 'Horizontal', value: 'horizontal'},
          {title: 'Vertical', value: 'vertical'},
        ],
        layout: 'radio',
      },
      initialValue: 'horizontal',
    }),
    defineField({
      name: 'reverse',
      title: 'Reverse Direction',
      type: 'boolean',
      description: 'Scroll in the opposite direction',
      initialValue: false,
    }),
    defineField({
      name: 'pauseOnHover',
      title: 'Pause on Hover',
      type: 'boolean',
      description: 'Pause the animation when hovering',
      initialValue: true,
    }),
    defineField({
      name: 'fadeEdges',
      title: 'Fade Edges',
      type: 'boolean',
      description: 'Add a gradient fade to the edges',
      initialValue: false,
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      description: 'Time for one complete scroll cycle',
      initialValue: 30,
      validation: (Rule) => Rule.min(1).max(120),
    }),
    defineField({
      name: 'gap',
      title: 'Gap',
      type: 'string',
      options: {
        list: [
          {title: 'Small (16px)', value: '16'},
          {title: 'Medium (24px)', value: '24'},
          {title: 'Large (32px)', value: '32'},
          {title: 'Extra Large (48px)', value: '48'},
        ],
      },
      initialValue: '24',
    }),
    defineField({
      name: 'height',
      title: 'Height (for vertical orientation)',
      type: 'string',
      description: 'Container height when using vertical orientation',
      options: {
        list: [
          {title: 'Small (200px)', value: '200'},
          {title: 'Medium (300px)', value: '300'},
          {title: 'Large (400px)', value: '400'},
          {title: 'Auto', value: 'auto'},
        ],
      },
      initialValue: '300',
      hidden: ({parent}) => parent?.orientation !== 'vertical',
    }),
  ],
  preview: {
    select: {
      orientation: 'orientation',
      reverse: 'reverse',
      itemCount: 'items',
    },
    prepare({orientation, reverse, itemCount}) {
      const count = itemCount?.length || 0
      const direction = reverse ? '(reversed)' : ''
      return {
        title: `Marquee - ${orientation || 'horizontal'} ${direction}`,
        subtitle: `${count} item${count !== 1 ? 's' : ''}`,
      }
    },
  },
})
