# Claude Code Project Instructions

This document contains project-specific instructions and context for Claude Code when working on this codebase.

## Project Overview

This is a **Mast design system** implementation using:
- **Frontend**: Next.js 15 with App Router
- **CMS**: Sanity Studio v3 with Visual Editing/Presentation mode
- **Styling**: Tailwind CSS v4 with CSS-first configuration

## Environment Constraints

### No esbuild/tsx on this machine
The `npx tsx` command does not work due to esbuild issues. When creating seed scripts or Node.js utilities:
- Use `.mjs` extension with ES modules (`import`/`export`)
- Run with plain `node scripts/filename.mjs`
- Avoid TypeScript for scripts that need to run directly

### Dev Servers via Docker/OrbStack
**IMPORTANT**: Dev servers cannot be started directly from the terminal on this machine. They must be run via Docker containers in the OrbStack app.

- **Do NOT** attempt to run `npm run dev`, `npm run dev:next`, or `npm run dev:studio` directly
- The user manages dev servers through OrbStack's Docker interface
- Frontend runs in Docker on port 4000, Studio on port 3333
- For verification, use TypeScript compilation (`npx tsc --noEmit`) instead of starting dev servers
- If the user needs to restart servers, they will do it manually via OrbStack

## Sanity Content Architecture

### Page Structure Hierarchy
```
Page
└── pageBuilder (array)
    ├── section
    │   └── rows (array)
    │       └── row
    │           └── columns (array)
    │               └── column
    │                   └── content (array of blocks)
    ├── callToAction
    └── infoSection
```

### Sanity API Nesting Limit
**CRITICAL**: Sanity has a **maximum attribute depth of 20 levels**. When creating pages programmatically:
- Avoid deeply nested structures like tabs containing rows containing columns containing complex blocks
- Card blocks add extra nesting depth - use flat column layouts with icons instead when possible
- Test complex layouts by running the seed script before finalizing

### Creating Pages via Script

1. Create a `.mjs` file in `/scripts/`
2. Use the `@sanity/client` package
3. Requires `SANITY_API_TOKEN` environment variable with write permissions
4. Run with: `SANITY_API_TOKEN="your-token" node scripts/your-script.mjs`

Example seed script pattern:
```javascript
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '6lj3hi0f',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Helper to generate unique keys (required for all array items)
const generateKey = () => Math.random().toString(36).substring(2, 12)

// All nested objects need _type and _key
const page = {
  _type: 'page',
  _id: 'your-page-id',
  name: 'Page Name',
  slug: { _type: 'slug', current: 'page-slug' },
  pageBuilder: [/* sections */]
}

await client.createOrReplace(page)
```

### Available Block Types
- `headingBlock` - h1-h6 with size, align, color options
- `richTextBlock` - Portable text with size, align, color, maxWidth
- `eyebrowBlock` - Small label text with variant (text/overline/pill)
- `imageBlock` - Image with aspectRatio, size, rounded, shadow
- `buttonBlock` - Button with variant, colorScheme, icon
- `iconBlock` - Phosphor icons with size, color, align, marginBottom
- `spacerBlock` - Vertical spacing with sizeDesktop/sizeMobile
- `dividerBlock` - Horizontal line with margins and color
- `cardBlock` - Container with content array (adds nesting depth!)
- `sliderBlock` - Image carousel
- `tabsBlock` - Tabbed content (adds significant nesting depth!)
- `accordionBlock` - Collapsible sections

## Content Best Practices

### Spacing Guidelines
**Do NOT add spacer blocks between text elements or buttons.** Most components have default bottom margins that create natural spacing. Only use spacers for:
- Large gaps between distinct content groups
- Spacing between sections/rows
- After sliders or images where extra breathing room is needed

**Bad example:**
```
eyebrowBlock → spacerBlock → headingBlock → spacerBlock → richTextBlock → spacerBlock → buttonBlock
```

**Good example:**
```
eyebrowBlock → headingBlock → richTextBlock → buttonBlock
```

The same applies to button groups - don't add spacers between buttons in a row. The row's `gap` property handles button spacing.

### Heading Hierarchy (SEO & Accessibility)
Always follow proper heading order within each section for SEO and accessibility:
- Each page should have exactly ONE `h1` (typically in the hero section)
- Sections should start with `h2` headings
- Subsections use `h3`, then `h4`, etc.
- Never skip levels (e.g., don't go from `h2` directly to `h4`)

**Example section structure:**
```
h2: Section Title
  h3: Subsection
    h4: Detail heading
  h3: Another subsection
```

### Eyebrow Consistency
Be consistent with eyebrow variants throughout a page. Pick ONE variant and stick with it:
- `text` - Plain uppercase text (most common)
- `overline` - Text with decorative line
- `pill` - Text in a pill/badge shape

Don't mix `overline` eyebrows in some sections and `text` eyebrows in others.

### Button Links
Buttons without a valid link will still render with their proper variant styling (primary, secondary, ghost) but will display a **magenta dashed outline** (3px thick, 3px offset) to indicate the missing link. This makes it easy to spot buttons that need links while editing in Presentation mode.

When creating pages via script, always set a `url` property on buttons, even if it's just `'#'` as a placeholder.

### Schema Field Reference

**IMPORTANT**: Always check these schemas for the latest field names before creating pages via script:
- Section: `studio/src/schemaTypes/objects/section.ts`
- Row: `studio/src/schemaTypes/objects/row.ts`
- Column: `studio/src/schemaTypes/objects/column.ts`
- Block types: `studio/src/schemaTypes/objects/blocks/`

#### Section Fields
```
label: string              - Internal label (not displayed)
rows: array                - Content (rows or direct blocks)
backgroundColor: 'primary' | 'secondary'  (NOT 'none' - omit for no background)
backgroundImage: image     - Optional background image
backgroundOverlay: 0 | 20 | 40 | 60 | 80  - Darken background image
minHeight: 'auto' | 'small' | 'medium' | 'large' | 'screen' | 'custom'
customMinHeight: string    - CSS value when minHeight is 'custom'
verticalAlign: 'start' | 'center' | 'end'  - Only when minHeight != 'auto'
maxWidth: 'full' | 'container' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
paddingTop: 'none' | 'compact' | 'default' | 'spacious'  (NOT numeric!)
```

#### Row Fields
```
columns: array             - Column array
horizontalAlign: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
verticalAlign: 'start' | 'center' | 'end' | 'stretch' | 'baseline' | 'between'
gap: '0' | '2' | '4' | '6' | '8' | '12'  (Tailwind spacing scale)
wrap: boolean              - Allow columns to wrap (default: true)
reverseOnMobile: boolean   - Reverse column order on mobile
customStyle: string        - Custom inline CSS
```

#### Column Fields
```
content: array             - Block array
widthDesktop: 'auto' | 'fill' | '1'-'12'
widthTablet: 'inherit' | 'auto' | 'fill' | '1'-'12'
widthMobile: 'inherit' | 'auto' | 'fill' | '1'-'12'
verticalAlign: 'start' | 'center' | 'end' | 'between'
padding: '0' | '2' | '4' | '6' | '8'
customStyle: string        - Custom inline CSS
```

## Sanity Studio Customizations

### Custom Form Input Components
Located in `studio/src/schemaTypes/components/`:
- `PageFormInput.tsx` - Adds "Open in Presentation" banner to Page documents
- `PostFormInput.tsx` - Adds "Open in Presentation" banner to Post documents

These banners only display in Structure mode (not Presentation mode) by checking `window.location.pathname`.

### Adding Custom Components
When adding JSX to Sanity schemas:
1. Create a separate `.tsx` file in `studio/src/schemaTypes/components/`
2. Import and use in the schema's `components` property
3. Do NOT put JSX directly in `.ts` schema files

## Frontend Components

### Tailwind CSS v4
- CSS-first configuration in `frontend/app/app.css`
- Custom properties defined with `@theme` directive
- No `tailwind.config.js` - all config in CSS

### Design Tokens
Located in CSS custom properties:
- `--brand-*` - Brand colors
- `--primary-*` - Primary theme (light backgrounds)
- `--secondary-*` - Secondary theme (gray backgrounds)
- Typography via `--font-*` variables

## Common Tasks

### Running the project
```bash
npm run dev          # Start both frontend and studio
npm run dev:next     # Frontend only (port 4000)
npm run dev:studio   # Studio only (port 3333)
```

### Seeding pages
```bash
# Requires SANITY_API_TOKEN
SANITY_API_TOKEN="token" npm run seed-mast-sanity
SANITY_API_TOKEN="token" npm run seed-layouts
```

### Docker/OrbStack
Frontend runs in Docker via OrbStack on port 4000.
