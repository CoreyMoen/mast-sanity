import {defineArrayMember, defineField, defineType} from 'sanity'
import {ThListIcon} from '@sanity/icons'

// Table column definition
const tableColumn = defineArrayMember({
  name: 'tableColumn',
  title: 'Column',
  type: 'object',
  fields: [
    defineField({
      name: 'header',
      title: 'Header',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
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
      header: 'header',
      align: 'align',
    },
    prepare({header, align}) {
      return {
        title: header || 'Column',
        subtitle: `Align: ${align || 'left'}`,
      }
    },
  },
})

// Table cell
const tableCell = defineArrayMember({
  name: 'tableCell',
  title: 'Cell',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      content: 'content',
    },
    prepare({content}) {
      return {
        title: content || '(empty)',
      }
    },
  },
})

// Table row
const tableRow = defineArrayMember({
  name: 'tableRow',
  title: 'Row',
  type: 'object',
  fields: [
    defineField({
      name: 'cells',
      title: 'Cells',
      type: 'array',
      of: [tableCell],
      description: 'Add one cell for each column in the same order',
    }),
  ],
  preview: {
    select: {
      cells: 'cells',
    },
    prepare({cells}) {
      const cellCount = cells?.length || 0
      const preview = cells
        ?.slice(0, 3)
        .map((c: {content: string}) => c.content || '-')
        .join(' | ')
      return {
        title: preview || 'Empty row',
        subtitle: `${cellCount} cell${cellCount !== 1 ? 's' : ''}`,
      }
    },
  },
})

export const tableBlock = defineType({
  name: 'tableBlock',
  title: 'Table',
  type: 'object',
  icon: ThListIcon,
  groups: [
    {name: 'structure', title: 'Structure'},
    {name: 'data', title: 'Data'},
    {name: 'style', title: 'Style'},
  ],
  fields: [
    // Structure - define columns first
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'array',
      group: 'structure',
      description: 'Define the table columns (headers)',
      of: [tableColumn],
      validation: (rule) => rule.min(1).error('At least one column is required'),
    }),

    // Data - add rows
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      group: 'data',
      description: 'Add data rows. Each row should have a cell for each column.',
      of: [tableRow],
    }),

    // Style options
    defineField({
      name: 'variant',
      title: 'Style Variant',
      type: 'string',
      group: 'style',
      options: {
        list: [
          {title: 'Default', value: 'default'},
          {title: 'Striped (alternating row colors)', value: 'striped'},
          {title: 'Bordered (all cells have borders)', value: 'bordered'},
        ],
        layout: 'radio',
      },
      initialValue: 'default',
    }),
    defineField({
      name: 'showHeader',
      title: 'Show Header Row',
      type: 'boolean',
      group: 'style',
      initialValue: true,
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      group: 'style',
      description: 'Optional caption displayed below the table',
    }),
  ],
  preview: {
    select: {
      columns: 'columns',
      rows: 'rows',
      variant: 'variant',
    },
    prepare({columns, rows, variant}) {
      const colCount = columns?.length || 0
      const rowCount = rows?.length || 0
      const variantLabels: Record<string, string> = {
        default: 'Default',
        striped: 'Striped',
        bordered: 'Bordered',
      }
      return {
        title: `Table (${colCount} cols × ${rowCount} rows)`,
        subtitle: variantLabels[variant] || 'Default',
      }
    },
  },
})
