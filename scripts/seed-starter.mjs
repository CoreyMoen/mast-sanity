/**
 * Starter seed script — populates a fresh Sanity dataset with all foundational content.
 *
 * Run: npm run seed
 *
 * What gets created:
 *   1. Singletons — Site Settings, Navigation, Footer, Claude API Settings
 *   2. People — Sample authors
 *   3. Content Variables — Brand Name, Support Email, Tagline
 *   4. Section Templates — Hero Center, Features 3-Column, CTA Banner, FAQ Accordion
 *   5. Pages — Home page, Mast demo page
 *   6. Blog — Categories + sample posts
 *   7. Claude Training — Instructions, component guidelines, terminology
 *   8. Claude Quick Actions — Create, Find, Edit, Explain
 */

import {createClient} from '@sanity/client'

const projectId = '6lj3hi0f'
const dataset = 'production'
const token = process.env.SANITY_API_TOKEN

if (!token) {
  console.error('❌ SANITY_API_TOKEN environment variable is required')
  console.error('   Create a .env file in the project root with:')
  console.error('   SANITY_API_TOKEN="your-write-token-here"')
  process.exit(1)
}

const client = createClient({projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false})

// ============================================================================
// HELPERS
// ============================================================================

const generateKey = () => Math.random().toString(36).substring(2, 12)

/** Portable Text block */
const richText = (text, style = 'normal') => ({
  _type: 'block',
  _key: generateKey(),
  style,
  children: [{_type: 'span', _key: generateKey(), text, marks: []}],
  markDefs: [],
})

/** Portable Text list item */
const listItem = (text, type = 'bullet', level = 1) => ({
  _type: 'block',
  _key: generateKey(),
  style: 'normal',
  listItem: type,
  level,
  markDefs: [],
  children: [{_type: 'span', _key: generateKey(), text, marks: []}],
})

/** Portable Text block with inline formatting */
const formattedBlock = (children, style = 'normal') => ({
  _type: 'block',
  _key: generateKey(),
  style,
  markDefs: [],
  children: children.map((c) => ({
    _type: 'span',
    _key: generateKey(),
    text: c.text,
    marks: c.marks || [],
  })),
})

const headingBlock = (text, level = 'h2', size = 'inherit', align = 'left', color = 'default') => ({
  _type: 'headingBlock',
  _key: generateKey(),
  text,
  level,
  size,
  align,
  color,
})

const eyebrowBlock = (text, variant = 'text', color = 'default', align = 'left') => ({
  _type: 'eyebrowBlock',
  _key: generateKey(),
  text,
  variant,
  color,
  align,
})

const richTextBlock = (paragraphs, size = 'inherit', align = 'left', color = 'default', maxWidth = 'full') => ({
  _type: 'richTextBlock',
  _key: generateKey(),
  content: paragraphs.map((p) => richText(p)),
  size,
  align,
  color,
  maxWidth,
})

const buttonBlock = (text, variant = 'primary', colorScheme = 'black', icon = null, href = '#') => ({
  _type: 'buttonBlock',
  _key: generateKey(),
  text,
  link: {_type: 'link', linkType: 'href', href},
  variant,
  colorScheme,
  icon,
})

const iconBlock = (icon, size = 'md', color = 'brand', align = 'start', marginBottom = 'md') => ({
  _type: 'iconBlock',
  _key: generateKey(),
  icon,
  size,
  color,
  align,
  marginBottom,
})

const spacerBlock = (sizeDesktop = '12', sizeMobile = '8') => ({
  _type: 'spacerBlock',
  _key: generateKey(),
  sizeDesktop,
  sizeMobile,
})

const col = (content, widthDesktop = 'fill', widthTablet = 'inherit', widthMobile = '12', verticalAlign = 'start') => ({
  _type: 'column',
  _key: generateKey(),
  content,
  widthDesktop,
  widthTablet,
  widthMobile,
  verticalAlign,
  padding: '0',
})

const row = (columns, horizontalAlign = 'start', verticalAlign = 'stretch', gap = '6') => ({
  _type: 'row',
  _key: generateKey(),
  columns,
  horizontalAlign,
  verticalAlign,
  gap,
  wrap: true,
  reverseOnMobile: false,
})

const section = (label, rows, backgroundColor = null, paddingTop = 'default', maxWidth = 'container') => {
  const s = {_type: 'section', _key: generateKey(), label, rows, maxWidth, paddingTop}
  if (backgroundColor && backgroundColor !== 'none') s.backgroundColor = backgroundColor
  return s
}

// ============================================================================
// 1. SINGLETONS
// ============================================================================

const settingsDoc = {
  _type: 'settings',
  _id: 'siteSettings',
  title: 'Mast for Sanity',
  description: [
    richText(
      'A component-based page builder for Sanity, powered by the Mast framework. Build beautiful, responsive pages with sections, rows, columns, and a full library of content blocks.'
    ),
  ],
}

const navigationDoc = {
  _type: 'navigation',
  _id: 'navigation',
  logoText: 'Mast',
  items: [
    {
      _type: 'navItem',
      _key: generateKey(),
      label: 'Home',
      type: 'link',
      link: {_type: 'link', linkType: 'page', page: {_type: 'reference', _ref: 'home-page'}},
    },
    {
      _type: 'navItem',
      _key: generateKey(),
      label: 'About',
      type: 'link',
      link: {_type: 'link', linkType: 'href', href: '#'},
    },
    {
      _type: 'navItem',
      _key: generateKey(),
      label: 'Resources',
      type: 'dropdown',
      dropdownLinks: [
        {_type: 'navLink', _key: generateKey(), label: 'Blog', link: {_type: 'link', linkType: 'href', href: '/blog'}},
        {_type: 'navLink', _key: generateKey(), label: 'Documentation', link: {_type: 'link', linkType: 'href', href: '#'}},
      ],
    },
  ],
  showCta: true,
  ctaLabel: 'Get Started',
  ctaLink: {_type: 'link', linkType: 'href', href: '#'},
  ctaStyle: 'primary',
}

const footerDoc = {
  _type: 'footer',
  _id: 'footer',
  showLogo: true,
  logoText: 'Mast',
  linkColumns: [
    {
      _type: 'linkColumn',
      _key: generateKey(),
      title: 'Product',
      links: [
        {_type: 'footerLink', _key: generateKey(), label: 'Features', link: {_type: 'link', linkType: 'href', href: '#'}},
        {_type: 'footerLink', _key: generateKey(), label: 'Pricing', link: {_type: 'link', linkType: 'href', href: '#'}},
        {_type: 'footerLink', _key: generateKey(), label: 'Changelog', link: {_type: 'link', linkType: 'href', href: '#'}},
      ],
    },
    {
      _type: 'linkColumn',
      _key: generateKey(),
      title: 'Resources',
      links: [
        {_type: 'footerLink', _key: generateKey(), label: 'Documentation', link: {_type: 'link', linkType: 'href', href: '#'}},
        {_type: 'footerLink', _key: generateKey(), label: 'Blog', link: {_type: 'link', linkType: 'href', href: '/blog'}},
        {_type: 'footerLink', _key: generateKey(), label: 'Support', link: {_type: 'link', linkType: 'href', href: '#'}},
      ],
    },
    {
      _type: 'linkColumn',
      _key: generateKey(),
      title: 'Company',
      links: [
        {_type: 'footerLink', _key: generateKey(), label: 'About', link: {_type: 'link', linkType: 'href', href: '#'}},
        {_type: 'footerLink', _key: generateKey(), label: 'Careers', link: {_type: 'link', linkType: 'href', href: '#'}},
        {_type: 'footerLink', _key: generateKey(), label: 'Contact', link: {_type: 'link', linkType: 'href', href: '#'}},
      ],
    },
  ],
  socialLinks: [
    {_type: 'socialLink', _key: generateKey(), platform: 'github', url: 'https://github.com/CoreyMoen/mast-sanity'},
    {_type: 'socialLink', _key: generateKey(), platform: 'x', url: 'https://x.com'},
    {_type: 'socialLink', _key: generateKey(), platform: 'linkedin', url: 'https://linkedin.com'},
  ],
  companyName: 'Mast',
  showThemeToggle: false,
}

const claudeApiSettingsDoc = {
  _type: 'claudeApiSettings',
  _id: 'claudeApiSettings',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
  enableStreaming: true,
}

// ============================================================================
// 2. PEOPLE
// ============================================================================

const people = [
  {_type: 'person', _id: 'person-jane-doe', firstName: 'Jane', lastName: 'Doe'},
  {_type: 'person', _id: 'person-alex-chen', firstName: 'Alex', lastName: 'Chen'},
]

// ============================================================================
// 3. CONTENT VARIABLES
// ============================================================================

const contentVariables = [
  {_type: 'contentVariable', _id: 'var-brand-name', name: 'Brand Name', key: {_type: 'slug', current: 'brand-name'}, variableType: 'text', textValue: 'Mast', description: 'The brand name used across the site'},
  {_type: 'contentVariable', _id: 'var-support-email', name: 'Support Email', key: {_type: 'slug', current: 'support-email'}, variableType: 'text', textValue: 'hello@example.com', description: 'Primary support/contact email address'},
  {_type: 'contentVariable', _id: 'var-tagline', name: 'Tagline', key: {_type: 'slug', current: 'tagline'}, variableType: 'text', textValue: 'Build beautiful pages, faster', description: 'Short brand tagline used in hero sections and metadata'},
]

// ============================================================================
// 4. SECTION TEMPLATES
// ============================================================================

const sectionTemplates = [
  {
    _type: 'sectionTemplate', _id: 'template-hero-center', name: 'Hero / Center',
    description: 'Centered hero section with eyebrow, heading, description, and button row.',
    category: 'heroes', isGlobal: false, backgroundColor: 'primary', minHeight: 'medium',
    verticalAlign: 'center', maxWidth: 'container', paddingTop: 'spacious',
    rows: [row([col([eyebrowBlock('Your Eyebrow', 'text', 'brand', 'center'), headingBlock('Your Hero Heading Goes Here', 'h1', 'inherit', 'center'), richTextBlock(['A compelling description that explains your value proposition.'], 'lg', 'center', 'gray', 'lg'), row([col([buttonBlock('Primary Action', 'primary', 'brand', 'arrow-right')], 'auto'), col([buttonBlock('Secondary Action', 'secondary', 'black')], 'auto')], 'center', 'center', '4')], '8', 'inherit', '12', 'center')], 'center', 'center')],
  },
  {
    _type: 'sectionTemplate', _id: 'template-features-3col', name: 'Features / 3-Column',
    description: 'Three-column feature grid with icons, headings, and descriptions.',
    category: 'features', isGlobal: false, maxWidth: 'container', paddingTop: 'default',
    rows: [
      row([col([eyebrowBlock('Features', 'text', 'brand', 'center'), headingBlock('Everything you need', 'h2', 'inherit', 'center'), richTextBlock(['A brief overview of what makes your product or service stand out.'], 'inherit', 'center', 'gray', 'lg')], '8', 'inherit', '12', 'center')], 'center'),
      row([col([iconBlock('lightning', 'lg', 'brand', 'start'), headingBlock('Feature One', 'h3'), richTextBlock(['Describe this feature and the benefit it provides.'], 'sm', 'start', 'gray')], '4', '4', '12'), col([iconBlock('shield-check', 'lg', 'brand', 'start'), headingBlock('Feature Two', 'h3'), richTextBlock(['Describe this feature and the benefit it provides.'], 'sm', 'start', 'gray')], '4', '4', '12'), col([iconBlock('chart-bar', 'lg', 'brand', 'start'), headingBlock('Feature Three', 'h3'), richTextBlock(['Describe this feature and the benefit it provides.'], 'sm', 'start', 'gray')], '4', '4', '12')], 'start', 'start', '8'),
    ],
  },
  {
    _type: 'sectionTemplate', _id: 'template-cta-banner', name: 'CTA / Banner',
    description: 'Simple centered call-to-action with heading, description, and buttons.',
    category: 'ctas', isGlobal: false, backgroundColor: 'secondary', maxWidth: 'container', paddingTop: 'default',
    rows: [row([col([headingBlock('Ready to get started?', 'h2', 'inherit', 'center'), richTextBlock(['Join thousands of teams already using our platform.'], 'lg', 'center', 'gray', 'lg'), row([col([buttonBlock('Start Free Trial', 'primary', 'brand')], 'auto'), col([buttonBlock('Talk to Sales', 'ghost', 'black')], 'auto')], 'center', 'center', '4')], '8', 'inherit', '12', 'center')], 'center', 'center')],
  },
  {
    _type: 'sectionTemplate', _id: 'template-faq', name: 'FAQ / Accordion',
    description: 'Frequently asked questions with heading and collapsible accordion items.',
    category: 'faq', isGlobal: false, maxWidth: 'container', paddingTop: 'default',
    rows: [
      row([col([eyebrowBlock('FAQ', 'text', 'brand', 'center'), headingBlock('Frequently asked questions', 'h2', 'inherit', 'center'), richTextBlock(["Can't find the answer you're looking for? Reach out to our support team."], 'inherit', 'center', 'gray', 'lg')], '8', 'inherit', '12', 'center')], 'center'),
      row([col([{_type: 'accordionBlock', _key: generateKey(), allowMultiple: true, items: [
        {_type: 'accordionItem', _key: generateKey(), title: 'What is Mast?', content: [richText('Mast is a component-based page builder framework for Sanity CMS. It provides a structured Section, Row, Column, Block architecture for building responsive pages with real-time visual editing.')]},
        {_type: 'accordionItem', _key: generateKey(), title: 'How do I customize the design?', content: [richText('The design is built with Tailwind CSS v4 and uses CSS custom properties for theming. Customize colors, typography, and spacing by editing the CSS variables in frontend/app/app.css.')]},
        {_type: 'accordionItem', _key: generateKey(), title: 'Can I add custom block types?', content: [richText('Yes! Create a new schema in studio/src/schemaTypes/objects/blocks/, add it to the column content array, and create a matching React component in frontend/app/components/blocks/.')]},
        {_type: 'accordionItem', _key: generateKey(), title: 'Is the Claude AI assistant required?', content: [richText('No. The Claude assistant is an optional plugin. The page builder works independently. To use the assistant, add an Anthropic API key to your frontend environment variables.')]},
      ]}], '8', 'inherit', '12')], 'center'),
    ],
  },
]

// ============================================================================
// 5. PAGES
// ============================================================================

const homePage = {
  _type: 'page', _id: 'home-page', name: 'Home', slug: {_type: 'slug', current: 'home'},
  pageBuilder: [
    section('Hero', [row([col([eyebrowBlock('Welcome', 'text', 'brand', 'center'), headingBlock('Build something amazing', 'h1', 'inherit', 'center'), richTextBlock(['This is your home page. Use the Sanity Studio page builder to customize this content with sections, rows, columns, and blocks.'], 'lg', 'center', 'gray'), row([col([buttonBlock('Get Started', 'primary', 'brand', 'arrow-right')], 'auto'), col([buttonBlock('Learn More', 'secondary', 'black')], 'auto')], 'center', 'center', '4')], '8', 'inherit', '12', 'center')], 'center', 'center')], null, 'spacious'),
  ],
}

const mastDemoPage = {
  _type: 'page', _id: 'mast-in-sanity', name: 'Mast in Sanity', slug: {_type: 'slug', current: 'mast-in-sanity'},
  pageBuilder: [
    // Hero
    section('Hero', [row([col([eyebrowBlock('Mast + Sanity', 'overline', 'brand'), spacerBlock('4', '2'), headingBlock('Where thoughtful design meets intelligent content', 'h1'), spacerBlock('6', '4'), richTextBlock(['Mast brings clarity to visual design. Sanity brings structure to content. Together, they create something rare: a system where every piece serves a purpose, every component tells a story, and every edit feels effortless.'], 'lg'), spacerBlock('8', '6'), row([col([buttonBlock('Explore the System', 'primary', 'brand', 'arrow-right')], 'auto'), col([buttonBlock('View Components', 'secondary', 'black')], 'auto')], 'start', 'center', '4')], '7', 'inherit', '12', 'center'), col([{_type: 'imageBlock', _key: generateKey(), alt: 'Mast design system preview', aspectRatio: '4x3', size: 'full', rounded: 'md', shadow: true}], '5', 'inherit', '12', 'center')], 'between', 'center', '12')], null, 'spacious'),
    // The Challenge
    section('The Challenge', [row([col([eyebrowBlock('The Challenge', 'text', 'muted', 'center'), spacerBlock('4', '2'), headingBlock('Design systems promise consistency. Content platforms promise flexibility. Why do we so often have to choose?', 'h2', 'h3', 'center')], '10', 'inherit', '12', 'center')], 'center', 'center'), row([col([spacerBlock('12', '8')], '12')]), row([col([iconBlock('shuffle-simple', 'xl', 'brand', 'left', 'md'), headingBlock('Scattered Components', 'h4'), spacerBlock('2', '2'), richTextBlock(['Teams rebuild the same patterns across projects, losing consistency and wasting creative energy on solved problems.'], 'base', 'left', 'gray')], '4', '6', '12'), col([iconBlock('lock', 'xl', 'brand', 'left', 'md'), headingBlock('Rigid Templates', 'h4'), spacerBlock('2', '2'), richTextBlock(['Traditional CMS templates lock content into fixed layouts, forcing editors to work around the system instead of with it.'], 'base', 'left', 'gray')], '4', '6', '12'), col([iconBlock('code', 'xl', 'brand', 'left', 'md'), headingBlock('Developer Dependency', 'h4'), spacerBlock('2', '2'), richTextBlock(['Every layout change requires developer intervention, creating bottlenecks and slowing the entire content creation process.'], 'base', 'left', 'gray')], '4', '6', '12')], 'between', 'start', '6')], 'secondary'),
    // The Solution
    section('The Solution', [row([col([eyebrowBlock('The Solution', 'overline', 'brand', 'center'), spacerBlock('6', '4'), headingBlock('Content as building blocks. Design as guardrails. Freedom within structure.', 'h2', 'h1', 'center', 'white'), spacerBlock('8', '6'), richTextBlock(['Mast in Sanity transforms how teams create. Every component is both a design decision and a content opportunity. Editors compose pages visually while designers maintain control over the system.'], 'lg', 'center', 'gray')], '9', 'inherit', '12', 'center')], 'center', 'center')], 'primary', 'spacious'),
    // Features Grid
    section('Key Capabilities', [row([col([eyebrowBlock('Capabilities'), headingBlock("Everything you need, nothing you don't", 'h2'), spacerBlock('4', '2'), richTextBlock(['A complete system of components designed to work together seamlessly, giving content teams the power to create while maintaining design integrity.'], 'base', 'left', 'gray')], '5', 'inherit', '12')]), row([col([spacerBlock('12', '8')], '12')]), row([col([iconBlock('rocket', 'lg', 'brand', 'left', 'sm'), headingBlock('Visual Page Builder', 'h4'), richTextBlock(['Compose pages from pre-built sections and blocks. See changes in real-time with Presentation mode.'], 'sm', 'left', 'gray')], '3', '6', '12'), col([iconBlock('palette', 'lg', 'brand', 'left', 'sm'), headingBlock('Consistent Design Tokens', 'h4'), richTextBlock(['Colors, typography, and spacing flow from a single source of truth. Change once, update everywhere.'], 'sm', 'left', 'gray')], '3', '6', '12'), col([iconBlock('lightning', 'lg', 'brand', 'left', 'sm'), headingBlock('Responsive by Default', 'h4'), richTextBlock(['Every component adapts gracefully. 12-column grid with mobile, tablet, and desktop breakpoints built in.'], 'sm', 'left', 'gray')], '3', '6', '12'), col([iconBlock('eye', 'lg', 'brand', 'left', 'sm'), headingBlock('Live Preview', 'h4'), richTextBlock(['Edit content and see it render instantly. Click any element to jump directly to its editing interface.'], 'sm', 'left', 'gray')], '3', '6', '12')], 'between', 'start', '8'), row([col([spacerBlock('8', '6')], '12')]), row([col([iconBlock('users', 'lg', 'brand', 'left', 'sm'), headingBlock('Team Collaboration', 'h4'), richTextBlock(["Real-time editing with presence indicators. Never overwrite a colleague's work again."], 'sm', 'left', 'gray')], '3', '6', '12'), col([iconBlock('shield-check', 'lg', 'brand', 'left', 'sm'), headingBlock('Content Validation', 'h4'), richTextBlock(['Built-in rules ensure content meets requirements before publishing. No broken layouts, ever.'], 'sm', 'left', 'gray')], '3', '6', '12'), col([iconBlock('clock', 'lg', 'brand', 'left', 'sm'), headingBlock('Version History', 'h4'), richTextBlock(['Every change is tracked. Roll back to any previous version with a single click.'], 'sm', 'left', 'gray')], '3', '6', '12'), col([iconBlock('globe', 'lg', 'brand', 'left', 'sm'), headingBlock('CDN Delivery', 'h4'), richTextBlock(["Content served globally through Sanity's edge network. Fast for editors, faster for visitors."], 'sm', 'left', 'gray')], '3', '6', '12')], 'between', 'start', '8')], null),
    // How It Works
    section('How It Works', [row([col([eyebrowBlock('How It Works', 'text', 'muted', 'center'), spacerBlock('4', '2'), headingBlock('From concept to published in minutes', 'h2', 'inherit', 'center')], '8', 'inherit', '12', 'center')], 'center', 'center'), row([col([spacerBlock('16', '12')], '12')]), row([col([headingBlock('01', 'h3', 'h1', 'left', 'brand'), headingBlock('Choose Your Structure', 'h4'), spacerBlock('2', '2'), richTextBlock(['Start with sections and rows. Define the grid layout for your content using the intuitive 12-column system.'], 'base', 'left', 'gray')], '3', '6', '12'), col([headingBlock('02', 'h3', 'h1', 'left', 'brand'), headingBlock('Add Content Blocks', 'h4'), spacerBlock('2', '2'), richTextBlock(['Drop in headings, text, images, buttons, cards, and more. Each block is designed to work with every other.'], 'base', 'left', 'gray')], '3', '6', '12'), col([headingBlock('03', 'h3', 'h1', 'left', 'brand'), headingBlock('Preview & Refine', 'h4'), spacerBlock('2', '2'), richTextBlock(['Switch to Presentation mode to see your page exactly as visitors will. Click any element to edit it in place.'], 'base', 'left', 'gray')], '3', '6', '12'), col([headingBlock('04', 'h3', 'h1', 'left', 'brand'), headingBlock('Publish Instantly', 'h4'), spacerBlock('2', '2'), richTextBlock(["One click to publish. Your content is live globally in seconds, delivered through Sanity's content lake."], 'base', 'left', 'gray')], '3', '6', '12')], 'between', 'start', '8')], 'secondary'),
    // Component Showcase
    section('Component Showcase', [row([col([eyebrowBlock('Components'), headingBlock('A system designed to compose', 'h2'), spacerBlock('4', '2'), richTextBlock(['Every component in Mast is built to work with every other. Mix, match, and create layouts that feel cohesive without feeling constrained.'], 'base', 'left', 'gray')], '6', 'inherit', '12')]), row([col([spacerBlock('12', '8')], '12')]), row([col([iconBlock('compass', 'xl', 'brand', 'left', 'md'), headingBlock('Flexible Grid System', 'h4'), spacerBlock('2', '2'), richTextBlock(['Sections contain rows. Rows contain columns. Columns contain blocks. The 12-column grid adapts to any screen size with independent controls for each breakpoint.'], 'base', 'left', 'gray')], '4', '12', '12'), col([iconBlock('pencil', 'xl', 'brand', 'left', 'md'), headingBlock('Purposeful Type Scale', 'h4'), spacerBlock('2', '2'), richTextBlock(['Six heading levels plus body text sizes give you the range to create visual hierarchy. Each size is carefully tuned for readability and rhythm.'], 'base', 'left', 'gray')], '4', '12', '12'), col([iconBlock('sparkle', 'xl', 'brand', 'left', 'md'), headingBlock('Engaging Interactions', 'h4'), spacerBlock('2', '2'), richTextBlock(['Sliders, tabs, accordions, and modals add interactivity without custom code. Each component is accessible and performant by default.'], 'base', 'left', 'gray')], '4', '12', '12')], 'between', 'start', '8')], null),
    // CTA
    section('Get Started', [row([col([headingBlock('Ready to build something beautiful?', 'h2', 'h2', 'center', 'white'), spacerBlock('6', '4'), richTextBlock(['Start creating with Mast in Sanity today. Your content deserves a system that works as hard as you do.'], 'lg', 'center', 'gray'), spacerBlock('8', '6'), row([col([buttonBlock('Start Building', 'primary', 'brand', 'arrow-right')], 'auto'), col([buttonBlock('View Documentation', 'secondary', 'white')], 'auto')], 'center', 'center', '4')], '8', 'inherit', '12', 'center')], 'center', 'center')], 'primary', 'spacious'),
  ],
}

// ============================================================================
// 6. BLOG — Categories + Posts
// ============================================================================

const categories = [
  {_id: 'category-design', _type: 'category', title: 'Design', slug: {_type: 'slug', current: 'design'}, description: 'Articles about design principles, UI/UX, and visual aesthetics'},
  {_id: 'category-development', _type: 'category', title: 'Development', slug: {_type: 'slug', current: 'development'}, description: 'Technical articles about web development, coding, and engineering'},
  {_id: 'category-business', _type: 'category', title: 'Business', slug: {_type: 'slug', current: 'business'}, description: 'Insights on business strategy, growth, and entrepreneurship'},
]

const posts = [
  {_id: 'post-getting-started-design-systems', _type: 'post', title: 'Getting Started with Design Systems', slug: {_type: 'slug', current: 'getting-started-design-systems'}, summary: 'Learn the fundamentals of building a cohesive design system that scales with your team and product.', date: '2025-01-15T10:00:00Z', categories: [{_type: 'reference', _ref: 'category-design', _key: generateKey()}], content: [richText('Getting Started with Design Systems', 'h2'), richText("A design system is more than just a component library. It's a comprehensive set of standards, documentation, and principles that guide how your product looks and feels."), richText('Why Design Systems Matter', 'h3'), richText('Design systems create consistency across your product, speed up development, and ensure accessibility standards are met.'), richText('Core Components', 'h3'), richText('Every design system should include: design tokens (colors, typography, spacing), core components (buttons, inputs, cards), patterns (forms, navigation), and comprehensive documentation.')]},
  {_id: 'post-modern-web-development-2025', _type: 'post', title: 'Modern Web Development in 2025', slug: {_type: 'slug', current: 'modern-web-development-2025'}, summary: 'An overview of the latest trends and best practices in web development, from server components to edge computing.', date: '2025-01-10T14:30:00Z', categories: [{_type: 'reference', _ref: 'category-development', _key: generateKey()}], content: [richText('Modern Web Development in 2025', 'h2'), richText('The web development landscape continues to evolve rapidly. Server components, edge computing, and AI-assisted development are reshaping how we build applications.'), richText('Server Components and Streaming', 'h3'), richText('React Server Components have matured significantly, allowing developers to build more efficient applications by moving rendering to the server.'), richText('Edge Computing', 'h3'), richText('Edge functions and databases bring computation closer to users, reducing latency and improving performance globally.')]},
  {_id: 'post-scaling-your-startup', _type: 'post', title: 'Scaling Your Startup: Lessons Learned', slug: {_type: 'slug', current: 'scaling-your-startup'}, summary: 'Practical advice on growing your business from early-stage to scale-up, covering team building, processes, and culture.', date: '2025-01-05T09:00:00Z', categories: [{_type: 'reference', _ref: 'category-business', _key: generateKey()}], content: [richText('Scaling Your Startup: Lessons Learned', 'h2'), richText('Growing a startup from a small team to a larger organization brings unique challenges. Here are some hard-won lessons.'), richText('Hiring Right', 'h3'), richText('Your early hires set the culture for everyone who follows. Look for people who are adaptable, curious, and aligned with your mission.'), richText('Maintaining Culture', 'h3'), richText('Culture is what happens when no one is watching. Define your values early and be intentional about preserving what makes your company special.')]},
  {_id: 'post-accessible-design-patterns', _type: 'post', title: 'Building Accessible Design Patterns', slug: {_type: 'slug', current: 'accessible-design-patterns'}, summary: 'How to create inclusive interfaces that work for everyone. Covers ARIA, keyboard navigation, color contrast, and testing.', date: '2024-12-28T11:00:00Z', categories: [{_type: 'reference', _ref: 'category-design', _key: generateKey()}, {_type: 'reference', _ref: 'category-development', _key: generateKey()}], content: [richText('Building Accessible Design Patterns', 'h2'), richText("Accessibility isn't an afterthought — it's a fundamental aspect of good design. When we build for accessibility, we build better products for everyone."), richText('Understanding ARIA', 'h3'), richText("ARIA provides attributes that help screen readers understand dynamic content. But remember: the first rule of ARIA is don't use ARIA unless you need to."), richText('Keyboard Navigation', 'h3'), richText('Many users navigate entirely by keyboard. Ensure all interactive elements are focusable, focus order is logical, and focus states are visible.'), richText('Color and Contrast', 'h3'), richText("WCAG requires a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text. Don't rely on color alone to convey meaning.")]},
  {_id: 'post-content-strategy-that-converts', _type: 'post', title: 'Content Strategy That Actually Converts', slug: {_type: 'slug', current: 'content-strategy-that-converts'}, summary: 'Move beyond vanity metrics and create content that drives real business results.', date: '2024-12-20T16:00:00Z', categories: [{_type: 'reference', _ref: 'category-business', _key: generateKey()}], content: [richText('Content Strategy That Actually Converts', 'h2'), richText("Traffic means nothing if it doesn't lead to conversions. Here's how to create content that drives real business results."), richText('Understanding User Intent', 'h3'), richText('Not all searches are created equal. Informational queries need educational content. Transactional queries need clear calls to action.'), richText('Funnel Mapping', 'h3'), richText('Map your content to each stage of the buyer journey. Top of funnel builds awareness. Middle builds trust. Bottom drives action.'), richText('Measuring What Matters', 'h3'), richText('Page views and time on page are vanity metrics. Track conversions, lead quality, and revenue attribution.')]},
]

// ============================================================================
// 7. CLAUDE TRAINING
// ============================================================================

const claudeInstructionsDoc = {
  _type: 'claudeInstructions', _id: 'claudeInstructions',
  writingGuidelines: [richText('Heading Hierarchy', 'h2'), listItem('Use h1 exactly once per page, typically in the hero section'), listItem('Use h2 for main section headings'), listItem('Use h3 and h4 for subsections - never skip levels (e.g., h2 → h4)'), listItem('Each section should follow proper semantic heading order'), richText('Content Tone & Style', 'h2'), listItem('Write clear, scannable content - front-load important information'), listItem('Use active voice rather than passive voice'), listItem('Keep headings concise (2-6 words) and descriptive'), listItem('Break content into digestible paragraphs - avoid walls of text'), listItem('Use bullet points for lists of 3+ items'), richText('Accessibility', 'h2'), listItem('Always provide meaningful alt text for images - describe what the image shows'), listItem('Use descriptive link text - never "click here" or "read more" alone'), listItem('Ensure sufficient color contrast in text'), listItem('Front-load link text with the most important words'), richText('Rich Text Best Practices', 'h2'), listItem('Use maxWidth on rich text blocks for optimal line length and readability'), listItem("Don't overuse bold or italic - reserve for genuine emphasis"), listItem('Use code formatting for technical terms, file names, or code snippets'), listItem('Break long content into multiple paragraphs with clear topic sentences')],
  brandVoice: [richText('Voice Characteristics', 'h2'), listItem('Professional yet approachable - expert but not intimidating'), listItem('Clear and direct - say what you mean without jargon'), listItem('Confident but not arrogant - helpful, not condescending'), listItem('Human and warm - conversational, not robotic'), richText('Writing Principles', 'h2'), listItem('Prefer "you/your" over "we/our" - focus on the user'), listItem('Use active voice: "We designed this" not "This was designed"'), listItem('Be specific rather than vague - concrete examples over abstractions'), listItem('Maintain consistent terminology throughout - pick terms and stick with them'), richText('Tone Adjustments', 'h2'), listItem('Hero sections: Inspiring and bold - grab attention'), listItem('Feature descriptions: Clear and benefit-focused'), listItem('CTAs: Action-oriented and motivating'), listItem('Error messages: Helpful and solution-focused, not blaming')],
  forbiddenTerms: ['Click here', 'Read more', 'Lorem ipsum', 'Welcome to our website', 'Submit', 'TBD', 'Coming soon', 'Under construction', 'Click to learn more', 'See more'],
  preferredTerms: [{_key: generateKey(), _type: 'preferredTerm', avoid: 'Click here', useInstead: 'Specific action (e.g., View pricing, Download guide)'}, {_key: generateKey(), _type: 'preferredTerm', avoid: 'Submit', useInstead: 'Specific action (e.g., Send message, Create account, Save changes)'}, {_key: generateKey(), _type: 'preferredTerm', avoid: 'Read more', useInstead: 'Content-specific text (e.g., Read the full article, View case study)'}, {_key: generateKey(), _type: 'preferredTerm', avoid: 'Info', useInstead: 'Information (or more specific term)'}, {_key: generateKey(), _type: 'preferredTerm', avoid: 'We/Our (overuse)', useInstead: 'You/Your (user-focused language)'}, {_key: generateKey(), _type: 'preferredTerm', avoid: 'Utilize', useInstead: 'Use'}, {_key: generateKey(), _type: 'preferredTerm', avoid: 'In order to', useInstead: 'To'}, {_key: generateKey(), _type: 'preferredTerm', avoid: 'At this point in time', useInstead: 'Now / Currently'}, {_key: generateKey(), _type: 'preferredTerm', avoid: 'Leverage', useInstead: 'Use / Apply'}, {_key: generateKey(), _type: 'preferredTerm', avoid: 'Synergy', useInstead: 'Collaboration / Working together'}],
  writingKeywords: 'write, writing, copy, text, content, heading, title, description, paragraph, rich text, blog, article, post, caption, label, tone, voice, style, language, word, sentence, grammar',
  designSystemRules: [richText('12-Column Grid System', 'h2'), listItem('Column widths: 1-12 (spans), plus "auto" (content-fit) and "fill" (flex grow)'), listItem('Responsive widths: widthDesktop, widthTablet, widthMobile'), listItem('Use "inherit" for tablet/mobile to follow desktop setting'), listItem('Common patterns: 6/6 (two-col), 4/4/4 (three-col), 3/9 (sidebar)'), richText('Spacing Scale', 'h2'), listItem('Gap options: 0, 2, 4, 6, 8, 12 (Tailwind spacing scale)'), listItem('Padding options: 0, 2, 4, 6, 8 (columns)'), listItem('Section padding: "none", "compact", "default", "spacious" (NOT numeric)'), richText('Section Configuration', 'h2'), listItem('Background colors: "primary" or "secondary" only - omit field for default/none'), listItem('Min height: "auto", "small", "medium", "large", "screen", or "custom"'), listItem('Max width: "full", "container", "sm", "md", "lg", "xl", "2xl"'), listItem('Vertical alignment (when min height set): "start", "center", "end"'), richText('Row Configuration', 'h2'), listItem('Horizontal align: "start", "center", "end", "between", "around", "evenly"'), listItem('Vertical align: "start", "center", "end", "stretch", "baseline", "between"'), listItem('Use wrap: true (default) to allow columns to wrap on smaller screens'), listItem('Use reverseOnMobile: true to flip column order on mobile'), richText('Spacing Anti-Patterns', 'h2'), formattedBlock([{text: 'Do NOT', marks: ['strong']}, {text: ' add spacer blocks between text elements (eyebrow → heading → richText → button)'}]), listItem('Components have built-in margins - spacers break natural rhythm'), listItem('Only use spacers for large gaps between distinct content groups'), listItem('Only use spacers after sliders/images where extra breathing room is needed'), richText('Visual Consistency', 'h2'), listItem('Be consistent with eyebrow variants - pick ONE per page (text/overline/pill)'), listItem('Maintain consistent icon sizes within the same context'), listItem('Use consistent button variants for similar actions'), listItem('Align content consistently within sections')],
  componentGuidelines: [{_key: generateKey(), _type: 'componentGuideline', component: 'section', guidelines: 'Sections are the top-level containers. Set backgroundColor to "primary" or "secondary", or omit for default. Use paddingTop/paddingBottom with values: "none", "compact", "default", "spacious". Set minHeight for hero sections.', doNot: 'Do not set backgroundColor to "none" - simply omit the field. Do not use numeric padding values.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'row', guidelines: 'Rows contain columns and control horizontal layout. Use horizontalAlign and verticalAlign for positioning. Set gap (0/2/4/6/8/12) for column spacing. Use reverseOnMobile for mobile-first content ordering.', doNot: 'Do not nest rows inside rows. Do not use rows without columns - add content directly to columns.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'column', guidelines: 'Columns hold content blocks. Set widthDesktop (1-12, "auto", "fill"). Use widthTablet/widthMobile with "inherit" to follow desktop, or override. Set verticalAlign for content positioning within column.', doNot: 'Do not use columns outside of rows. Do not set width to 0 - use "auto" for content-fit sizing.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'headingBlock', guidelines: 'Required: text field. Use level (h1-h6) with h1 once per page. Size can override visual size independently of semantic level. Align: start/center/end.', doNot: 'Do not use multiple h1 tags per page. Do not skip heading levels (h2 → h4). Do not use headings for styling.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'richTextBlock', guidelines: 'Use for multi-paragraph content. Set maxWidth (sm/md/lg/xl/2xl/full) for readability. Supports bold, italic, code, and lists.', doNot: 'Do not use full width for long-form text - line lengths over 80 characters hurt readability.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'eyebrowBlock', guidelines: 'Small label text above headings. Variants: "text" (uppercase), "overline" (with line), "pill" (badge style). Keep text short (2-4 words).', doNot: 'Do not use long text in eyebrows. Do not mix different eyebrow variants on the same page.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'imageBlock', guidelines: 'Required: image and alt text. Use aspectRatio for consistent sizing. Size options: auto/small/medium/large/full. Add rounded and shadow as needed.', doNot: 'Do not leave alt text empty on meaningful images. Do not stretch images disproportionately.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'buttonBlock', guidelines: 'Required: text and link. Variants: primary, secondary, ghost, outline. Use colorScheme to match section. Add icon for visual interest.', doNot: 'Do not use multiple primary buttons in same section. Do not leave link empty. Do not use generic text like "Submit".'}, {_key: generateKey(), _type: 'componentGuideline', component: 'iconBlock', guidelines: 'Uses Phosphor icon library. Size: xs/sm/md/lg/xl. Align: start/center/end. Use marginBottom to control spacing below.', doNot: 'Do not use icons without purpose. Do not mix icon styles inconsistently.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'spacerBlock', guidelines: 'Use sparingly for intentional gaps. Set sizeDesktop and sizeMobile independently.', doNot: 'Do not use spacers between consecutive text elements. Do not use spacers between buttons.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'dividerBlock', guidelines: 'Horizontal line separator. Color: default/muted/subtle. Use marginTop/marginBottom for spacing.', doNot: 'Do not overuse dividers. Do not use dividers when a spacer would suffice.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'cardBlock', guidelines: 'Container with background/border. Variants: default/elevated/outlined. Can contain nested content. Has hover effects.', doNot: 'Do not nest cards deeply - adds nesting depth. Avoid cards inside tabs.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'sliderBlock', guidelines: 'Image carousel. Requires at least 1 slide. slidesPerView: 1/2/3/4/auto. Has autoplay and loop options.', doNot: 'Do not use sliders for critical content that must be seen.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'tabsBlock', guidelines: 'Tabbed content panels. Requires at least 1 tab. Each tab has title and content array.', doNot: 'Do not nest complex content inside tabs - adds significant nesting depth.'}, {_key: generateKey(), _type: 'componentGuideline', component: 'accordionBlock', guidelines: 'Collapsible sections. Requires at least 1 item. allowMultiple for simultaneous open panels.', doNot: 'Do not put critical information in collapsed state. Do not use for just 1-2 items.'}],
  designKeywords: 'design, layout, section, row, column, spacing, padding, margin, style, visual, color, theme, grid, responsive, mobile, desktop, hero, banner, card, button, icon, image, slider, tab, background, overlay, align, width, height',
  technicalConstraints: [richText('Sanity Nesting Limits', 'h2'), formattedBlock([{text: 'Maximum attribute depth: 20 levels', marks: ['strong']}, {text: ' - exceeding this causes API errors'}]), listItem('Page → Section → Row → Column → Block = 5 levels baseline'), listItem('Cards add ~3 levels of nesting depth'), listItem('Tabs add significant depth - avoid nested complex content inside tabs'), listItem('Prefer flat column layouts with icons over deeply nested card structures'), richText('Array Items & Keys', 'h2'), formattedBlock([{text: 'All array items require unique '}, {text: '_key', marks: ['code']}, {text: ' values'}]), listItem('Generate keys with: Math.random().toString(36).substring(2, 12)'), listItem('Never reuse keys across items or documents'), listItem('Missing keys cause silent failures in updates'), richText('Document References', 'h2'), formattedBlock([{text: 'Reference format: '}, {text: '{ _type: "reference", _ref: "document-id" }', marks: ['code']}]), listItem("Settings/hooks only read PUBLISHED documents - drafts won't load"), listItem('Always publish singleton documents (instructions, settings) after editing'), richText('Required Field Validation', 'h2'), listItem('Check schema validation rules before creating content programmatically'), listItem('Buttons without links show magenta dashed outline as visual warning'), listItem('Images without alt text fail accessibility requirements'), listItem('Tabs/accordions require at least one item'), richText('Performance Considerations', 'h2'), listItem('Avoid excessive array items in a single section (keep under 20 blocks)'), listItem('Use lazy loading for images below the fold'), listItem('Minimize nested references in GROQ queries')],
  maxNestingDepth: 12,
  requiredFields: [{_key: generateKey(), _type: 'requiredFieldsRule', component: 'headingBlock', fields: ['text']}, {_key: generateKey(), _type: 'requiredFieldsRule', component: 'buttonBlock', fields: ['text', 'link']}, {_key: generateKey(), _type: 'requiredFieldsRule', component: 'imageBlock', fields: ['image', 'alt']}, {_key: generateKey(), _type: 'requiredFieldsRule', component: 'sliderBlock', fields: ['slides']}, {_key: generateKey(), _type: 'requiredFieldsRule', component: 'tabsBlock', fields: ['tabs']}, {_key: generateKey(), _type: 'requiredFieldsRule', component: 'accordionBlock', fields: ['items']}, {_key: generateKey(), _type: 'requiredFieldsRule', component: 'section', fields: ['rows']}, {_key: generateKey(), _type: 'requiredFieldsRule', component: 'row', fields: ['columns']}, {_key: generateKey(), _type: 'requiredFieldsRule', component: 'column', fields: ['content']}],
  technicalKeywords: 'nest, nesting, depth, schema, structure, field, type, key, sanity, groq, query, api, update, create, delete, duplicate, error, fail, bug, fix, constraint, limit, required',
}

// ============================================================================
// 8. CLAUDE QUICK ACTIONS
// ============================================================================

const quickActions = [
  {_id: 'quick-action-create', _type: 'claudeQuickAction', label: 'Create', description: 'Create new content', icon: 'add', prompt: 'I want to create a new page or document. Help me set up ', category: 'content', order: 10, active: true},
  {_id: 'quick-action-find', _type: 'claudeQuickAction', label: 'Find', description: 'Search for content', icon: 'search', prompt: 'Search my content and find all documents that ', category: 'query', order: 20, active: true},
  {_id: 'quick-action-edit', _type: 'claudeQuickAction', label: 'Edit', description: 'Modify existing content', icon: 'edit', prompt: 'I need to update some existing content. Help me modify ', category: 'content', order: 30, active: true},
  {_id: 'quick-action-explain', _type: 'claudeQuickAction', label: 'Explain', description: 'Learn about the schema', icon: 'help', prompt: 'Explain how the content schema works, specifically ', category: 'help', order: 40, active: true},
]

// ============================================================================
// EXECUTION
// ============================================================================

async function createDocs(label, emoji, docs, nameField = 'name') {
  console.log(`\n${emoji} ${label}...`)
  let count = 0
  for (const doc of docs) {
    const name = doc[nameField] || doc.label || doc.title || doc._id
    try {
      await client.createOrReplace(doc)
      console.log(`   ✓ ${name}`)
      count++
    } catch (error) {
      console.error(`   ✗ ${name}: ${error.message}`)
    }
  }
  return count
}

async function seed() {
  console.log('🌱 Seeding starter content...')

  const singletonLabels = ['Site Settings', 'Navigation', 'Footer', 'Claude API Settings']
  const singletonDocs = [settingsDoc, navigationDoc, footerDoc, claudeApiSettingsDoc]
  console.log('\n📋 Creating singletons...')
  for (let i = 0; i < singletonDocs.length; i++) {
    try {
      await client.createOrReplace(singletonDocs[i])
      console.log(`   ✓ ${singletonLabels[i]}`)
    } catch (error) {
      console.error(`   ✗ ${singletonLabels[i]}: ${error.message}`)
    }
  }

  await createDocs('Creating people', '👤', people, 'firstName')
  await createDocs('Creating content variables', '🏷️ ', contentVariables)
  await createDocs('Creating section templates', '🧩', sectionTemplates)
  await createDocs('Creating pages', '📄', [homePage, mastDemoPage])
  await createDocs('Creating categories', '📂', categories, 'title')
  await createDocs('Creating blog posts', '✏️ ', posts, 'title')

  console.log('\n🤖 Creating Claude training...')
  try {
    await client.createOrReplace(claudeInstructionsDoc)
    console.log('   ✓ Claude Instructions')
  } catch (error) {
    console.error(`   ✗ Claude Instructions: ${error.message}`)
  }

  await createDocs('Creating quick actions', '⚡', quickActions, 'label')

  console.log('\n' + '═'.repeat(50))
  console.log('✅ Seed complete!')
  console.log('📝 Next: Open Sanity Studio and publish all documents.')
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error)
  process.exit(1)
})
