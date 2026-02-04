import {BoltIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Claude Skill schema.
 * Stores skill templates that users can select when starting a chat.
 * Each skill provides specific context, instructions, and optional starter prompts.
 */
export const claudeWorkflow = defineType({
  name: 'claudeWorkflow',
  title: 'Claude Skill',
  type: 'document',
  icon: BoltIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Skill Name',
      type: 'string',
      description: 'Short name displayed in the skill selector',
      validation: (rule) => rule.required().max(50),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description shown when selecting this skill',
      rows: 3,
    }),
    defineField({
      name: 'systemInstructions',
      title: 'System Instructions',
      type: 'text',
      description: 'Additional context and instructions appended to Claude\'s system prompt when this skill is active',
      rows: 10,
    }),
    defineField({
      name: 'starterPrompt',
      title: 'Starter Prompt',
      type: 'text',
      description: 'Optional prompt that auto-fills when user selects this skill (user can edit before sending)',
      rows: 4,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in the skill selector (lower numbers appear first)',
      initialValue: 50,
    }),
    defineField({
      name: 'roles',
      title: 'Allowed Roles',
      type: 'array',
      description: 'Which roles can use this skill (leave empty for everyone)',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Administrator', value: 'administrator'},
          {title: 'Editor', value: 'editor'},
          {title: 'Viewer', value: 'viewer'},
        ],
        layout: 'tags',
      },
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this skill is available for selection',
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      active: 'active',
    },
    prepare({title, subtitle, active}) {
      return {
        title: title || 'Untitled Skill',
        subtitle: active === false ? '(Inactive) ' + (subtitle || '') : subtitle || '',
        media: BoltIcon,
      }
    },
  },
})
