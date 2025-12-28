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

// Helper to create an image slide (for sliderBlock)
const createImageSlide = (assetRef: string, alt: string, caption?: string) => ({
  _type: 'imageSlide',
  _key: generateKey(),
  image: {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: assetRef,
    },
  },
  alt,
  caption,
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
  // INSPIRED LAYOUTS PAGE (Simplified to stay under Sanity's 20-level depth limit)
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
                [createHeadingBlock("Every ship needs its mast—not because it's complex or clever, but because it's essential.", 'h3', 'paragraph-lg')],
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
                      createImageSlide(imageAssets['post5'], 'Slide 1'),
                      createImageSlide(imageAssets['post3'], 'Slide 2'),
                      createImageSlide(imageAssets['post2'], 'Slide 3'),
                      createImageSlide(imageAssets['post1'], 'Slide 4'),
                      createImageSlide(imageAssets['post6'], 'Slide 5'),
                    ],
                    aspectRatio: '16/9',
                    slidesPerViewDesktop: 1,
                    slidesPerViewTablet: 1,
                    slidesPerViewMobile: 1,
                    gap: '0',
                    autoplay: true,
                    autoplayDelay: 4000,
                    loop: true,
                    showNavigation: true,
                    navigationPosition: 'overlay-center',
                    showPagination: true,
                    effect: 'fade',
                    speed: 1200,
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

      // Section 2: Image Gallery - showcasing the grid system
      createSection(
        'Image Gallery',
        [
          createRow(
            [
              createColumn(
                [
                  createEyebrowBlock('Gallery'),
                  createHeadingBlock('A showcase of possibilities', 'h2', 'inherit', 'center'),
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
          createRow([createColumn([createSpacerBlock('12', '8')], '12')]),
          createRow(
            [
              createColumn(
                [createImageBlock(imageAssets['post7'], 'Gallery image 1', '1/1', 'full', 'md')],
                '4',
                '6',
                '12'
              ),
              createColumn(
                [createImageBlock(imageAssets['post8'], 'Gallery image 2', '1/1', 'full', 'md')],
                '4',
                '6',
                '12'
              ),
              createColumn(
                [createImageBlock(imageAssets['post9'], 'Gallery image 3', '1/1', 'full', 'md')],
                '4',
                '12',
                '12'
              ),
            ],
            'between',
            'start'
          ),
          createRow([createColumn([createSpacerBlock('6', '4')], '12')]),
          createRow(
            [
              createColumn(
                [createImageBlock(imageAssets['post10'], 'Gallery image 4', '1/1', 'full', 'md')],
                '4',
                '6',
                '12'
              ),
              createColumn(
                [createImageBlock(imageAssets['post11'], 'Gallery image 5', '1/1', 'full', 'md')],
                '4',
                '6',
                '12'
              ),
              createColumn(
                [createImageBlock(imageAssets['post12'], 'Gallery image 6', '1/1', 'full', 'md')],
                '4',
                '12',
                '12'
              ),
            ],
            'between',
            'start'
          ),
        ],
        'white'
      ),

      // Section 3: Call to Action
      createSection(
        'Get Started',
        [
          createRow(
            [
              createColumn(
                [
                  createHeadingBlock('Ready to build something great?', 'h2', 'h1', 'center'),
                  createSpacerBlock('6', '4'),
                  createButtonBlock('Get Started', 'primary', 'black'),
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
        'gray-800',
        '24',
        '24'
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
