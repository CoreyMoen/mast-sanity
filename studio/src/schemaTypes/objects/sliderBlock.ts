import {defineArrayMember, defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

// Slide content - can contain other blocks
const slide = defineArrayMember({
  name: 'slide',
  title: 'Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      title: 'Slide Content',
      type: 'array',
      of: [
        {type: 'headingBlock'},
        {type: 'richTextBlock'},
        {type: 'imageBlock'},
        {type: 'buttonBlock'},
        {type: 'cardBlock'},
        {type: 'eyebrowBlock'},
      ],
    }),
  ],
  preview: {
    select: {
      content: 'content',
    },
    prepare({content}) {
      const blockCount = content?.length || 0
      const firstBlock = content?.[0]
      const title = firstBlock?._type || 'Empty slide'
      return {
        title: `Slide`,
        subtitle: `${blockCount} block${blockCount !== 1 ? 's' : ''}`,
      }
    },
  },
})

export const sliderBlock = defineType({
  name: 'sliderBlock',
  title: 'Slider',
  type: 'object',
  icon: ImagesIcon,
  groups: [
    {name: 'slides', title: 'Slides', default: true},
    {name: 'layout', title: 'Layout'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fields: [
    // Slides
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      group: 'slides',
      of: [slide],
      validation: (rule) => rule.min(1).error('At least one slide is required'),
    }),

    // Layout options
    defineField({
      name: 'slidesPerViewDesktop',
      title: 'Slides Per View (Desktop)',
      type: 'number',
      group: 'layout',
      options: {
        list: [
          {title: '1', value: 1},
          {title: '2', value: 2},
          {title: '3', value: 3},
          {title: '4', value: 4},
          {title: '5', value: 5},
          {title: '6', value: 6},
        ],
      },
      initialValue: 3,
    }),
    defineField({
      name: 'slidesPerViewTablet',
      title: 'Slides Per View (Tablet)',
      type: 'number',
      group: 'layout',
      options: {
        list: [
          {title: '1', value: 1},
          {title: '2', value: 2},
          {title: '3', value: 3},
          {title: '4', value: 4},
        ],
      },
      initialValue: 2,
    }),
    defineField({
      name: 'slidesPerViewMobile',
      title: 'Slides Per View (Mobile)',
      type: 'number',
      group: 'layout',
      options: {
        list: [
          {title: '1', value: 1},
          {title: '2', value: 2},
        ],
      },
      initialValue: 1,
    }),
    defineField({
      name: 'gap',
      title: 'Gap Between Slides',
      type: 'string',
      group: 'layout',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Small (8px)', value: '2'},
          {title: 'Medium (16px)', value: '4'},
          {title: 'Large (24px)', value: '6'},
          {title: 'XL (32px)', value: '8'},
        ],
      },
      initialValue: '4',
    }),

    // Behavior options
    defineField({
      name: 'autoplay',
      title: 'Enable Autoplay',
      type: 'boolean',
      group: 'behavior',
      initialValue: false,
    }),
    defineField({
      name: 'autoplayDelay',
      title: 'Autoplay Delay (ms)',
      type: 'number',
      group: 'behavior',
      description: 'Time between slides in milliseconds',
      initialValue: 4000,
      hidden: ({parent}) => !parent?.autoplay,
    }),
    defineField({
      name: 'loop',
      title: 'Enable Loop',
      type: 'boolean',
      group: 'behavior',
      description: 'Loop back to the beginning after the last slide',
      initialValue: false,
    }),
    defineField({
      name: 'showNavigation',
      title: 'Show Navigation Arrows',
      type: 'boolean',
      group: 'behavior',
      initialValue: true,
    }),
    defineField({
      name: 'showPagination',
      title: 'Show Pagination Dots',
      type: 'boolean',
      group: 'behavior',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      slides: 'slides',
      slidesPerView: 'slidesPerViewDesktop',
      autoplay: 'autoplay',
    },
    prepare({slides, slidesPerView, autoplay}) {
      const slideCount = slides?.length || 0
      return {
        title: `Slider (${slideCount} slide${slideCount !== 1 ? 's' : ''})`,
        subtitle: `${slidesPerView} per view${autoplay ? ' • Autoplay' : ''}`,
      }
    },
  },
})
