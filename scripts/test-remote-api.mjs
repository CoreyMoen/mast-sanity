#!/usr/bin/env node
/**
 * Test script for the Remote Claude API
 *
 * Usage:
 *   node scripts/test-remote-api.mjs
 *
 * Required environment variables:
 *   CLAUDE_REMOTE_API_SECRET - The API secret for authentication
 *   REMOTE_API_URL - The URL of the remote API (default: http://localhost:4000/api/claude/remote)
 */

const API_URL = process.env.REMOTE_API_URL || 'http://localhost:4000/api/claude/remote'
const API_SECRET = process.env.CLAUDE_REMOTE_API_SECRET

if (!API_SECRET) {
  console.error('Error: CLAUDE_REMOTE_API_SECRET environment variable is required')
  console.error('')
  console.error('Usage:')
  console.error('  CLAUDE_REMOTE_API_SECRET="your-secret" node scripts/test-remote-api.mjs')
  process.exit(1)
}

console.log('🧪 Testing Remote Claude API')
console.log(`   URL: ${API_URL}`)
console.log('')

/**
 * Make a request to the remote API
 */
async function testRequest(name, body) {
  console.log(`\n📋 Test: ${name}`)
  console.log('─'.repeat(50))

  const startTime = Date.now()

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    const duration = Date.now() - startTime

    console.log(`   Status: ${response.status}`)
    console.log(`   Duration: ${duration}ms`)

    // Show rate limit headers
    const rateLimit = response.headers.get('X-RateLimit-Remaining')
    if (rateLimit) {
      console.log(`   Rate Limit Remaining: ${rateLimit}`)
    }

    if (data.success) {
      console.log(`   ✅ Success`)
      console.log(`   Response preview: ${data.response?.substring(0, 200)}...`)
      if (data.summary) {
        console.log(`   Actions: ${data.summary.totalActions} total, ${data.summary.successfulActions} successful`)
      }
      if (data.includedInstructions) {
        console.log(`   Instructions: ${data.includedInstructions.join(', ')}`)
      }
    } else {
      console.log(`   ❌ Failed: ${data.error}`)
    }

    return { success: true, data, status: response.status }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  // Test 1: Simple query (dry run)
  await testRequest('Simple Query (Dry Run)', {
    message: 'List all pages in the system',
    dryRun: true,
  })

  // Test 2: Writing-focused request
  await testRequest('Writing Request', {
    message: 'Write a short tagline for a tech startup homepage',
    includeInstructions: ['writing'],
    dryRun: true,
  })

  // Test 3: Design-focused request (dry run)
  await testRequest('Design Request (Dry Run)', {
    message: 'Create a simple hero section with a heading that says "Welcome" and a subheading',
    includeInstructions: ['design'],
    dryRun: true,
  })

  // Test 4: Invalid request (missing message)
  await testRequest('Invalid Request (should fail)', {
    workflow: 'test',
  })

  // Test 5: Request with conversation history
  await testRequest('With Conversation History', {
    message: 'Now make the heading larger',
    conversationHistory: [
      { role: 'user', content: 'Create a heading block with the text "Hello World"' },
      { role: 'assistant', content: 'I\'ll create a heading block for you with the text "Hello World".' },
    ],
    dryRun: true,
  })

  console.log('\n' + '═'.repeat(50))
  console.log('✅ All tests completed!')
  console.log('')
  console.log('To run a real request (not dry run), use:')
  console.log('')
  console.log(`curl -X POST ${API_URL} \\`)
  console.log(`  -H "Content-Type: application/json" \\`)
  console.log(`  -H "Authorization: Bearer $CLAUDE_REMOTE_API_SECRET" \\`)
  console.log(`  -d '{"message": "List all pages", "dryRun": false}'`)
}

runTests().catch(console.error)
