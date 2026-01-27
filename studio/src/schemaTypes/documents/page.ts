import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentIcon} from '@sanity/icons'
import {PageFormInput} from '../components/PageFormInput'

/**
 * Page schema.  Define and edit the fields for the 'page' content type.
 * Learn more: https://www.sanity.io/docs/schema-types
 */

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  // Add banner at top of document form
  components: {
    input: PageFormInput,
  },
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'metadata', title: 'Metadata'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      validation: (Rule) => Rule.required(),
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'pageBuilder',
      title: 'Page builder',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({type: 'section', options: {modal: {type: 'dialog', width: 'auto'}}}),
      ],
    }),

    // Metadata fields
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      group: 'metadata',
      description:
        'An alternate title used for search engine indexing and browser tabs. Use sentence case and capitalize only the first word and proper nouns (like names, places, and brand names). (This field is primarily for use with Posts, not section-based Pages.)',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      group: 'metadata',
      rows: 3,
      description: 'A brief description for search engine indexing.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Image',
      type: 'image',
      group: 'metadata',
      description:
        'Image will appear when content is shared across social networks and external sites.',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Description',
          type: 'string',
          description: 'A brief description of the image for assistive technology users',
        }),
      ],
    }),
    defineField({
      name: 'indexable',
      title: 'Indexable by Search Engines',
      type: 'boolean',
      group: 'metadata',
      description: 'Determines if the page can show up in search results. Defaults to true.',
      initialValue: true,
    }),
  ],
})
