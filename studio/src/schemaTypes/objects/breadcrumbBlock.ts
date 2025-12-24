import {defineArrayMember, defineField, defineType} from 'sanity'
import {OlistIcon} from '@sanity/icons'

// Breadcrumb item
const breadcrumbItem = defineArrayMember({
  name: 'breadcrumbItem',
  title: 'Breadcrumb Item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'link',
      description: 'Leave empty for the current page (last item)',
    }),
  ],
  preview: {
    select: {
      label: 'label',
      linkType: 'link.linkType',
    },
    prepare({label, linkType}) {
      return {
        title: label || 'Breadcrumb Item',
        subtitle: linkType ? 'Has link' : 'Current page',
      }
    },
  },
})

export const breadcrumbBlock = defineType({
  name: 'breadcrumbBlock',
  title: 'Breadcrumb',
  type: 'object',
  icon: OlistIcon,
  groups: [
    {name: 'content', title: 'Content'},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    defineField({
      name: 'items',
      title: 'Breadcrumb Items',
      type: 'array',
      group: 'content',
      description:
        'Add breadcrumb items in order. The last item is typically the current page (no link needed).',
      of: [breadcrumbItem],
      validation: (rule) => rule.min(1).error('At least one breadcrumb item is required'),
    }),
    defineField({
      name: 'separator',
      title: 'Separator',
      type: 'string',
      group: 'style',
      options: {
        list: [
          {title: 'Chevron (>)', value: 'chevron'},
          {title: 'Slash (/)', value: 'slash'},
        ],
        layout: 'radio',
      },
      initialValue: 'chevron',
    }),
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      group: 'style',
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
  ],
  preview: {
    select: {
      items: 'items',
    },
    prepare({items}) {
      const itemCount = items?.length || 0
      const labels = items?.map((i: {label: string}) => i.label).join(' > ') || 'Empty'
      return {
        title: 'Breadcrumb',
        subtitle: itemCount > 0 ? labels : 'No items',
      }
    },
  },
})
