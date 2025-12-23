import {defineField, defineType} from 'sanity'
import {SquareIcon} from '@sanity/icons'

/**
 * Column schema - Container within a row using a 12-column grid system.
 * Contains content blocks and provides responsive width settings.
 */
export const column = defineType({
  name: 'column',
  title: 'Column',
  type: 'object',
  icon: SquareIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'width', title: 'Width Settings'},
    {name: 'spacing', title: 'Spacing'},
  ],
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {type: 'headingBlock'},
        {type: 'richTextBlock'},
        {type: 'imageBlock'},
        {type: 'buttonBlock'},
        {type: 'spacerBlock'},
      ],
      group: 'content',
    }),
    // Width Settings Group - 12 column grid system
    defineField({
      name: 'widthDesktop',
      title: 'Desktop Width',
      type: 'string',
      group: 'width',
      description: 'Width on large screens (1024px+)',
      options: {
        list: [
          {title: 'Auto (content width)', value: 'auto'},
          {title: 'Fill (grow to fill)', value: 'fill'},
          {title: '1/12 (8.3%)', value: '1'},
          {title: '2/12 (16.7%)', value: '2'},
          {title: '3/12 (25%)', value: '3'},
          {title: '4/12 (33.3%)', value: '4'},
          {title: '5/12 (41.7%)', value: '5'},
          {title: '6/12 (50%)', value: '6'},
          {title: '7/12 (58.3%)', value: '7'},
          {title: '8/12 (66.7%)', value: '8'},
          {title: '9/12 (75%)', value: '9'},
          {title: '10/12 (83.3%)', value: '10'},
          {title: '11/12 (91.7%)', value: '11'},
          {title: '12/12 (100%)', value: '12'},
        ],
      },
      initialValue: 'fill',
    }),
    defineField({
      name: 'widthTablet',
      title: 'Tablet Width',
      type: 'string',
      group: 'width',
      description: 'Width on medium screens (768px - 1023px)',
      options: {
        list: [
          {title: 'Same as Desktop', value: 'inherit'},
          {title: 'Auto (content width)', value: 'auto'},
          {title: 'Fill (grow to fill)', value: 'fill'},
          {title: '1/12 (8.3%)', value: '1'},
          {title: '2/12 (16.7%)', value: '2'},
          {title: '3/12 (25%)', value: '3'},
          {title: '4/12 (33.3%)', value: '4'},
          {title: '5/12 (41.7%)', value: '5'},
          {title: '6/12 (50%)', value: '6'},
          {title: '7/12 (58.3%)', value: '7'},
          {title: '8/12 (66.7%)', value: '8'},
          {title: '9/12 (75%)', value: '9'},
          {title: '10/12 (83.3%)', value: '10'},
          {title: '11/12 (91.7%)', value: '11'},
          {title: '12/12 (100%)', value: '12'},
        ],
      },
      initialValue: 'inherit',
    }),
    defineField({
      name: 'widthMobile',
      title: 'Mobile Width',
      type: 'string',
      group: 'width',
      description: 'Width on small screens (below 768px)',
      options: {
        list: [
          {title: 'Same as Tablet', value: 'inherit'},
          {title: 'Auto (content width)', value: 'auto'},
          {title: 'Fill (grow to fill)', value: 'fill'},
          {title: '1/12 (8.3%)', value: '1'},
          {title: '2/12 (16.7%)', value: '2'},
          {title: '3/12 (25%)', value: '3'},
          {title: '4/12 (33.3%)', value: '4'},
          {title: '5/12 (41.7%)', value: '5'},
          {title: '6/12 (50%)', value: '6'},
          {title: '7/12 (58.3%)', value: '7'},
          {title: '8/12 (66.7%)', value: '8'},
          {title: '9/12 (75%)', value: '9'},
          {title: '10/12 (83.3%)', value: '10'},
          {title: '11/12 (91.7%)', value: '11'},
          {title: '12/12 (100%)', value: '12'},
        ],
      },
      initialValue: '12',
    }),
    // Spacing Group
    defineField({
      name: 'verticalAlign',
      title: 'Content Vertical Alignment',
      type: 'string',
      group: 'spacing',
      options: {
        list: [
          {title: 'Top', value: 'start'},
          {title: 'Center', value: 'center'},
          {title: 'Bottom', value: 'end'},
        ],
        layout: 'radio',
      },
      initialValue: 'start',
    }),
    defineField({
      name: 'padding',
      title: 'Inner Padding',
      type: 'string',
      group: 'spacing',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Small (8px)', value: '2'},
          {title: 'Medium (16px)', value: '4'},
          {title: 'Large (24px)', value: '6'},
          {title: 'XL (32px)', value: '8'},
        ],
      },
      initialValue: '0',
    }),
  ],
  preview: {
    select: {
      content: 'content',
      widthDesktop: 'widthDesktop',
    },
    prepare({content, widthDesktop}) {
      const blockCount = content?.length || 0
      const widthLabel = widthDesktop === 'fill' ? 'Fill' : widthDesktop === 'auto' ? 'Auto' : `${widthDesktop}/12`
      return {
        title: 'Column',
        subtitle: `${widthLabel} • ${blockCount} block${blockCount !== 1 ? 's' : ''}`,
      }
    },
  },
})
