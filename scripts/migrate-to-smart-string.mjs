/**
 * Migration Script: Convert plain string fields to smartString objects
 *
 * This script migrates existing headingBlock, buttonBlock, and eyebrowBlock
 * documents that have plain string `text` fields to use the new smartString
 * object format: { mode: 'static', staticValue: <original_value> }
 *
 * Run with: SANITY_API_TOKEN="your-token" node scripts/migrate-to-smart-string.mjs
 *
 * Add --dry-run flag to preview changes without applying them:
 * SANITY_API_TOKEN="your-token" node scripts/migrate-to-smart-string.mjs --dry-run
 */

import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const token = process.env.SANITY_API_TOKEN

if (!projectId) {
  console.error('Error: SANITY_STUDIO_PROJECT_ID or NEXT_PUBLIC_SANITY_PROJECT_ID environment variable is required')
  process.exit(1)
}

if (!token) {
  console.error('Error: SANITY_API_TOKEN environment variable is required')
  process.exit(1)
}

const isDryRun = process.argv.includes('--dry-run')

const client = createClient({
  projectId,
  dataset: 'production',
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Block types that have text fields needing migration
const BLOCK_TYPES_WITH_TEXT = ['headingBlock', 'buttonBlock', 'eyebrowBlock']

/**
 * Recursively process an object/array to find and migrate text fields
 * in headingBlock, buttonBlock, and eyebrowBlock
 */
function migrateTextFields(obj, path = '') {
  if (!obj || typeof obj !== 'object') {
    return { modified: false, value: obj }
  }

  if (Array.isArray(obj)) {
    let arrayModified = false
    const newArray = obj.map((item, index) => {
      const result = migrateTextFields(item, `${path}[${index}]`)
      if (result.modified) arrayModified = true
      return result.value
    })
    return { modified: arrayModified, value: newArray }
  }

  // Check if this is a block that needs migration
  if (obj._type && BLOCK_TYPES_WITH_TEXT.includes(obj._type)) {
    // Check if 'text' field is a plain string (needs migration)
    if (typeof obj.text === 'string') {
      console.log(`  Found ${obj._type} at ${path} with plain string text: "${obj.text.slice(0, 50)}${obj.text.length > 50 ? '...' : ''}"`)
      return {
        modified: true,
        value: {
          ...obj,
          text: {
            _type: 'smartString',
            mode: 'static',
            staticValue: obj.text,
          },
        },
      }
    }
  }

  // Recursively process all properties
  let objectModified = false
  const newObj = {}

  for (const [key, value] of Object.entries(obj)) {
    const result = migrateTextFields(value, `${path}.${key}`)
    if (result.modified) objectModified = true
    newObj[key] = result.value
  }

  return { modified: objectModified, value: newObj }
}

async function migrateDocuments() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`SmartString Migration Script`)
  console.log(`Project: ${projectId}`)
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`)
  console.log(`${'='.repeat(60)}\n`)

  // Query all pages and posts that might contain these blocks
  const query = `*[_type in ["page", "post"] && defined(pageBuilder)] {
    _id,
    _type,
    name,
    title,
    pageBuilder
  }`

  console.log('Fetching documents...')
  const documents = await client.fetch(query)
  console.log(`Found ${documents.length} documents to check\n`)

  let totalModified = 0
  let totalBlocksConverted = 0
  const modifiedDocs = []

  for (const doc of documents) {
    const docName = doc.name || doc.title || doc._id
    console.log(`Checking: ${doc._type} - "${docName}"`)

    const result = migrateTextFields(doc.pageBuilder, 'pageBuilder')

    if (result.modified) {
      totalModified++
      modifiedDocs.push({
        _id: doc._id,
        _type: doc._type,
        name: docName,
        pageBuilder: result.value,
      })

      if (!isDryRun) {
        try {
          await client
            .patch(doc._id)
            .set({ pageBuilder: result.value })
            .commit()
          console.log(`  ✓ Updated successfully\n`)
        } catch (error) {
          console.error(`  ✗ Error updating: ${error.message}\n`)
        }
      } else {
        console.log(`  → Would update (dry run)\n`)
      }
    } else {
      console.log(`  - No changes needed\n`)
    }
  }

  console.log(`${'='.repeat(60)}`)
  console.log(`Migration Summary`)
  console.log(`${'='.repeat(60)}`)
  console.log(`Documents checked: ${documents.length}`)
  console.log(`Documents ${isDryRun ? 'that would be' : ''} modified: ${totalModified}`)

  if (isDryRun && totalModified > 0) {
    console.log(`\nRun without --dry-run flag to apply changes.`)
  }

  console.log('')
}

migrateDocuments().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
