# Code Review: Unless Mast Sanity

**Review Date:** January 2026
**Reviewer:** Claude (AI-assisted review)
**Project:** Mast Design System with Next.js + Sanity CMS
**Best Practices:** Verified against [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills) and [Sanity Agent Toolkit](https://github.com/sanity-io/agent-toolkit)

---

## Executive Summary

This is a **production-grade headless CMS implementation** combining Next.js 15 (App Router) with Sanity Studio v3. The project implements the "Mast" design system and features a sophisticated page builder, real-time visual editing, and a custom Claude AI assistant integration.

### Best Practices Compliance

This codebase has been audited against industry best practices:

- **Vercel React Best Practices** (45+ rules) - React/Next.js performance optimization patterns
- **Sanity Agent Toolkit** (20+ rules) - CMS schema design, GROQ queries, visual editing, and TypeGen patterns

The best practices rule files are installed in:
- `.claude/skills/react-best-practices/` - React/Next.js optimization rules
- `.cursor/rules/` - Sanity CMS best practices

### Key Strengths
- Comprehensive TypeScript coverage with generated types
- Flexible page builder with hierarchical layout system
- Real-time visual editing with custom overlays
- Modern CSS architecture (Tailwind v4, CSS-first)
- Clean component composition patterns
- Advanced AI content creation tools

### Tech Stack at a Glance
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript 5.9 |
| CMS | Sanity v4.20, Sanity Studio v3 |
| Styling | Tailwind CSS v4 (CSS-first) |
| UI Components | Radix UI, Phosphor Icons |
| AI Integration | Anthropic Claude API |
| Build | Turbopack, npm workspaces |

---

## Project Architecture

### Monorepo Structure

```
/unless-mast-sanity
├── frontend/                 # Next.js 15 application
│   ├── app/                  # App Router pages & components
│   │   ├── components/       # React components
│   │   │   ├── blocks/       # Page builder block components
│   │   │   ├── ui/           # Base UI primitives
│   │   │   └── overlays/     # Visual editing overlays
│   │   ├── api/              # API routes
│   │   └── [slug]/           # Dynamic page routing
│   ├── sanity/               # Sanity client & queries
│   └── lib/                  # Shared utilities
│
├── studio/                   # Sanity Studio v3
│   ├── src/
│   │   ├── schemaTypes/      # Content schemas
│   │   │   ├── documents/    # Page, Post, Person
│   │   │   ├── objects/      # Section, Row, Column, Blocks
│   │   │   └── singletons/   # Settings, Navigation, Footer
│   │   ├── plugins/          # Claude assistant plugin
│   │   └── structure/        # Studio navigation config
│   └── sanity.config.ts      # Main configuration
│
├── scripts/                  # Seeding scripts (.mjs)
└── package.json              # Workspace root
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sanity Studio                             │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────────┐ │
│  │ Document │ → │ Page Builder │ → │ Section → Row → Column  │ │
│  │  Editor  │   │   (Schema)   │   │        → Blocks         │ │
│  └──────────┘   └──────────────┘   └─────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │ GROQ Queries
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                            │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────────┐ │
│  │ sanity   │ → │ PageBuilder  │ → │ BlockRenderer           │ │
│  │ Fetch()  │   │  Component   │   │  → Section, Row, etc.   │ │
│  └──────────┘   └──────────────┘   └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### App Router Structure

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Home page (hardcoded slug: 'home') |
| `/[slug]` | `app/[slug]/page.tsx` | Dynamic pages from Sanity |
| `/posts/[slug]` | `app/posts/[slug]/page.tsx` | Blog posts |
| `/design-system` | `app/design-system/page.tsx` | Design system showcase |
| `/api/draft-mode/*` | API routes | Draft mode enable/disable |
| `/api/claude` | API route | Claude AI streaming endpoint |

### Component Hierarchy

```
PageBuilder
└─ BlockRenderer (type-based dispatch)
   ├─ Section (nested layout block)
   │  └─ Row
   │     └─ Column
   │        └─ ContentBlockRenderer
   │           └─ HeadingBlock, RichTextBlock, ImageBlock, etc.
   ├─ CallToAction (simple block)
   └─ InfoSection (simple block)
```

### Block Types Reference

**Layout Blocks:**
- `Section` - Container with background, padding, max-width options
- `Row` - Horizontal flex container with gap and alignment
- `Column` - Width-controlled column (12-column grid)

**Content Blocks:**
- `HeadingBlock` - h1-h6 with size, align, color options
- `RichTextBlock` - Portable text with typography controls
- `EyebrowBlock` - Small label (text/overline/pill variants)
- `ImageBlock` - Image with aspect ratio, size, rounded, shadow
- `ButtonBlock` - Button with variant, colorScheme, icon
- `IconBlock` - Phosphor icons with size and color

**Interactive Blocks:** *(dynamically imported for bundle optimization)*
- `AccordionBlock` - Collapsible sections
- `TabsBlock` - Tabbed content panels (dynamic import)
- `SliderBlock` - Image carousel using Swiper (dynamic import)
- `ModalBlock` - Dialog/modal trigger (dynamic import)

**Utility Blocks:**
- `SpacerBlock` - Vertical spacing
- `DividerBlock` - Horizontal line
- `CardBlock` - Container with styling options
- `TableBlock` - Responsive tables
- `MarqueeBlock` - Scrolling text
- `InlineVideoBlock` - Embedded video

### Data Fetching Pattern

```typescript
// sanity/lib/live.ts - Real-time updates setup
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,      // Allows draft content
  browserToken: token,     // Shared only in valid draft mode
  fetchOptions: { revalidate: 0 },
});

// Usage in page component
const { data: page } = await sanityFetch({
  query: getPageQuery,
  params: { slug },
  stega: false,  // Disable for metadata
});
```

### Styling Architecture

**Tailwind CSS v4 (CSS-First)**

Configuration is minimal (`tailwind.config.ts`):
```typescript
export default {
  content: ['./app/**/*.{ts,tsx}', './sanity/**/*.{ts,tsx}'],
  future: { hoverOnlyWhenSupported: true },
}
```

All theming lives in `app/globals.css`:

```css
/* Theme tokens via @theme directive */
@theme {
  --color-brand-primary: #0066FF;
  --color-gray-50: #fafafa;
  --font-display: "General Sans", sans-serif;
  /* ... generates Tailwind utilities automatically */
}

/* Semantic variables for theming */
:root {
  --primary-bg: light-dark(white, #0a0a0a);
  --primary-text: light-dark(#171717, #ededed);
  --component-button-primary-bg: var(--color-brand-primary);
}
```

**Class Merging Utility:**
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Sanity Studio Architecture

### Schema Organization

```
schemaTypes/
├── documents/
│   ├── page.ts              # Main page document
│   ├── post.ts              # Blog posts
│   ├── person.ts            # Authors
│   └── claude*.ts           # AI conversation storage
├── objects/
│   ├── section.ts           # Page section container
│   ├── row.ts               # Row layout
│   ├── column.ts            # Column layout
│   ├── blocks/              # All content blocks
│   │   ├── headingBlock.ts
│   │   ├── richTextBlock.ts
│   │   └── ... (20+ blocks)
│   ├── link.ts              # Link object
│   └── blockContent.ts      # Portable text config
├── singletons/
│   ├── settings.ts          # Site settings
│   ├── navigation.ts        # Header nav
│   └── footer.ts            # Footer config
└── index.ts                 # All exports
```

### Page Builder Schema

```typescript
// Section fields
{
  label: string,
  rows: Row[],
  backgroundColor: 'primary' | 'secondary',  // NOT 'none' - omit for default
  backgroundImage: image,
  backgroundOverlay: 0 | 20 | 40 | 60 | 80,
  minHeight: 'auto' | 'small' | 'medium' | 'large' | 'screen' | 'custom',
  maxWidth: 'full' | 'container' | 'sm' | 'md' | 'lg' | 'xl' | '2xl',
  paddingTop: 'none' | 'compact' | 'default' | 'spacious',
  verticalAlign: 'start' | 'center' | 'end',
}

// Row fields
{
  columns: Column[],
  horizontalAlign: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly',
  verticalAlign: 'start' | 'center' | 'end' | 'stretch' | 'baseline' | 'between',
  gap: '0' | '2' | '4' | '6' | '8' | '12',
  wrap: boolean,
  reverseOnMobile: boolean,
}

// Column fields
{
  content: Block[],
  widthDesktop: 'auto' | 'fill' | '1'-'12',
  widthTablet: 'inherit' | 'auto' | 'fill' | '1'-'12',
  widthMobile: 'inherit' | 'auto' | 'fill' | '1'-'12',
  verticalAlign: 'start' | 'center' | 'end' | 'between',
  padding: '0' | '2' | '4' | '6' | '8',
}
```

### Studio Plugins

1. **Presentation Tool** - Visual editing with live preview
2. **Structure Tool** - Custom navigation with orderable pages
3. **Claude Assistant** - AI content creation (custom plugin)
4. **Vision** - GROQ query playground
5. **Unsplash** - Stock image integration
6. **Sanity Assist** - AI suggestions

### Custom Components

Custom form inputs are kept in separate `.tsx` files:

```typescript
// schemaTypes/components/PageFormInput.tsx
export const PageFormInput = (props: ObjectInputProps) => {
  // Check if we're in Structure mode (not Presentation)
  const isStructureMode = typeof window !== 'undefined'
    && !window.location.pathname.includes('/presentation');

  return (
    <Stack space={4}>
      {isStructureMode && <OpenInPresentationBanner />}
      {props.renderDefault(props)}
    </Stack>
  );
};
```

---

## Claude AI Integration

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Sanity Studio                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Claude Assistant Plugin                 │   │
│  │  ┌──────────┐  ┌───────────┐  ┌─────────────────┐  │   │
│  │  │ Chat UI  │  │  Hooks    │  │  Operations     │  │   │
│  │  │ Messages │  │ useChat   │  │ CRUD Documents  │  │   │
│  │  │ Actions  │  │ useConv   │  │ Schema Context  │  │   │
│  │  └──────────┘  └───────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ POST /api/claude
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend API Route                        │
│  • Validates request                                         │
│  • Builds system prompt with schema context                  │
│  • Streams response via SSE                                  │
│  • Handles rate limits and errors                            │
└─────────────────────────────────────────────────────────────┘
```

### Key Features
- **Multimodal support** - Text and image inputs
- **Conversation persistence** - Stored in Sanity
- **Action parsing** - Claude can create/update/delete documents
- **Schema awareness** - Context injected into prompts
- **Floating chat** - Available across all Studio tools

---

## Type Safety

### Generated Types

```bash
# Generate types from Sanity schema
npm run typegen
```

This creates `frontend/sanity.types.ts` with:
- Document types (`Page`, `Post`, `Person`)
- Object types (`Section`, `Row`, `Column`, all blocks)
- Query result types (`GetPageQueryResult`, etc.)

### Type-Safe Queries

```typescript
// sanity/lib/queries.ts
export const getPageQuery = defineQuery(`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    name,
    pageBuilder[] {
      ...,
      // Expand nested content
    }
  }
`);

// Usage with automatic typing
const { data: page } = await sanityFetch({
  query: getPageQuery,
  params: { slug: 'home' },
});
// page is typed as GetPageQueryResult
```

### Component Props Pattern

```typescript
// Most blocks use generated types
interface HeadingBlockProps {
  block: HeadingBlock;  // From sanity.types.ts
}

// Some use looser typing (area for improvement)
interface RowProps {
  row: any;  // Should be Row from sanity.types.ts
  pageId?: string;
  pageType?: string;
}
```

---

## Code Quality Analysis

### Strengths

| Area | Assessment |
|------|------------|
| **Type Coverage** | Excellent - Full TypeScript with generated types |
| **Component Architecture** | Excellent - Clear composition patterns |
| **Separation of Concerns** | Excellent - Frontend/studio cleanly separated |
| **CSS Architecture** | Excellent - Modern CSS-first Tailwind approach |
| **Real-Time Features** | Excellent - Live preview and visual editing |
| **Documentation** | Good - CLAUDE.md provides clear guidance |
| **Error Handling** | Good - API routes handle errors properly |

### Areas for Improvement

| Area | Issue | Recommendation | Status |
|------|-------|----------------|--------|
| **Loose Typing** | Some components use `any` for props | Use generated types consistently | Open |
| **CSS Parsing** | Row.tsx parses custom CSS with regex | Consider safer parsing or validation | Open |
| **Overlay Selectors** | Visual editing overlays use fragile DOM selectors | Abstract into constants, add tests | Open |
| **API Security** | Claude endpoint uses `Access-Control-Allow-Origin: *` | Restrict to known origins | Open |
| **Nesting Depth** | Sanity 20-level limit could be hit with deep structures | Monitor and add validation | Open |
| **Bundle Size** | Heavy components loaded eagerly | Use dynamic imports | ✅ Done |
| **Image Loading** | No blur placeholders for images | Add LQIP support | ✅ Done |
| **Icon Imports** | Barrel imports increase bundle | Use SSR-specific paths | ✅ Done |
| **Schema Types** | Missing defineArrayMember wrappers | Add for TypeGen | ✅ Done |

### Specific Recommendations

**1. Tighten Component Props**

```typescript
// Before
interface RowProps {
  row: any;
}

// After
import { Row } from '@/sanity.types';
interface RowProps {
  row: Row;
  pageId?: string;
  pageType?: string;
}
```

**2. Improve Custom CSS Handling**

```typescript
// Before (fragile regex parsing)
const gridClasses = customStyle?.match(/grid-template-columns[^;]+/);

// After (structured approach)
interface CustomStyles {
  gridTemplateColumns?: string;
  gap?: string;
}
// Or use a CSS parser library
```

**3. Restrict CORS Origins**

```typescript
// Before
headers: { 'Access-Control-Allow-Origin': '*' }

// After
const allowedOrigins = [
  'http://localhost:3333',
  'https://your-studio.sanity.studio'
];
const origin = request.headers.get('origin');
headers: {
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : ''
}
```

---

## Performance Considerations

### Current Optimizations
- Static generation for published pages (`generateStaticParams`)
- CDN enabled for Sanity content API
- Next.js Image component for image optimization
- Turbopack for fast development builds
- CSS-first Tailwind (smaller CSS output)
- **Dynamic imports** for heavy components (SliderBlock, TabsBlock, ModalBlock) - reduces initial bundle
- **Blur placeholders (LQIP)** on images - provides visual feedback during image loading
- **Optimized icon imports** using `@phosphor-icons/react/dist/ssr` for better tree-shaking
- **defineArrayMember wrappers** in schemas for improved TypeGen type generation

### Potential Improvements
- Consider ISR (Incremental Static Regeneration) for frequently updated pages
- Add `loading.tsx` files for streaming SSR
- Consider preloading critical fonts
- Implement tag-based revalidation with webhooks for granular cache control

---

## Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| Environment variables | Check `.env.local` is gitignored | Studio `.env` may have tokens |
| API token exposure | Frontend token has limited scope | Verify read-only |
| CORS configuration | Currently allows all origins | Should be restricted |
| Input validation | API routes validate inputs | Good |
| XSS prevention | React handles by default | Portable text is safe |
| Draft mode auth | Uses Sanity's built-in auth | Good |

---

## Development Workflow

### Running Locally

```bash
# Install dependencies
npm install

# Start both frontend and studio
npm run dev

# Or run separately
npm run dev:next    # Frontend on port 4000
npm run dev:studio  # Studio on port 3333
```

### Docker Development (OrbStack)

```bash
# Frontend
cd frontend && docker compose up -d

# Studio
cd studio && docker compose up -d
```

### Type Generation

```bash
# Generate TypeScript types from Sanity schema
npm run typegen

# Or from studio directory
cd studio && npm run extract-types
```

### Seeding Content

```bash
# Requires SANITY_API_TOKEN with write permissions
SANITY_API_TOKEN="token" npm run seed-mast-sanity
SANITY_API_TOKEN="token" npm run seed-home
```

---

## File Reference

### Key Frontend Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with theme script, navigation, footer |
| `app/page.tsx` | Home page component |
| `app/[slug]/page.tsx` | Dynamic page routing |
| `app/globals.css` | Tailwind theme and CSS variables |
| `app/components/PageBuilder.tsx` | Renders pageBuilder array |
| `app/components/BlockRenderer.tsx` | Type-based block dispatch |
| `sanity/lib/client.ts` | Sanity client configuration |
| `sanity/lib/queries.ts` | GROQ queries |
| `sanity/lib/live.ts` | Real-time updates setup |
| `sanity.types.ts` | Generated TypeScript types |

### Key Studio Files

| File | Purpose |
|------|---------|
| `sanity.config.ts` | Main Sanity configuration |
| `src/schemaTypes/index.ts` | Schema type exports |
| `src/schemaTypes/documents/page.ts` | Page document schema |
| `src/schemaTypes/objects/section.ts` | Section object schema |
| `src/structure/index.ts` | Studio navigation structure |
| `src/plugins/claude-assistant/` | AI assistant plugin |

---

## Conclusion

This project demonstrates **professional-grade architecture** for a headless CMS implementation. The combination of Next.js App Router patterns, comprehensive TypeScript coverage, and a flexible page builder creates a solid foundation for content-driven websites.

The codebase has been optimized following Vercel React and Sanity best practices, with particular focus on:
- Bundle size optimization through dynamic imports
- Image loading experience with blur placeholders
- Schema type safety with defineArrayMember patterns
- Efficient icon imports for reduced client bundle size

**Recommended next steps:**
1. Tighten TypeScript types in block components (some use `any` for props)
2. Add unit tests for critical utilities
3. Document the page builder block options for content editors
4. Consider adding Storybook for component documentation
5. Review and restrict CORS configuration before production deployment
6. Consider implementing tag-based revalidation for granular cache control

**Completed optimizations (January 2026):**
- ✅ Dynamic imports for heavy block components
- ✅ Image blur placeholders (LQIP)
- ✅ Optimized icon imports (SSR-specific paths)
- ✅ Schema defineArrayMember wrappers
- ✅ Best practices toolkits installed

---

*This review was generated with AI assistance and verified against Vercel React Best Practices and Sanity Agent Toolkit guidelines. Manual verification of specific code paths is recommended before making architectural decisions.*
