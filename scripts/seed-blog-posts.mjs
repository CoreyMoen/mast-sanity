/**
 * Seed script for example blog posts
 * Run with: SANITY_API_TOKEN="your-token" node scripts/seed-blog-posts.mjs
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

// Categories to create
const categories = [
  {
    _id: 'category-design',
    _type: 'category',
    title: 'Design',
    slug: {_type: 'slug', current: 'design'},
    description: 'Articles about design principles, UI/UX, and visual aesthetics',
  },
  {
    _id: 'category-development',
    _type: 'category',
    title: 'Development',
    slug: {_type: 'slug', current: 'development'},
    description: 'Technical articles about web development, coding, and engineering',
  },
  {
    _id: 'category-business',
    _type: 'category',
    title: 'Business',
    slug: {_type: 'slug', current: 'business'},
    description: 'Insights on business strategy, growth, and entrepreneurship',
  },
]

// Blog posts to create
const posts = [
  {
    _id: 'post-getting-started-design-systems',
    _type: 'post',
    title: 'Getting Started with Design Systems',
    slug: {_type: 'slug', current: 'getting-started-design-systems'},
    summary:
      'Learn the fundamentals of building a cohesive design system that scales with your team and product. We cover tokens, components, and documentation strategies.',
    date: '2025-01-15T10:00:00Z',
    categories: [{_type: 'reference', _ref: 'category-design', _key: generateKey()}],
    content: [
      richText('Getting Started with Design Systems', 'h2'),
      richText(
        'A design system is more than just a component library. It\'s a comprehensive set of standards, documentation, and principles that guide how your product looks and feels.',
      ),
      richText(
        'In this article, we\'ll explore the key building blocks of an effective design system and how to implement one that grows with your organization.',
      ),
      richText('Why Design Systems Matter', 'h3'),
      richText(
        'Design systems create consistency across your product, speed up development, and ensure accessibility standards are met. They serve as the single source of truth for both designers and developers.',
      ),
      richText(
        'When implemented correctly, a design system can reduce design debt, improve collaboration between teams, and create a more cohesive user experience.',
      ),
      richText('Core Components', 'h3'),
      richText(
        'Every design system should include: design tokens (colors, typography, spacing), core components (buttons, inputs, cards), patterns (forms, navigation), and comprehensive documentation.',
      ),
      richText(
        'Start small and iterate. Begin with your most commonly used components and expand from there based on real usage patterns.',
      ),
    ],
  },
  {
    _id: 'post-modern-web-development-2025',
    _type: 'post',
    title: 'Modern Web Development in 2025',
    slug: {_type: 'slug', current: 'modern-web-development-2025'},
    summary:
      'An overview of the latest trends and best practices in web development, from server components to edge computing and beyond.',
    date: '2025-01-10T14:30:00Z',
    categories: [{_type: 'reference', _ref: 'category-development', _key: generateKey()}],
    content: [
      richText('Modern Web Development in 2025', 'h2'),
      richText(
        'The web development landscape continues to evolve rapidly. Server components, edge computing, and AI-assisted development are reshaping how we build applications.',
      ),
      richText('Server Components and Streaming', 'h3'),
      richText(
        'React Server Components have matured significantly, allowing developers to build more efficient applications by moving rendering to the server where appropriate.',
      ),
      richText(
        'Combined with streaming and Suspense boundaries, we can deliver faster initial page loads while maintaining rich interactivity.',
      ),
      richText('Edge Computing', 'h3'),
      richText(
        'Edge functions and databases bring computation closer to users, reducing latency and improving performance globally. Platforms like Vercel, Cloudflare, and Deno Deploy make this accessible.',
      ),
      richText('AI in Development', 'h3'),
      richText(
        'AI coding assistants have become essential tools, helping with everything from code generation to debugging. The key is knowing when to use them and how to verify their output.',
      ),
    ],
  },
  {
    _id: 'post-scaling-your-startup',
    _type: 'post',
    title: 'Scaling Your Startup: Lessons Learned',
    slug: {_type: 'slug', current: 'scaling-your-startup'},
    summary:
      'Practical advice on growing your business from early-stage to scale-up, covering team building, processes, and maintaining culture.',
    date: '2025-01-05T09:00:00Z',
    categories: [{_type: 'reference', _ref: 'category-business', _key: generateKey()}],
    content: [
      richText('Scaling Your Startup: Lessons Learned', 'h2'),
      richText(
        'Growing a startup from a small team to a larger organization brings unique challenges. Here are some hard-won lessons from the trenches.',
      ),
      richText('Hiring Right', 'h3'),
      richText(
        'Your early hires set the culture for everyone who follows. Look for people who are adaptable, curious, and aligned with your mission. Skills can be taught; attitude is harder to change.',
      ),
      richText('Processes That Scale', 'h3'),
      richText(
        'What works for a team of 5 won\'t work for a team of 50. Invest in documentation, clear communication channels, and repeatable processes early.',
      ),
      richText(
        'But don\'t over-engineer. Add process only when the pain of not having it exceeds the cost of implementing it.',
      ),
      richText('Maintaining Culture', 'h3'),
      richText(
        'Culture is what happens when no one is watching. Define your values early, hire people who embody them, and be intentional about preserving what makes your company special as you grow.',
      ),
    ],
  },
  {
    _id: 'post-accessible-design-patterns',
    _type: 'post',
    title: 'Building Accessible Design Patterns',
    slug: {_type: 'slug', current: 'accessible-design-patterns'},
    summary:
      'How to create inclusive interfaces that work for everyone. Covers ARIA, keyboard navigation, color contrast, and testing strategies.',
    date: '2024-12-28T11:00:00Z',
    categories: [
      {_type: 'reference', _ref: 'category-design', _key: generateKey()},
      {_type: 'reference', _ref: 'category-development', _key: generateKey()},
    ],
    content: [
      richText('Building Accessible Design Patterns', 'h2'),
      richText(
        'Accessibility isn\'t an afterthought—it\'s a fundamental aspect of good design. When we build for accessibility, we build better products for everyone.',
      ),
      richText('Understanding ARIA', 'h3'),
      richText(
        'ARIA (Accessible Rich Internet Applications) provides attributes that help screen readers understand dynamic content. But remember: the first rule of ARIA is don\'t use ARIA unless you need to.',
      ),
      richText(
        'Native HTML elements come with built-in accessibility. A button element is better than a div with role="button" in almost every case.',
      ),
      richText('Keyboard Navigation', 'h3'),
      richText(
        'Many users navigate entirely by keyboard. Ensure all interactive elements are focusable, focus order is logical, and focus states are visible.',
      ),
      richText('Color and Contrast', 'h3'),
      richText(
        'WCAG requires a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text. Don\'t rely on color alone to convey meaning—use icons, text, or patterns as well.',
      ),
      richText('Testing', 'h3'),
      richText(
        'Test with real assistive technologies. Tools like axe and Lighthouse can catch common issues, but nothing replaces testing with actual screen readers and keyboard-only navigation.',
      ),
    ],
  },
  {
    _id: 'post-content-strategy-that-converts',
    _type: 'post',
    title: 'Content Strategy That Actually Converts',
    slug: {_type: 'slug', current: 'content-strategy-that-converts'},
    summary:
      'Move beyond vanity metrics and create content that drives real business results. Learn about funnel mapping, user intent, and measuring what matters.',
    date: '2024-12-20T16:00:00Z',
    categories: [{_type: 'reference', _ref: 'category-business', _key: generateKey()}],
    content: [
      richText('Content Strategy That Actually Converts', 'h2'),
      richText(
        'Traffic means nothing if it doesn\'t lead to conversions. Here\'s how to create content that moves readers through your funnel and drives real business results.',
      ),
      richText('Understanding User Intent', 'h3'),
      richText(
        'Not all searches are created equal. Informational queries need educational content. Transactional queries need clear calls to action. Match your content to the intent.',
      ),
      richText('Funnel Mapping', 'h3'),
      richText(
        'Map your content to each stage of the buyer journey. Top of funnel content builds awareness. Middle content builds trust and consideration. Bottom content drives action.',
      ),
      richText(
        'Don\'t ask for the sale in a blog post that\'s meant to educate. Meet readers where they are.',
      ),
      richText('Measuring What Matters', 'h3'),
      richText(
        'Page views and time on page are vanity metrics. Track conversions, lead quality, and revenue attribution. A post with 100 views that generates 10 leads is better than one with 10,000 views and no conversions.',
      ),
      richText('Iteration and Optimization', 'h3'),
      richText(
        'Content strategy is never "done." Regularly audit your content, update what\'s working, prune what isn\'t, and continuously test new approaches.',
      ),
    ],
  },
]

async function seedContent() {
  console.log('Starting blog post seed...\n')

  // Create categories first
  console.log('Creating categories...')
  for (const category of categories) {
    try {
      await client.createOrReplace(category)
      console.log(`  ✓ Created category: ${category.title}`)
    } catch (error) {
      console.error(`  ✗ Error creating category ${category.title}:`, error.message)
    }
  }

  console.log('\nCreating blog posts...')
  for (const post of posts) {
    try {
      await client.createOrReplace(post)
      console.log(`  ✓ Created post: ${post.title}`)
    } catch (error) {
      console.error(`  ✗ Error creating post ${post.title}:`, error.message)
    }
  }

  console.log('\n✓ Blog post seed complete!')
  console.log(`  Created ${categories.length} categories and ${posts.length} posts`)
}

seedContent().catch(console.error)
