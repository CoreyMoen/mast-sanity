import {MenuIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Navigation schema singleton.
 * Controls the global navigation bar with links, dropdowns, and CTA button.
 */

// Reusable nav link object
const navLink = defineArrayMember({
  name: 'navLink',
  title: 'Navigation Link',
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
    }),
  ],
  preview: {
    select: {
      title: 'label',
      linkType: 'link.linkType',
    },
    prepare({title, linkType}) {
      return {
        title: title || 'Untitled Link',
        subtitle: linkType === 'href' ? 'External URL' : linkType === 'page' ? 'Page' : 'Post',
      }
    },
  },
})

// Navigation item that can be a simple link or a dropdown
const navItem = defineArrayMember({
  name: 'navItem',
  title: 'Navigation Item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Link', value: 'link'},
          {title: 'Dropdown', value: 'dropdown'},
        ],
        layout: 'radio',
      },
      initialValue: 'link',
    }),
    // Simple link fields
    defineField({
      name: 'link',
      title: 'Link',
      type: 'link',
      hidden: ({parent}) => parent?.type !== 'link',
    }),
    // Dropdown fields
    defineField({
      name: 'dropdownLinks',
      title: 'Dropdown Links',
      type: 'array',
      hidden: ({parent}) => parent?.type !== 'dropdown',
      of: [navLink],
    }),
  ],
  preview: {
    select: {
      title: 'label',
      type: 'type',
      dropdownLinks: 'dropdownLinks',
    },
    prepare({title, type, dropdownLinks}) {
      const linkCount = dropdownLinks?.length || 0
      return {
        title: title || 'Untitled',
        subtitle: type === 'dropdown' ? `Dropdown (${linkCount} items)` : 'Link',
      }
    },
  },
})

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  icon: MenuIcon,
  groups: [
    {name: 'logo', title: 'Logo'},
    {name: 'links', title: 'Navigation Links'},
    {name: 'cta', title: 'Call to Action'},
  ],
  fields: [
    // Logo settings
    defineField({
      name: 'logoText',
      title: 'Logo Text',
      type: 'string',
      description: 'Text to display as the logo. Leave empty to use an image instead.',
      group: 'logo',
    }),
    defineField({
      name: 'logoImage',
      title: 'Logo Image',
      type: 'image',
      description: 'Optional logo image. If provided, this will be used instead of text.',
      group: 'logo',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Alternative text for accessibility',
        }),
      ],
    }),

    // Navigation items
    defineField({
      name: 'items',
      title: 'Navigation Items',
      type: 'array',
      group: 'links',
      of: [navItem],
    }),

    // CTA Button
    defineField({
      name: 'showCta',
      title: 'Show CTA Button',
      type: 'boolean',
      initialValue: true,
      group: 'cta',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Button Label',
      type: 'string',
      hidden: ({parent}) => !parent?.showCta,
      group: 'cta',
    }),
    defineField({
      name: 'ctaLink',
      title: 'CTA Button Link',
      type: 'link',
      hidden: ({parent}) => !parent?.showCta,
      group: 'cta',
    }),
    defineField({
      name: 'ctaStyle',
      title: 'CTA Button Style',
      type: 'string',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
        ],
      },
      initialValue: 'primary',
      hidden: ({parent}) => !parent?.showCta,
      group: 'cta',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Navigation',
      }
    },
  },
})
