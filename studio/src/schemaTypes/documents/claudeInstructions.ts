import {BookIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Claude Instructions schema (Singleton).
 * Stores custom instructions and guidelines for the Claude assistant.
 * This configures how Claude behaves when generating content.
 *
 * Guideline fields use Portable Text (rich text) for better editing UX.
 * The content is serialized to Markdown when sent to Claude.
 */

/**
 * Simple rich text block for instructions - supports headings, lists, and basic formatting
 */
const instructionBlockContent = [
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
]

/**
 * List of all component types in the project.
 * Used for select fields to ensure correct component references.
 */
const COMPONENT_OPTIONS = [
  // Layout components
  {title: 'Section', value: 'section'},
  {title: 'Row', value: 'row'},
  {title: 'Column', value: 'column'},
  // Content blocks
  {title: 'Heading Block', value: 'headingBlock'},
  {title: 'Rich Text Block', value: 'richTextBlock'},
  {title: 'Eyebrow Block', value: 'eyebrowBlock'},
  {title: 'Image Block', value: 'imageBlock'},
  {title: 'Button Block', value: 'buttonBlock'},
  {title: 'Icon Block', value: 'iconBlock'},
  {title: 'Spacer Block', value: 'spacerBlock'},
  {title: 'Divider Block', value: 'dividerBlock'},
  {title: 'Card Block', value: 'cardBlock'},
  {title: 'Table Block', value: 'tableBlock'},
  {title: 'Accordion Block', value: 'accordionBlock'},
  {title: 'Breadcrumb Block', value: 'breadcrumbBlock'},
  // Interactive blocks
  {title: 'Slider Block', value: 'sliderBlock'},
  {title: 'Tabs Block', value: 'tabsBlock'},
  {title: 'Modal Block', value: 'modalBlock'},
  {title: 'Inline Video Block', value: 'inlineVideoBlock'},
  {title: 'Marquee Block', value: 'marqueeBlock'},
  // Page-level sections
  {title: 'Call To Action', value: 'callToAction'},
  {title: 'Info Section', value: 'infoSection'},
]

/**
 * Default keywords that trigger Writing instructions inclusion
 */
const DEFAULT_WRITING_KEYWORDS = 'write, writing, copy, text, content, heading, title, description, paragraph, rich text, blog, article, post, caption, label, tone, voice, style, language, word, sentence, grammar'

/**
 * Default keywords that trigger Design instructions inclusion
 */
const DEFAULT_DESIGN_KEYWORDS = 'design, layout, section, row, column, spacing, padding, margin, style, visual, color, theme, grid, responsive, mobile, desktop, hero, banner, card, button, icon, image, slider, tab, background, overlay, align, width, height'

/**
 * Default keywords that trigger Technical instructions inclusion
 */
const DEFAULT_TECHNICAL_KEYWORDS = 'nest, nesting, depth, schema, structure, field, type, key, sanity, groq, query, api, update, create, delete, duplicate, error, fail, bug, fix, constraint, limit, required'

// Preferred terms object for terminology replacements
const preferredTermObject = defineArrayMember({
  name: 'preferredTerm',
  title: 'Preferred Term',
  type: 'object',
  fields: [
    defineField({
      name: 'avoid',
      title: 'Avoid',
      type: 'string',
      description: 'The term or phrase to avoid',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'useInstead',
      title: 'Use Instead',
      type: 'string',
      description: 'The preferred replacement term',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      avoid: 'avoid',
      useInstead: 'useInstead',
    },
    prepare({avoid, useInstead}) {
      return {
        title: `"${avoid}" → "${useInstead}"`,
      }
    },
  },
})

// Component guideline object
const componentGuidelineObject = defineArrayMember({
  name: 'componentGuideline',
  title: 'Component Guideline',
  type: 'object',
  fields: [
    defineField({
      name: 'component',
      title: 'Component',
      type: 'string',
      description: 'Select the component type',
      validation: (rule) => rule.required(),
      options: {
        list: COMPONENT_OPTIONS,
      },
    }),
    defineField({
      name: 'guidelines',
      title: 'Guidelines',
      type: 'text',
      description: 'How to properly use this component',
      rows: 4,
    }),
    defineField({
      name: 'doNot',
      title: 'Do Not',
      type: 'text',
      description: 'Things to avoid when using this component',
      rows: 4,
    }),
  ],
  preview: {
    select: {
      component: 'component',
      guidelines: 'guidelines',
    },
    prepare({component, guidelines}) {
      // Find the display title for the component
      const componentOption = COMPONENT_OPTIONS.find((opt) => opt.value === component)
      const displayTitle = componentOption?.title || component
      const truncated = guidelines?.length > 60 ? `${guidelines.substring(0, 60)}...` : guidelines
      return {
        title: displayTitle,
        subtitle: truncated || 'No guidelines specified',
      }
    },
  },
})

// Required fields object for component field requirements
const requiredFieldsObject = defineArrayMember({
  name: 'requiredFieldsRule',
  title: 'Required Fields Rule',
  type: 'object',
  fields: [
    defineField({
      name: 'component',
      title: 'Component',
      type: 'string',
      description: 'Select the component type this rule applies to',
      validation: (rule) => rule.required(),
      options: {
        list: COMPONENT_OPTIONS,
      },
    }),
    defineField({
      name: 'fields',
      title: 'Required Fields',
      type: 'array',
      description: 'List of field names that must be filled',
      of: [defineArrayMember({type: 'string'})],
    }),
  ],
  preview: {
    select: {
      component: 'component',
      fields: 'fields',
    },
    prepare({component, fields}) {
      const componentOption = COMPONENT_OPTIONS.find((opt) => opt.value === component)
      const displayTitle = componentOption?.title || component
      const fieldList = fields?.join(', ') || 'No fields specified'
      return {
        title: displayTitle,
        subtitle: fieldList,
      }
    },
  },
})

export const claudeInstructions = defineType({
  name: 'claudeInstructions',
  title: 'Claude Instructions',
  type: 'document',
  icon: BookIcon,
  groups: [
    {name: 'writing', title: 'Writing', default: true},
    {name: 'design', title: 'Design'},
    {name: 'technical', title: 'Technical'},
  ],
  fields: [
    // Writing group
    defineField({
      name: 'writingGuidelines',
      title: 'Writing Guidelines',
      type: 'array',
      description: 'General guidelines for writing style, tone, and voice. Use headings and lists for better organization.',
      group: 'writing',
      of: instructionBlockContent,
    }),
    defineField({
      name: 'brandVoice',
      title: 'Brand Voice',
      type: 'array',
      description: 'Description of the brand voice and personality',
      group: 'writing',
      of: instructionBlockContent,
    }),
    defineField({
      name: 'forbiddenTerms',
      title: 'Forbidden Terms',
      type: 'array',
      description: 'Words or phrases that should never be used',
      group: 'writing',
      of: [defineArrayMember({type: 'string'})],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'preferredTerms',
      title: 'Preferred Terms',
      type: 'array',
      description: 'Term replacements - what to avoid and what to use instead',
      group: 'writing',
      of: [preferredTermObject],
    }),
    defineField({
      name: 'writingKeywords',
      title: 'Trigger Keywords',
      type: 'text',
      description: 'Comma-separated keywords that trigger inclusion of Writing instructions when detected in user prompts. This optimizes performance by only including relevant instructions.',
      group: 'writing',
      rows: 3,
      initialValue: DEFAULT_WRITING_KEYWORDS,
    }),

    // Design group
    defineField({
      name: 'designSystemRules',
      title: 'Design System Rules',
      type: 'array',
      description: 'General rules for the design system and visual consistency. Use headings and lists for better organization.',
      group: 'design',
      of: instructionBlockContent,
    }),
    defineField({
      name: 'componentGuidelines',
      title: 'Component Guidelines',
      type: 'array',
      description: 'Specific guidelines for individual components',
      group: 'design',
      of: [componentGuidelineObject],
    }),
    defineField({
      name: 'designKeywords',
      title: 'Trigger Keywords',
      type: 'text',
      description: 'Comma-separated keywords that trigger inclusion of Design instructions when detected in user prompts.',
      group: 'design',
      rows: 3,
      initialValue: DEFAULT_DESIGN_KEYWORDS,
    }),

    // Technical group
    defineField({
      name: 'technicalConstraints',
      title: 'Technical Constraints',
      type: 'array',
      description: 'Technical limitations and constraints Claude should be aware of. Use headings and lists for better organization.',
      group: 'technical',
      of: instructionBlockContent,
    }),
    defineField({
      name: 'maxNestingDepth',
      title: 'Max Nesting Depth',
      type: 'number',
      description: 'Maximum nesting depth for page structures (Sanity limit is 20)',
      group: 'technical',
      initialValue: 12,
      validation: (rule) => rule.min(1).max(20),
    }),
    defineField({
      name: 'requiredFields',
      title: 'Required Fields',
      type: 'array',
      description: 'Fields that must be filled for specific components',
      group: 'technical',
      of: [requiredFieldsObject],
    }),
    defineField({
      name: 'technicalKeywords',
      title: 'Trigger Keywords',
      type: 'text',
      description: 'Comma-separated keywords that trigger inclusion of Technical instructions when detected in user prompts.',
      group: 'technical',
      rows: 3,
      initialValue: DEFAULT_TECHNICAL_KEYWORDS,
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Claude Instructions',
        subtitle: 'AI Assistant Configuration',
        media: BookIcon,
      }
    },
  },
})

// Export constants for use in format-instructions
export {DEFAULT_WRITING_KEYWORDS, DEFAULT_DESIGN_KEYWORDS, DEFAULT_TECHNICAL_KEYWORDS}
