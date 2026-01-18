/**
 * Seed script for Claude Quick Actions
 * Creates the default quick action buttons in Sanity.
 *
 * Run with: SANITY_API_TOKEN="your-token" node scripts/seed-quick-actions.mjs
 */

import {createClient} from '@sanity/client'

const projectId = '6lj3hi0f'
const dataset = 'production'
const token = process.env.SANITY_API_TOKEN

if (!token) {
  console.error('SANITY_API_TOKEN environment variable is required')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})

/**
 * Default quick actions to seed
 */
const quickActions = [
  {
    _id: 'quick-action-create',
    _type: 'claudeQuickAction',
    label: 'Create',
    description: 'Create new content',
    icon: 'add',
    prompt: 'I want to create a new page or document. Help me set up ',
    category: 'content',
    order: 10,
    active: true,
  },
  {
    _id: 'quick-action-find',
    _type: 'claudeQuickAction',
    label: 'Find',
    description: 'Search for content',
    icon: 'search',
    prompt: 'Search my content and find all documents that ',
    category: 'query',
    order: 20,
    active: true,
  },
  {
    _id: 'quick-action-edit',
    _type: 'claudeQuickAction',
    label: 'Edit',
    description: 'Modify existing content',
    icon: 'edit',
    prompt: 'I need to update some existing content. Help me modify ',
    category: 'content',
    order: 30,
    active: true,
  },
  {
    _id: 'quick-action-explain',
    _type: 'claudeQuickAction',
    label: 'Explain',
    description: 'Learn about the schema',
    icon: 'help',
    prompt: 'Explain how the content schema works, specifically ',
    category: 'help',
    order: 40,
    active: true,
  },
]

async function seedQuickActions() {
  console.log('Seeding Claude Quick Actions...')

  try {
    // Create or replace each quick action
    for (const action of quickActions) {
      console.log(`  Creating: ${action.label}`)
      await client.createOrReplace(action)
    }

    console.log(`\nSuccessfully seeded ${quickActions.length} quick actions!`)
    console.log('\nYou can view and edit them in Sanity Studio:')
    console.log('  Structure > Claude Settings > Quick Actions')
  } catch (error) {
    console.error('Failed to seed quick actions:', error)
    process.exit(1)
  }
}

seedQuickActions()
