---
name: sanity-best-practices
description: Sanity CMS best practices for schema design, GROQ queries, Visual Editing, Next.js integration, Portable Text, images, migrations, and more. Use when working with Sanity Studio, content modeling, data fetching, or Visual Editing features.
---

# Sanity Best Practices

Comprehensive guidelines for building applications with Sanity CMS. This skill covers schema design, GROQ queries, Visual Editing, framework integrations, and content modeling patterns.

## When to Apply

Reference these guidelines when:
- Designing Sanity schemas or content models
- Writing GROQ queries for data fetching
- Implementing Visual Editing or Presentation Tool
- Integrating Sanity with Next.js, Astro, Remix, Nuxt, or SvelteKit
- Working with Portable Text or images
- Running migrations or managing project structure

## Rule Categories

| Category | File | Description |
|----------|------|-------------|
| **Getting Started** | `sanity-get-started.md` | Project setup and initial configuration |
| **Project Structure** | `sanity-project-structure.md` | Directory organization and file conventions |
| **Schema Design** | `sanity-schema.md` | Content modeling, field patterns, validation |
| **GROQ Queries** | `sanity-groq.md` | Query syntax, performance, fragments |
| **Visual Editing** | `sanity-visual-editing.md` | Presentation Tool, Stega, overlays |
| **Page Builder** | `sanity-page-builder.md` | Block-based layouts and patterns |
| **Portable Text** | `sanity-portable-text.md` | Rich text rendering and customization |
| **Images** | `sanity-image.md` | Image handling, optimization, hotspots |
| **Studio Structure** | `sanity-studio-structure.md` | Customizing Studio navigation and views |
| **Localization** | `sanity-localization.md` | Multi-language content strategies |
| **TypeGen** | `sanity-typegen.md` | TypeScript type generation |
| **Migrations** | `sanity-migration.md` | Schema changes and data migrations |
| **SEO** | `sanity-seo.md` | Metadata and SEO patterns |

### Framework Integrations

| Framework | File | Key Topics |
|-----------|------|------------|
| **Next.js** | `sanity-nextjs.md` | App Router, Live Content API, caching |
| **Astro** | `sanity-astro.md` | Static/SSR integration |
| **Remix** | `sanity-remix.md` | Loader patterns, live preview |
| **Nuxt** | `sanity-nuxt.md` | Module configuration |
| **SvelteKit** | `sanity-svelte.md` | Store-based loading |
| **Hydrogen** | `sanity-hydrogen.md` | Shopify + Sanity patterns |

## Quick Reference

### The Golden Rule of Stega

When Visual Editing is enabled, string fields contain invisible characters. Clean them before logic:

```typescript
import { stegaClean } from "@sanity/client/stega";

// Always clean before comparison
const cleanAlign = stegaClean(align);
if (cleanAlign === 'center') { /* ... */ }
```

### Schema Definition Syntax

Always use helper functions for type safety:

```typescript
import { defineType, defineField, defineArrayMember } from 'sanity'

export const article = defineType({
  name: 'article',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })]
    })
  ]
})
```

### GROQ Query Best Practices

```groq
// Always wrap in defineQuery for TypeGen
const QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{
    title,
    // Expand references explicitly
    author->{ name, bio },
    // Use coalesce for defaults
    "image": coalesce(mainImage, defaultImage)
  }
`)
```

### Array Keys for React

Always use `_key` for array items:

```typescript
// Correct - uses Sanity's _key
{items.map((item) => <Component key={item._key} {...item} />)}

// Wrong - breaks Visual Editing
{items.map((item, i) => <Component key={i} {...item} />)}
```

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/sanity-schema.md      # Content modeling patterns
rules/sanity-groq.md        # Query optimization
rules/sanity-nextjs.md      # Next.js integration
rules/sanity-visual-editing.md  # Presentation Tool setup
```

Each rule file contains:
- Best practices with rationale
- Code examples (correct and incorrect)
- Common patterns and pitfalls
- Framework-specific guidance where applicable
