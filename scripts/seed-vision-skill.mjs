/**
 * Seed script for "Build from Design Image" Claude Skill
 *
 * Creates a claudeWorkflow (Skill) document that teaches Claude to interpret
 * visual design images (JPG/PNG exports from Figma or other design tools)
 * and translate them into Sanity page builder structures.
 *
 * IMPORTANT: This skill is designed to work alongside the Claude Training
 * document (claudeInstructions). The Training document provides:
 * - Design System Rules (component options, spacing scale, grid system)
 * - Component Guidelines (per-component do's and don'ts)
 * - Technical Constraints (nesting limits, _key/_type rules, required fields)
 * - Writing Guidelines (heading hierarchy, content tone)
 *
 * This skill adds ONLY what's unique to the vision-based workflow:
 * - How to read annotated design images
 * - Visual cue → block type mapping
 * - Layout analysis methodology
 * - Visual appearance → field value translation
 * - Common layout patterns
 * - JSON format details (smartString, Portable Text, link objects)
 *
 * The starter prompt includes keywords that trigger all three Training
 * instruction groups (design, technical, writing) so they are automatically
 * injected into the Claude API call.
 *
 * Usage:
 *   SANITY_API_TOKEN="your-token" node scripts/seed-vision-skill.mjs
 */

import {createClient} from '@sanity/client'

const projectId = '6lj3hi0f'
const dataset = 'production'
const token = process.env.SANITY_API_TOKEN

if (!token) {
  console.error('❌ Error: SANITY_API_TOKEN environment variable is required')
  console.log('Usage: SANITY_API_TOKEN="your-token" node scripts/seed-vision-skill.mjs')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Helper to generate unique keys for array items
const generateKey = () => Math.random().toString(36).substring(2, 12)

/**
 * Create a Portable Text block
 * @param {string} text - The text content
 * @param {'normal'|'h2'|'h3'|'h4'} style - Block style
 */
const createBlock = (text, style = 'normal') => ({
  _type: 'block',
  _key: generateKey(),
  style,
  markDefs: [],
  children: [{_type: 'span', _key: generateKey(), text, marks: []}],
})

/**
 * Create a list item block
 * @param {string} text - The text content
 * @param {'bullet'|'number'} listItem - List type
 * @param {number} level - Indentation level (1-based)
 */
const createListItem = (text, listItem = 'bullet', level = 1) => ({
  _type: 'block',
  _key: generateKey(),
  style: 'normal',
  listItem,
  level,
  markDefs: [],
  children: [{_type: 'span', _key: generateKey(), text, marks: []}],
})

/**
 * Create a block with inline formatting (bold/italic/code)
 * @param {Array<{text: string, marks?: string[]}>} children - Text segments with marks
 * @param {'normal'|'h2'|'h3'|'h4'} style - Block style
 */
const createFormattedBlock = (children, style = 'normal') => ({
  _type: 'block',
  _key: generateKey(),
  style,
  markDefs: [],
  children: children.map((child) => ({
    _type: 'span',
    _key: generateKey(),
    text: child.text,
    marks: child.marks || [],
  })),
})

/**
 * Create a code block
 * @param {string} code - The code content
 * @param {string} language - Language identifier
 */
const createCodeBlock = (code, language = 'json') => ({
  _type: 'code',
  _key: generateKey(),
  language,
  code,
})

// ============================================================================
// SYSTEM INSTRUCTIONS
//
// These instructions ONLY cover what is unique to the vision-based workflow.
// Component options, spacing rules, nesting limits, heading hierarchy, and
// other general guidelines come from the Claude Training document and are
// injected automatically when the starter prompt's keywords are detected.
// ============================================================================
const systemInstructions = [
  // ---- OVERVIEW ----
  createBlock('Build from Design Image', 'h2'),
  createBlock(
    'You translate visual designs into Sanity page builder documents. When the user attaches an image of a web page design (a full page or individual section), analyze the visual layout and create the equivalent Sanity page document using the page builder component system.'
  ),
  createFormattedBlock([
    {text: 'Note: ', marks: ['strong']},
    {text: 'Detailed component options, spacing rules, nesting depth limits, heading hierarchy, and other design system rules are provided in the Training instructions above. Refer to those for valid field values and constraints. This skill focuses on how to '},
    {text: 'interpret a visual design image', marks: ['em']},
    {text: ' and translate it into the correct page builder structure.'},
  ]),

  // ---- HOW TO READ THE IMAGE ----
  createBlock('Reading the Annotated Design Image', 'h2'),
  createBlock(
    'The user will export design images with visual annotations to help you interpret the layout. Here is what to look for:'
  ),

  createBlock('12-Column Grid Overlay', 'h3'),
  createBlock(
    'The image will have vertical grid lines dividing the content area into 12 equal columns. Count which grid lines each content element spans between to determine its widthDesktop value. For example, if an element spans from grid line 1 to grid line 4, that is 4 columns wide — use widthDesktop: "4".'
  ),

  createBlock('Section Boundaries', 'h3'),
  createBlock(
    'Colored outlines along the inside edge of each section mark where one section ends and the next begins. Each outlined region becomes one section object in the pageBuilder array. Sections stack vertically — the topmost outlined region is the first section, and so on down the page.'
  ),

  createBlock('Component Labels', 'h3'),
  createBlock(
    'The user may add small text labels near elements that could be ambiguous. If you see a label like "eyebrowBlock", "cardBlock", "accordionBlock", or similar, use that exact block type. Labels override your visual interpretation when present.'
  ),

  // ---- VISUAL CUE → BLOCK TYPE MAPPING ----
  createBlock('Visual Cue to Block Type Mapping', 'h2'),
  createBlock(
    'When no label is present, use these visual cues to identify which block type to use:'
  ),
  createListItem('Very large, bold text at the top of a section or page → headingBlock (h1 if it is the first/hero section, h2 for subsequent sections)'),
  createListItem('Small uppercase text above a heading → eyebrowBlock'),
  createListItem('Body-sized paragraph text → richTextBlock'),
  createListItem('A colored or outlined rectangular shape with text inside, styled as a clickable element → buttonBlock'),
  createListItem('A photograph, illustration, or image placeholder → imageBlock'),
  createListItem('A small symbol or pictogram (not a photo) → iconBlock'),
  createListItem('A group of content boxes with visible borders, backgrounds, or card-like styling → cardBlock in each column'),
  createListItem('Collapsible/expandable question-answer pairs → accordionBlock'),
  createListItem('Tabbed interface with tab labels at the top → tabsBlock'),
  createListItem('A horizontal carousel of images → sliderBlock'),
  createListItem('A thin horizontal line between content → dividerBlock'),

  // ---- LAYOUT ANALYSIS ----
  createBlock('Analyzing Layout Structure', 'h2'),
  createBlock(
    'Work through the design systematically from top to bottom. For each section, determine the row and column structure before identifying individual blocks.'
  ),

  createBlock('Step 1: Identify Sections', 'h3'),
  createBlock(
    'A section is a full-width horizontal band of content. Look for:'
  ),
  createListItem('Section boundary outlines in the image'),
  createListItem('Background color changes (white to gray, light to dark, etc.)'),
  createListItem('Large vertical spacing that separates distinct content groups'),

  createBlock('Step 2: Identify Rows Within Each Section', 'h3'),
  createBlock(
    'Within each section, identify horizontal groupings of content that sit side by side. Each horizontal grouping is a row. Common patterns:'
  ),
  createListItem('A centered heading group (eyebrow + heading + description) sitting above a multi-column grid = TWO rows: one for the heading group, one for the grid'),
  createListItem('Text on the left and an image on the right = ONE row with two columns'),
  createListItem('A single centered content block = ONE row with one column'),
  createListItem('Three feature cards sitting side by side = ONE row with three columns'),

  createBlock('Step 3: Determine Column Widths from the Grid', 'h3'),
  createBlock(
    'Use the 12-column grid overlay to count column spans. Common width patterns:'
  ),
  createListItem('1 centered column of text: widthDesktop "8" or "9" or "10", row horizontalAlign "center"'),
  createListItem('2 equal columns: widthDesktop "6" each'),
  createListItem('2 asymmetric columns (text + image): widthDesktop "5" + "6" or "6" + "5", row horizontalAlign "between"'),
  createListItem('3 equal columns: widthDesktop "4" each'),
  createListItem('4 equal columns: widthDesktop "3" each'),
  createListItem('Sidebar + main: widthDesktop "3" + "8" or "4" + "7"'),

  createBlock('Step 4: Identify Blocks in Each Column', 'h3'),
  createBlock(
    'Read the content within each column from top to bottom. Map each visual element to a block type using the visual cue mapping above. Maintain the correct top-to-bottom order in the content array.'
  ),

  // ---- RESPONSIVE COLUMN WIDTHS ----
  createBlock('Responsive Column Widths', 'h3'),
  createBlock(
    'The design image shows only the desktop layout. Always set responsive widths so layouts adapt to smaller screens:'
  ),
  createListItem('For 4-column grids: widthDesktop "3", widthTablet "6", widthMobile "12" (4 → 2 → 1 column)'),
  createListItem('For 3-column grids: widthDesktop "4", widthTablet "6" or "12", widthMobile "12"'),
  createListItem('For 2-column layouts: widthTablet "inherit" or "6", widthMobile "12"'),
  createListItem('For single centered column: widthTablet "inherit", widthMobile "12"'),

  // ---- TRANSLATING VISUAL APPEARANCE TO FIELD VALUES ----
  createBlock('Translating Visual Appearance to Field Values', 'h2'),
  createBlock(
    'Use these mappings to translate what you see in the design into field values. For the full list of valid options for each field, refer to the Design System Rules and Component Guidelines in the Training instructions.'
  ),

  createBlock('Section Background', 'h3'),
  createListItem('White or very light background → omit backgroundColor (defaults to none)'),
  createListItem('Light gray background → backgroundColor: "secondary"'),
  createListItem('Dark background (navy, black, dark gray) → backgroundColor: "primary" — set text block colors to "white" inside'),
  createListItem('Brand-colored background → backgroundColor: "primary"'),

  createBlock('Section Padding and Height', 'h3'),
  createListItem('Very tall section with lots of breathing room → paddingTop: "spacious"'),
  createListItem('Normal section spacing → paddingTop: "default"'),
  createListItem('Tight spacing → paddingTop: "compact"'),
  createListItem('Content vertically centered in a tall section → minHeight: "large", verticalAlign: "center"'),
  createListItem('Hero filling the viewport → minHeight: "screen", verticalAlign: "center"'),
  createListItem('Almost always use maxWidth: "container"'),

  createBlock('Row Alignment from Visual Positioning', 'h3'),
  createListItem('Columns spread apart with space between → horizontalAlign: "between"'),
  createListItem('Columns grouped in the center → horizontalAlign: "center"'),
  createListItem('Columns flush left → horizontalAlign: "start"'),
  createListItem('Content vertically centered across columns of different heights → verticalAlign: "center"'),
  createListItem('Equal-height cards or columns → verticalAlign: "stretch"'),
  createListItem('Small gap between columns → gap: "4"; normal → gap: "6"; large → gap: "8" or "12"'),

  createBlock('Text Appearance', 'h3'),
  createListItem('Large body text or lead paragraph → richTextBlock with size: "lg"'),
  createListItem('Small body text or captions → richTextBlock with size: "sm"'),
  createListItem('Gray/muted text → color: "gray"'),
  createListItem('White text on dark background → color: "white"'),
  createListItem('Centered text → align: "center" on the block'),

  // ---- JSON FORMAT DETAILS ----
  createBlock('JSON Format Details', 'h2'),
  createBlock(
    'These block types require specific JSON object structures that are NOT covered in the Component Guidelines. Use these exact formats when building the page document.'
  ),

  createBlock('smartString (used by headingBlock, eyebrowBlock, buttonBlock text fields)', 'h3'),
  createCodeBlock(
    `{
  "_type": "smartString",
  "mode": "static",
  "staticValue": "Your text here"
}`,
    'json'
  ),

  createBlock('Portable Text (used by richTextBlock content field)', 'h3'),
  createCodeBlock(
    `[
  {
    "_type": "block",
    "_key": "unique10char",
    "style": "normal",
    "markDefs": [],
    "children": [
      {
        "_type": "span",
        "_key": "unique10char",
        "text": "Your paragraph text here",
        "marks": []
      }
    ]
  }
]`,
    'json'
  ),

  createBlock('link (used by buttonBlock link field)', 'h3'),
  createCodeBlock(
    `{
  "_type": "link",
  "linkType": "href",
  "href": "#"
}`,
    'json'
  ),
  createBlock('Use "#" as a placeholder href when the actual URL is not known from the design.'),

  createBlock('image reference (used by imageBlock image field)', 'h3'),
  createCodeBlock(
    `{
  "_type": "image",
  "asset": {
    "_type": "reference",
    "_ref": "image-asset-id-from-upload"
  }
}`,
    'json'
  ),

  // ---- COMMON LAYOUT PATTERNS ----
  createBlock('Common Layout Patterns', 'h2'),
  createBlock(
    'These are the most common layout patterns you will encounter. Use them as templates when you recognize the visual pattern in the design.'
  ),

  createBlock('Pattern 1: Centered Hero', 'h3'),
  createBlock(
    'Single column of centered text, typically the first section on a page. Visually: large heading centered horizontally, often with an eyebrow above and a description below, sometimes with one or two buttons.'
  ),
  createListItem('Section: paddingTop "spacious", minHeight "large" or "screen", verticalAlign "center"'),
  createListItem('Row: horizontalAlign "center"'),
  createListItem('Column: widthDesktop "8" or "9", widthMobile "12"'),
  createListItem('Content: eyebrowBlock (center) → headingBlock h1 (center) → richTextBlock (center, size "lg", color "gray") → buttons'),
  createListItem('For button pairs: create a nested row inside the column with 2 auto-width columns, each containing one buttonBlock'),

  createBlock('Pattern 2: Two-Column Text + Image', 'h3'),
  createBlock(
    'Text content on one side, image on the other. Very common for feature highlights and about sections.'
  ),
  createListItem('Row: horizontalAlign "between", verticalAlign "center", gap "6" or "8"'),
  createListItem('Text column: widthDesktop "5" or "6"; Image column: widthDesktop "5" or "6"'),
  createListItem('Text content: eyebrowBlock → headingBlock h2 → richTextBlock → buttonBlock (optional)'),
  createListItem('If image is on the left in the design, put the image column first and add reverseOnMobile: true'),

  createBlock('Pattern 3: Multi-Column Feature Grid', 'h3'),
  createBlock(
    'A header row with centered text, followed by a grid of 3-4 equal columns each containing an icon, heading, and description.'
  ),
  createListItem('Row 1 (header): horizontalAlign "center" — single column widthDesktop "9" with centered eyebrow + h2 + richTextBlock'),
  createListItem('Row 2 (grid): gap "6" or "8"'),
  createListItem('Grid columns: widthDesktop "4" (3-col) or "3" (4-col), widthTablet "6", widthMobile "12"'),
  createListItem('Grid column content: iconBlock → headingBlock h4 → richTextBlock (size "sm" or "base", color "gray")'),

  createBlock('Pattern 4: Card Grid', 'h3'),
  createBlock(
    'Similar to feature grid but each item is wrapped in a cardBlock with visible borders or backgrounds.'
  ),
  createListItem('Row: verticalAlign "stretch" to make cards equal height, gap "6"'),
  createListItem('Each column contains a single cardBlock with variant "outline" or "filled"'),
  createListItem('Card content: headingBlock h3 → richTextBlock → buttonBlock (optional)'),

  createBlock('Pattern 5: FAQ / Accordion Layout', 'h3'),
  createListItem('Two-column variant: widthDesktop "4" (heading side) + "7" (accordion side), horizontalAlign "between"'),
  createListItem('Full-width variant: header row with centered heading, then row with widthDesktop "8" or "10" centered column containing the accordionBlock'),

  createBlock('Pattern 6: Full-Width Image Slider', 'h3'),
  createListItem('Row 1: centered header (eyebrow + heading + description)'),
  createListItem('Row 2: single column widthDesktop "12" with sliderBlock'),
  createListItem('Set slidesPerViewDesktop based on how many slides are partially visible'),

  createBlock('Pattern 7: Dark Callout Section', 'h3'),
  createListItem('Section: backgroundColor "primary", paddingTop "spacious"'),
  createListItem('Row: horizontalAlign "center"'),
  createListItem('Column: widthDesktop "8" or "9"'),
  createListItem('Content: headingBlock with color "white", richTextBlock with color "white"'),

  createBlock('Pattern 8: Asymmetric 3-Column', 'h3'),
  createListItem('Row: horizontalAlign "between", gap "6"'),
  createListItem('Example widths: "5" + "4" + "2" or "3" + "6" + "3"'),
  createListItem('Mix imageBlock columns with text content columns'),

  // ---- IMAGES ----
  createBlock('Working with Images', 'h2'),
  createBlock(
    'Since you are working from a design image, you will not have actual image assets to reference. Handle images as follows:'
  ),
  createListItem('If the user has already uploaded images to Sanity and shares them in the chat, use the provided asset references'),
  createListItem('If images need to be uploaded, use the uploadImage action to upload them from the chat attachments'),
  createListItem('If no images are available yet, create imageBlock placeholders without the image field — the user can add images later in Sanity Studio'),
  createListItem('Always set a descriptive alt text based on what the image appears to show in the design'),

  // ---- OUTPUT FORMAT ----
  createBlock('Output Format', 'h2'),
  createBlock(
    'After analyzing the design image, create the Sanity page document using a create action. Here is a minimal example showing the correct structure:'
  ),
  createCodeBlock(
    `{
  "type": "create",
  "documentType": "page",
  "description": "Create '[Page Name]' page from design image",
  "data": {
    "_type": "page",
    "name": "Page Name",
    "slug": { "_type": "slug", "current": "page-slug" },
    "pageBuilder": [
      {
        "_key": "a1b2c3d4e5",
        "_type": "section",
        "label": "Hero Section",
        "maxWidth": "container",
        "paddingTop": "spacious",
        "rows": [
          {
            "_key": "f6g7h8i9j0",
            "_type": "row",
            "horizontalAlign": "center",
            "verticalAlign": "center",
            "gap": "6",
            "columns": [
              {
                "_key": "k1l2m3n4o5",
                "_type": "column",
                "widthDesktop": "9",
                "widthTablet": "inherit",
                "widthMobile": "12",
                "verticalAlign": "start",
                "content": [
                  {
                    "_key": "p6q7r8s9t0",
                    "_type": "headingBlock",
                    "text": {
                      "_type": "smartString",
                      "mode": "static",
                      "staticValue": "Your Heading"
                    },
                    "level": "h1",
                    "align": "center"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}`,
    'json'
  ),

  // ---- WORKFLOW ----
  createBlock('Workflow', 'h2'),
  createBlock('Follow this process when the user attaches a design image:'),
  createListItem('Acknowledge the design image and briefly describe what you see (layout structure, number of sections, key elements)', 'number'),
  createListItem('Ask the user for the page name and slug (or suggest one based on the design content)', 'number'),
  createListItem('Ask if they have any images to attach, or if you should create placeholders', 'number'),
  createListItem('Analyze the full layout: count sections, map rows and columns, identify all block types', 'number'),
  createListItem('Build the complete page document with all sections', 'number'),
  createListItem('Output the create action', 'number'),
  createListItem('After the page is created, provide a link to view it in Structure and Presentation mode', 'number'),

  createBlock(
    'If the design is complex (5+ sections), consider building it in stages — create the page with the first 2-3 sections, then use update actions to add the remaining sections. This avoids hitting depth or size limits in a single action.'
  ),
]

// ============================================================================
// SKILL DOCUMENT
// ============================================================================
const skillDocument = {
  _id: 'skill-build-from-design-image',
  _type: 'claudeWorkflow',

  // Content group
  name: 'Build from Design Image',
  description:
    'Analyze an attached design image (JPG/PNG export from Figma or similar) and build the equivalent page in Sanity using the page builder components. Works best with annotated exports that include 12-column grid overlay, section boundaries, and component labels.',
  systemInstructions,
  // Starter prompt deliberately includes trigger keywords for all three
  // Training instruction groups:
  //   - "design", "layout", "section" → Design group (design system rules, component guidelines)
  //   - "structure", "create", "schema", "field", "constraint" → Technical group (nesting, keys, required fields)
  //   - "content", "heading" → Writing group (heading hierarchy, writing guidelines)
  starterPrompt:
    'I\'ve attached a design image. Please analyze the layout structure and create this as a new section design (or full page with multiple sections) in Sanity, following the content and heading guidelines and schema field constraints. The page should be called ',
  order: 10,

  // Integrations group
  enableFigmaFetch: false,

  // Access control group
  roles: [],
  active: true,
}

// ============================================================================
// EXECUTION
// ============================================================================
async function seedVisionSkill() {
  console.log('🎨 Seeding "Build from Design Image" Skill...')

  try {
    const result = await client.createOrReplace(skillDocument)
    console.log('✅ Skill created/updated successfully!')
    console.log(`   Document ID: ${result._id}`)
    console.log(`   Name: ${skillDocument.name}`)
    console.log('')
    console.log('📝 Next steps:')
    console.log('   1. Open Sanity Studio → Structure → Claude Settings → Skills')
    console.log('   2. Find "Build from Design Image" and review the instructions')
    console.log('   3. PUBLISH the document (required for it to appear in the skill picker)')
    console.log('   4. Open Claude Assistant, select the skill, attach a design image, and try it!')
    console.log('')
    console.log('💡 Tips for best results:')
    console.log('   - Export designs with a 12-column grid overlay visible')
    console.log('   - Add colored outlines around section boundaries')
    console.log('   - Label ambiguous components (e.g., "eyebrowBlock", "cardBlock")')
    console.log('   - Use JPG or PNG format for the exported image')
    console.log('')
    console.log('📌 Keyword triggers in starter prompt:')
    console.log('   - Design group: "design", "layout", "section"')
    console.log('   - Technical group: "structure", "create", "schema", "field", "constraint"')
    console.log('   - Writing group: "content", "heading"')
  } catch (error) {
    console.error('❌ Error seeding skill:', error.message)
    if (error.response?.body) {
      console.error('   Details:', JSON.stringify(error.response.body, null, 2))
    }
    process.exit(1)
  }
}

seedVisionSkill()
