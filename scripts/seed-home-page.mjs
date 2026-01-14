/**
 * Seed script for Home page
 * Run with: SANITY_API_TOKEN="your-token" node scripts/seed-home-page.mjs
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

// Helper to generate unique keys
const generateKey = () => Math.random().toString(36).substring(2, 12)

// Helper to create a rich text block
const richText = (text, style = 'normal') => ({
  _type: 'block',
  _key: generateKey(),
  style,
  children: [
    {
      _type: 'span',
      _key: generateKey(),
      text,
      marks: [],
    },
  ],
  markDefs: [],
})

// Helper to create rich text block content
const createRichTextBlock = (paragraphs, size = 'inherit', align = 'left', color = 'default') => ({
  _type: 'richTextBlock',
  _key: generateKey(),
  content: paragraphs.map((p) => richText(p)),
  size,
  align,
  color,
})

// Helper to create a heading block
const createHeadingBlock = (text, level = 'h2', size = 'inherit', align = 'left', color = 'default') => ({
  _type: 'headingBlock',
  _key: generateKey(),
  text,
  level,
  size,
  align,
  color,
})

// Helper to create an eyebrow block
const createEyebrowBlock = (text, variant = 'text', color = 'default', align = 'left') => ({
  _type: 'eyebrowBlock',
  _key: generateKey(),
  text,
  variant,
  color,
  align,
})

// Helper to create a button block
const createButtonBlock = (text, variant = 'primary', colorScheme = 'black', icon = null, href = '#') => ({
  _type: 'buttonBlock',
  _key: generateKey(),
  text,
  link: {
    _type: 'link',
    linkType: 'href',
    href,
  },
  variant,
  colorScheme,
  icon,
})

// Helper to create a column
const createColumn = (content, widthDesktop = 'fill', widthTablet = 'inherit', widthMobile = '12', verticalAlign = 'start') => ({
  _type: 'column',
  _key: generateKey(),
  content,
  widthDesktop,
  widthTablet,
  widthMobile,
  verticalAlign,
  padding: '0',
})

// Helper to create a row
const createRow = (columns, horizontalAlign = 'start', verticalAlign = 'stretch', gap = '6') => ({
  _type: 'row',
  _key: generateKey(),
  columns,
  horizontalAlign,
  verticalAlign,
  gap,
  wrap: true,
  reverseOnMobile: false,
})

// Helper to create a section
const createSection = (label, rows, backgroundColor = null, paddingTop = 'default', maxWidth = 'container') => {
  const section = {
    _type: 'section',
    _key: generateKey(),
    label,
    rows,
    maxWidth,
    paddingTop,
  }
  if (backgroundColor && backgroundColor !== 'none') {
    section.backgroundColor = backgroundColor
  }
  return section
}

// ============================================================================
// HOME PAGE
// ============================================================================

const homePage = {
  _type: 'page',
  _id: 'home-page',
  name: 'Home',
  slug: {
    _type: 'slug',
    current: 'home',
  },
  pageBuilder: [
    // HERO SECTION
    createSection(
      'Hero',
      [
        createRow(
          [
            createColumn(
              [
                createEyebrowBlock('Welcome', 'text', 'brand', 'center'),
                createHeadingBlock('Build something amazing', 'h1', 'inherit', 'center'),
                createRichTextBlock(
                  ['This is your home page. Use the Sanity Studio page builder to customize this content with sections, rows, columns, and blocks.'],
                  'lg',
                  'center',
                  'gray'
                ),
                createRow(
                  [
                    createColumn([createButtonBlock('Get Started', 'primary', 'brand', 'arrow-right')], 'auto'),
                    createColumn([createButtonBlock('Learn More', 'secondary', 'black')], 'auto'),
                  ],
                  'center',
                  'center',
                  '4'
                ),
              ],
              '8',
              'inherit',
              '12',
              'center'
            ),
          ],
          'center',
          'center'
        ),
      ],
      null,
      'spacious'
    ),
  ],
}

// Seed function
async function seedHomePage() {
  console.log('Seeding Home page...')

  try {
    // Delete existing page if it exists
    await client.delete('home-page').catch(() => {
      console.log('No existing home page to delete')
    })

    // Create the page
    const result = await client.createOrReplace(homePage)
    console.log('Created page:', result._id)
    console.log('\nHome page seeded successfully!')
    console.log('View it at: http://localhost:4000/')
  } catch (error) {
    console.error('Error seeding page:', error)
    process.exit(1)
  }
}

seedHomePage()
