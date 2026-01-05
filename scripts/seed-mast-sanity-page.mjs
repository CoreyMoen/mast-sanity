/**
 * Seed script for "Mast in Sanity" page
 * Run with: node scripts/seed-mast-sanity-page.mjs
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
const createButtonBlock = (text, variant = 'primary', colorScheme = 'black', icon = null) => ({
  _type: 'buttonBlock',
  _key: generateKey(),
  text,
  url: '#',
  variant,
  colorScheme,
  icon,
})

// Helper to create a spacer block
const createSpacerBlock = (sizeDesktop = '12', sizeMobile = '8') => ({
  _type: 'spacerBlock',
  _key: generateKey(),
  sizeDesktop,
  sizeMobile,
})

// Helper to create an icon block
const createIconBlock = (icon, size = 'lg', color = 'brand', align = 'left', marginBottom = 'md') => ({
  _type: 'iconBlock',
  _key: generateKey(),
  icon,
  size,
  color,
  align,
  marginBottom,
})

// Helper to create a card block
const createCardBlock = (content, variant = 'outline', padding = 'md') => ({
  _type: 'cardBlock',
  _key: generateKey(),
  content,
  variant,
  padding,
  hoverEffect: true,
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
// paddingTop values: 'none' | 'compact' | 'default' | 'spacious'
// backgroundColor values: 'primary' | 'secondary' (omit for no background)
const createSection = (label, rows, backgroundColor = null, paddingTop = 'default', maxWidth = 'container') => {
  const section = {
    _type: 'section',
    _key: generateKey(),
    label,
    rows,
    maxWidth,
    paddingTop,
  }
  // Only add backgroundColor if specified (null/undefined means no background)
  if (backgroundColor && backgroundColor !== 'none') {
    section.backgroundColor = backgroundColor
  }
  return section
}

// ============================================================================
// MAST IN SANITY PAGE
// ============================================================================

const mastInSanityPage = {
  _type: 'page',
  _id: 'mast-in-sanity',
  name: 'Mast in Sanity',
  slug: {
    _type: 'slug',
    current: 'mast-in-sanity',
  },
  pageBuilder: [
    // SECTION 1: Hero
    createSection(
      'Hero - Design System Meets Content Platform',
      [
        createRow(
          [
            createColumn(
              [
                createEyebrowBlock('Mast + Sanity', 'overline', 'brand'),
                createSpacerBlock('4', '2'),
                createHeadingBlock('Where thoughtful design meets intelligent content', 'h1', 'inherit', 'left'),
                createSpacerBlock('6', '4'),
                createRichTextBlock(
                  ['Mast brings clarity to visual design. Sanity brings structure to content. Together, they create something rare: a system where every piece serves a purpose, every component tells a story, and every edit feels effortless.'],
                  'lg'
                ),
                createSpacerBlock('8', '6'),
                createRow(
                  [
                    createColumn([createButtonBlock('Explore the System', 'primary', 'brand', 'arrow-right')], 'auto'),
                    createColumn([createButtonBlock('View Components', 'secondary', 'black')], 'auto'),
                  ],
                  'start',
                  'center',
                  '4'
                ),
              ],
              '7',
              'inherit',
              '12',
              'center'
            ),
            createColumn(
              [
                {
                  _type: 'imageBlock',
                  _key: generateKey(),
                  alt: 'Mast design system preview',
                  aspectRatio: '4x3',
                  size: 'full',
                  rounded: 'md',
                  shadow: true,
                },
              ],
              '5',
              'inherit',
              '12',
              'center'
            ),
          ],
          'between',
          'center',
          '12'
        ),
      ],
      null,
      'spacious'
    ),

    // SECTION 2: The Challenge
    createSection(
      'The Challenge',
      [
        createRow(
          [
            createColumn(
              [
                createEyebrowBlock('The Challenge', 'text', 'muted', 'center'),
                createSpacerBlock('4', '2'),
                createHeadingBlock(
                  'Design systems promise consistency. Content platforms promise flexibility. Why do we so often have to choose?',
                  'h2',
                  'h3',
                  'center'
                ),
              ],
              '10',
              'inherit',
              '12',
              'center'
            ),
          ],
          'center',
          'center'
        ),
        createRow([createColumn([createSpacerBlock('12', '8')], '12')]),
        createRow(
          [
            createColumn(
              [
                createIconBlock('shuffle-simple', 'xl', 'brand', 'left', 'md'),
                createHeadingBlock('Scattered Components', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(['Teams rebuild the same patterns across projects, losing consistency and wasting creative energy on solved problems.'], 'base', 'left', 'gray'),
              ],
              '4',
              '6',
              '12'
            ),
            createColumn(
              [
                createIconBlock('lock', 'xl', 'brand', 'left', 'md'),
                createHeadingBlock('Rigid Templates', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(['Traditional CMS templates lock content into fixed layouts, forcing editors to work around the system instead of with it.'], 'base', 'left', 'gray'),
              ],
              '4',
              '6',
              '12'
            ),
            createColumn(
              [
                createIconBlock('code', 'xl', 'brand', 'left', 'md'),
                createHeadingBlock('Developer Dependency', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(['Every layout change requires developer intervention, creating bottlenecks and slowing the entire content creation process.'], 'base', 'left', 'gray'),
              ],
              '4',
              '6',
              '12'
            ),
          ],
          'between',
          'start',
          '6'
        ),
      ],
      'secondary',
      'default'
    ),

    // SECTION 3: The Solution
    createSection(
      'The Solution',
      [
        createRow(
          [
            createColumn(
              [
                createEyebrowBlock('The Solution', 'overline', 'brand', 'center'),
                createSpacerBlock('6', '4'),
                createHeadingBlock('Content as building blocks. Design as guardrails. Freedom within structure.', 'h2', 'h1', 'center', 'white'),
                createSpacerBlock('8', '6'),
                createRichTextBlock(
                  ['Mast in Sanity transforms how teams create. Every component is both a design decision and a content opportunity. Editors compose pages visually while designers maintain control over the system.'],
                  'lg',
                  'center',
                  'gray'
                ),
              ],
              '9',
              'inherit',
              '12',
              'center'
            ),
          ],
          'center',
          'center'
        ),
      ],
      'primary',
      'spacious'
    ),

    // SECTION 4: Features Grid
    createSection(
      'Key Capabilities',
      [
        createRow(
          [
            createColumn(
              [
                createEyebrowBlock('Capabilities'),
                createHeadingBlock("Everything you need, nothing you don't", 'h2'),
                createSpacerBlock('4', '2'),
                createRichTextBlock(
                  ['A complete system of components designed to work together seamlessly, giving content teams the power to create while maintaining design integrity.'],
                  'base',
                  'left',
                  'gray'
                ),
              ],
              '5',
              'inherit',
              '12'
            ),
          ],
          'start',
          'start'
        ),
        createRow([createColumn([createSpacerBlock('12', '8')], '12')]),
        createRow(
          [
            createColumn(
              [
                createIconBlock('rocket', 'lg', 'brand', 'left', 'sm'),
                createHeadingBlock('Visual Page Builder', 'h4'),
                createRichTextBlock(['Compose pages from pre-built sections and blocks. See changes in real-time with Presentation mode.'], 'sm', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
            createColumn(
              [
                createIconBlock('palette', 'lg', 'brand', 'left', 'sm'),
                createHeadingBlock('Consistent Design Tokens', 'h4'),
                createRichTextBlock(['Colors, typography, and spacing flow from a single source of truth. Change once, update everywhere.'], 'sm', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
            createColumn(
              [
                createIconBlock('lightning', 'lg', 'brand', 'left', 'sm'),
                createHeadingBlock('Responsive by Default', 'h4'),
                createRichTextBlock(['Every component adapts gracefully. 12-column grid with mobile, tablet, and desktop breakpoints built in.'], 'sm', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
            createColumn(
              [
                createIconBlock('eye', 'lg', 'brand', 'left', 'sm'),
                createHeadingBlock('Live Preview', 'h4'),
                createRichTextBlock(['Edit content and see it render instantly. Click any element to jump directly to its editing interface.'], 'sm', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
          ],
          'between',
          'start',
          '8'
        ),
        createRow([createColumn([createSpacerBlock('8', '6')], '12')]),
        createRow(
          [
            createColumn(
              [
                createIconBlock('users', 'lg', 'brand', 'left', 'sm'),
                createHeadingBlock('Team Collaboration', 'h4'),
                createRichTextBlock(["Real-time editing with presence indicators. Never overwrite a colleague's work again."], 'sm', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
            createColumn(
              [
                createIconBlock('shield-check', 'lg', 'brand', 'left', 'sm'),
                createHeadingBlock('Content Validation', 'h4'),
                createRichTextBlock(['Built-in rules ensure content meets requirements before publishing. No broken layouts, ever.'], 'sm', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
            createColumn(
              [
                createIconBlock('clock', 'lg', 'brand', 'left', 'sm'),
                createHeadingBlock('Version History', 'h4'),
                createRichTextBlock(['Every change is tracked. Roll back to any previous version with a single click.'], 'sm', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
            createColumn(
              [
                createIconBlock('globe', 'lg', 'brand', 'left', 'sm'),
                createHeadingBlock('CDN Delivery', 'h4'),
                createRichTextBlock(["Content served globally through Sanity's edge network. Fast for editors, faster for visitors."], 'sm', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
          ],
          'between',
          'start',
          '8'
        ),
      ],
      null,
      'default'
    ),

    // SECTION 5: How It Works
    createSection(
      'How It Works',
      [
        createRow(
          [
            createColumn(
              [
                createEyebrowBlock('How It Works', 'text', 'muted', 'center'),
                createSpacerBlock('4', '2'),
                createHeadingBlock('From concept to published in minutes', 'h2', 'inherit', 'center'),
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
        createRow([createColumn([createSpacerBlock('16', '12')], '12')]),
        createRow(
          [
            createColumn(
              [
                createHeadingBlock('01', 'h3', 'h1', 'left', 'brand'),
                createHeadingBlock('Choose Your Structure', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(['Start with sections and rows. Define the grid layout for your content using the intuitive 12-column system.'], 'base', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
            createColumn(
              [
                createHeadingBlock('02', 'h3', 'h1', 'left', 'brand'),
                createHeadingBlock('Add Content Blocks', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(['Drop in headings, text, images, buttons, cards, and more. Each block is designed to work with every other.'], 'base', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
            createColumn(
              [
                createHeadingBlock('03', 'h3', 'h1', 'left', 'brand'),
                createHeadingBlock('Preview & Refine', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(['Switch to Presentation mode to see your page exactly as visitors will. Click any element to edit it in place.'], 'base', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
            createColumn(
              [
                createHeadingBlock('04', 'h3', 'h1', 'left', 'brand'),
                createHeadingBlock('Publish Instantly', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(["One click to publish. Your content is live globally in seconds, delivered through Sanity's content lake."], 'base', 'left', 'gray'),
              ],
              '3',
              '6',
              '12'
            ),
          ],
          'between',
          'start',
          '8'
        ),
      ],
      'secondary',
      'default'
    ),

    // SECTION 6: Component Showcase - Simpler 3-column layout instead of tabs
    createSection(
      'Component Showcase',
      [
        createRow(
          [
            createColumn(
              [
                createEyebrowBlock('Components'),
                createHeadingBlock('A system designed to compose', 'h2'),
                createSpacerBlock('4', '2'),
                createRichTextBlock(
                  ['Every component in Mast is built to work with every other. Mix, match, and create layouts that feel cohesive without feeling constrained.'],
                  'base',
                  'left',
                  'gray'
                ),
              ],
              '6',
              'inherit',
              '12'
            ),
          ],
          'start',
          'start'
        ),
        createRow([createColumn([createSpacerBlock('12', '8')], '12')]),
        createRow(
          [
            createColumn(
              [
                createIconBlock('compass', 'xl', 'brand', 'left', 'md'),
                createHeadingBlock('Flexible Grid System', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(
                  ['Sections contain rows. Rows contain columns. Columns contain blocks. The 12-column grid adapts to any screen size with independent controls for each breakpoint.'],
                  'base',
                  'left',
                  'gray'
                ),
              ],
              '4',
              '12',
              '12'
            ),
            createColumn(
              [
                createIconBlock('pencil', 'xl', 'brand', 'left', 'md'),
                createHeadingBlock('Purposeful Type Scale', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(
                  ['Six heading levels plus body text sizes give you the range to create visual hierarchy. Each size is carefully tuned for readability and rhythm.'],
                  'base',
                  'left',
                  'gray'
                ),
              ],
              '4',
              '12',
              '12'
            ),
            createColumn(
              [
                createIconBlock('sparkle', 'xl', 'brand', 'left', 'md'),
                createHeadingBlock('Engaging Interactions', 'h4'),
                createSpacerBlock('2', '2'),
                createRichTextBlock(
                  ['Sliders, tabs, accordions, and modals add interactivity without custom code. Each component is accessible and performant by default.'],
                  'base',
                  'left',
                  'gray'
                ),
              ],
              '4',
              '12',
              '12'
            ),
          ],
          'between',
          'start',
          '8'
        ),
      ],
      null,
      'default'
    ),

    // SECTION 7: CTA
    createSection(
      'Get Started',
      [
        createRow(
          [
            createColumn(
              [
                createHeadingBlock('Ready to build something beautiful?', 'h2', 'h2', 'center', 'white'),
                createSpacerBlock('6', '4'),
                createRichTextBlock(
                  ['Start creating with Mast in Sanity today. Your content deserves a system that works as hard as you do.'],
                  'lg',
                  'center',
                  'gray'
                ),
                createSpacerBlock('8', '6'),
                createRow(
                  [
                    createColumn([createButtonBlock('Start Building', 'primary', 'brand', 'arrow-right')], 'auto'),
                    createColumn([createButtonBlock('View Documentation', 'secondary', 'white')], 'auto'),
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
      'primary',
      'spacious'
    ),
  ],
}

// Seed function
async function seedMastSanityPage() {
  console.log('Seeding Mast in Sanity page...')

  try {
    // Delete existing page if it exists
    await client.delete('mast-in-sanity').catch(() => {
      console.log('No existing page to delete')
    })

    // Create the page
    const result = await client.createOrReplace(mastInSanityPage)
    console.log('Created page:', result._id)
    console.log('\nMast in Sanity page seeded successfully!')
    console.log('View it at: /mast-in-sanity')
  } catch (error) {
    console.error('Error seeding page:', error)
    process.exit(1)
  }
}

seedMastSanityPage()
