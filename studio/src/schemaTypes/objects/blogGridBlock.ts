import {ThListIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Blog Grid block - Displays a grid of blog posts with filtering and sorting options.
 * Can display all posts, specific posts, or posts from a category.
 */
export const blogGridBlock = defineType({
  name: 'blogGridBlock',
  title: 'Blog Grid',
  type: 'object',
  icon: ThListIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'layout', title: 'Layout'},
    {name: 'advanced', title: 'Advanced'},
  ],
  fields: [
    // Content Group - Post Selection
    defineField({
      name: 'selectionMode',
      title: 'Post Selection',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'All Posts', value: 'all'},
          {title: 'Specific Posts', value: 'specific'},
          {title: 'By Category', value: 'category'},
        ],
        layout: 'radio',
      },
      initialValue: 'all',
    }),
    defineField({
      name: 'specificPosts',
      title: 'Select Posts',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'reference', to: [{type: 'post'}]})],
      description: 'Choose specific posts to display',
      hidden: ({parent}) => parent?.selectionMode !== 'specific',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'content',
      description: 'Show posts from this category',
      hidden: ({parent}) => parent?.selectionMode !== 'category',
    }),
    defineField({
      name: 'limit',
      title: 'Maximum Posts',
      type: 'number',
      group: 'content',
      description: 'Limit the number of posts displayed (leave empty for no limit)',
      validation: (rule) => rule.min(1).max(50),
    }),
    defineField({
      name: 'sortBy',
      title: 'Sort By',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Date', value: 'date'},
          {title: 'Title (Alphabetical)', value: 'title'},
        ],
        layout: 'radio',
      },
      initialValue: 'date',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Descending (Newest/Z-A)', value: 'desc'},
          {title: 'Ascending (Oldest/A-Z)', value: 'asc'},
        ],
        layout: 'radio',
      },
      initialValue: 'desc',
    }),

    // Layout Group - Grid Settings
    defineField({
      name: 'columnsDesktop',
      title: 'Desktop Columns',
      type: 'string',
      group: 'layout',
      description: 'Number of columns on large screens (1024px+)',
      options: {
        list: [
          {title: '1 Column', value: '1'},
          {title: '2 Columns', value: '2'},
          {title: '3 Columns', value: '3'},
          {title: '4 Columns', value: '4'},
        ],
        layout: 'radio',
      },
      initialValue: '3',
    }),
    defineField({
      name: 'columnsTablet',
      title: 'Tablet Columns',
      type: 'string',
      group: 'layout',
      description: 'Number of columns on medium screens (768px - 1023px)',
      options: {
        list: [
          {title: 'Same as Desktop', value: 'inherit'},
          {title: '1 Column', value: '1'},
          {title: '2 Columns', value: '2'},
          {title: '3 Columns', value: '3'},
          {title: '4 Columns', value: '4'},
        ],
        layout: 'radio',
      },
      initialValue: '2',
    }),
    defineField({
      name: 'columnsMobile',
      title: 'Mobile Columns',
      type: 'string',
      group: 'layout',
      description: 'Number of columns on small screens (below 768px)',
      options: {
        list: [
          {title: 'Same as Tablet', value: 'inherit'},
          {title: '1 Column', value: '1'},
          {title: '2 Columns', value: '2'},
        ],
        layout: 'radio',
      },
      initialValue: '1',
    }),
    defineField({
      name: 'gap',
      title: 'Grid Gap',
      type: 'string',
      group: 'layout',
      description: 'Space between grid items',
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
      initialValue: '6',
    }),

    // Advanced Group
    defineField({
      name: 'customStyle',
      title: 'Custom CSS',
      type: 'text',
      group: 'advanced',
      description: 'Add custom inline CSS styles (e.g., "margin-top: 2rem;")',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      selectionMode: 'selectionMode',
      category: 'category.title',
      limit: 'limit',
      columnsDesktop: 'columnsDesktop',
    },
    prepare({selectionMode, category, limit, columnsDesktop}) {
      const modeLabel =
        selectionMode === 'all'
          ? 'All Posts'
          : selectionMode === 'specific'
            ? 'Specific Posts'
            : category
              ? `Category: ${category}`
              : 'By Category'

      const limitLabel = limit ? `Limit: ${limit}` : 'No limit'
      const colsLabel = `${columnsDesktop || 3} cols`

      return {
        title: 'Blog Grid',
        subtitle: `${modeLabel} • ${limitLabel} • ${colsLabel}`,
      }
    },
  },
})
