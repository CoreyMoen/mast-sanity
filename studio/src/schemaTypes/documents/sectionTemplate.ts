import {defineArrayMember, defineField, defineType} from 'sanity'
import {BlockElementIcon, EarthGlobeIcon} from '@sanity/icons'
import {SectionTemplateFormInput} from '../components/SectionTemplateFormInput'

/**
 * Section Template document type.
 * Allows editors to create reusable section templates that can be applied
 * to any section in the page builder. Templates are managed entirely within
 * Sanity and can be created/edited without code changes.
 */
export const sectionTemplate = defineType({
  name: 'sectionTemplate',
  title: 'Section Template',
  type: 'document',
  icon: BlockElementIcon,
  // Add banner at top of document form for Presentation mode
  components: {
    input: SectionTemplateFormInput,
  },
  groups: [
    {name: 'template', title: 'Template Info', default: true},
    {name: 'content', title: 'Content'},
    {name: 'settings', title: 'Section Settings'},
  ],
  fields: [
    // Template Info Group
    defineField({
      name: 'name',
      title: 'Template Name',
      type: 'string',
      description: 'Display name shown when selecting templates (e.g., "Hero / Center")',
      group: 'template',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Brief description of when to use this template',
      group: 'template',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'template',
      options: {
        list: [
          {title: 'Heroes', value: 'heroes'},
          {title: 'Features', value: 'features'},
          {title: 'Content', value: 'content'},
          {title: 'Testimonials', value: 'testimonials'},
          {title: 'CTAs', value: 'ctas'},
          {title: 'Pricing', value: 'pricing'},
          {title: 'FAQ', value: 'faq'},
          {title: 'Other', value: 'other'},
        ],
      },
      initialValue: 'other',
    }),
    // isGlobal is set automatically based on which group you create from:
    // - Prefill Templates → isGlobal: false (content copied when applied)
    // - Global Sections → isGlobal: true (pages reference it, edits update everywhere)
    defineField({
      name: 'isGlobal',
      title: 'Global Section',
      type: 'boolean',
      group: 'template',
      hidden: true, // Auto-set via initial value templates in structure
      initialValue: false,
    }),
    defineField({
      name: 'thumbnail',
      title: 'Preview Thumbnail',
      type: 'image',
      description: 'Screenshot showing what this template looks like (recommended: 400x300px)',
      group: 'template',
      options: {
        hotspot: true,
      },
      hidden: ({parent}) => parent?.isGlobal === true,
    }),

    // Content Group - Same as section.rows
    defineField({
      name: 'rows',
      title: 'Template Content',
      type: 'array',
      description: 'Build out the section content that will be copied when this template is applied',
      of: [
        // Layout
        defineArrayMember({type: 'row', options: {modal: {type: 'dialog', width: 'auto'}}}),
        defineArrayMember({type: 'spacerBlock'}),
        defineArrayMember({type: 'dividerBlock'}),
        // Content
        defineArrayMember({type: 'headingBlock'}),
        defineArrayMember({type: 'richTextBlock'}),
        defineArrayMember({type: 'buttonBlock'}),
        // Media
        defineArrayMember({type: 'imageBlock'}),
        // Interactive
        defineArrayMember({type: 'sliderBlock'}),
        defineArrayMember({type: 'tabsBlock'}),
      ],
      options: {
        insertMenu: {
          groups: [
            {name: 'layout', title: 'Layout', of: ['row', 'spacerBlock', 'dividerBlock']},
            {name: 'content', title: 'Content', of: ['headingBlock', 'richTextBlock', 'buttonBlock']},
            {name: 'media', title: 'Media', of: ['imageBlock']},
            {name: 'interactive', title: 'Interactive', of: ['sliderBlock', 'tabsBlock']},
          ],
        },
      },
      group: 'content',
    }),

    // Section Settings Group - Same as section settings fields
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'primary',
    }),
    defineField({
      name: 'minHeight',
      title: 'Minimum Height',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Auto (content height)', value: 'auto'},
          {title: 'Small (300px)', value: 'small'},
          {title: 'Medium (500px)', value: 'medium'},
          {title: 'Large (700px)', value: 'large'},
          {title: 'Full Screen (100vh)', value: 'screen'},
        ],
      },
      initialValue: 'auto',
    }),
    defineField({
      name: 'verticalAlign',
      title: 'Vertical Alignment',
      type: 'string',
      group: 'settings',
      description: 'Only applies when Minimum Height is not Auto',
      options: {
        list: [
          {title: 'Top', value: 'start'},
          {title: 'Center', value: 'center'},
          {title: 'Bottom', value: 'end'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'start',
    }),
    defineField({
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Full Width', value: 'full'},
          {title: 'Container (Default)', value: 'container'},
          {title: 'Small (640px)', value: 'sm'},
          {title: 'Medium (768px)', value: 'md'},
          {title: 'Large (1024px)', value: 'lg'},
          {title: 'XL (1280px)', value: 'xl'},
          {title: '2XL (1536px)', value: '2xl'},
        ],
      },
      initialValue: 'container',
    }),
    defineField({
      name: 'paddingTop',
      title: 'Vertical Padding',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Compact (24-48px)', value: 'compact'},
          {title: 'Default (48-96px)', value: 'default'},
          {title: 'Spacious (96-144px)', value: 'spacious'},
        ],
        layout: 'radio',
      },
      initialValue: 'default',
    }),
  ],
  preview: {
    select: {
      name: 'name',
      category: 'category',
      thumbnail: 'thumbnail',
      rows: 'rows',
      isGlobal: 'isGlobal',
    },
    prepare({name, category, thumbnail, rows, isGlobal}) {
      const itemCount = rows?.length || 0
      const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Other'
      const globalPrefix = isGlobal ? '🌐 ' : ''
      const typeLabel = isGlobal ? 'Global' : categoryLabel
      return {
        title: `${globalPrefix}${name || 'Untitled Template'}`,
        subtitle: `${typeLabel} • ${itemCount} item${itemCount !== 1 ? 's' : ''}`,
        media: isGlobal ? EarthGlobeIcon : thumbnail || BlockElementIcon,
      }
    },
  },
  orderings: [
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [{field: 'category', direction: 'asc'}],
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
  ],
})
