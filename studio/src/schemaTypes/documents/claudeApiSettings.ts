import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/**
 * Claude API Settings schema (Singleton).
 * Stores API configuration for the Claude assistant.
 * Only published versions are used by the Claude tool.
 */

/**
 * Available Claude models
 */
const AVAILABLE_MODELS = [
  {title: 'Claude Opus 4.5 (Most Capable)', value: 'claude-opus-4-5-20251101'},
  {title: 'Claude Sonnet 4 (Recommended)', value: 'claude-sonnet-4-20250514'},
]

export const claudeApiSettings = defineType({
  name: 'claudeApiSettings',
  title: 'API Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'model',
      title: 'Model',
      type: 'string',
      description: 'Select the Claude model to use. Sonnet is recommended for most tasks.',
      options: {
        list: AVAILABLE_MODELS,
        layout: 'dropdown',
      },
      initialValue: 'claude-sonnet-4-20250514',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'maxTokens',
      title: 'Max Output Tokens',
      type: 'number',
      description: 'Maximum number of tokens in Claude\'s response (100-8192).',
      initialValue: 4096,
      validation: (rule) => rule.required().min(100).max(8192),
    }),
    defineField({
      name: 'temperature',
      title: 'Temperature',
      type: 'number',
      description: 'Lower values (0.0) make responses more focused, higher values (1.0) more creative.',
      initialValue: 0.7,
      validation: (rule) => rule.required().min(0).max(1),
      options: {
        list: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((v) => ({
          title: v.toString(),
          value: v,
        })),
      },
    }),
    defineField({
      name: 'enableStreaming',
      title: 'Enable Streaming',
      type: 'boolean',
      description: 'Show responses as they are generated instead of waiting for the complete response.',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      model: 'model',
    },
    prepare({model}) {
      const modelOption = AVAILABLE_MODELS.find((m) => m.value === model)
      return {
        title: 'API Settings',
        subtitle: modelOption?.title || model || 'Not configured',
        media: CogIcon,
      }
    },
  },
})
