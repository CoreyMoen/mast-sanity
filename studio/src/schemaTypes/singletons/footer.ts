import {BlockElementIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Footer schema singleton.
 * Controls the global footer with logo, link columns, social links, and copyright.
 */

// Footer link
const footerLink = defineArrayMember({
  name: 'footerLink',
  title: 'Link',
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
    },
  },
})

// Link column group
const linkColumn = defineArrayMember({
  name: 'linkColumn',
  title: 'Link Column',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Column Title',
      type: 'string',
      description: 'Optional heading for this group of links',
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [footerLink],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      links: 'links',
    },
    prepare({title, links}) {
      const linkCount = links?.length || 0
      return {
        title: title || 'Untitled Column',
        subtitle: `${linkCount} link${linkCount !== 1 ? 's' : ''}`,
      }
    },
  },
})

// Social link with icon selection
const socialLink = defineArrayMember({
  name: 'socialLink',
  title: 'Social Link',
  type: 'object',
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          {title: 'LinkedIn', value: 'linkedin'},
          {title: 'X (Twitter)', value: 'x'},
          {title: 'Instagram', value: 'instagram'},
          {title: 'Facebook', value: 'facebook'},
          {title: 'YouTube', value: 'youtube'},
          {title: 'GitHub', value: 'github'},
          {title: 'TikTok', value: 'tiktok'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      platform: 'platform',
      url: 'url',
    },
    prepare({platform, url}) {
      const platformNames: Record<string, string> = {
        linkedin: 'LinkedIn',
        x: 'X (Twitter)',
        instagram: 'Instagram',
        facebook: 'Facebook',
        youtube: 'YouTube',
        github: 'GitHub',
        tiktok: 'TikTok',
      }
      return {
        title: platformNames[platform] || platform,
        subtitle: url,
      }
    },
  },
})

export const footer = defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  icon: BlockElementIcon,
  groups: [
    {name: 'logo', title: 'Logo'},
    {name: 'links', title: 'Link Columns'},
    {name: 'social', title: 'Social Links'},
    {name: 'legal', title: 'Legal & Copyright'},
  ],
  fields: [
    // Logo settings
    defineField({
      name: 'showLogo',
      title: 'Show Logo',
      type: 'boolean',
      initialValue: true,
      group: 'logo',
    }),
    defineField({
      name: 'logoText',
      title: 'Logo Text',
      type: 'string',
      description: 'Text to display as the logo. Leave empty to use an image instead.',
      hidden: ({parent}) => !parent?.showLogo,
      group: 'logo',
    }),
    defineField({
      name: 'logoImage',
      title: 'Logo Image',
      type: 'image',
      description: 'Optional logo image. If provided, this will be used instead of text.',
      hidden: ({parent}) => !parent?.showLogo,
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

    // Link columns
    defineField({
      name: 'linkColumns',
      title: 'Link Columns',
      type: 'array',
      description: 'Groups of links organized into columns',
      group: 'links',
      of: [linkColumn],
      validation: (rule) => rule.max(4).warning('Maximum of 4 columns recommended for best layout'),
    }),

    // Social links
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      group: 'social',
      of: [socialLink],
    }),

    // Copyright and legal
    defineField({
      name: 'companyName',
      title: 'Company Name',
      type: 'string',
      description: 'Used in the copyright notice',
      group: 'legal',
    }),
    defineField({
      name: 'showThemeToggle',
      title: 'Show Theme Toggle',
      type: 'boolean',
      description: 'Display a light/dark mode toggle in the footer',
      initialValue: false,
      group: 'legal',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Footer',
      }
    },
  },
})
