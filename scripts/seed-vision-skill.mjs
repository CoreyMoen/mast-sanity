/**
 * Seed script for "Build from Design Image" Claude Skill
 *
 * Creates a claudeWorkflow (Skill) document that teaches Claude to interpret
 * visual design images (JPG/PNG exports from Figma or other design tools)
 * and translate them into Sanity page builder structures.
 *
 * The skill is designed for use with annotated design exports that include:
 * - 12-column grid overlay lines
 * - Section boundary outlines
 * - Optional component type labels
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
// ============================================================================
const systemInstructions = [
  // ---- OVERVIEW ----
  createBlock('Build from Design Image', 'h2'),
  createBlock(
    'You translate visual designs into Sanity page builder documents. When the user attaches an image of a web page design (a full page or individual section), analyze the visual layout and create the equivalent Sanity page document using the page builder component system.'
  ),

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

  createBlock('Unlabeled Elements', 'h3'),
  createBlock(
    'When no label is present, use these visual cues to identify block types:'
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
  createListItem('Each section gets its own section object with appropriate backgroundColor'),

  createBlock('Step 2: Identify Rows Within Each Section', 'h3'),
  createBlock(
    'Within each section, identify horizontal groupings of content that sit side by side. Each horizontal grouping is a row. Common patterns:'
  ),
  createListItem('A centered heading group (eyebrow + heading + description) sitting above a multi-column grid = TWO rows: one for the heading group, one for the grid'),
  createListItem('Text on the left and an image on the right = ONE row with two columns'),
  createListItem('A single centered content block = ONE row with one column'),
  createListItem('Three feature cards sitting side by side = ONE row with three columns'),

  createBlock('Step 3: Determine Column Widths', 'h3'),
  createBlock(
    'Use the 12-column grid overlay to count column spans. Common width patterns:'
  ),
  createListItem('1 centered column of text: widthDesktop "8" or "9" or "10", row horizontalAlign "center"'),
  createListItem('2 equal columns: widthDesktop "6" each'),
  createListItem('2 asymmetric columns (text + image): widthDesktop "5" + "6" or "6" + "5", row horizontalAlign "between"'),
  createListItem('3 equal columns: widthDesktop "4" each'),
  createListItem('4 equal columns: widthDesktop "3" each'),
  createListItem('Sidebar + main: widthDesktop "3" + "8" or "4" + "7"'),
  createListItem('3 asymmetric (small + large + small): widthDesktop "3" + "6" + "3"'),

  createBlock('Step 4: Identify Blocks in Each Column', 'h3'),
  createBlock(
    'Read the content within each column from top to bottom. Map each visual element to a block type using the rules above. Maintain the correct top-to-bottom order in the content array.'
  ),

  // ---- RESPONSIVE BEHAVIOR ----
  createBlock('Responsive Column Widths', 'h3'),
  createBlock(
    'Always set responsive widths so layouts work on all screen sizes:'
  ),
  createListItem('widthTablet: use "inherit" to follow desktop, OR set a wider value (e.g., desktop "4" → tablet "6")'),
  createListItem('widthMobile: almost always "12" (full width) so content stacks vertically'),
  createListItem('For 4-column grids: widthDesktop "3", widthTablet "6", widthMobile "12" (4-col → 2-col → 1-col)'),
  createListItem('For 3-column grids: widthDesktop "4", widthTablet "6" or "12", widthMobile "12"'),
  createListItem('For 2-column layouts: widthTablet "inherit" or "6", widthMobile "12"'),

  // ---- SECTION SETTINGS ----
  createBlock('Section Settings from Visual Cues', 'h2'),

  createBlock('Background Colors', 'h3'),
  createListItem('White or very light background → omit backgroundColor (defaults to none)'),
  createListItem('Light gray background → backgroundColor: "secondary"'),
  createListItem('Dark background (navy, black, dark gray) → backgroundColor: "primary" (with white text on blocks inside)'),
  createListItem('Brand-colored background → backgroundColor: "primary"'),

  createBlock('Padding', 'h3'),
  createListItem('Very tall section with lots of breathing room → paddingTop: "spacious"'),
  createListItem('Normal section spacing → paddingTop: "default"'),
  createListItem('Tight/compact spacing → paddingTop: "compact"'),
  createListItem('No visible top space → paddingTop: "none"'),

  createBlock('Other Section Settings', 'h3'),
  createListItem('Almost always use maxWidth: "container" (content does not span full browser width)'),
  createListItem('If content is vertically centered in a tall section → set minHeight: "medium" or "large" and verticalAlign: "center"'),
  createListItem('Hero sections often use minHeight: "large" or "screen" with verticalAlign: "center"'),

  // ---- ROW SETTINGS ----
  createBlock('Row Settings from Visual Cues', 'h2'),
  createListItem('Columns spread apart with space between → horizontalAlign: "between"'),
  createListItem('Columns grouped in the center → horizontalAlign: "center"'),
  createListItem('Columns flush left → horizontalAlign: "start"'),
  createListItem('Content vertically centered across columns of different heights → verticalAlign: "center"'),
  createListItem('Columns stretched to equal height (e.g., equal-height cards) → verticalAlign: "stretch"'),
  createListItem('Content aligned to bottom of columns → verticalAlign: "end"'),
  createListItem('Small gap between columns → gap: "4"'),
  createListItem('Normal gap → gap: "6" (default)'),
  createListItem('Large gap → gap: "8" or "12"'),

  // ---- BLOCK FIELD REFERENCE ----
  createBlock('Block Field Reference', 'h2'),
  createBlock(
    'When creating action blocks, use these exact field names and value options for each block type.'
  ),

  createBlock('headingBlock', 'h3'),
  createListItem('text: { _type: "smartString", mode: "static", staticValue: "The heading text" } (REQUIRED)'),
  createListItem('level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" (default: "h2")'),
  createListItem('size: "inherit" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" (default: "inherit" — inherits from level)'),
  createListItem('align: "left" | "center" | "right" (default: "left")'),
  createListItem('color: "default" | "gray" | "white" | "brand" | "blue" (default: "default")'),

  createBlock('richTextBlock', 'h3'),
  createListItem('content: array of Portable Text blocks (see format below)'),
  createListItem('size: "inherit" | "xl" | "lg" | "base" | "sm" (default: "inherit")'),
  createListItem('align: "left" | "center" | "right" (default: "left")'),
  createListItem('color: "default" | "gray" | "white" | "brand" | "blue" (default: "default")'),
  createListItem('maxWidth: "none" | "prose" | "prose-lg" | "prose-xl" (default: "none")'),

  createBlock('Portable Text format for richTextBlock content:', 'h4'),
  createCodeBlock(
    `{
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
}`,
    'json'
  ),

  createBlock('eyebrowBlock', 'h3'),
  createListItem('text: { _type: "smartString", mode: "static", staticValue: "EYEBROW TEXT" } (REQUIRED)'),
  createListItem('variant: "text" | "overline" | "pill" (default: "text")'),
  createListItem('color: "default" | "brand" | "blue" | "muted" (default: "default")'),
  createListItem('align: "left" | "center" | "right" (default: "left")'),

  createBlock('buttonBlock', 'h3'),
  createListItem('text: { _type: "smartString", mode: "static", staticValue: "Button Text" } (REQUIRED)'),
  createListItem('variant: "primary" | "secondary" | "ghost" (default: "primary")'),
  createListItem('color: "brand" | "black" | "white" (default: "brand")'),
  createListItem('icon: "none" | "arrow-right" | "external" | "download" (default: "none")'),
  createListItem('link: { _type: "link", linkType: "href", href: "#" } (REQUIRED — use "#" as placeholder if no real URL)'),

  createBlock('imageBlock', 'h3'),
  createListItem('image: { _type: "image", asset: { _type: "reference", _ref: "image-asset-id" } } — use uploadImage action first if user provides images'),
  createListItem('alt: descriptive alt text string (REQUIRED)'),
  createListItem('aspectRatio: "original" | "16/9" | "4/3" | "1/1" | "3/4" | "9/16" (default: "original")'),
  createListItem('size: "full" | "lg" | "md" | "sm" | "thumb" (default: "full")'),
  createListItem('rounded: "none" | "sm" | "md" | "lg" | "full" (default: "none")'),
  createListItem('shadow: true | false (default: false)'),

  createBlock('iconBlock', 'h3'),
  createListItem('icon: one of "check-circle", "target", "star", "trophy", "arrow-right", "lightbulb-filament", "heart", "lightning", "rocket", "globe", "users", "chart-line-up", "shield-check", "sparkle", "compass", etc. (REQUIRED)'),
  createListItem('size: "sm" | "md" | "lg" | "xl" (default: "md")'),
  createListItem('color: "inherit" | "brand" | "blue" | "black" | "gray" (default: "inherit")'),
  createListItem('align: "left" | "center" | "right" (default: "left")'),
  createListItem('marginBottom: "0" | "sm" | "md" | "lg" (default: "sm")'),

  createBlock('cardBlock', 'h3'),
  createListItem('content: array of blocks (headingBlock, richTextBlock, imageBlock, buttonBlock, spacerBlock, dividerBlock)'),
  createListItem('variant: "default" | "outline" | "filled" | "ghost" (default: "default")'),
  createListItem('padding: "none" | "sm" | "md" | "lg" (default: "md")'),
  createListItem('href: URL string for clickable cards (optional)'),
  createListItem('hoverEffect: true | false (default: false)'),

  createBlock('spacerBlock', 'h3'),
  createListItem('sizeDesktop: "2" | "4" | "6" | "8" | "12" | "16" | "24" (default: "8")'),
  createListItem('sizeMobile: "inherit" | "2" | "4" | "6" | "8" | "12" | "16" | "24" (default: "inherit")'),
  createFormattedBlock([
    {text: 'IMPORTANT: ', marks: ['strong']},
    {text: 'Do NOT add spacers between consecutive text elements (eyebrow → heading → richText → button). Components have built-in margins. Only use spacers for large gaps between distinct content groups.'},
  ]),

  createBlock('dividerBlock', 'h3'),
  createListItem('marginTop: "0" | "2" | "4" | "6" | "8" | "12" | "16" | "24" (default: "8")'),
  createListItem('marginBottom: "0" | "2" | "4" | "6" | "8" | "12" | "16" | "24" (default: "8")'),
  createListItem('color: "default" | "light" | "dark" | "brand" | "blue" (default: "default")'),

  createBlock('accordionBlock', 'h3'),
  createListItem('items: array of { _type: "accordionItem", _key: "...", title: "Question", content: [...blocks], defaultOpen: false }'),
  createListItem('allowMultiple: true | false (default: true)'),
  createListItem('titleStyle: "h3" | "h4" | "h5" | "body" (default: "h4")'),
  createListItem('dividers: true | false (default: true)'),

  createBlock('tabsBlock', 'h3'),
  createListItem('tabs: array of { _type: "tabItem", _key: "...", label: "Tab Name", content: [...blocks] }'),
  createListItem('orientation: "horizontal" | "vertical" (default: "horizontal")'),
  createListItem('autoplay: true | false (default: false)'),
  createListItem('autoplayDuration: milliseconds (default: 5000)'),

  createBlock('sliderBlock', 'h3'),
  createListItem('slides: array of { _type: "imageSlide", _key: "...", image: {...}, alt: "..." }'),
  createListItem('slidesPerViewDesktop: 1-6 (default: 3)'),
  createListItem('slidesPerViewTablet: 1-4 (default: 2)'),
  createListItem('slidesPerViewMobile: 1-2 (default: 1)'),
  createListItem('aspectRatio: "original" | "16/9" | "4/3" | "1/1" (default: "16/9")'),
  createListItem('autoplay: true | false, loop: true | false'),
  createListItem('showNavigation: true | false, showPagination: true | false'),

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
  createListItem('Row: horizontalAlign "center", verticalAlign "center"'),
  createListItem('Column: widthDesktop "8" or "9", widthMobile "12"'),
  createListItem('Content: eyebrowBlock (center) → headingBlock h1 (center) → richTextBlock (center, size "lg", color "gray") → row with button columns'),
  createListItem('For button pairs: create a nested row inside the column with 2 auto-width columns, each containing one buttonBlock'),
  createFormattedBlock([
    {text: 'Use h1 ONLY in the hero section. ', marks: ['strong']},
    {text: 'All other sections should use h2 or lower.'},
  ]),

  createBlock('Pattern 2: Two-Column Text + Image', 'h3'),
  createBlock(
    'Text content on one side, image on the other. Very common for feature highlights and about sections.'
  ),
  createListItem('Section: paddingTop "default"'),
  createListItem('Row: horizontalAlign "between", verticalAlign "center", gap "6" or "8"'),
  createListItem('Text column: widthDesktop "5" or "6", widthMobile "12"'),
  createListItem('Image column: widthDesktop "5" or "6", widthMobile "12"'),
  createListItem('Text content: eyebrowBlock → headingBlock h2 → richTextBlock → buttonBlock (optional)'),
  createListItem('Image content: imageBlock with appropriate aspectRatio'),
  createListItem('If image is on the left in the design, put the image column first and add reverseOnMobile: true on the row so text appears first on mobile'),

  createBlock('Pattern 3: Multi-Column Feature Grid', 'h3'),
  createBlock(
    'A header row with centered text, followed by a grid of 3-4 equal columns each containing an icon, heading, and description.'
  ),
  createListItem('Section: backgroundColor "secondary" (gray) or omit (white)'),
  createListItem('Row 1 (header): horizontalAlign "center" — single column widthDesktop "9", content: eyebrowBlock + headingBlock h2 + richTextBlock (all centered)'),
  createListItem('Row 2 (grid): horizontalAlign "start" or "between", gap "6" or "8"'),
  createListItem('Grid columns: widthDesktop "4" (3-col) or "3" (4-col), widthTablet "6", widthMobile "12"'),
  createListItem('Grid column content: iconBlock → headingBlock h4 → richTextBlock (size "sm" or "base", color "gray")'),

  createBlock('Pattern 4: Card Grid', 'h3'),
  createBlock(
    'Similar to feature grid but each item is wrapped in a cardBlock with visible borders or backgrounds.'
  ),
  createListItem('Row 1 (optional header): same as Pattern 3 header'),
  createListItem('Row 2 (cards): verticalAlign "stretch" to make cards equal height, gap "6"'),
  createListItem('Each column contains a single cardBlock with variant "outline" or "filled"'),
  createListItem('Card content: headingBlock h3 → richTextBlock → buttonBlock (optional)'),

  createBlock('Pattern 5: FAQ / Accordion Layout', 'h3'),
  createBlock(
    'A heading on the left with an accordion on the right, or a full-width accordion below a centered heading.'
  ),
  createListItem('Two-column variant: widthDesktop "4" (heading) + "7" (accordion), horizontalAlign "between"'),
  createListItem('Full-width variant: header row with centered heading, then row with widthDesktop "8" or "10" centered column containing the accordionBlock'),
  createListItem('Accordion: titleStyle "h4", dividers true, items with title + richTextBlock content'),

  createBlock('Pattern 6: Full-Width Image Slider', 'h3'),
  createBlock(
    'Header text followed by a full-width image carousel.'
  ),
  createListItem('Row 1: centered header (eyebrow + heading + description)'),
  createListItem('Row 2: single column widthDesktop "12" with sliderBlock'),
  createListItem('Set slidesPerViewDesktop based on how many slides are partially visible'),

  createBlock('Pattern 7: Dark Callout Section', 'h3'),
  createBlock(
    'A dark background section with white text, used for emphasis or visual breaks.'
  ),
  createListItem('Section: backgroundColor "primary", paddingTop "spacious"'),
  createListItem('Row: horizontalAlign "center"'),
  createListItem('Column: widthDesktop "8" or "9"'),
  createListItem('Content: headingBlock with color "white" and/or richTextBlock with color "white"'),

  createBlock('Pattern 8: Asymmetric 3-Column', 'h3'),
  createBlock(
    'Three columns with different widths, often mixing images and text for visual rhythm.'
  ),
  createListItem('Row: horizontalAlign "between", verticalAlign "stretch" or "center", gap "6"'),
  createListItem('Example widths: "5" + "4" + "2" or "3" + "6" + "3"'),
  createListItem('Mix imageBlock columns with text content columns'),

  // ---- HEADING HIERARCHY ----
  createBlock('Heading Hierarchy Rules', 'h2'),
  createFormattedBlock([
    {text: 'CRITICAL: ', marks: ['strong']},
    {text: 'Follow proper heading hierarchy for SEO and accessibility.'},
  ]),
  createListItem('Exactly ONE h1 per page — in the hero section only', 'number'),
  createListItem('Each subsequent section starts with h2', 'number'),
  createListItem('Subsections within a section use h3, then h4', 'number'),
  createListItem('Never skip levels (do NOT go from h2 directly to h4)', 'number'),

  // ---- NESTING DEPTH ----
  createBlock('Nesting Depth Constraint', 'h2'),
  createFormattedBlock([
    {text: 'CRITICAL: ', marks: ['strong']},
    {text: 'Sanity has a maximum attribute depth of 20 levels. The base path to a block inside a column is already 9 levels deep.'},
  ]),
  createListItem('Safe: section → row → column → headingBlock (10 levels)'),
  createListItem('Safe: section → row → column → richTextBlock (13 levels)'),
  createListItem('Safe: section → row → column → cardBlock → richTextBlock (15 levels)'),
  createListItem('Safe: section → row → column → accordionBlock → richTextBlock (16 levels)'),
  createFormattedBlock([
    {text: 'AVOID: ', marks: ['strong']},
    {text: 'Do not nest tabsBlock inside cardBlock or vice versa. Do not put complex content inside tabs or cards — keep it to headings, text, and buttons only.'},
  ]),

  // ---- REQUIRED FIELDS & KEYS ----
  createBlock('Required Fields and Keys', 'h2'),
  createFormattedBlock([
    {text: 'Every object in every array MUST have both ', marks: []},
    {text: '_type', marks: ['code']},
    {text: ' and ', marks: []},
    {text: '_key', marks: ['code']},
    {text: '. Generate _key as a random 10-character alphanumeric string.', marks: []},
  ]),
  createBlock('Required _type values:'),
  createListItem('pageBuilder items: _type: "section"'),
  createListItem('rows items: _type: "row"'),
  createListItem('columns items: _type: "column"'),
  createListItem('content items: the specific block type (e.g., "headingBlock", "richTextBlock")'),
  createListItem('Portable Text blocks: _type: "block"'),
  createListItem('Portable Text spans: _type: "span"'),
  createListItem('Smart string fields (text on headingBlock, eyebrowBlock, buttonBlock): _type: "smartString"'),
  createListItem('Link fields: _type: "link"'),
  createListItem('Image fields: _type: "image"'),
  createListItem('Image asset references: _type: "reference"'),

  // ---- SPACING ANTI-PATTERNS ----
  createBlock('Spacing Anti-Patterns', 'h2'),
  createFormattedBlock([
    {text: 'Do NOT ', marks: ['strong']},
    {text: 'add spacerBlock between these elements — they have built-in margins:'},
  ]),
  createListItem('eyebrowBlock → headingBlock (no spacer needed)'),
  createListItem('headingBlock → richTextBlock (no spacer needed)'),
  createListItem('richTextBlock → buttonBlock (no spacer needed)'),
  createListItem('iconBlock → headingBlock (no spacer needed)'),
  createBlock('Only use spacerBlock for large intentional gaps between distinct content groups, after sliders or images, or between sections within the same section container.'),

  // ---- EYEBROW CONSISTENCY ----
  createBlock('Eyebrow Consistency', 'h2'),
  createBlock('Pick ONE eyebrow variant and use it consistently across the entire page. Do not mix "text" eyebrows in some sections and "overline" eyebrows in others. If the design shows varied eyebrow styles, default to "text" unless a label specifies otherwise.'),

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
    'After analyzing the design image, create the Sanity page document using a create action:'
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
                    "size": "inherit",
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
  createBlock('Follow this process when the user attaches a design image:', 'normal'),
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
  starterPrompt:
    'I\'ve attached a design image. Please analyze the layout and build this as a page in Sanity. The page should be called ',
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
  } catch (error) {
    console.error('❌ Error seeding skill:', error.message)
    if (error.response?.body) {
      console.error('   Details:', JSON.stringify(error.response.body, null, 2))
    }
    process.exit(1)
  }
}

seedVisionSkill()
