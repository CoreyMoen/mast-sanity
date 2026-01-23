import {defineArrayMember, defineField, defineType} from 'sanity'
import {InlineIcon} from '@sanity/icons'

// Tab item with label and content
const tabItem = defineArrayMember({
  name: 'tabItem',
  title: 'Tab',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Tab Label',
      type: 'string',
      description: 'Text shown in the tab button',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Tab Content',
      type: 'array',
      of: [
        {type: 'row'},
        {type: 'headingBlock'},
        {type: 'richTextBlock'},
        {type: 'imageBlock'},
        {type: 'buttonBlock'},
        {type: 'cardBlock'},
        {type: 'eyebrowBlock'},
        {type: 'iconBlock'},
        {type: 'dividerBlock'},
        {type: 'spacerBlock'},
        {type: 'tableBlock'},
      ],
    }),
  ],
  preview: {
    select: {
      label: 'label',
      content: 'content',
    },
    prepare({label, content}) {
      const blockCount = content?.length || 0
      return {
        title: label || 'Untitled Tab',
        subtitle: `${blockCount} block${blockCount !== 1 ? 's' : ''}`,
      }
    },
  },
})

export const tabsBlock = defineType({
  name: 'tabsBlock',
  title: 'Tabs',
  type: 'object',
  icon: InlineIcon,
  groups: [
    {name: 'tabs', title: 'Tabs', default: true},
    {name: 'settings', title: 'Settings'},
    {name: 'autoplay', title: 'Autoplay'},
  ],
  fields: [
    // Tab items
    defineField({
      name: 'tabs',
      title: 'Tabs',
      type: 'array',
      group: 'tabs',
      of: [tabItem],
      validation: (rule) => rule.min(1).error('At least one tab is required'),
      initialValue: () => [
        {
          _type: 'tabItem',
          _key: crypto.randomUUID().slice(0, 8),
          label: 'Tab 1',
          content: [],
        },
        {
          _type: 'tabItem',
          _key: crypto.randomUUID().slice(0, 8),
          label: 'Tab 2',
          content: [],
        },
      ],
    }),

    // Settings
    defineField({
      name: 'orientation',
      title: 'Menu Orientation',
      type: 'string',
      group: 'settings',
      description: 'Direction of the tab buttons',
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
      name: 'menuPosition',
      title: 'Menu Position',
      type: 'string',
      group: 'settings',
      description: 'Where to place the tab menu relative to content',
      options: {
        list: [
          {title: 'Above Content', value: 'above'},
          {title: 'Below Content', value: 'below'},
          {title: 'Left of Content', value: 'left'},
          {title: 'Right of Content', value: 'right'},
        ],
      },
      initialValue: 'above',
    }),
    defineField({
      name: 'mobileDropdown',
      title: 'Use Dropdown on Mobile',
      type: 'boolean',
      group: 'settings',
      description: 'Convert tabs to a dropdown menu on mobile screens',
      initialValue: false,
    }),
    defineField({
      name: 'contentGap',
      title: 'Menu/Content Gap',
      type: 'string',
      group: 'settings',
      description: 'Space between the tab menu and content area',
      options: {
        list: [
          {title: 'None', value: '0'},
          {title: 'Small (8px)', value: '2'},
          {title: 'Medium (16px)', value: '4'},
          {title: 'Large (24px)', value: '6'},
          {title: 'XL (32px)', value: '8'},
          {title: '2XL (48px)', value: '12'},
        ],
      },
      initialValue: '4',
    }),
    defineField({
      name: 'defaultTab',
      title: 'Default Active Tab',
      type: 'string',
      group: 'settings',
      description: 'Leave empty to default to the first tab',
    }),

    // Autoplay settings
    defineField({
      name: 'autoplay',
      title: 'Enable Autoplay',
      type: 'boolean',
      group: 'autoplay',
      description: 'Automatically cycle through tabs',
      initialValue: false,
    }),
    defineField({
      name: 'autoplayDuration',
      title: 'Autoplay Duration (ms)',
      type: 'number',
      group: 'autoplay',
      description: 'Time each tab is shown in milliseconds',
      initialValue: 5000,
      hidden: ({parent}) => !parent?.autoplay,
    }),
    defineField({
      name: 'pauseOnHover',
      title: 'Pause on Hover',
      type: 'boolean',
      group: 'autoplay',
      description: 'Pause autoplay when hovering over the tabs',
      initialValue: true,
      hidden: ({parent}) => !parent?.autoplay,
    }),
    defineField({
      name: 'showProgress',
      title: 'Show Progress Indicator',
      type: 'boolean',
      group: 'autoplay',
      description: 'Show animated progress bar on active tab',
      initialValue: true,
      hidden: ({parent}) => !parent?.autoplay,
    }),
  ],
  preview: {
    select: {
      tabs: 'tabs',
      orientation: 'orientation',
      autoplay: 'autoplay',
    },
    prepare({tabs, orientation, autoplay}) {
      const tabCount = tabs?.length || 0
      const labels = tabs?.map((t: {label: string}) => t.label).join(', ')
      return {
        title: `Tabs (${tabCount})`,
        subtitle: `${orientation}${autoplay ? ' • Autoplay' : ''} — ${labels}`,
      }
    },
  },
})
