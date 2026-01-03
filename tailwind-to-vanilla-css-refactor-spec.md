# Tailwind to Vanilla CSS Refactor Spec

This document outlines the plan to refactor the current Tailwind-based styling to a cleaned-up vanilla CSS approach based on the original Mast framework from Webflow.

## Goals

1. **Consistency** - Align Next.js/Sanity build with the Webflow Mast framework
2. **Parity** - Frontend styling should be nearly identical across both platforms
3. **Intuitive** - Make styling approachable for designers and AI-assisted development
4. **Scalable** - Fewer options = more consistency at scale
5. **Performant** - Simple selectors, organized variables, no build complexity

---

## Critical Principle: Structure Alignment

> **Before refactoring any component's CSS, the HTML/JSX structure must match the Webflow component structure.**

Style regression is most likely to occur when the Sanity component's DOM structure differs from Webflow's. CSS selectors, spacing relationships, and layout behaviors all depend on consistent nesting and class placement.

### Why This Matters

Mast CSS assumes specific parent-child relationships:
```html
<!-- Webflow Mast structure -->
<section class="section">
  <div class="container">
    <div class="row">
      <div class="col col-lg-6">
        <div class="slot cc-content-wrap">
          <!-- Content here -->
        </div>
      </div>
    </div>
  </div>
</section>
```

If the Sanity component omits `.slot` or nests differently, selectors like `.slot > *:last-child { margin-bottom: 0; }` won't work, causing visual discrepancies.

### Alignment Process (Required for Each Component)

1. **Export reference HTML** from Webflow for the component
2. **Compare DOM structure** with the current Sanity TSX component
3. **Document differences** in nesting, class names, and element types
4. **Align structure first**, then apply CSS classes
5. **Visual diff test** against Webflow reference at multiple breakpoints

---

## Phase 1: Create Clean Mast CSS Foundation

### 1.1 Simplify Variable Names

The Webflow export uses verbose hierarchical naming for UI organization. In code, we can simplify while maintaining clarity.

**Typography Variables:**
```css
/* Before (Webflow) */
--_typography---h1--font-size: ...
--_typography---h1--line-height: 1;
--_typography---h1--font-weight: 500;
--_typography---h1--letter-spacing: -.02em;
--_typography---h1--bottom-margin: .2em;
--_typography---paragraph-body--font-size: ...

/* After (Simplified) */
--type-h1-size: ...
--type-h1-leading: 1;
--type-h1-weight: 500;
--type-h1-tracking: -0.02em;
--type-h1-margin: 0.2em;
--type-body-size: ...
```

**Color Variables:**
```css
/* Before (Webflow) */
--_color---neutral--white: white;
--_color---neutral--black: #1d1c1a;
--_color---primary--orange: #d14424;
--_color---secondary--yellow: #f8d47a;

/* After (Simplified) */
--color-white: white;
--color-black: #1d1c1a;
--color-brand: #d14424;
--color-yellow: #f8d47a;
```

**Component Variables:**
```css
/* Before (Webflow) */
--_components---section--padding: ...
--_components---container--gutter: 6vw;
--_components---button--vertical-padding: 0.7em;
--_components---card--border-radius: 0.5rem;

/* After (Simplified) */
--section-padding: ...
--container-gutter: 6vw;
--button-padding-y: 0.7em;
--card-radius: 0.5rem;
```

**Layout Variables:**
```css
/* Before (Webflow) */
--_layout---grid--gap-main: 40px;
--_layout---grid--gap-md: 24px;
--_layout---grid--columns: 12;
--_layout---fluid--max: 90;

/* After (Simplified) */
--grid-gap: 40px;
--grid-gap-md: 24px;
--grid-columns: 12;
--fluid-max: 90;
```

### 1.2 Organize Variables by Collection (via Comments)

Structure the `:root` block with clear section comments:

```css
:root {
  /* ==============================================
     THEME - Semantic color tokens (light/dark aware)
     ============================================== */
  --bg-primary: light-dark(var(--color-white), var(--color-black));
  --bg-secondary: light-dark(var(--color-light-gray), var(--color-dark-gray));
  --text-primary: light-dark(var(--color-black), var(--color-white));
  --text-muted: light-dark(var(--color-mid-gray-1), var(--color-mid-gray-2));
  --border-primary: light-dark(var(--color-mid-gray-1), var(--color-mid-gray-2));
  --accent: var(--color-brand);
  --accent-dark: var(--color-brand-dark);

  /* ==============================================
     COLORS - Raw palette values
     ============================================== */
  --color-white: #ffffff;
  --color-black: #1d1c1a;
  --color-dark-gray: #292825;
  --color-mid-gray-1: #cccabf;
  --color-mid-gray-2: #474641;
  --color-light-gray: #f0eee6;
  --color-brand: #d14424;
  --color-brand-dark: #9c331b;
  --color-yellow: #f8d47a;
  --color-blue: #0073e6;

  /* ==============================================
     TYPOGRAPHY - Font sizing and spacing
     ============================================== */
  --font-family: "General Sans", Arial, sans-serif;

  /* Fluid scale bounds */
  --fluid-min: 20;  /* rem */
  --fluid-max: 90;  /* rem */

  /* H1 */
  --type-h1-size: clamp(2.8rem, calc(2.03rem + 3.86vw), 5.5rem);
  --type-h1-leading: 1;
  --type-h1-weight: 500;
  --type-h1-tracking: -0.02em;
  --type-h1-margin: 0.2em;

  /* H2 */
  --type-h2-size: clamp(2rem, calc(1.49rem + 2.57vw), 3.8rem);
  --type-h2-leading: 1.1;
  --type-h2-weight: 500;
  --type-h2-tracking: -0.02em;
  --type-h2-margin: 0.2em;

  /* ... H3-H6, paragraphs follow same pattern ... */

  /* ==============================================
     LAYOUT - Grid and spacing
     ============================================== */
  --grid-columns: 12;
  --grid-gap: 40px;
  --grid-gap-md: 24px;
  --grid-gap-sm: 8px;
  --container-gutter: 6vw;
  --container-max: 90rem;

  /* Spacing scale */
  --space-xs: 0.5em;
  --space-sm: 1em;
  --space-md: 2em;
  --space-lg: 3em;

  /* ==============================================
     COMPONENTS - Element-specific tokens
     ============================================== */
  /* Section */
  --section-padding: clamp(3rem, calc(2.57rem + 2.14vw), 6rem);

  /* Button */
  --button-padding-x: 1em;
  --button-padding-y: 0.7em;
  --button-radius: 0.5rem;
  --button-weight: 400;

  /* Card */
  --card-padding: clamp(1rem, calc(0.93rem + 0.36vw), 1.5rem);
  --card-radius: 0.5rem;

  /* Input */
  --input-radius: 0.5rem;
  --input-margin: 1rem;
}
```

### 1.3 Remove Webflow Artifacts

**Delete these patterns entirely:**

1. **Deleted variable references:**
   ```css
   /* Remove */
   --_size---0rem\<deleted\|variable-76ad6b20-ba74-e8a2-27f3-884949ddcd06\>: 0rem;
   ```

2. **Webflow-specific classes:**
   ```css
   /* Remove */
   .w-form-formradioinput--inputType-custom { ... }
   .w-checkbox { ... }
   .w--redirected-focus { ... }
   ```

3. **Webflow embed/interaction classes:**
   ```css
   /* Remove */
   .w-embed { ... }
   .w-background-video { ... }
   ```

---

## Phase 2: Convert Variant Selectors to Semantic Classes

### 2.1 Map Arbitrary IDs to Meaningful Names

The `:where(.w-variant-xxx)` selectors are Webflow's component variant system. These need semantic names.

**Section Variants:**
```css
/* Before */
.section:where(.w-variant-ffdae436-6d76-12b6-39d6-0e4201c47aad) {
  --bg-primary: var(--color-light-gray);
}

/* After */
.section.cc-muted {
  --bg-primary: light-dark(var(--color-light-gray), var(--color-dark-gray));
}
```

**Row Alignment Variants:**
```css
/* Before */
.row:where(.w-variant-478364d0-b9a1-9a8d-3561-fc2372ac7598) {
  justify-content: center;
}
.row:where(.w-variant-74857e04-b06e-e825-b9a7-b1c429c16d7e) {
  align-items: center;
}

/* After - Use modifier classes */
.row.row-justify-center { justify-content: center; }
.row.row-justify-between { justify-content: space-between; }
.row.row-justify-end { justify-content: flex-end; }
.row.row-align-center { align-items: center; }
.row.row-align-end { align-items: flex-end; }
```

**Column Width Variants:**
```css
/* Before */
.col:where(.w-variant-28e74f51-d7e2-a771-32c6-dda728ccfa16) {
  max-width: calc(min(100%, 100% / var(--grid-columns) * 2));
}

/* After */
.col.col-lg-2 {
  flex-basis: calc(100% / var(--grid-columns) * 2);
  max-width: calc(100% / var(--grid-columns) * 2);
}
```

**Button Variants:**
```css
/* Before */
.button:where(.w-variant-052759b4-b398-e98d-c28c-099b380d4426) {
  border-color: var(--accent);
  background-color: transparent;
}

/* After */
.button.cc-secondary {
  border-color: var(--accent);
  background-color: transparent;
  color: var(--accent);
}
.button.cc-secondary:hover {
  background-color: color-mix(in hsl, var(--accent) 10%, transparent);
}
```

**Image Position Variants:**
```css
/* Before */
.u-img-cover:where(.w-variant-109354ec-e18b-6d34-fc97-2bd60ed75688) {
  object-position: 0% 0%;
}

/* After */
.u-img-cover.cc-top-left { object-position: 0% 0%; }
.u-img-cover.cc-top-center { object-position: 50% 0%; }
.u-img-cover.cc-top-right { object-position: 100% 0%; }
.u-img-cover.cc-center-left { object-position: 0% 50%; }
.u-img-cover.cc-center-right { object-position: 100% 50%; }
.u-img-cover.cc-bottom-left { object-position: 0% 100%; }
.u-img-cover.cc-bottom-center { object-position: 50% 100%; }
.u-img-cover.cc-bottom-right { object-position: 100% 100%; }
```

### 2.2 Complete Variant Mapping Reference

| Webflow Variant ID | Semantic Class | Purpose |
|--------------------|----------------|---------|
| Section variants | `.section.cc-muted` | Light gray / dark gray background |
| Section variants | `.section.cc-invert` | Inverted dark / light background |
| Container variants | `.container.cc-full` | Full-width (no max-width) |
| Row variants | `.row.row-justify-*` | Horizontal alignment |
| Row variants | `.row.row-align-*` | Vertical alignment |
| Row variants | `.row.row-gap-*` | Gap size overrides |
| Column variants | `.col.col-lg-{1-12}` | Desktop column widths |
| Column variants | `.col.col-md-{1-12}` | Tablet column widths |
| Column variants | `.col.col-shrink` | Width of content only |
| Button variants | `.button.cc-secondary` | Outline style |
| Button variants | `.button.cc-ghost` | Text-only style |
| Card variants | `.card.cc-hover` | Hover background change |
| Icon variants | `.icon.cc-sm/md/lg` | Size variants |
| Icon color variants | `.icon-color.cc-brand/yellow/blue` | Color variants |
| Image variants | `.img-component.cc-{ratio}` | Aspect ratios |
| Rich text variants | `.rich-text.cc-sm/lg/xl` | Font size variants |

---

## Phase 3: Convert Media Queries to REM

### 3.1 Breakpoint Conversion

Convert pixel-based breakpoints to rem (assuming 16px base):

```css
/* Before (px) */
@media screen and (max-width: 991px) { }
@media screen and (max-width: 767px) { }
@media screen and (max-width: 479px) { }

/* After (rem) - More accessible */
@media screen and (max-width: 61.9375rem) { }  /* 991px / 16 */
@media screen and (max-width: 47.9375rem) { }  /* 767px / 16 */
@media screen and (max-width: 29.9375rem) { }  /* 479px / 16 */
```

### 3.2 Breakpoint Variables (Optional Enhancement)

For easier maintenance, define breakpoints as custom properties in a `:root` comment block (CSS custom properties don't work in media queries, but documenting them helps):

```css
/*
  BREAKPOINTS (for reference - use values in media queries)
  --bp-lg: 61.9375rem  (992px - Desktop)
  --bp-md: 47.9375rem  (768px - Tablet)
  --bp-sm: 29.9375rem  (480px - Mobile landscape)
  --bp-xs: 29.9375rem  (480px - Mobile portrait, same as sm)
*/

@media screen and (max-width: 61.9375rem) {
  /* Tablet and below */
}

@media screen and (max-width: 47.9375rem) {
  /* Mobile landscape and below */
}

@media screen and (max-width: 29.9375rem) {
  /* Mobile portrait */
}
```

---

## Phase 4: File Structure

### 4.1 New CSS Architecture

```
app/
├── styles/
│   ├── mast-framework.css      # Core framework (cleaned from Webflow)
│   │   ├── /* Variables */
│   │   ├── /* Base/Reset */
│   │   ├── /* Typography */
│   │   ├── /* Layout (section, container, row, col) */
│   │   ├── /* Components */
│   │   ├── /* Utilities */
│   │   └── /* Media queries */
│   │
│   └── globals.css             # Project-specific overrides & additions
│       ├── /* Font loading */
│       ├── /* Project customizations */
│       └── /* Sanity-specific styles */
```

### 4.2 Import Order

```css
/* app/layout.tsx or globals.css */
@import './styles/mast-framework.css';
/* Project-specific additions follow */
```

### 4.3 Component-Specific CSS: Should We Split?

In Webflow, component-specific CSS/JS is embedded at the top of the page body via custom code blocks:

```html
<!-- Webflow pattern: component code only loads on pages using that component -->
<div data-custom-code="marquee">
  <style>/* Marquee keyframes and styles */</style>
</div>
<div data-custom-code="accordion">
  <style>/* Accordion-specific styles */</style>
</div>
<div data-custom-code="tabs">
  <style>/* Tabs-specific styles */</style>
</div>
```

**Components with custom CSS/JS in Webflow:**
- `marquee` - Keyframe animations, pause-on-hover
- `accordion` - Details/summary animation helpers
- `modal` - Dialog backdrop, positioning
- `slider` - Swiper.js integration styles
- `tabs` - Autoplay progress, mobile dropdown
- `inline-video` - Play-on-hover behavior
- `theme-toggle` - Switch styling, state management
- `form` - Autofill colors, select arrows

#### Option A: Single File (Recommended for Simplicity)

Keep all CSS in `mast-framework.css`. Component-specific styles add ~2-3KB total.

**Pros:**
- Single HTTP request
- No conditional loading logic
- Cached after first page load
- Simpler mental model

**Cons:**
- Unused component CSS loads on every page

#### Option B: Component CSS Modules (Maximum Optimization)

Split component-specific CSS into co-located files:

```
app/
├── components/
│   ├── Marquee/
│   │   ├── Marquee.tsx
│   │   └── marquee.css        # Imported only when component renders
│   ├── Accordion/
│   │   ├── Accordion.tsx
│   │   └── accordion.css
│   ├── Tabs/
│   │   ├── Tabs.tsx
│   │   └── tabs.css
│   └── ...
```

```tsx
// Marquee.tsx
import './marquee.css'

export function Marquee({ ... }) {
  // Component only loads its CSS when rendered
}
```

**Pros:**
- CSS only loads when component is used on page
- Aligns with Webflow's conditional loading pattern
- Better for pages that don't use complex components

**Cons:**
- Multiple small CSS files = more HTTP requests (mitigated by HTTP/2)
- Slightly more complex file organization
- Need to ensure no duplicate styles between files

#### Option C: Hybrid Approach (Balanced)

Core framework in one file, complex interactive components split:

```
app/
├── styles/
│   ├── mast-framework.css     # Variables, layout, typography, utilities, simple components
│   └── components/
│       ├── marquee.css        # ~0.5KB - Keyframes
│       ├── slider.css         # ~1KB - Swiper overrides
│       ├── tabs.css           # ~0.5KB - Autoplay, dropdown
│       └── modal.css          # ~0.3KB - Dialog styles
```

Only split components that have:
1. Significant CSS (>0.3KB)
2. Keyframe animations
3. Third-party library overrides
4. Features not used on most pages

#### Recommendation

**Start with Option A** (single file). The total component CSS is small enough (~3-5KB) that splitting provides marginal benefit. If performance profiling later shows CSS as a bottleneck on specific pages, migrate to Option C selectively.

The Webflow pattern exists because Webflow lacks native CSS bundling—it's a workaround, not necessarily a best practice for a build system like Next.js.

---

## Phase 5: Component Migration

### 5.1 Migration Priority

Migrate components in this order (dependencies first):

1. **Layout primitives** - Section, Container, Row, Column
2. **Typography** - Headings, paragraphs, rich text
3. **Interactive elements** - Button, Input, Form
4. **Content components** - Card, Icon, Image
5. **Complex components** - Accordion, Tabs, Modal, Slider
6. **Navigation** - Nav, Dropdown, Breadcrumb

### 5.2 Structure Alignment Checklist (Per Component)

**Before writing any CSS, complete this checklist for each component:**

#### Step 1: Extract Webflow Reference
```bash
# Location of Webflow HTML exports
reference/mast-framework.webflow/components.html
reference/mast-framework.webflow/inspired-layouts.html
```

Use browser DevTools to copy the rendered HTML for the specific component.

#### Step 2: Document Current Sanity Structure
```bash
# Find the component file
app/components/[ComponentName].tsx
# or
app/components/blocks/[ComponentName].tsx
```

Render the component and copy its HTML output.

#### Step 3: Create Comparison Document
For each component, create a comparison showing both structures:

```markdown
## Button Component

### Webflow Structure
​```html
<a href="#" class="button">
  <div class="btn-text">Click me</div>
  <div class="btn-icon">
    <div class="icon"><i class="ph ph-arrow-right"></i></div>
  </div>
</a>
​```

### Current Sanity Structure
​```html
<button className="inline-flex items-center gap-2 ...">
  <span>Click me</span>
  <ArrowRight className="w-4 h-4" />
</button>
​```

### Differences
- [ ] Webflow uses `<a>`, Sanity uses `<button>` - ALIGN based on use case
- [ ] Missing `.btn-text` wrapper - ADD
- [ ] Missing `.btn-icon` wrapper - ADD
- [ ] Icon structure differs - ALIGN to `.icon` class pattern
```

#### Step 4: Align Before Styling
Modify the Sanity component JSX to match Webflow's DOM structure:

```tsx
// BEFORE (Tailwind-styled, different structure)
<button className="inline-flex items-center gap-2 px-4 py-2 bg-brand">
  <span>Click me</span>
  <ArrowRight className="w-4 h-4" />
</button>

// AFTER (Mast structure, ready for CSS)
<a href={href} className="button">
  <div className="btn-text">{children}</div>
  {icon && (
    <div className="btn-icon">
      <div className="icon">{icon}</div>
    </div>
  )}
</a>
```

#### Step 5: Visual Regression Test
After applying Mast CSS classes:

1. **Screenshot Webflow** at 1440px, 768px, 375px widths
2. **Screenshot Sanity** at same widths
3. **Overlay comparison** - Should be pixel-close (within 1-2px tolerance)
4. **Test interactions** - Hover, focus, active states

### 5.3 Component Structure Reference

Key structural patterns from Webflow Mast to preserve:

| Component | Required Wrappers | Critical Classes |
|-----------|-------------------|------------------|
| Section | `section > container > row > col` | `.section`, `.container`, `.row`, `.col` |
| Column Content | `col > slot` | `.slot.cc-content-wrap` or `.slot.cc-column` |
| Button | `button > btn-text + btn-icon > icon` | `.button`, `.btn-text`, `.btn-icon`, `.icon` |
| Card | `card > slot` | `.card`, `.slot` |
| Heading | `heading-component > h1-h6` | `.heading-component`, `.h1`-`.h6` |
| Accordion | `details.accordion-component > summary.accordion-trigger` | `.accordion-component`, `.accordion-trigger`, `.accordion-content` |
| Tabs | `tabs-component > tabs-menu + tabs-content` | `.tabs-component`, `.tabs-menu`, `.tabs-link`, `.tabs-pane` |
| Form | `form > input-group > input-label + input` | `.form`, `.input-group`, `.input-label`, `.input` |

### 5.4 Component Class Migration Example

**Before (Tailwind in TSX):**
```tsx
<button className={cn(
  "inline-flex items-center justify-center gap-[0.4em]",
  "py-[0.7em] px-[1em] text-base",
  "bg-brand text-white rounded-lg",
  "transition-colors duration-300",
  "hover:bg-brand-dark focus:outline-none focus:ring-2"
)}>
  Click me
</button>
```

**After (Mast classes):**
```tsx
<button className="button">
  Click me
</button>

// With variant
<button className="button cc-secondary">
  Click me
</button>
```

### 5.3 Handling Dynamic Values from Sanity

For values that come from Sanity CMS, use a mapping approach:

```tsx
// Map Sanity values to Mast classes
const columnWidthClasses = {
  '1': 'col-lg-1',
  '2': 'col-lg-2',
  // ...
  '12': 'col-lg-12',
}

const sectionThemeClasses = {
  'default': '',
  'muted': 'cc-muted',
  'invert': 'cc-invert',
}

// Usage
<div className={`col ${columnWidthClasses[column.width]}`}>
```

---

## Phase 6: Tailwind Removal

### 6.1 Gradual Removal Steps

1. **Keep Tailwind config** during migration for reference
2. **Remove Tailwind classes** component by component
3. **Remove Tailwind dependencies** when complete:
   ```bash
   pnpm remove tailwindcss @tailwindcss/typography postcss autoprefixer
   ```
4. **Simplify PostCSS config** to only what's needed:
   ```js
   // postcss.config.mjs
   export default {
     plugins: {
       'postcss-import': {},
       'postcss-nesting': {},  // If using CSS nesting
     },
   }
   ```

### 6.2 What to Keep from Current Setup

- **`cn()` utility** - Still useful for conditional classes
- **CSS custom properties** - Already aligned with Mast approach
- **`light-dark()` function** - Modern, clean dark mode
- **Fluid typography `clamp()` values** - Already computed, just rename variables

---

## Phase 7: Documentation

### 7.1 Create Class Reference

Document all available classes for designers and AI assistants:

```markdown
## Layout Classes
- `.section` - Page section with vertical padding
- `.section.cc-muted` - Muted background variant
- `.container` - Centered max-width container
- `.row` - Flexbox row with gutters
- `.col` - Flexible column
- `.col.col-lg-{1-12}` - Desktop column widths

## Utility Classes
- `.u-mt-{xs|sm|md|lg}` - Margin top
- `.u-text-{left|center|right}` - Text alignment
- `.u-d-{flex|block|none}` - Display
```

### 7.2 Variable Reference

Document all CSS variables for quick customization:

```markdown
## Brand Customization
Change these variables to match your brand:

| Variable | Default | Description |
|----------|---------|-------------|
| `--color-brand` | #d14424 | Primary brand color |
| `--color-brand-dark` | #9c331b | Hover/active state |
| `--font-family` | "General Sans" | Primary typeface |
```

---

## Execution Checklist

- [ ] **Phase 1**: Create `mast-framework.css` with simplified variables
- [ ] **Phase 2**: Map all `:where()` variants to semantic classes
- [ ] **Phase 3**: Convert all media queries to rem values
- [ ] **Phase 4**: Set up file structure and imports
- [ ] **Phase 5**: Migrate components with structure alignment:
  - [ ] For each component: Compare Webflow → Sanity DOM structure
  - [ ] Align JSX structure to match Webflow before applying CSS
  - [ ] Visual regression test at 1440px, 768px, 375px
  - [ ] Migration order: layout → typography → interactive → content → complex → nav
- [ ] **Phase 6**: Remove Tailwind dependencies
- [ ] **Phase 7**: Document classes and variables

---

## Notes

- **No build complexity** - Pure CSS, no PurgeCSS or additional processing
- **~20KB gzipped** - Acceptable size for cached framework CSS
- **Simple selectors** - Fast parsing, no specificity wars
- **Portable** - Framework can be extracted for other projects
