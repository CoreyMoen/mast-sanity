/**
 * Seed script for Claude Instructions document
 *
 * Creates/updates the claudeInstructions singleton document with sensible defaults
 * for all fields including writing guidelines, design system rules, and technical constraints.
 *
 * Usage:
 *   SANITY_API_TOKEN="your-token" node scripts/seed-claude-instructions.mjs
 */

import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '6lj3hi0f',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
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

// ============================================================================
// WRITING GUIDELINES (Portable Text)
// ============================================================================
const writingGuidelines = [
  createBlock('Heading Hierarchy', 'h2'),
  createListItem('Use h1 exactly once per page, typically in the hero section'),
  createListItem('Use h2 for main section headings'),
  createListItem('Use h3 and h4 for subsections - never skip levels (e.g., h2 → h4)'),
  createListItem('Each section should follow proper semantic heading order'),

  createBlock('Content Tone & Style', 'h2'),
  createListItem('Write clear, scannable content - front-load important information'),
  createListItem('Use active voice rather than passive voice'),
  createListItem('Keep headings concise (2-6 words) and descriptive'),
  createListItem('Break content into digestible paragraphs - avoid walls of text'),
  createListItem('Use bullet points for lists of 3+ items'),

  createBlock('Accessibility', 'h2'),
  createListItem('Always provide meaningful alt text for images - describe what the image shows'),
  createListItem('Use descriptive link text - never "click here" or "read more" alone'),
  createListItem('Ensure sufficient color contrast in text'),
  createListItem('Front-load link text with the most important words'),

  createBlock('Rich Text Best Practices', 'h2'),
  createListItem('Use maxWidth on rich text blocks for optimal line length and readability'),
  createListItem("Don't overuse bold or italic - reserve for genuine emphasis"),
  createListItem('Use code formatting for technical terms, file names, or code snippets'),
  createListItem('Break long content into multiple paragraphs with clear topic sentences'),
]

// ============================================================================
// BRAND VOICE (Portable Text)
// ============================================================================
const brandVoice = [
  createBlock('Voice Characteristics', 'h2'),
  createListItem('Professional yet approachable - expert but not intimidating'),
  createListItem('Clear and direct - say what you mean without jargon'),
  createListItem('Confident but not arrogant - helpful, not condescending'),
  createListItem('Human and warm - conversational, not robotic'),

  createBlock('Writing Principles', 'h2'),
  createListItem('Prefer "you/your" over "we/our" - focus on the user'),
  createListItem('Use active voice: "We designed this" not "This was designed"'),
  createListItem('Be specific rather than vague - concrete examples over abstractions'),
  createListItem('Maintain consistent terminology throughout - pick terms and stick with them'),

  createBlock('Tone Adjustments', 'h2'),
  createListItem('Hero sections: Inspiring and bold - grab attention'),
  createListItem('Feature descriptions: Clear and benefit-focused'),
  createListItem('CTAs: Action-oriented and motivating'),
  createListItem('Error messages: Helpful and solution-focused, not blaming'),
]

// ============================================================================
// DESIGN SYSTEM RULES (Portable Text)
// ============================================================================
const designSystemRules = [
  createBlock('12-Column Grid System', 'h2'),
  createListItem('Column widths: 1-12 (spans), plus "auto" (content-fit) and "fill" (flex grow)'),
  createListItem('Responsive widths: widthDesktop, widthTablet, widthMobile'),
  createListItem('Use "inherit" for tablet/mobile to follow desktop setting'),
  createListItem('Common patterns: 6/6 (two-col), 4/4/4 (three-col), 3/9 (sidebar)'),

  createBlock('Spacing Scale', 'h2'),
  createListItem('Gap options: 0, 2, 4, 6, 8, 12 (Tailwind spacing scale)'),
  createListItem('Padding options: 0, 2, 4, 6, 8 (columns)'),
  createListItem('Section padding: "none", "compact", "default", "spacious" (NOT numeric)'),

  createBlock('Section Configuration', 'h2'),
  createListItem('Background colors: "primary" or "secondary" only - omit field for default/none'),
  createListItem('Min height: "auto", "small", "medium", "large", "screen", or "custom"'),
  createListItem('Max width: "full", "container", "sm", "md", "lg", "xl", "2xl"'),
  createListItem('Vertical alignment (when min height set): "start", "center", "end"'),

  createBlock('Row Configuration', 'h2'),
  createListItem('Horizontal align: "start", "center", "end", "between", "around", "evenly"'),
  createListItem('Vertical align: "start", "center", "end", "stretch", "baseline", "between"'),
  createListItem('Use wrap: true (default) to allow columns to wrap on smaller screens'),
  createListItem('Use reverseOnMobile: true to flip column order on mobile'),

  createBlock('Spacing Anti-Patterns', 'h2'),
  createFormattedBlock([
    {text: 'Do NOT', marks: ['strong']},
    {text: ' add spacer blocks between text elements (eyebrow → heading → richText → button)'},
  ]),
  createListItem('Components have built-in margins - spacers break natural rhythm'),
  createListItem('Only use spacers for large gaps between distinct content groups'),
  createListItem('Only use spacers after sliders/images where extra breathing room is needed'),

  createBlock('Visual Consistency', 'h2'),
  createListItem('Be consistent with eyebrow variants - pick ONE per page (text/overline/pill)'),
  createListItem('Maintain consistent icon sizes within the same context'),
  createListItem('Use consistent button variants for similar actions'),
  createListItem('Align content consistently within sections'),
]

// ============================================================================
// TECHNICAL CONSTRAINTS (Portable Text)
// ============================================================================
const technicalConstraints = [
  createBlock('Sanity Nesting Limits', 'h2'),
  createFormattedBlock([
    {text: 'Maximum attribute depth: 20 levels', marks: ['strong']},
    {text: ' - exceeding this causes API errors'},
  ]),
  createListItem('Page → Section → Row → Column → Block = 5 levels baseline'),
  createListItem('Cards add ~3 levels of nesting depth'),
  createListItem('Tabs add significant depth - avoid nested complex content inside tabs'),
  createListItem('Prefer flat column layouts with icons over deeply nested card structures'),

  createBlock('Array Items & Keys', 'h2'),
  createFormattedBlock([
    {text: 'All array items require unique ', marks: []},
    {text: '_key', marks: ['code']},
    {text: ' values', marks: []},
  ]),
  createListItem('Generate keys with: Math.random().toString(36).substring(2, 12)'),
  createListItem('Never reuse keys across items or documents'),
  createListItem('Missing keys cause silent failures in updates'),

  createBlock('Document References', 'h2'),
  createFormattedBlock([
    {text: 'Reference format: ', marks: []},
    {text: '{ _type: "reference", _ref: "document-id" }', marks: ['code']},
  ]),
  createListItem("Settings/hooks only read PUBLISHED documents - drafts won't load"),
  createListItem('Always publish singleton documents (instructions, settings) after editing'),

  createBlock('Required Field Validation', 'h2'),
  createListItem('Check schema validation rules before creating content programmatically'),
  createListItem('Buttons without links show magenta dashed outline as visual warning'),
  createListItem('Images without alt text fail accessibility requirements'),
  createListItem('Tabs/accordions require at least one item'),

  createBlock('Performance Considerations', 'h2'),
  createListItem('Avoid excessive array items in a single section (keep under 20 blocks)'),
  createListItem('Use lazy loading for images below the fold'),
  createListItem('Minimize nested references in GROQ queries'),
]

// ============================================================================
// COMPONENT GUIDELINES (Array of objects)
// ============================================================================
const componentGuidelines = [
  // Layout components
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'section',
    guidelines:
      'Sections are the top-level containers. Set backgroundColor to "primary" or "secondary", or omit for default. Use paddingTop/paddingBottom with values: "none", "compact", "default", "spacious". Set minHeight for hero sections.',
    doNot:
      'Do not set backgroundColor to "none" - simply omit the field. Do not use numeric padding values.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'row',
    guidelines:
      'Rows contain columns and control horizontal layout. Use horizontalAlign and verticalAlign for positioning. Set gap (0/2/4/6/8/12) for column spacing. Use reverseOnMobile for mobile-first content ordering.',
    doNot:
      'Do not nest rows inside rows. Do not use rows without columns - add content directly to columns.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'column',
    guidelines:
      'Columns hold content blocks. Set widthDesktop (1-12, "auto", "fill"). Use widthTablet/widthMobile with "inherit" to follow desktop, or override. Set verticalAlign for content positioning within column.',
    doNot:
      'Do not use columns outside of rows. Do not set width to 0 - use "auto" for content-fit sizing.',
  },
  // Content blocks
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'headingBlock',
    guidelines:
      'Required: text field. Use level (h1-h6) with h1 once per page. Size can override visual size independently of semantic level. Align: start/center/end. Use color for brand emphasis.',
    doNot:
      'Do not use multiple h1 tags per page. Do not skip heading levels (h2 → h4). Do not use headings for styling - use proper levels for semantics.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'richTextBlock',
    guidelines:
      'Use for multi-paragraph content. Set maxWidth (sm/md/lg/xl/2xl/full) for readability - "md" or "lg" work well for body text. Supports bold, italic, code, and lists.',
    doNot:
      'Do not use full width for long-form text - line lengths over 80 characters hurt readability. Do not overuse formatting.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'eyebrowBlock',
    guidelines:
      'Small label text above headings. Variants: "text" (uppercase), "overline" (with line), "pill" (badge style). Keep text short (2-4 words). Be consistent with variant choice throughout the page.',
    doNot:
      'Do not use long text in eyebrows. Do not mix different eyebrow variants on the same page.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'imageBlock',
    guidelines:
      'Required: image and alt text. Use aspectRatio (auto/1:1/4:3/16:9/21:9/3:4/9:16) for consistent sizing. Size options: auto/small/medium/large/full. Add rounded and shadow as needed.',
    doNot:
      'Do not leave alt text empty on meaningful images. Do not use decorative images without alt="" (empty string for decorative). Do not stretch images disproportionately.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'buttonBlock',
    guidelines:
      'Required: text and link. Variants: primary (main CTA), secondary (alternative), ghost (subtle), outline (bordered). Use colorScheme to match section. Add icon for visual interest.',
    doNot:
      'Do not use multiple primary buttons in same section. Do not leave link empty (shows magenta warning). Do not use generic text like "Submit" or "Click here".',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'iconBlock',
    guidelines:
      'Uses Phosphor icon library. Size: xs/sm/md/lg/xl. Align: start/center/end. Use marginBottom to control spacing below. Color inherits from theme or can be set explicitly.',
    doNot:
      'Do not use icons without purpose - they should convey meaning. Do not mix icon styles inconsistently.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'spacerBlock',
    guidelines:
      'Use sparingly for intentional gaps between content groups. Set sizeDesktop and sizeMobile independently. Good for: after sliders, between major sections, before CTAs.',
    doNot:
      'Do not use spacers between consecutive text elements. Do not use spacers between buttons. Components have built-in margins.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'dividerBlock',
    guidelines:
      'Horizontal line separator. Color: default/muted/subtle. Use marginTop/marginBottom for spacing control. Good for separating content groups visually.',
    doNot:
      'Do not overuse dividers - they can fragment content. Do not use dividers when a spacer would suffice.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'cardBlock',
    guidelines:
      'Container with background/border. Variants: default/elevated/outlined. Can contain nested content. Has hover effects. Use for grouped related content.',
    doNot:
      'Do not nest cards deeply - adds nesting depth. Do not use cards when a simple column with background would work. Avoid cards inside tabs.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'sliderBlock',
    guidelines:
      'Image carousel. Requires at least 1 slide. slidesPerView: 1/2/3/4/auto. Has autoplay and loop options. Navigation: arrows and/or dots. Good for testimonials, portfolios.',
    doNot:
      'Do not use sliders for critical content that must be seen. Do not set very fast autoplay - users need time to read.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'tabsBlock',
    guidelines:
      'Tabbed content panels. Requires at least 1 tab. Each tab has title and content array. Good for organizing related but distinct content sections.',
    doNot:
      'Do not nest complex content inside tabs - adds significant nesting depth. Do not use tabs for sequential content (use accordion instead).',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'accordionBlock',
    guidelines:
      'Collapsible sections. Requires at least 1 item. allowMultiple option for simultaneous open panels. titleStyle: default/bold/large. Good for FAQs, detailed specs.',
    doNot:
      'Do not put critical information in collapsed state. Do not use for just 1-2 items - list them directly instead.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'callToAction',
    guidelines:
      'Full-width CTA section. Typically includes heading, description, and buttons. Use compelling, action-oriented copy. Set background for visual emphasis.',
    doNot:
      'Do not use weak CTAs like "Learn more". Do not overuse - one strong CTA per page is often enough. Do not bury in middle of content.',
  },
  {
    _key: generateKey(),
    _type: 'componentGuideline',
    component: 'infoSection',
    guidelines:
      'Pre-built section layout for common patterns. Good for features, benefits, or service descriptions. Uses standardized structure for consistency.',
    doNot: 'Do not customize heavily - use custom sections for complex layouts instead.',
  },
]

// ============================================================================
// FORBIDDEN TERMS (Array of strings)
// ============================================================================
const forbiddenTerms = [
  'Click here',
  'Read more',
  'Lorem ipsum',
  'Welcome to our website',
  'Submit',
  'TBD',
  'Coming soon',
  'Under construction',
  'Click to learn more',
  'See more',
]

// ============================================================================
// PREFERRED TERMS (Array of objects)
// ============================================================================
const preferredTerms = [
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'Click here',
    useInstead: 'Specific action (e.g., View pricing, Download guide)',
  },
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'Submit',
    useInstead: 'Specific action (e.g., Send message, Create account, Save changes)',
  },
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'Read more',
    useInstead: 'Content-specific text (e.g., Read the full article, View case study)',
  },
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'Info',
    useInstead: 'Information (or more specific term)',
  },
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'We/Our (overuse)',
    useInstead: 'You/Your (user-focused language)',
  },
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'Utilize',
    useInstead: 'Use',
  },
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'In order to',
    useInstead: 'To',
  },
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'At this point in time',
    useInstead: 'Now / Currently',
  },
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'Leverage',
    useInstead: 'Use / Apply',
  },
  {
    _key: generateKey(),
    _type: 'preferredTerm',
    avoid: 'Synergy',
    useInstead: 'Collaboration / Working together',
  },
]

// ============================================================================
// REQUIRED FIELDS (Array of objects)
// ============================================================================
const requiredFields = [
  {
    _key: generateKey(),
    _type: 'requiredFieldsRule',
    component: 'headingBlock',
    fields: ['text'],
  },
  {
    _key: generateKey(),
    _type: 'requiredFieldsRule',
    component: 'buttonBlock',
    fields: ['text', 'link'],
  },
  {
    _key: generateKey(),
    _type: 'requiredFieldsRule',
    component: 'imageBlock',
    fields: ['image', 'alt'],
  },
  {
    _key: generateKey(),
    _type: 'requiredFieldsRule',
    component: 'sliderBlock',
    fields: ['slides'],
  },
  {
    _key: generateKey(),
    _type: 'requiredFieldsRule',
    component: 'tabsBlock',
    fields: ['tabs'],
  },
  {
    _key: generateKey(),
    _type: 'requiredFieldsRule',
    component: 'accordionBlock',
    fields: ['items'],
  },
  {
    _key: generateKey(),
    _type: 'requiredFieldsRule',
    component: 'section',
    fields: ['rows'],
  },
  {
    _key: generateKey(),
    _type: 'requiredFieldsRule',
    component: 'row',
    fields: ['columns'],
  },
  {
    _key: generateKey(),
    _type: 'requiredFieldsRule',
    component: 'column',
    fields: ['content'],
  },
]

// ============================================================================
// TRIGGER KEYWORDS (use schema defaults)
// ============================================================================
const writingKeywords =
  'write, writing, copy, text, content, heading, title, description, paragraph, rich text, blog, article, post, caption, label, tone, voice, style, language, word, sentence, grammar'
const designKeywords =
  'design, layout, section, row, column, spacing, padding, margin, style, visual, color, theme, grid, responsive, mobile, desktop, hero, banner, card, button, icon, image, slider, tab, background, overlay, align, width, height'
const technicalKeywords =
  'nest, nesting, depth, schema, structure, field, type, key, sanity, groq, query, api, update, create, delete, duplicate, error, fail, bug, fix, constraint, limit, required'

// ============================================================================
// DOCUMENT ASSEMBLY
// ============================================================================
const claudeInstructionsDoc = {
  _type: 'claudeInstructions',
  _id: 'claudeInstructions',

  // Writing group
  writingGuidelines,
  brandVoice,
  forbiddenTerms,
  preferredTerms,
  writingKeywords,

  // Design group
  designSystemRules,
  componentGuidelines,
  designKeywords,

  // Technical group
  technicalConstraints,
  maxNestingDepth: 12,
  requiredFields,
  technicalKeywords,
}

// ============================================================================
// EXECUTION
// ============================================================================
async function seedClaudeInstructions() {
  console.log('🤖 Seeding Claude Instructions document...')

  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ Error: SANITY_API_TOKEN environment variable is required')
    console.log('Usage: SANITY_API_TOKEN="your-token" node scripts/seed-claude-instructions.mjs')
    process.exit(1)
  }

  try {
    const result = await client.createOrReplace(claudeInstructionsDoc)
    console.log('✅ Claude Instructions document created/updated successfully!')
    console.log(`   Document ID: ${result._id}`)
    console.log('')
    console.log('📝 Next steps:')
    console.log('   1. Open Sanity Studio → Structure → Claude Settings → Instructions')
    console.log('   2. Review the content and customize as needed')
    console.log('   3. PUBLISH the document (required for Claude to use it)')
  } catch (error) {
    console.error('❌ Error seeding Claude Instructions:', error.message)
    if (error.response?.body) {
      console.error('   Details:', JSON.stringify(error.response.body, null, 2))
    }
    process.exit(1)
  }
}

seedClaudeInstructions()
