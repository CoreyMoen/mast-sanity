/**
 * Script to upload reference images to Sanity and update page data
 * Run with: npx tsx scripts/upload-images-and-seed.ts
 */

import {createClient} from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'

// Initialize Sanity client
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const IMAGES_DIR = path.join(__dirname, '../reference/mast-framework.webflow/images')

// Images needed for the layout pages
const IMAGES_TO_UPLOAD = [
  'post1.webp',
  'post2.webp',
  'post3.webp',
  'post4.webp',
  'post5.webp',
  'post6.webp',
  'post7.webp',
  'post8.webp',
  'post9.webp',
  'post10.webp',
  'post11.webp',
  'post12.webp',
  'post13.webp',
]

// Helper to generate unique keys
const generateKey = () => Math.random().toString(36).substring(2, 12)

// Helper to create a rich text block
const richText = (text: string, style = 'normal') => ({
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
const createRichTextBlock = (
  paragraphs: string[],
  size: string = 'inherit',
  align: string = 'left'
) => ({
  _type: 'richTextBlock',
  _key: generateKey(),
  content: paragraphs.map((p) => richText(p)),
  size,
  align,
})

// Helper to create a heading block
const createHeadingBlock = (
  text: string,
  level: string = 'h2',
  size: string = 'inherit',
  align: string = 'left'
) => ({
  _type: 'headingBlock',
  _key: generateKey(),
  text,
  level,
  size,
  align,
})

// Helper to create an eyebrow block
const createEyebrowBlock = (text: string, variant: string = 'text', color: string = 'default') => ({
  _type: 'eyebrowBlock',
  _key: generateKey(),
  text,
  variant,
  color,
})

// Helper to create an icon block
const createIconBlock = (
  icon: string,
  size: string = 'md',
  color: string = 'primary',
  marginBottom: string = 'sm'
) => ({
  _type: 'iconBlock',
  _key: generateKey(),
  icon,
  size,
  color,
  marginBottom,
})

// Helper to create a button block
const createButtonBlock = (
  text: string,
  variant: string = 'primary',
  colorScheme: string = 'black',
  icon?: string
) => ({
  _type: 'buttonBlock',
  _key: generateKey(),
  text,
  url: '#',
  variant,
  colorScheme,
  icon: icon || null,
})

// Helper to create a spacer block
const createSpacerBlock = (sizeDesktop: string = '12', sizeMobile: string = '8') => ({
  _type: 'spacerBlock',
  _key: generateKey(),
  sizeDesktop,
  sizeMobile,
})

// Helper to create a divider block
const createDividerBlock = (
  marginTop: string = '8',
  marginBottom: string = '8',
  color: string = 'default'
) => ({
  _type: 'dividerBlock',
  _key: generateKey(),
  marginTop,
  marginBottom,
  color,
})

// Helper to create an image block with asset reference
const createImageBlock = (
  assetRef: string,
  alt: string,
  aspectRatio: string = 'original',
  size: string = 'full',
  rounded: string = 'none'
) => ({
  _type: 'imageBlock',
  _key: generateKey(),
  image: {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: assetRef,
    },
  },
  alt,
  aspectRatio,
  size,
  rounded,
})

// Helper to create a column
const createColumn = (
  content: any[],
  widthDesktop: string = 'fill',
  widthTablet: string = 'inherit',
  widthMobile: string = '12',
  verticalAlign: string = 'start'
) => ({
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
const createRow = (
  columns: any[],
  horizontalAlign: string = 'start',
  verticalAlign: string = 'stretch',
  gap: string = '6'
) => ({
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
const createSection = (
  label: string,
  rows: any[],
  backgroundColor: string = 'none',
  paddingTop: string = '12',
  paddingBottom: string = '12'
) => ({
  _type: 'section',
  _key: generateKey(),
  label,
  rows,
  backgroundColor,
  maxWidth: 'container',
  paddingTop,
  paddingBottom,
  paddingX: '6',
})

// Upload an image and return the asset reference
async function uploadImage(filename: string): Promise<string> {
  const filePath = path.join(IMAGES_DIR, filename)
  const imageBuffer = fs.readFileSync(filePath)

  console.log(`   Uploading ${filename}...`)

  const asset = await client.assets.upload('image', imageBuffer, {
    filename,
    contentType: 'image/webp',
  })

  return asset._id
}

// Main function to upload images and create pages
async function main() {
  console.log('🖼️  Starting image upload and page seeding...\n')

  // Check environment variables
  if (!process.env.SANITY_STUDIO_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
    console.error('❌ Missing environment variables')
    console.log('\nPlease set:')
    console.log('  export SANITY_STUDIO_PROJECT_ID=your-project-id')
    console.log('  export SANITY_STUDIO_DATASET=production')
    console.log('  export SANITY_API_TOKEN=your-token')
    process.exit(1)
  }

  // Upload images
  console.log('📤 Uploading images to Sanity...')
  const imageAssets: Record<string, string> = {}

  for (const imageName of IMAGES_TO_UPLOAD) {
    try {
      const assetId = await uploadImage(imageName)
      const key = imageName.replace('.webp', '')
      imageAssets[key] = assetId
      console.log(`   ✓ ${imageName} -> ${assetId}`)
    } catch (error) {
      console.error(`   ✗ Failed to upload ${imageName}:`, error)
    }
  }

  console.log('\n📄 Creating Basic Layouts page...')

  // ============================================================================
  // BASIC LAYOUTS PAGE
  // ============================================================================
  const basicLayoutsPage = {
    _type: 'page',
    _id: 'basic-layouts',
    name: 'Basic Layouts',
    slug: {
      _type: 'slug',
      current: 'basic-layouts',
    },
    pageBuilder: [
      // Section 1: Hero Header
      createSection(
        'Hero Header',
        [
          createRow(
            [
              createColumn(
                [
                  createEyebrowBlock('Lorem ipsum'),
                  createHeadingBlock('A simple header', 'h1', 'inherit', 'center'),
                  createRichTextBlock(
                    [
                      'Lorem ipsum dolor sit amet consectetur adipiscing elit enim porttitor, ornare luctus dignissim posuere platea aliquam turpis taciti fusce, diam arcu mollis phasellus mattis ad suspendisse integer.',
                    ],
                    'inherit',
                    'center'
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
          createRow(
            [
              createColumn([createButtonBlock('Button', 'primary', 'black')], 'auto'),
              createColumn([createButtonBlock('Button', 'secondary', 'black')], 'auto'),
            ],
            'center',
            'center',
            '4'
          ),
        ],
        'white',
        '24',
        '24'
      ),

      // Section 2: Two-Column Layout with image
      createSection(
        'Two Column Image Right',
        [
          createRow(
            [
              createColumn(
                [
                  createEyebrowBlock('Lorem ipsum'),
                  createHeadingBlock('Another header', 'h2', 'h1'),
                  createRichTextBlock([
                    'Lorem ipsum dolor sit amet consectetur adipiscing elit enim porttitor, ornare luctus dignissim posuere platea aliquam turpis taciti fusce, diam arcu mollis phasellus mattis ad suspendisse integer.',
                  ]),
                ],
                '5',
                'inherit',
                '12',
                'center'
              ),
              createColumn(
                [createImageBlock(imageAssets['post4'], 'Featured image', '1/1', 'full', 'md')],
                '6',
                'inherit',
                '12'
              ),
            ],
            'between',
            'center'
          ),
          createRow(
            [
              createColumn([createButtonBlock('Button', 'primary', 'black')], 'auto'),
              createColumn([createButtonBlock('Button', 'secondary', 'black')], 'auto'),
            ],
            'start',
            'center',
            '4'
          ),
        ],
        'gray-50',
        '24',
        '24'
      ),

      // Section 3: Features Grid with icons
      createSection(
        'Features Grid',
        [
          createRow(
            [
              createColumn(
                [
                  createEyebrowBlock('Lorem ipsum'),
                  createHeadingBlock('This is a section title', 'h2', 'inherit', 'center'),
                  createRichTextBlock(
                    [
                      'Lorem ipsum dolor sit amet consectetur adipiscing elit enim porttitor, ornare luctus dignissim posuere platea aliquam turpis taciti fusce, diam arcu mollis phasellus mattis ad suspendisse integer.',
                    ],
                    'inherit',
                    'center'
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
          createRow([createColumn([createSpacerBlock('8', '6')], '12')], 'start', 'start'),
          createRow(
            [
              createColumn(
                [
                  createIconBlock('check-circle', 'md', 'primary', 'sm'),
                  createRichTextBlock(['Lorem ipsum dolor sit amet, consectetur adipiscing elit.']),
                ],
                '3',
                '6',
                '12'
              ),
              createColumn(
                [
                  createIconBlock('target', 'md', 'primary', 'sm'),
                  createRichTextBlock(['Lorem ipsum dolor sit amet, consectetur adipiscing elit.']),
                ],
                '3',
                '6',
                '12'
              ),
              createColumn(
                [
                  createIconBlock('star', 'md', 'primary', 'sm'),
                  createRichTextBlock(['Lorem ipsum dolor sit amet, consectetur adipiscing elit.']),
                ],
                '3',
                '6',
                '12'
              ),
              createColumn(
                [
                  createIconBlock('trophy', 'md', 'primary', 'sm'),
                  createRichTextBlock(['Lorem ipsum dolor sit amet, consectetur adipiscing elit.']),
                ],
                '3',
                '6',
                '12'
              ),
            ],
            'start',
            'start'
          ),
        ],
        'white'
      ),

      // Section 4: Text + Nested Grid with icons
      createSection(
        'Text with Feature Grid',
        [
          createRow(
            [
              createColumn(
                [
                  createHeadingBlock('This is a section title', 'h2'),
                  createRichTextBlock([
                    'Lorem ipsum dolor sit amet consectetur adipiscing elit enim porttitor, ornare luctus dignissim posuere platea aliquam turpis taciti fusce, diam arcu mollis phasellus mattis ad suspendisse integer.',
                  ]),
                ],
                '5',
                'inherit',
                '12'
              ),
              createColumn(
                [
                  createIconBlock('check-circle', 'md', 'primary', 'sm'),
                  createRichTextBlock(['Lorem ipsum dolor sit amet, consectetur adipiscing elit.']),
                ],
                '3',
                '6',
                '12'
              ),
              createColumn(
                [
                  createIconBlock('target', 'md', 'primary', 'sm'),
                  createRichTextBlock(['Lorem ipsum dolor sit amet, consectetur adipiscing elit.']),
                ],
                '3',
                '6',
                '12'
              ),
            ],
            'between',
            'start'
          ),
          createRow(
            [
              createColumn([], '5', 'inherit', '12'),
              createColumn(
                [
                  createIconBlock('star', 'md', 'primary', 'sm'),
                  createRichTextBlock(['Lorem ipsum dolor sit amet, consectetur adipiscing elit.']),
                ],
                '3',
                '6',
                '12'
              ),
              createColumn(
                [
                  createIconBlock('trophy', 'md', 'primary', 'sm'),
                  createRichTextBlock(['Lorem ipsum dolor sit amet, consectetur adipiscing elit.']),
                ],
                '3',
                '6',
                '12'
              ),
            ],
            'between',
            'start'
          ),
        ],
        'gray-50'
      ),

      // Section 5: Video + Text
      createSection(
        'Video with Text',
        [
          createRow(
            [
              createColumn(
                [
                  createRichTextBlock([
                    'YouTube video embed would appear here. The video player is embedded using the YouTube iframe API.',
                  ]),
                ],
                '6',
                'inherit',
                '12'
              ),
              createColumn(
                [
                  createHeadingBlock('This is a section title', 'h2'),
                  createRichTextBlock([
                    'Lorem ipsum dolor sit amet consectetur adipiscing elit, posuere bibendum per congue conubia justo laoreet, habitasse auctor vel pellentesque sapien aptent.',
                  ]),
                ],
                '5',
                'inherit',
                '12'
              ),
            ],
            'between',
            'center'
          ),
        ],
        'white'
      ),

      // Section 6: Full Width Image with Text
      createSection(
        'Full Width Image Section',
        [
          createRow(
            [
              createColumn(
                [
                  createHeadingBlock('This is a section title', 'h2'),
                  createRichTextBlock([
                    'Lorem ipsum dolor sit amet consectetur adipiscing elit enim porttitor, ornare luctus dignissim posuere platea aliquam turpis taciti fusce.',
                  ]),
                  createRichTextBlock([
                    'Lorem ipsum dolor sit amet consectetur adipiscing elit enim porttitor, ornare luctus dignissim posuere platea aliquam turpis taciti fusce.',
                  ]),
                ],
                '5',
                'inherit',
                '12',
                'center'
              ),
              createColumn(
                [createImageBlock(imageAssets['post6'], 'Full width image', '1/1', 'full', 'md')],
                '6',
                'inherit',
                '12'
              ),
            ],
            'between',
            'stretch'
          ),
        ],
        'gray-50',
        '0',
        '0'
      ),

      // Section 7: Cards Row
      createSection(
        'Cards Section',
        [
          createRow(
            [
              createColumn([createHeadingBlock('This is a section title', 'h2')], '4', 'inherit', '12'),
              createColumn(
                [
                  createRichTextBlock([
                    'Lorem ipsum dolor sit amet consectetur adipiscing elit, posuere bibendum per congue conubia justo laoreet, habitasse auctor vel pellentesque sapien aptent.',
                  ]),
                  createButtonBlock('Button', 'primary', 'black', 'arrow-up-right'),
                ],
                '6',
                'inherit',
                '12'
              ),
            ],
            'between',
            'end',
            '4'
          ),
          createRow([createColumn([createSpacerBlock('8', '6')], '12')]),
          createRow(
            [
              createColumn(
                [
                  {
                    _type: 'cardBlock',
                    _key: generateKey(),
                    variant: 'filled',
                    paddingDesktop: '6',
                    paddingMobile: '4',
                    content: [
                      createIconBlock('check-circle', 'md', 'primary', 'sm'),
                      createHeadingBlock('This is another title', 'h3'),
                      createRichTextBlock([
                        'Lorem ipsum dolor sit amet consectetur adipiscing elit, posuere bibendum per congue conubia justo laoreet, habitasse auctor vel pellentesque sapien aptent.',
                      ]),
                    ],
                  },
                ],
                '6',
                'inherit',
                '12'
              ),
              createColumn(
                [
                  {
                    _type: 'cardBlock',
                    _key: generateKey(),
                    variant: 'filled',
                    paddingDesktop: '6',
                    paddingMobile: '4',
                    content: [
                      createIconBlock('target', 'md', 'primary', 'sm'),
                      createHeadingBlock('This is another title', 'h3'),
                      createRichTextBlock([
                        'Lorem ipsum dolor sit amet consectetur adipiscing elit, posuere bibendum per congue conubia justo laoreet, habitasse auctor vel pellentesque sapien aptent.',
                      ]),
                    ],
                  },
                ],
                '6',
                'inherit',
                '12'
              ),
            ],
            'start',
            'stretch'
          ),
        ],
        'white'
      ),

      // Section 8: FAQ Accordion
      createSection(
        'FAQ Section',
        [
          createRow(
            [
              createColumn([createHeadingBlock('Have a question?', 'h2')], '4', 'inherit', '12'),
              createColumn(
                [
                  {
                    _type: 'richTextBlock',
                    _key: generateKey(),
                    content: [
                      richText('Lorem ipsum?', 'h4'),
                      richText(
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
                      ),
                    ],
                  },
                  createDividerBlock('4', '4'),
                  {
                    _type: 'richTextBlock',
                    _key: generateKey(),
                    content: [
                      richText('Lorem ipsum?', 'h4'),
                      richText(
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
                      ),
                    ],
                  },
                  createDividerBlock('4', '4'),
                  {
                    _type: 'richTextBlock',
                    _key: generateKey(),
                    content: [
                      richText('Lorem ipsum?', 'h4'),
                      richText(
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
                      ),
                    ],
                  },
                ],
                '7',
                'inherit',
                '12'
              ),
            ],
            'between',
            'start'
          ),
        ],
        'gray-50'
      ),
    ],
  }

  await client.createOrReplace(basicLayoutsPage)
  console.log('   ✓ Basic Layouts page created')

  // ============================================================================
  // INSPIRED LAYOUTS PAGE
  // ============================================================================
  console.log('\n📄 Creating Inspired Layouts page...')

  const inspiredLayoutsPage = {
    _type: 'page',
    _id: 'inspired-layouts',
    name: 'Inspired Layouts',
    slug: {
      _type: 'slug',
      current: 'inspired-layouts',
    },
    pageBuilder: [
      // Section 1: Hero with Slider
      createSection(
        'Hero - The Steady Center',
        [
          createRow(
            [
              createColumn(
                [
                  createEyebrowBlock('The Steady Center'),
                  createHeadingBlock(
                    'In turbulent waters, what matters most is what holds you steady',
                    'h1'
                  ),
                ],
                '9',
                'inherit',
                '12'
              ),
            ],
            'start',
            'start'
          ),
          createRow([createColumn([createSpacerBlock('16', '12')], '12')]),
          createRow(
            [
              createColumn(
                [
                  createRichTextBlock(
                    [
                      "Every ship needs its mast—not because it's complex or clever, but because it's essential. It stands quietly at the center, bearing weight, catching wind, enabling movement. While others chase the latest innovations, you understand that true progress comes from getting the fundamentals right.",
                    ],
                    'paragraph-lg'
                  ),
                ],
                '6',
                'inherit',
                '12'
              ),
              createColumn(
                [createButtonBlock('Begin with Purpose', 'primary', 'black', 'arrow-down')],
                'auto'
              ),
            ],
            'between',
            'end'
          ),
          createRow([createColumn([createSpacerBlock('12', '8')], '12')]),
          createRow(
            [
              createColumn(
                [
                  {
                    _type: 'sliderBlock',
                    _key: generateKey(),
                    slides: [
                      {
                        _type: 'sliderSlide',
                        _key: generateKey(),
                        content: [
                          createImageBlock(imageAssets['post5'], 'Slide 1', '16/9', 'full', 'none'),
                        ],
                      },
                      {
                        _type: 'sliderSlide',
                        _key: generateKey(),
                        content: [
                          createImageBlock(imageAssets['post3'], 'Slide 2', '16/9', 'full', 'none'),
                        ],
                      },
                      {
                        _type: 'sliderSlide',
                        _key: generateKey(),
                        content: [
                          createImageBlock(imageAssets['post2'], 'Slide 3', '16/9', 'full', 'none'),
                        ],
                      },
                      {
                        _type: 'sliderSlide',
                        _key: generateKey(),
                        content: [
                          createImageBlock(imageAssets['post1'], 'Slide 4', '16/9', 'full', 'none'),
                        ],
                      },
                      {
                        _type: 'sliderSlide',
                        _key: generateKey(),
                        content: [
                          createImageBlock(imageAssets['post6'], 'Slide 5', '16/9', 'full', 'none'),
                        ],
                      },
                    ],
                    slidesPerViewDesktop: 1,
                    slidesPerViewTablet: 1,
                    slidesPerViewMobile: 1,
                    gap: '4',
                    autoplay: true,
                    autoplayDelay: 4000,
                    loop: true,
                    showNavigation: true,
                    showPagination: true,
                  },
                ],
                '12'
              ),
            ],
            'center',
            'center'
          ),
        ],
        'white',
        '24',
        '0'
      ),

      // Section 2: Problem Statement with icons
      createSection(
        'Problem - The Weight of Expectations',
        [
          createRow(
            [
              createColumn(
                [
                  createEyebrowBlock('The Weight of Expectations'),
                  createHeadingBlock('The burden of building without compass', 'h2', 'inherit', 'center'),
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
          createRow([createColumn([createDividerBlock('12', '12')], '12')]),
          createRow(
            [
              createColumn(
                [
                  createRichTextBlock(
                    [
                      "There's a particular exhaustion that comes from swimming against endless currents of complexity. You know the feeling—when every project feels like starting from scratch, when simple intentions become tangled in unnecessary complications, when you find yourself building the same foundations over and over.",
                      "It's not about the tools themselves. It's about the mental load, the creative energy spent on mechanics instead of meaning.",
                    ],
                    'paragraph-lg'
                  ),
                ],
                '5',
                'inherit',
                '12'
              ),
              createColumn(
                [
                  createIconBlock('shuffle-simple', 'md', 'primary', 'sm'),
                  createRichTextBlock([
                    'The fatigue of constantly context-switching between inconsistent approaches.',
                  ]),
                ],
                '3',
                '6',
                '12'
              ),
              createColumn(
                [
                  createIconBlock('lightbulb-filament', 'md', 'primary', 'sm'),
                  createRichTextBlock([
                    'The frustration of beautiful ideas compromised by clunky execution.',
                  ]),
                ],
                '3',
                '6',
                '12'
              ),
            ],
            'between',
            'start'
          ),
          createRow(
            [
              createColumn([], '5', 'inherit', '12'),
              createColumn(
                [
                  createIconBlock('barbell', 'md', 'primary', 'sm'),
                  createRichTextBlock([
                    'The weight of maintaining complexity that adds nothing to the final experience.',
                  ]),
                ],
                '3',
                '6',
                '12'
              ),
              createColumn(
                [
                  createIconBlock('feather', 'md', 'primary', 'sm'),
                  createRichTextBlock(['The nagging sense that there should be a more graceful way.']),
                ],
                '3',
                '6',
                '12'
              ),
            ],
            'between',
            'start'
          ),
        ],
        'white'
      ),

      // Section 3: Full Screen Moment of Clarity
      createSection(
        'The Moment of Clarity',
        [
          createRow(
            [
              createColumn(
                [createHeadingBlock('The Moment of Clarity', 'h2', 'h1', 'center')],
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
        'gray-800',
        '24',
        '24'
      ),

      // Section 4: Solution Intro with image
      createSection(
        'When noise fades, essence emerges',
        [
          createRow(
            [
              createColumn(
                [createImageBlock(imageAssets['post4'], 'Featured image', '3/4', 'full', 'md')],
                '6',
                'inherit',
                '12'
              ),
              createColumn(
                [
                  createHeadingBlock('When noise fades, essence emerges', 'h2'),
                  createRichTextBlock(
                    [
                      'But in those rare moments of clarity—perhaps late at night when the world is quiet, or in the pause before coffee kicks in—you glimpse something different. A way of working that feels like breathing. Where the structure serves the vision instead of constraining it.',
                      "This isn't about revolutionary technology or groundbreaking innovation. It's about understanding what matters and letting everything else fall away. It's about finding your rhythm and building tools that move with it rather than against it.",
                    ],
                    'paragraph-lg'
                  ),
                ],
                '5',
                'inherit',
                '12',
                'end'
              ),
            ],
            'between',
            'stretch'
          ),
        ],
        'gray-50'
      ),

      // Section 5: Tabs Section with images
      createSection(
        'The Art of Subtraction',
        [
          createRow(
            [
              createColumn(
                [
                  createEyebrowBlock('The Art of Subtraction'),
                  createHeadingBlock(
                    "What you don't build is as important as what you do",
                    'h2',
                    'inherit',
                    'center'
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
          createRow([createColumn([createSpacerBlock('12', '8')], '12')]),
          createRow(
            [
              createColumn(
                [
                  {
                    _type: 'tabsBlock',
                    _key: generateKey(),
                    tabs: [
                      {
                        _type: 'tab',
                        _key: generateKey(),
                        label: 'Distillation',
                        content: [
                          createRow(
                            [
                              createColumn(
                                [createHeadingBlock('Distillation Over Addition', 'h3')],
                                '3',
                                '12',
                                '12'
                              ),
                              createColumn(
                                [
                                  createImageBlock(
                                    imageAssets['post9'],
                                    'Distillation image',
                                    '1/1',
                                    'full',
                                    'md'
                                  ),
                                ],
                                '4',
                                '12',
                                '12'
                              ),
                              createColumn(
                                [
                                  createRichTextBlock([
                                    "True craft lies not in accumulating features but in distilling to essence. Every line of code, every class, every component earns its place not through cleverness but through necessity. Like a master craftsman who knows which tool to reach for without thinking, you develop an intuition for what belongs and what doesn't.",
                                  ]),
                                ],
                                '3',
                                '12',
                                '12'
                              ),
                            ],
                            'between',
                            'start'
                          ),
                        ],
                      },
                      {
                        _type: 'tab',
                        _key: generateKey(),
                        label: 'Rhythm',
                        content: [
                          createRow(
                            [
                              createColumn(
                                [createHeadingBlock('Rhythm Over Rules', 'h3')],
                                '3',
                                '12',
                                '12'
                              ),
                              createColumn(
                                [
                                  createImageBlock(
                                    imageAssets['post8'],
                                    'Rhythm image',
                                    '1/1',
                                    'full',
                                    'md'
                                  ),
                                ],
                                '4',
                                '12',
                                '12'
                              ),
                              createColumn(
                                [
                                  createRichTextBlock([
                                    "The best systems don't dictate—they dance. They establish a rhythm that your hands remember, patterns that feel inevitable once learned. Your workflow becomes fluid, your thinking becomes clear, your energy flows toward the work that matters.",
                                  ]),
                                ],
                                '3',
                                '12',
                                '12'
                              ),
                            ],
                            'between',
                            'start'
                          ),
                        ],
                      },
                      {
                        _type: 'tab',
                        _key: generateKey(),
                        label: 'Foundation',
                        content: [
                          createRow(
                            [
                              createColumn(
                                [createHeadingBlock('Foundation Over Fashion', 'h3')],
                                '3',
                                '12',
                                '12'
                              ),
                              createColumn(
                                [
                                  createImageBlock(
                                    imageAssets['post10'],
                                    'Foundation image',
                                    '1/1',
                                    'full',
                                    'md'
                                  ),
                                ],
                                '4',
                                '12',
                                '12'
                              ),
                              createColumn(
                                [
                                  createRichTextBlock([
                                    'While others chase trends, you build bedrock. You understand that true innovation comes from having a solid base to launch from, not from reinventing the ground beneath your feet with every project.',
                                  ]),
                                ],
                                '3',
                                '12',
                                '12'
                              ),
                            ],
                            'between',
                            'start'
                          ),
                        ],
                      },
                    ],
                    orientation: 'horizontal',
                    autoplay: true,
                    autoplayDuration: 8000,
                  },
                ],
                '12'
              ),
            ],
            'center',
            'center'
          ),
        ],
        'white'
      ),

      // Section 6: Community - The Quiet Confidence
      createSection(
        'The Quiet Confidence',
        [
          createRow(
            [
              createColumn(
                [
                  createEyebrowBlock('The Quiet Confidence'),
                  createHeadingBlock('Those who build with purpose recognize each other', 'h2'),
                ],
                '9',
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
              createColumn([], '6', 'inherit', '12'),
              createColumn(
                [
                  createHeadingBlock('Community of Practice', 'h4'),
                  createRichTextBlock(
                    [
                      "There's a particular satisfaction that comes from working with tools that understand you. It's the difference between fighting your way through a project and flowing through it. Others notice—the clarity in your work, the speed of your delivery, the calm confidence in your process.",
                    ],
                    'paragraph-lg'
                  ),
                ],
                '6',
                'inherit',
                '12'
              ),
            ],
            'end',
            'start'
          ),
          createRow([createColumn([createSpacerBlock('12', '8')], '12')]),
          createRow(
            [
              createColumn(
                [
                  {
                    _type: 'cardBlock',
                    _key: generateKey(),
                    variant: 'filled',
                    paddingDesktop: '12',
                    paddingMobile: '8',
                    content: [
                      createRichTextBlock(
                        [
                          'The recognition comes not from the complexity you manage, but from the complexity you avoid.',
                        ],
                        'inherit',
                        'center'
                      ),
                    ],
                  },
                ],
                '12'
              ),
            ],
            'center',
            'center'
          ),
        ],
        'gray-50'
      ),

      // Section 7: Expanding Horizon with images
      createSection(
        'The Expanding Horizon',
        [
          createRow(
            [
              createColumn(
                [createImageBlock(imageAssets['post12'], 'Large featured image', '3/4', 'full', 'md')],
                '5',
                'inherit',
                '12'
              ),
              createColumn(
                [
                  createEyebrowBlock('The Expanding Horizon'),
                  createHeadingBlock('When the foundation is right, anything becomes possible', 'h2'),
                  createRichTextBlock(
                    [
                      "With the mechanics handled, your mind is free to wander into more interesting territory. You're not debugging basic layouts or wrestling with inconsistent patterns. You're exploring ideas, refining experiences, solving problems that matter.",
                    ],
                    'paragraph-lg'
                  ),
                ],
                '4',
                '8',
                '12',
                'end'
              ),
              createColumn(
                [createImageBlock(imageAssets['post5'], 'Small image', '1/1', 'full', 'md')],
                '2',
                'inherit',
                '6'
              ),
            ],
            'between',
            'stretch'
          ),
        ],
        'white'
      ),

      // Section 8: Full Screen Callout
      createSection(
        'Scale Without Strain',
        [
          createRow(
            [
              createColumn(
                [createHeadingBlock('Scale Without Strain', 'h2', 'h1', 'center')],
                '8',
                'inherit',
                '12',
                'center'
              ),
            ],
            'center',
            'center'
          ),
          createRow([createColumn([createSpacerBlock('8', '6')], '12')]),
          createRow(
            [
              createColumn([], '6', 'inherit', '12'),
              createColumn(
                [
                  createRichTextBlock(
                    [
                      "Whether you're crafting something intimate and personal or building at enterprise scale, the principles remain constant. Good structure scales. Clean foundations support growth. What works for one project works for a hundred.",
                    ],
                    'paragraph-lg',
                    'right'
                  ),
                ],
                '6',
                'inherit',
                '12'
              ),
            ],
            'end',
            'center'
          ),
        ],
        'gray-800',
        '24',
        '24'
      ),

      // Section 9: The Practice with center image
      createSection(
        'The Practice',
        [
          createRow(
            [
              createColumn(
                [
                  createEyebrowBlock('The Practice'),
                  createHeadingBlock(
                    'Mastery lives in the daily discipline of choosing better',
                    'h2',
                    'inherit',
                    'center'
                  ),
                  createRichTextBlock(
                    [
                      "Every choice to simplify, every decision to embrace constraint, every moment of saying \"no\" to unnecessary complexity—these are the small acts that compound into mastery.",
                    ],
                    'paragraph-lg',
                    'center'
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
          createRow([createColumn([createSpacerBlock('12', '8')], '12')]),
          createRow(
            [
              createColumn(
                [
                  createHeadingBlock('The Daily Choice', 'h4'),
                  createRichTextBlock([
                    "Each project presents the same fundamental choice: add or subtract? Complicate or clarify? You've learned that the most powerful designs often come from what you remove, not what you add.",
                  ]),
                ],
                '3',
                '12',
                '12'
              ),
              createColumn(
                [createImageBlock(imageAssets['post13'], 'Center image', '1/1', 'full', 'md')],
                '6',
                '10',
                '12'
              ),
              createColumn(
                [
                  createHeadingBlock('The Compound Effect', 'h4'),
                  createRichTextBlock([
                    'Small improvements accumulate. Each project builds on the last. Your instincts sharpen. What once required conscious effort becomes second nature. This is the quiet power of working with intention.',
                  ]),
                ],
                '3',
                '12',
                '12'
              ),
            ],
            'center',
            'center'
          ),
        ],
        'gray-50'
      ),
    ],
  }

  await client.createOrReplace(inspiredLayoutsPage)
  console.log('   ✓ Inspired Layouts page created')

  console.log('\n✅ All images uploaded and pages seeded successfully!')
  console.log('\nView your pages at:')
  console.log('   /basic-layouts')
  console.log('   /inspired-layouts')
}

main().catch(console.error)
