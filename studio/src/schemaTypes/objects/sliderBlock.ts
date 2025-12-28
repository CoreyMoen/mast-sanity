import {defineArrayMember, defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

/**
 * Image Slide - simplified slide structure with direct image field.
 * This reduces nesting depth and keeps the slider focused on images.
 * For other slide types (text, cards, etc.), create separate slider components.
 */
const imageSlide = defineArrayMember({
  name: 'imageSlide',
  title: 'Image Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      description: 'Describe the image for accessibility',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption displayed below the image',
    }),
  ],
  preview: {
    select: {
      media: 'image',
      alt: 'alt',
      caption: 'caption',
    },
    prepare({media, alt, caption}) {
      return {
        title: alt || caption || 'Image slide',
        media,
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
      of: [imageSlide],
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
    defineField({
      name: 'aspectRatio',
      title: 'Image Aspect Ratio',
      type: 'string',
      group: 'layout',
      description: 'Aspect ratio for all slide images',
      options: {
        list: [
          {title: 'Original', value: 'original'},
          {title: '16:9 (Widescreen)', value: '16/9'},
          {title: '4:3 (Standard)', value: '4/3'},
          {title: '1:1 (Square)', value: '1/1'},
          {title: '3:4 (Portrait)', value: '3/4'},
          {title: '9:16 (Vertical)', value: '9/16'},
        ],
        layout: 'radio',
      },
      initialValue: '16/9',
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
      name: 'navigationPosition',
      title: 'Navigation Position',
      type: 'string',
      group: 'behavior',
      description: 'Where to display navigation arrows',
      options: {
        list: [
          {title: 'Below Slider', value: 'below'},
          {title: 'Overlay (Center)', value: 'overlay-center'},
          {title: 'Overlay (Edges)', value: 'overlay-edges'},
          {title: 'Sides (Outside)', value: 'sides'},
        ],
        layout: 'radio',
      },
      initialValue: 'below',
      hidden: ({parent}) => !parent?.showNavigation,
    }),
    defineField({
      name: 'showPagination',
      title: 'Show Pagination Dots',
      type: 'boolean',
      group: 'behavior',
      initialValue: true,
    }),
    defineField({
      name: 'effect',
      title: 'Slide Effect',
      type: 'string',
      group: 'behavior',
      options: {
        list: [
          {title: 'Slide', value: 'slide'},
          {title: 'Fade', value: 'fade'},
        ],
        layout: 'radio',
      },
      initialValue: 'slide',
    }),
    defineField({
      name: 'speed',
      title: 'Transition Speed (ms)',
      type: 'number',
      group: 'behavior',
      description: 'Duration of slide transition in milliseconds',
      initialValue: 500,
    }),
    defineField({
      name: 'centeredSlides',
      title: 'Center Active Slide',
      type: 'boolean',
      group: 'layout',
      description: 'Center the active slide in the viewport',
      initialValue: false,
    }),
    defineField({
      name: 'overflowVisible',
      title: 'Show Overflow',
      type: 'boolean',
      group: 'layout',
      description: 'Show partial next/previous slides at the edges',
      initialValue: false,
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
