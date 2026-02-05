import {BoltIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Claude Skill schema.
 * Stores skill templates that users can select when starting a chat.
 * Each skill provides specific context, instructions, and optional starter prompts.
 *
 * System instructions use Portable Text (rich text) for better editing UX,
 * supporting markdown paste and consistent formatting with the Training document.
 * The content is serialized to Markdown when sent to Claude.
 */

/**
 * Rich text block for skill instructions - supports headings, lists, code, and basic formatting
 * Matches the instructionBlockContent from claudeInstructions.ts for consistency
 */
const skillInstructionBlockContent = [
  defineArrayMember({
    type: 'block',
    styles: [
      {title: 'Normal', value: 'normal'},
      {title: 'Heading 2', value: 'h2'},
      {title: 'Heading 3', value: 'h3'},
      {title: 'Heading 4', value: 'h4'},
    ],
    lists: [
      {title: 'Bullet', value: 'bullet'},
      {title: 'Numbered', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: 'Bold', value: 'strong'},
        {title: 'Italic', value: 'em'},
        {title: 'Code', value: 'code'},
      ],
      annotations: [],
    },
  }),
  defineArrayMember({
    type: 'code',
    title: 'Code Block',
    options: {
      language: 'json',
      languageAlternatives: [
        {title: 'JSON', value: 'json'},
        {title: 'JavaScript', value: 'javascript'},
        {title: 'TypeScript', value: 'typescript'},
        {title: 'Plain Text', value: 'text'},
      ],
      withFilename: false,
    },
  }),
]

export const claudeWorkflow = defineType({
  name: 'claudeWorkflow',
  title: 'Claude Skill',
  type: 'document',
  icon: BoltIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'integrations', title: 'Integrations'},
    {name: 'access', title: 'Access Control'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Skill Name',
      type: 'string',
      description: 'Short name displayed in the skill selector',
      validation: (rule) => rule.required().max(50),
      group: 'content',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description shown when selecting this skill',
      rows: 3,
      group: 'content',
    }),
    defineField({
      name: 'systemInstructions',
      title: 'System Instructions',
      type: 'array',
      description:
        "Additional context and instructions appended to Claude's system prompt when this skill is active. Supports markdown formatting.",
      of: skillInstructionBlockContent,
      group: 'content',
    }),
    defineField({
      name: 'starterPrompt',
      title: 'Starter Prompt',
      type: 'text',
      description:
        'Optional prompt that auto-fills when user selects this skill (user can edit before sending)',
      rows: 4,
      group: 'content',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in the skill selector (lower numbers appear first)',
      initialValue: 50,
      group: 'content',
    }),

    // Integrations group
    defineField({
      name: 'enableFigmaFetch',
      title: 'Enable Figma Integration',
      type: 'boolean',
      description:
        'Allow this skill to fetch frame data from Figma URLs. Requires FIGMA_ACCESS_TOKEN environment variable.',
      initialValue: false,
      group: 'integrations',
    }),

    // Access control group
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
      group: 'access',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this skill is available for selection',
      initialValue: true,
      group: 'access',
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
      enableFigmaFetch: 'enableFigmaFetch',
    },
    prepare({title, subtitle, active, enableFigmaFetch}) {
      const badges: string[] = []
      if (active === false) badges.push('Inactive')
      if (enableFigmaFetch) badges.push('Figma')

      const badgeText = badges.length > 0 ? `(${badges.join(', ')}) ` : ''

      return {
        title: title || 'Untitled Skill',
        subtitle: badgeText + (subtitle || ''),
        media: BoltIcon,
      }
    },
  },
})
