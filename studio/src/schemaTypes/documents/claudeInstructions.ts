import {BookIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Claude Instructions schema (Singleton).
 * Stores custom instructions and guidelines for the Claude assistant.
 * This configures how Claude behaves when generating content.
 */

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
      description: 'The name of the component or block type',
      validation: (rule) => rule.required(),
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
      const truncated = guidelines?.length > 60 ? `${guidelines.substring(0, 60)}...` : guidelines
      return {
        title: component,
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
      description: 'The component or block type this rule applies to',
      validation: (rule) => rule.required(),
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
      const fieldList = fields?.join(', ') || 'No fields specified'
      return {
        title: component,
        subtitle: fieldList,
      }
    },
  },
})

// Example prompt object
const examplePromptObject = defineArrayMember({
  name: 'examplePrompt',
  title: 'Example Prompt',
  type: 'object',
  fields: [
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Category for organizing examples',
      options: {
        list: [
          {title: 'Page Creation', value: 'pageCreation'},
          {title: 'Content Editing', value: 'contentEditing'},
          {title: 'Layout', value: 'layout'},
          {title: 'Styling', value: 'styling'},
          {title: 'SEO', value: 'seo'},
          {title: 'Other', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'userPrompt',
      title: 'User Prompt',
      type: 'text',
      description: 'An example of what a user might ask',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'idealResponse',
      title: 'Ideal Response',
      type: 'text',
      description: 'How Claude should ideally respond or what it should produce',
      rows: 6,
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      description: 'Additional notes or context for this example',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      userPrompt: 'userPrompt',
      category: 'category',
    },
    prepare({userPrompt, category}) {
      const truncated = userPrompt?.length > 60 ? `${userPrompt.substring(0, 60)}...` : userPrompt
      return {
        title: truncated || 'Untitled Example',
        subtitle: category || 'Uncategorized',
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
    {name: 'examples', title: 'Examples'},
  ],
  fields: [
    // Writing group
    defineField({
      name: 'writingGuidelines',
      title: 'Writing Guidelines',
      type: 'text',
      description: 'General guidelines for writing style, tone, and voice',
      group: 'writing',
      rows: 8,
    }),
    defineField({
      name: 'brandVoice',
      title: 'Brand Voice',
      type: 'text',
      description: 'Description of the brand voice and personality',
      group: 'writing',
      rows: 6,
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

    // Design group
    defineField({
      name: 'designSystemRules',
      title: 'Design System Rules',
      type: 'text',
      description: 'General rules for the design system and visual consistency',
      group: 'design',
      rows: 8,
    }),
    defineField({
      name: 'componentGuidelines',
      title: 'Component Guidelines',
      type: 'array',
      description: 'Specific guidelines for individual components',
      group: 'design',
      of: [componentGuidelineObject],
    }),

    // Technical group
    defineField({
      name: 'technicalConstraints',
      title: 'Technical Constraints',
      type: 'text',
      description: 'Technical limitations and constraints Claude should be aware of',
      group: 'technical',
      rows: 8,
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

    // Examples group
    defineField({
      name: 'examplePrompts',
      title: 'Example Prompts',
      type: 'array',
      description: 'Example prompts and ideal responses for training Claude',
      group: 'examples',
      of: [examplePromptObject],
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
