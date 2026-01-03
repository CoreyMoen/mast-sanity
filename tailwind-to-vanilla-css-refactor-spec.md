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

Mast CSS assumes specific parent-child relationships. We use the **static/clean approach** (not the component-wrapped approach that Webflow requires for its component system):

```html
<!-- Clean static structure (what we want in Sanity) -->
<section class="section">
  <div class="container">
    <div class="row">
      <div class="col col-lg-6">
        <!-- Content blocks directly here -->
      </div>
    </div>
  </div>
</section>
```

**Note:** In Webflow, components require extra wrappers like `.slot` and `xxx-component` classes due to how Webflow's component system works. Since Sanity doesn't require these, we keep the markup clean and simple.

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

### 4.1 Source Files (Read-Only Reference)

The Webflow export remains untouched for ongoing reference:

```
reference/
└── mast-framework.webflow/       # DO NOT MODIFY - reference only
    ├── css/
    │   ├── mast-framework.css    # Source of truth for CSS patterns
    │   ├── components.css        # Component-specific styles
    │   └── normalize.css
    ├── components.html           # Component structure reference
    └── ...
```

### 4.2 Destination Files (Sanity Build)

The cleaned, simplified CSS is created in the app directory:

```
app/
├── globals.css                   # Core Mast framework CSS (cleaned/simplified)
│   ├── /* Variables */
│   ├── /* Base/Reset */
│   ├── /* Typography */
│   ├── /* Layout (section, container, row, col) */
│   ├── /* Base component styles (button, card, form, etc.) */
│   ├── /* Utilities */
│   └── /* Media queries */
│
├── components/
│   ├── Accordion/
│   │   ├── Accordion.tsx
│   │   └── accordion.css         # Accordion-specific styles only
│   ├── Tabs/
│   │   ├── Tabs.tsx
│   │   └── tabs.css
│   ├── Marquee/
│   │   ├── Marquee.tsx
│   │   └── marquee.css
│   ├── Modal/
│   │   ├── Modal.tsx
│   │   └── modal.css
│   ├── Slider/
│   │   ├── Slider.tsx
│   │   └── slider.css
│   └── ...
```

### 4.3 What Goes Where

| CSS Type | Location | Loaded |
|----------|----------|--------|
| Variables (colors, typography, spacing) | `globals.css` | Always |
| Base/reset styles | `globals.css` | Always |
| Layout classes (`.section`, `.row`, `.col`) | `globals.css` | Always |
| Typography classes (`.h1`-`.h6`, `.p-*`) | `globals.css` | Always |
| Simple components (`.button`, `.card`, `.input`) | `globals.css` | Always |
| Utility classes (`.u-*`) | `globals.css` | Always |
| Accordion animations & triggers | `accordion.css` | When used |
| Tabs autoplay, mobile dropdown | `tabs.css` | When used |
| Marquee keyframes | `marquee.css` | When used |
| Modal dialog styles | `modal.css` | When used |
| Slider/Swiper overrides | `slider.css` | When used |

### 4.4 Import Pattern

```tsx
// app/layout.tsx - globals.css imported here (already the case)
import './globals.css'
```

```tsx
// app/components/Accordion/Accordion.tsx
import './accordion.css'  // Only loads when Accordion renders

export function Accordion({ ... }) { ... }
```

### 4.5 Component-Specific CSS Approach (Option B - Recommended)

Split component-specific CSS into co-located files. This approach:
- Loads CSS only when the component is used on a page
- Aligns with the Webflow pattern of conditional component code
- Makes it easier to review and collaborate on individual components
- Requires no additional build tooling (Next.js handles it natively)

**Components requiring separate CSS files:**
- `accordion.css` - Details/summary animation, icon rotation
- `tabs.css` - Autoplay progress bar, mobile dropdown toggle
- `marquee.css` - Keyframe animations, pause-on-hover
- `modal.css` - Dialog backdrop, positioning, transitions
- `slider.css` - Swiper.js integration and overrides
- `inline-video.css` - Play button overlay, hover states (if needed)
- `theme-toggle.css` - Switch styling (if not in globals)

**Key rule:** Component CSS files should only contain styles unique to that component. Shared variables, base classes, and utilities stay in `globals.css`.

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

Key structural patterns for Sanity (using clean static approach without Webflow component wrappers):

| Component | Structure | Critical Classes |
|-----------|-----------|------------------|
| Section | `section > container` | `.section`, `.container` |
| Row | `div.row` | `.row`, `.row-justify-*`, `.row-align-*` |
| Column | `div.col` | `.col`, `.col-lg-*`, `.col-md-*` |
| Heading | `h1-h6` | `.h1`-`.h6` (or native elements) |
| Rich Text | `div.rich-text` | `.rich-text` |
| Button | `a.button` or `button.button` | `.button`, `.cc-secondary`, `.cc-ghost` |
| Card | `div.card > div.card-body` | `.card`, `.card-body` |
| Accordion | `details.accordion-component` (native) | `.accordion-component`, `.accordion-trigger`, `.accordion-content` |
| Modal | `dialog.modal` (native) | `.modal`, `.modal_close-button` |
| Tabs | `div.tabs-component > .tabs-menu + .tabs-pane` | `.tabs-component`, `.tabs-menu`, `.tabs-link`, `.tabs-pane` |
| Form | `form > input-group` | `.form`, `.input-group`, `.input-label`, `.input` |

### 5.4 Layout Component Diffs

Detailed structure changes for the core layout components:

#### Section Component

**Current Sanity → Proposed:**
```tsx
// CURRENT
<section className={`relative ${bgClass} ${isDarkBg ? 'text-white' : 'text-foreground'} ${minHeightClass} ${hasMinHeight ? 'flex flex-col' : ''} ${alignClass}`}>
  {backgroundImageUrl && (
    <>
      <Image src={backgroundImageUrl} ... className="object-cover" />
      {cleanOverlay > 0 && (
        <div className="absolute inset-0 bg-black" style={{opacity: cleanOverlay / 100}} />
      )}
    </>
  )}
  <div className={`relative z-10 ${maxWidthClass} ${ptClass} ${pbClass} ${pxClass} ...`}>
    {rowItems.map(...)}
  </div>
</section>

// PROPOSED
<section className={cn('section', themeClass, minHeightClass, alignClass)}>
  {backgroundImageUrl && (
    <>
      <Image src={backgroundImageUrl} ... className="section-bg-image" />
      {cleanOverlay > 0 && (
        <div className="section-bg-overlay" style={{opacity: cleanOverlay / 100}} />
      )}
    </>
  )}
  <div className="container">
    {rowItems.map(...)}
  </div>
</section>
```

**Section Class Mappings:**
```tsx
const themeClasses = {
  primary: '',                    // Default
  secondary: 'cc-muted',          // Light gray / dark gray
  invert: 'cc-invert',            // Inverted colors
}

const minHeightClasses = {
  auto: '',
  small: 'cc-min-sm',
  medium: 'cc-min-md',
  large: 'cc-min-lg',
  screen: 'cc-min-screen',
}

const verticalAlignClasses = {
  start: '',
  center: 'cc-valign-center',
  end: 'cc-valign-end',
}
```

#### Row Component

**Current Sanity → Proposed:**
```tsx
// CURRENT
<div className={`flex ${mobileClass} md:flex-row ${wrapClass} ${justifyClass} ${alignClass} ${negativeMarginClass} ${verticalGapClass}`}>
  {columnItems.map((column) => <Column ... />)}
</div>

// PROPOSED
<div className={cn('row', justifyClass, alignClass, gapClass)}>
  {columnItems.map((column) => <Column ... />)}
</div>
```

**Row Class Mappings:**
```tsx
const justifyClasses = {
  start: '',                      // Default
  center: 'row-justify-center',
  end: 'row-justify-end',
  between: 'row-justify-between',
}

const alignClasses = {
  stretch: '',                    // Default
  start: 'row-align-start',
  center: 'row-align-center',
  end: 'row-align-end',
}

const gapClasses = {
  '0': 'row-gap-0',
  'sm': 'row-gap-sm',
  'md': '',                       // Default
  'lg': 'row-gap-lg',
}
```

#### Column Component

**Current Sanity → Proposed:**
```tsx
// CURRENT
<div className={`flex flex-col ${alignClass} w-full md:w-auto ${tabletClass} ${desktopClass} ${gutterClass} ${innerPaddingClass}`}
     data-sanity={...}>
  {contentBlocks.map(...)}
</div>

// PROPOSED
<div className={cn('col', desktopClass, tabletClass, mobileClass, alignClass)}
     data-sanity={...}>
  {contentBlocks.map(...)}
</div>
```

**Column Class Mappings:**
```tsx
const widthClasses = {
  '1': 'col-lg-1',
  '2': 'col-lg-2',
  '3': 'col-lg-3',
  '4': 'col-lg-4',
  '5': 'col-lg-5',
  '6': 'col-lg-6',
  '7': 'col-lg-7',
  '8': 'col-lg-8',
  '9': 'col-lg-9',
  '10': 'col-lg-10',
  '11': 'col-lg-11',
  '12': 'col-lg-12',
  'fill': '',                     // Default flex behavior
  'shrink': 'col-shrink',
}

// Repeat pattern for tablet: col-md-* and mobile: col-sm-*
```

#### Summary of Layout Changes

| Element | Current (Tailwind) | Proposed (Mast) |
|---------|-------------------|-----------------|
| Section | `relative bg-[var(...)] pt-12 pb-12` | `.section` |
| Section theme | `bg-[var(--secondary-background)]` | `.section.cc-muted` |
| Section min-height | `min-h-[500px] flex flex-col justify-center` | `.section.cc-min-md.cc-valign-center` |
| Background image | `object-cover` | `.section-bg-image` |
| Background overlay | `absolute inset-0 bg-black` | `.section-bg-overlay` |
| Container | `container pt-12 pb-12 px-6` | `.container` |
| Row | `flex flex-col md:flex-row flex-wrap -mx-3 gap-y-6` | `.row` |
| Row justify | `justify-center` | `.row-justify-center` |
| Row align | `items-center` | `.row-align-center` |
| Row gap | `gap-y-6 -mx-3` | `.row-gap-md` (default) |
| Column | `flex flex-col lg:w-6/12 px-3` | `.col.col-lg-6` |
| Column tablet | `md:w-full` | `.col-md-12` |
| Column align | `justify-center` | `.col-valign-center` |

### 5.5 Content Component Diffs

Detailed structure changes for content components:

#### Heading Component

**Current Sanity → Proposed:**
```tsx
// CURRENT
createElement(cleanLevel, {
  className: `${sizeClass} ${alignClass} ${colorClass} mb-4`
}, text)
// Outputs: <h2 class="text-h2 text-left text-foreground mb-4">Title</h2>

// PROPOSED
createElement(cleanLevel, {
  className: cn(sizeClass, alignClass, colorClass)
}, text)
// Outputs: <h2 class="h2">Title</h2>
// Or with modifiers: <h2 class="h2 u-text-center u-text-brand">Title</h2>
```

**Heading Class Mappings:**
```tsx
const sizeClasses = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
}

const alignClasses = {
  left: '',                   // Default
  center: 'u-text-center',
  right: 'u-text-right',
}

const colorClasses = {
  default: '',                // Inherits from parent
  gray: 'u-text-muted',
  brand: 'u-text-brand',
  blue: 'u-text-blue',
  white: 'u-text-white',
}
```

#### Rich Text Component

**Current Sanity → Proposed:**
```tsx
// CURRENT
<div className={`${alignClass} ${maxWidthClass} ${colorClass} mb-4`}>
  <PortableText value={content} className={sizeClass} />
</div>
// Outputs: <div class="text-left text-foreground mb-4"><div class="prose-base">...</div></div>

// PROPOSED
<div className={cn('rich-text', sizeClass, alignClass)}>
  <PortableText value={content} />
</div>
// Outputs: <div class="rich-text">...</div>
// Or with modifiers: <div class="rich-text cc-lg u-text-center">...</div>
```

**Rich Text Class Mappings:**
```tsx
const sizeClasses = {
  base: '',                   // Default
  sm: 'cc-sm',
  lg: 'cc-lg',
  xl: 'cc-xl',
}

const alignClasses = {
  left: '',                   // Default
  center: 'u-text-center',
  right: 'u-text-right',
}
```

#### Button Component

**Current Sanity → Proposed:**
```tsx
// CURRENT
<div className={cn(alignClass, 'mb-4')}>
  <Button variant={...} colorScheme={...} size={...} asChild>
    <ResolvedLink link={link}>
      {text}
      {icons[cleanIcon]}
    </ResolvedLink>
  </Button>
</div>
// Outputs: <div class="flex justify-start mb-4"><a class="inline-flex items-center ... bg-brand ...">Button<svg>...</svg></a></div>

// PROPOSED
<a href={href} className={cn('button', variantClass, colorClass)}>
  <span className="btn-text">{text}</span>
  {icon && (
    <span className="btn-icon">
      <span className="icon">{iconElement}</span>
    </span>
  )}
</a>
// Outputs: <a class="button" href="#">
//            <span class="btn-text">Button</span>
//            <span class="btn-icon"><span class="icon"><svg>...</svg></span></span>
//          </a>
```

**Button Class Mappings:**
```tsx
const variantClasses = {
  primary: '',                // Default
  secondary: 'cc-secondary',
  ghost: 'cc-ghost',
}

const colorClasses = {
  brand: '',                  // Default
  black: 'cc-black',
  blue: 'cc-blue',
  white: 'cc-white',
}

const sizeClasses = {
  sm: 'cc-sm',
  md: '',                     // Default
  lg: 'cc-lg',
}
```

#### Card Component

**Current Sanity → Proposed:**
```tsx
// CURRENT
<Card paddingDesktop={...} variant={...} href={...}>
  {contentItems.map(block => <ContentBlockRenderer ... />)}
</Card>
// Outputs: <div class="rounded-lg overflow-hidden flex flex-col bg-card-background border p-4 lg:p-6 ...">...</div>

// PROPOSED
<div className={cn('card', variantClass, hoverClass)} {...linkProps}>
  <div className={cn('card-body', paddingClass)}>
    {contentItems.map(block => <ContentBlockRenderer ... />)}
  </div>
</div>
// Outputs: <div class="card">
//            <div class="card-body">...</div>
//          </div>
// Or with modifiers: <div class="card cc-outline cc-hover">
//                      <div class="card-body cc-p-lg">...</div>
//                    </div>
```

**Card Class Mappings:**
```tsx
// On .card element
const variantClasses = {
  default: '',                // Border + background
  outline: 'cc-outline',      // Border only, transparent bg
  filled: 'cc-filled',        // Filled bg, no border
  ghost: 'cc-ghost',          // No border, no bg
}

const hoverClasses = {
  none: '',
  hover: 'cc-hover',          // Background change on hover
}

// On .card-body element
const paddingClasses = {
  '0': 'cc-p-0',
  'sm': 'cc-p-sm',
  'md': '',                   // Default
  'lg': 'cc-p-lg',
}
```

#### Summary of Content Component Changes

| Component | Current | Proposed |
|-----------|---------|----------|
| Heading | `text-h2 text-left text-foreground mb-4` | `.h2` (margin built-in) |
| Heading align | `text-center` | `.u-text-center` |
| Heading color | `text-brand` | `.u-text-brand` |
| Rich Text wrapper | Tailwind utilities + PortableText wrapper | `.rich-text` only |
| Rich Text size | `prose-lg` | `.rich-text.cc-lg` |
| Button | CVA utilities on `<Button>` component | `.button` + modifiers on `<a>` |
| Button icon | Lucide inline | `.btn-icon > .icon` wrapper |
| Button variant | `variant="secondary"` prop | `.button.cc-secondary` class |
| Card | Tailwind utilities | `.card` + `.card-body` |
| Card padding | `p-4 lg:p-6` | `.card-body.cc-p-lg` |
| Card variant | `variant="outline"` prop | `.card.cc-outline` class |

### 5.6 Interactive Component Diffs

These components use native HTML elements enhanced by external Mast JS libraries (hosted on jsdelivr). This approach:
- Replaces Radix primitives with simpler, lighter alternatives
- Uses native `<details>/<summary>` for accordion (built-in accessibility)
- Uses native `<dialog>` for modal (built-in focus trap and backdrop)
- Loads minimal JS only for smooth animations and edge cases

#### External Resources

Add these to the app layout or load conditionally when components are used:

```html
<!-- In layout.tsx or component-level Script imports -->
<script defer src="https://cdn.jsdelivr.net/gh/nocodesupplyco/mast@latest/accordion.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/nocodesupplyco/mast@latest/modal.min.js"></script>
```

#### Accordion Component

**Current Sanity (Radix + Tailwind) → Proposed (Native + Mast CSS):**

```tsx
// CURRENT (using native details/summary with Tailwind)
<details className="accordion-component group">
  <summary className={cn(
    'accordion-trigger flex cursor-pointer items-center justify-between py-4',
    'list-none [&::-webkit-details-marker]:hidden',
    'hover:text-brand focus-visible:outline-none focus-visible:ring-2'
  )}>
    <span className="accordion-title text-h4">{title}</span>
    <PlusIcon className="text-muted-foreground group-open:rotate-45" />
  </summary>
  <div className={cn(
    'accordion-content overflow-hidden',
    'grid grid-rows-[0fr] transition-[grid-template-rows] duration-300',
    'group-open:grid-rows-[1fr]'
  )}>
    <div className="overflow-hidden">
      <div className="accordion-content_spacer pb-4">{content}</div>
    </div>
  </div>
</details>

// PROPOSED (Mast CSS classes + external JS)
<details className={cn('accordion-component', bottomMarginClass)} data-accordion-start-open={defaultOpen}>
  <summary className="accordion-trigger">
    <span className={cn('accordion-title', titleClass)}>{title}</span>
    <svg className="accordion-icon" viewBox="0 0 32 32" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z" fill="currentColor"/>
    </svg>
  </summary>
  <div data-accordion="content" className="accordion-content">
    <div className="accordion-content_spacer">
      {content}
    </div>
  </div>
</details>
```

**Accordion CSS (in `accordion.css`):**

```css
/* accordion.css - Component-specific styles */

/* Enable smooth height animation (modern browsers) */
:root {
  interpolate-size: allow-keywords;
}

/* Icon rotation on open */
details[open] .accordion-icon {
  transform: rotate(45deg);
}

/* Hide default disclosure marker */
summary::-webkit-details-marker {
  display: none;
}

/* Base styles from mast-framework.css are in globals.css:
   .accordion-component, .accordion-trigger, .accordion-title,
   .accordion-icon, .accordion-content, .accordion-content_spacer */
```

**Accordion Class Mappings:**

```tsx
const titleClasses = {
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  body: '',        // Inherits body size
}

const spacingClasses = {
  none: '',
  sm: 'u-mb-sm',   // Small bottom margin between accordions
}
```

**Note:** The external `accordion.min.js` handles:
- Smooth height animation fallback for browsers without `interpolate-size`
- Optional exclusive accordion behavior (only one open at a time via `name` attribute)
- Respects `data-accordion-start-open` attribute for initial state

#### Modal Component

**Current Sanity (Radix Dialog) → Proposed (Native `<dialog>` + Mast CSS):**

```tsx
// CURRENT (Radix Dialog with Tailwind)
import * as DialogPrimitive from '@radix-ui/react-dialog'

<Modal open={isOpen} onOpenChange={setIsOpen}>
  <ModalTrigger asChild>
    <Button variant="primary">Open Modal</Button>
  </ModalTrigger>
  <ModalContent size="md">
    <ModalHeader><ModalTitle>Title</ModalTitle></ModalHeader>
    <ModalBody>{content}</ModalBody>
  </ModalContent>
</Modal>
// Outputs: Radix portal with overlay, focus trap, animations via Tailwind

// PROPOSED (Native dialog + Mast CSS)
<div className="modal-component">
  <dialog className={cn('modal', sizeClass)} data-modal-open-on-load={openOnLoad}>
    <div className="modal-content">
      {title && <h3 className="modal-title">{title}</h3>}
      <div className="modal-body">
        {content}
      </div>
    </div>
    <button className="modal_close-button" aria-label="Close">
      <svg className="modal_close-button_icon" viewBox="0 0 14 14" fill="none">
        <path d="M12.673 0.67334L0.67319 12.6731" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M0.673462 0.67334L12.6732 12.6731" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    </button>
  </dialog>
  <button className="button" data-modal-trigger>
    Open Modal
  </button>
</div>
```

**Modal CSS (in `modal.css`):**

```css
/* modal.css - Component-specific styles */

/* Prevent body scroll when modal is open */
body:has(dialog[open]) {
  overflow: hidden !important;
}

/* Fade in animation */
dialog.modal[open] {
  animation: modal-fadein 400ms ease-out forwards;
}

/* Backdrop styling */
dialog.modal::backdrop {
  background: color-mix(in srgb, var(--color-black) 80%, transparent);
}

@keyframes modal-fadein {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* Custom scrollbar for modal content */
dialog::-webkit-scrollbar {
  width: 10px;
}
dialog::-webkit-scrollbar-track {
  border-radius: 10px;
  background-color: transparent;
}
dialog::-webkit-scrollbar-thumb {
  border-radius: 10px;
  border: 2px solid var(--bg-primary);
  background: var(--text-primary);
}

/* Size variants */
dialog.modal.cc-sm { max-width: 24rem; }
dialog.modal.cc-md { max-width: 32rem; }
dialog.modal.cc-lg { max-width: 42rem; }
dialog.modal.cc-xl { max-width: 56rem; }
dialog.modal.cc-full { max-width: 90vw; }

/* Base styles from mast-framework.css are in globals.css:
   .modal, .modal_close-button, .modal_close-button_icon */
```

**Modal Class Mappings:**

```tsx
const sizeClasses = {
  sm: 'cc-sm',
  md: '',           // Default
  lg: 'cc-lg',
  xl: 'cc-xl',
  full: 'cc-full',
}
```

**Note:** The external `modal.min.js` handles:
- Binding trigger buttons to their modal via `data-modal-trigger` attribute
- `showModal()` / `close()` calls on the native `<dialog>` element
- Optional cookie-based "show once" behavior via `data-modal-cooldown-days`
- Optional auto-open on page load via `data-modal-open-on-load`
- ESC key and backdrop click to close (native behavior)
- Focus trapping is built into native `<dialog>`

#### Video Modal Variant

For YouTube video lightbox modals, use a simplified structure:

```tsx
// PROPOSED (Video modal)
<div className="modal-component">
  <dialog className="modal cc-video cc-xl">
    <div className="modal-video-wrapper">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
    <button className="modal_close-button cc-video" aria-label="Close">
      <svg>...</svg>
    </button>
  </dialog>
  <button className="button" data-modal-trigger>
    Watch Video
  </button>
</div>
```

**Video Modal CSS additions:**

```css
/* Video modal variant */
dialog.modal.cc-video {
  background: black;
  padding: 0;
  overflow: hidden;
}

.modal-video-wrapper {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
}

.modal-video-wrapper iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.modal_close-button.cc-video {
  position: absolute;
  top: -0.75rem;
  right: -0.75rem;
  background: white;
  border-radius: 50%;
  padding: 0.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
```

#### Summary of Interactive Component Changes

| Component | Current | Proposed |
|-----------|---------|----------|
| Accordion wrapper | Native `<details>` with Tailwind | Native `<details>` with Mast CSS |
| Accordion animation | CSS Grid trick (`grid-rows-[0fr]`) | `interpolate-size` + external JS fallback |
| Accordion icon rotation | `group-open:rotate-45` | `details[open] .accordion-icon { transform: rotate(45deg) }` |
| Modal | Radix Dialog + Portal | Native `<dialog>` |
| Modal trigger | `<ModalTrigger>` component | `data-modal-trigger` attribute |
| Modal focus trap | Radix built-in | Native `<dialog>` built-in |
| Modal backdrop | Radix `<DialogOverlay>` | Native `::backdrop` pseudo-element |
| Modal close | Radix `<DialogClose>` | `.modal_close-button` + external JS |
| Modal animation | Tailwind `animate-in/out` | CSS `@keyframes modal-fadein` |
| Video modal | `<VideoModalContent>` component | `.modal.cc-video` variant class |

#### Tabs Component

The Tabs component is the most complex interactive component, featuring:
- Horizontal and vertical orientations
- Autoplay with progress indicators
- Mobile dropdown menu on smaller screens
- Pause on hover

**External Resource:**
```html
<script defer src="https://cdn.jsdelivr.net/gh/nocodesupplyco/mast@latest/tabs.min.js"></script>
```

**Current Sanity (Radix Tabs) → Proposed (Mast CSS + External JS):**

```tsx
// CURRENT (Radix Tabs with React-based autoplay logic)
import * as TabsPrimitive from '@radix-ui/react-tabs'

<Tabs
  defaultValue={defaultValue}
  orientation={orientation}
  menuPosition={menuPosition}
  mobileDropdown={mobileDropdown}
  autoplay={autoplay}
  autoplayDuration={autoplayDuration}
  pauseOnHover={pauseOnHover}
  showProgress={showProgress}
>
  <TabsList>
    {tabs.map((tab) => (
      <TabsTrigger key={tab._key} value={tab._key}>
        {tab.label}
      </TabsTrigger>
    ))}
  </TabsList>
  {tabs.map((tab) => (
    <TabsContent key={tab._key} value={tab._key}>
      {tab.content}
    </TabsContent>
  ))}
</Tabs>
// Complex React state management for autoplay, progress tracking, mobile dropdown

// PROPOSED (Mast CSS classes + external JS handles all behavior)
<div className="tabs-component" data-tabs-component>
  <div className="row">
    <div className="col col-lg-12">
      <div
        className="tabs-menu"
        role="tablist"
        data-tabs-menu
        data-tabs-autoplay={autoplay}
        data-tabs-autoplay-duration={autoplayDuration}
        data-tabs-autoplay-hover-pause={pauseOnHover}
        data-tab-mobile-dropdown={mobileDropdown}
      >
        {/* Mobile dropdown toggle - shown only on mobile when enabled */}
        <button className="tabs-menu_dropdown-toggle" data-tabs-menu-dropdown-toggle>
          <span className="tabs-menu_dropdown-text" data-tabs-menu-dropdown-text>
            {activeTabLabel}
          </span>
          <span className="tabs-menu_dropdown-arrow">
            <span className="icon ph ph-caret-down" />
          </span>
        </button>

        {/* Dropdown menu wrapper */}
        <div className="tabs-menu_dropdown-menu" data-tabs-menu-dropdown-menu>
          {tabs.map((tab, index) => (
            <div
              key={tab._key}
              role="tab"
              aria-selected={index === 0}
              className={cn('tabs-link', index === 0 && 'cc-active')}
              data-tabs-link
              data-tab-link-name={tab.label}
            >
              <span className="tabs-link-text">{tab.label}</span>
              <button
                aria-label={tab.label}
                tabIndex={-1}
                className="u-link-cover cc-tabs-link"
                data-tabs-link-button
              />
              <div className="tabs-autoplay-progress" data-tabs-autoplay-progress />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="col col-lg-12">
      {tabs.map((tab, index) => (
        <div
          key={tab._key}
          role="tabpanel"
          aria-hidden={index !== 0}
          className="tabs-pane"
          data-tabs-pane
        >
          {tab.content}
        </div>
      ))}
    </div>
  </div>

  {/* Optional autoplay toggle button */}
  {autoplay && (
    <button className="tabs-autoplay-toggle" data-tabs-autoplay-toggle>
      <span className="tabs-autoplay-toggle_pause">
        <span className="icon ph ph-pause" />
      </span>
      <span className="tabs-autoplay-toggle_play">
        <span className="icon ph ph-play" />
      </span>
    </button>
  )}
</div>
```

**Tabs CSS (in `tabs.css`):**

```css
/* tabs.css - Component-specific styles */

/* Tab pane fade-in animation */
.tabs-pane {
  animation: tabsFadeIn 0.5s ease;
}

@keyframes tabsFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tabs-pane[aria-hidden="true"] {
  display: none;
}

/* Vertical menu variant */
.tabs-menu.cc-vertical .tabs-link {
  border-bottom: none;
  border-left: 2px solid var(--border-primary);
}

.tabs-menu.cc-vertical .tabs-link.cc-active {
  border-color: var(--text-primary);
}

.tabs-menu.cc-vertical .tabs-autoplay-progress {
  top: 0;
  right: auto;
  bottom: 0;
  left: -2px;
  width: 2px;
  height: 0%;
}

/* Autoplay progress animation (horizontal) */
.tabs-menu[data-tabs-autoplay="true"] .tabs-link[aria-selected="true"] .tabs-autoplay-progress {
  animation: autoplayProgress var(--autoplay-duration, 5s) linear forwards;
}

.tabs-component.autoplay-paused .tabs-autoplay-progress {
  animation-play-state: paused;
}

@keyframes autoplayProgress {
  from { width: 0%; }
  to { width: 100%; }
}

/* Autoplay progress animation (vertical) */
.tabs-menu.cc-vertical[data-tabs-autoplay="true"] .tabs-link[aria-selected="true"] .tabs-autoplay-progress {
  animation: autoplayProgressVertical var(--autoplay-duration, 5s) linear forwards;
}

@keyframes autoplayProgressVertical {
  from { height: 0%; }
  to { height: 100%; }
}

/* Play/pause toggle states */
.tabs-component.autoplay-paused .tabs-autoplay-toggle_pause {
  display: none;
}

.tabs-component.autoplay-paused .tabs-autoplay-toggle_play {
  display: flex;
}

/* Mobile dropdown */
@media (max-width: 47.9375rem) {
  .tabs-menu[data-tab-mobile-dropdown="true"] .tabs-menu_dropdown-toggle {
    display: flex;
  }

  .tabs-menu[data-tab-mobile-dropdown="true"] .tabs-menu_dropdown-toggle.cc-open {
    border-radius: var(--button-radius) var(--button-radius) 0 0;
  }

  .tabs-menu[data-tab-mobile-dropdown="true"] .tabs-menu_dropdown-toggle.cc-open .tabs-menu_dropdown-arrow {
    transform: rotate(180deg);
  }

  .tabs-menu[data-tab-mobile-dropdown="true"] .tabs-menu_dropdown-menu {
    display: none;
    position: absolute;
    top: calc(100% - 1px);
    left: 0;
    right: 0;
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: 0 0 var(--button-radius) var(--button-radius);
    z-index: 10;
    max-height: 300px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .tabs-menu[data-tab-mobile-dropdown="true"] .tabs-menu_dropdown-menu.cc-open {
    display: block;
  }

  .tabs-menu[data-tab-mobile-dropdown="true"] .tabs-link {
    border: none;
  }

  .tabs-menu[data-tab-mobile-dropdown="true"] .tabs-link.cc-active {
    background-color: var(--border-primary);
  }
}

/* Base styles from mast-framework.css are in globals.css:
   .tabs-component, .tabs-menu, .tabs-link, .tabs-autoplay-progress,
   .tabs-autoplay-toggle, .tabs-menu_dropdown-toggle */
```

**Tabs Data Attributes (handled by external JS):**

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `data-tabs-component` | `.tabs-component` | Identifies component root |
| `data-tabs-menu` | `.tabs-menu` | Tab menu container |
| `data-tabs-link` | `.tabs-link` | Individual tab trigger |
| `data-tab-link-name` | `.tabs-link` | Tab identifier for linking |
| `data-tabs-pane` | `.tabs-pane` | Tab content panel |
| `data-tabs-autoplay` | `.tabs-menu` | Enable autoplay (`"true"`) |
| `data-tabs-autoplay-duration` | `.tabs-menu` | Duration in seconds |
| `data-tabs-autoplay-hover-pause` | `.tabs-menu` | Pause on hover (`"true"`) |
| `data-tab-mobile-dropdown` | `.tabs-menu` | Show as dropdown on mobile |
| `data-tabs-autoplay-toggle` | button | Play/pause autoplay |
| `data-tabs-link-button` | button | Hidden accessible button in tab |
| `data-tabs-autoplay-progress` | div | Progress bar element |

**Tabs Class Mappings:**

```tsx
const orientationClasses = {
  horizontal: '',                // Default
  vertical: 'cc-vertical',
}

// Note: Layout (menu position) is handled via row/column structure
// not additional classes on .tabs-menu
```

**Note:** The external `tabs.min.js` handles:
- Tab switching via click and keyboard navigation
- ARIA attribute management (`aria-selected`, `aria-hidden`)
- Autoplay timer with progress animation
- Pause/resume on hover (when configured)
- Mobile dropdown open/close
- Updating dropdown text to show active tab
- Adding `.cc-active` class to active tab
- Adding `.cc-open` class to open dropdown

**Simplified Tabs (without autoplay/dropdown):**

For simple tabs without autoplay or mobile dropdown, the structure is simpler:

```tsx
<div className="tabs-component" data-tabs-component>
  <div className="tabs-menu" role="tablist" data-tabs-menu>
    {tabs.map((tab, index) => (
      <div
        key={tab._key}
        role="tab"
        aria-selected={index === 0}
        className={cn('tabs-link', index === 0 && 'cc-active')}
        data-tabs-link
        data-tab-link-name={tab.label}
      >
        {tab.label}
      </div>
    ))}
  </div>
  {tabs.map((tab, index) => (
    <div
      key={tab._key}
      role="tabpanel"
      aria-hidden={index !== 0}
      className="tabs-pane"
      data-tabs-pane
    >
      {tab.content}
    </div>
  ))}
</div>
```

#### Summary of Interactive Component Changes (Updated)

| Component | Current | Proposed |
|-----------|---------|----------|
| Accordion wrapper | Native `<details>` with Tailwind | Native `<details>` with Mast CSS |
| Accordion animation | CSS Grid trick (`grid-rows-[0fr]`) | `interpolate-size` + external JS fallback |
| Accordion icon rotation | `group-open:rotate-45` | `details[open] .accordion-icon { transform: rotate(45deg) }` |
| Modal | Radix Dialog + Portal | Native `<dialog>` |
| Modal trigger | `<ModalTrigger>` component | `data-modal-trigger` attribute |
| Modal focus trap | Radix built-in | Native `<dialog>` built-in |
| Modal backdrop | Radix `<DialogOverlay>` | Native `::backdrop` pseudo-element |
| Modal close | Radix `<DialogClose>` | `.modal_close-button` + external JS |
| Modal animation | Tailwind `animate-in/out` | CSS `@keyframes modal-fadein` |
| Video modal | `<VideoModalContent>` component | `.modal.cc-video` variant class |
| Tabs | Radix Tabs + React state | Mast CSS + external JS |
| Tabs autoplay | React useEffect timer | CSS animation + external JS |
| Tabs progress | React state + inline style | CSS animation on `.tabs-autoplay-progress` |
| Tabs mobile dropdown | React state + conditional render | CSS + external JS via data attributes |
| Tabs orientation | React context | `.tabs-menu.cc-vertical` class |

#### Dependencies Removed (Updated)

With this approach, you can remove:
- `@radix-ui/react-dialog` - Replaced by native `<dialog>` + Mast JS
- `@radix-ui/react-tabs` - Replaced by semantic HTML + Mast JS
- Complex Tailwind animation utilities - Replaced by simple CSS keyframes
- React state management for tabs autoplay/progress - Handled by external JS

---

### 5.7 Component Class Migration Example

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

### 5.8 Handling Dynamic Values from Sanity

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

## Phase 8: Interactive Component JS (External → React)

Instead of loading external JS from jsdelivr, rewrite the interactive component behavior in React. This provides:
- **No external dependencies** - Eliminates CDN requests and version management
- **Better React integration** - Uses hooks, refs, and React's lifecycle
- **TypeScript support** - Full type safety
- **SSR compatibility** - Works with Next.js server components where appropriate
- **Smaller bundle** - Only loads what's needed per component

### 8.1 Source Analysis

The external Mast JS files were analyzed from `github.com/nocodesupplyco/mast`:

| File | Lines | Key Functionality |
|------|-------|-------------------|
| `accordion.js` | ~100 | Height animation, reduced motion, GSAP fallback |
| `modal.js` | ~130 | Open/close, click-outside, auto-open cooldown |
| `tabs.js` | ~400 | Tab switching, autoplay, keyboard nav, mobile dropdown, deep linking |

### 8.2 Accordion React Implementation

**What the external JS does:**
1. Handles `data-accordion-start-open` attribute for initial state
2. Animates height transitions (with GSAP fallback to CSS transitions)
3. Respects `prefers-reduced-motion` accessibility setting
4. Manages the native `<details>` open attribute

**React implementation approach:**

```tsx
// hooks/useAccordion.ts
import { useRef, useEffect, useCallback } from 'react'

interface UseAccordionOptions {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function useAccordion({ defaultOpen = false, onOpenChange }: UseAccordionOptions = {}) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useRef(false)

  // Check reduced motion preference
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = query.matches

    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches
    }
    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [])

  // Handle animated close
  const handleClick = useCallback((e: React.MouseEvent) => {
    const details = detailsRef.current
    const content = contentRef.current
    if (!details || !content) return

    if (details.open) {
      e.preventDefault() // Prevent native close

      if (prefersReducedMotion.current) {
        details.open = false
        onOpenChange?.(false)
      } else {
        // Animate close
        content.style.height = `${content.scrollHeight}px`
        content.offsetHeight // Force reflow
        content.style.transition = 'height 0.4s ease-in-out'
        content.style.height = '0px'

        setTimeout(() => {
          details.open = false
          content.style.transition = ''
          onOpenChange?.(false)
        }, 400)
      }
    }
  }, [onOpenChange])

  // Handle animated open (via toggle event)
  useEffect(() => {
    const details = detailsRef.current
    const content = contentRef.current
    if (!details || !content) return

    const handleToggle = () => {
      if (details.open) {
        onOpenChange?.(true)

        if (prefersReducedMotion.current) {
          content.style.height = 'auto'
        } else {
          const fullHeight = content.scrollHeight
          content.style.transition = 'height 0.4s ease-out'
          content.style.height = `${fullHeight}px`

          setTimeout(() => {
            content.style.height = 'auto'
            content.style.transition = ''
          }, 400)
        }
      }
    }

    details.addEventListener('toggle', handleToggle)
    return () => details.removeEventListener('toggle', handleToggle)
  }, [onOpenChange])

  // Set initial collapsed state
  useEffect(() => {
    const content = contentRef.current
    if (content && !defaultOpen) {
      content.style.height = '0px'
      content.style.overflow = 'clip'
    }
  }, [defaultOpen])

  return { detailsRef, contentRef, handleClick }
}
```

**Accordion component using the hook:**

```tsx
// components/Accordion.tsx
'use client'

import { useAccordion } from '@/hooks/useAccordion'
import { cn } from '@/lib/utils'

interface AccordionProps {
  title: string
  titleClass?: string
  defaultOpen?: boolean
  className?: string
  children: React.ReactNode
}

export function Accordion({
  title,
  titleClass = 'h4',
  defaultOpen = false,
  className,
  children
}: AccordionProps) {
  const { detailsRef, contentRef, handleClick } = useAccordion({ defaultOpen })

  return (
    <details
      ref={detailsRef}
      className={cn('accordion-component', className)}
      open={defaultOpen}
    >
      <summary className="accordion-trigger" onClick={handleClick}>
        <span className={cn('accordion-title', titleClass)}>{title}</span>
        <svg className="accordion-icon" viewBox="0 0 32 32" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z"
            fill="currentColor"
          />
        </svg>
      </summary>
      <div ref={contentRef} className="accordion-content">
        <div className="accordion-content_spacer">
          {children}
        </div>
      </div>
    </details>
  )
}
```

### 8.3 Modal React Implementation

**What the external JS does:**
1. Binds trigger buttons to show modal
2. Close button and click-outside-to-close
3. Auto-open on page load with optional cooldown (localStorage)
4. Uses native `<dialog>` `showModal()` and `close()` methods

**React implementation approach:**

```tsx
// hooks/useModal.ts
import { useRef, useEffect, useCallback, useState } from 'react'

interface UseModalOptions {
  id?: string
  autoOpen?: boolean
  cooldownDays?: number
  onOpenChange?: (open: boolean) => void
}

export function useModal({
  id,
  autoOpen = false,
  cooldownDays = 0,
  onOpenChange
}: UseModalOptions = {}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Check cooldown from localStorage
  const isInCooldown = useCallback(() => {
    if (!id || cooldownDays <= 0) return false

    try {
      const storageKey = `modal-cooldown-${id}`
      const cooldownUntil = localStorage.getItem(storageKey)

      if (!cooldownUntil) return false

      const now = Date.now()
      const cooldownTime = parseInt(cooldownUntil, 10)

      if (now > cooldownTime) {
        localStorage.removeItem(storageKey)
        return false
      }

      return true
    } catch {
      return false
    }
  }, [id, cooldownDays])

  // Store cooldown timestamp
  const storeCooldown = useCallback(() => {
    if (!id || cooldownDays <= 0) return

    try {
      const storageKey = `modal-cooldown-${id}`
      const cooldownDuration = cooldownDays * 24 * 60 * 60 * 1000
      const cooldownUntil = Date.now() + cooldownDuration
      localStorage.setItem(storageKey, cooldownUntil.toString())
    } catch {
      // Ignore localStorage errors
    }
  }, [id, cooldownDays])

  // Open modal
  const open = useCallback(() => {
    dialogRef.current?.showModal()
    setIsOpen(true)
    onOpenChange?.(true)
  }, [onOpenChange])

  // Close modal
  const close = useCallback(() => {
    dialogRef.current?.close()
    setIsOpen(false)
    storeCooldown()
    onOpenChange?.(false)
  }, [onOpenChange, storeCooldown])

  // Handle click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      close()
    }
  }, [close])

  // Auto-open on mount (if enabled and not in cooldown)
  useEffect(() => {
    if (autoOpen && !isInCooldown()) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        open()
      })
    }
  }, [autoOpen, isInCooldown, open])

  // Handle ESC key (native dialog behavior, but we need to track state)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      setIsOpen(false)
      storeCooldown()
      onOpenChange?.(false)
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onOpenChange, storeCooldown])

  return { dialogRef, isOpen, open, close, handleBackdropClick }
}
```

**Modal component using the hook:**

```tsx
// components/Modal.tsx
'use client'

import { useModal } from '@/hooks/useModal'
import { cn } from '@/lib/utils'

interface ModalProps {
  id?: string
  trigger?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  autoOpen?: boolean
  cooldownDays?: number
  className?: string
  children: React.ReactNode
}

const sizeClasses = {
  sm: 'cc-sm',
  md: '',
  lg: 'cc-lg',
  xl: 'cc-xl',
  full: 'cc-full',
}

export function Modal({
  id,
  trigger,
  size = 'md',
  autoOpen = false,
  cooldownDays = 0,
  className,
  children
}: ModalProps) {
  const { dialogRef, open, close, handleBackdropClick } = useModal({
    id,
    autoOpen,
    cooldownDays
  })

  return (
    <div className="modal-component" id={id}>
      <dialog
        ref={dialogRef}
        className={cn('modal', sizeClasses[size], className)}
        onClick={handleBackdropClick}
      >
        {children}
        <button
          className="modal_close-button"
          onClick={close}
          aria-label="Close"
        >
          <svg className="modal_close-button_icon" viewBox="0 0 14 14" fill="none">
            <path d="M12.673 0.67334L0.67319 12.6731" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M0.673462 0.67334L12.6732 12.6731" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </dialog>

      {trigger && (
        <button className="button" onClick={open}>
          {trigger}
        </button>
      )}
    </div>
  )
}
```

### 8.4 Tabs React Implementation

**What the external JS does:**
1. Tab switching with ARIA attribute management
2. Autoplay with `IntersectionObserver` (pause when off-screen)
3. Autoplay with hover pause option
4. Mobile dropdown menu
5. Keyboard navigation (Arrow keys, Home, End)
6. URL hash deep linking
7. Progress bar animation restart
8. Play/pause toggle button

**React implementation approach:**

```tsx
// hooks/useTabs.ts
import { useState, useRef, useEffect, useCallback } from 'react'

interface UseTabsOptions {
  defaultIndex?: number
  autoplay?: boolean
  autoplayDuration?: number // in seconds
  pauseOnHover?: boolean
  onTabChange?: (index: number) => void
}

export function useTabs({
  defaultIndex = 0,
  autoplay = false,
  autoplayDuration = 5,
  pauseOnHover = false,
  onTabChange,
}: UseTabsOptions = {}) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex)
  const [isPaused, setIsPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const tabCount = useRef(0)
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null)
  const progressKey = useRef(0) // For resetting CSS animation

  // Set active tab
  const setActiveTab = useCallback((index: number) => {
    if (index < 0 || index >= tabCount.current) return
    setActiveIndex(index)
    progressKey.current++ // Reset progress animation
    onTabChange?.(index)
  }, [onTabChange])

  // Navigate to next/prev tab
  const goToNext = useCallback(() => {
    setActiveTab((activeIndex + 1) % tabCount.current)
  }, [activeIndex, setActiveTab])

  const goToPrev = useCallback(() => {
    setActiveTab(activeIndex > 0 ? activeIndex - 1 : tabCount.current - 1)
  }, [activeIndex, setActiveTab])

  // Autoplay timer
  useEffect(() => {
    if (!autoplay || isPaused || !isVisible) {
      if (autoplayTimer.current) {
        clearTimeout(autoplayTimer.current)
        autoplayTimer.current = null
      }
      return
    }

    autoplayTimer.current = setTimeout(() => {
      goToNext()
    }, autoplayDuration * 1000)

    return () => {
      if (autoplayTimer.current) {
        clearTimeout(autoplayTimer.current)
      }
    }
  }, [autoplay, autoplayDuration, isPaused, isVisible, activeIndex, goToNext])

  // IntersectionObserver for visibility
  useEffect(() => {
    if (!autoplay) return

    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.5 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [autoplay])

  // Hover pause handlers
  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true)
  }, [pauseOnHover])

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false)
  }, [pauseOnHover])

  // Toggle play/pause
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        goToPrev()
        break
      case 'ArrowRight':
        e.preventDefault()
        goToNext()
        break
      case 'Home':
        e.preventDefault()
        setActiveTab(0)
        break
      case 'End':
        e.preventDefault()
        setActiveTab(tabCount.current - 1)
        break
    }
  }, [goToNext, goToPrev, setActiveTab])

  // Register tab count
  const registerTabs = useCallback((count: number) => {
    tabCount.current = count
  }, [])

  // URL hash deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash) {
        // Find tab with matching id (implementation depends on tab structure)
        // This would be handled by the component
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange() // Check on mount

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return {
    activeIndex,
    setActiveTab,
    isPaused,
    togglePause,
    containerRef,
    handleMouseEnter,
    handleMouseLeave,
    handleKeyDown,
    registerTabs,
    autoplayDuration,
    progressKey: progressKey.current,
  }
}
```

**Tabs component using the hook:**

```tsx
// components/Tabs.tsx
'use client'

import { useEffect, useState } from 'react'
import { useTabs } from '@/hooks/useTabs'
import { cn } from '@/lib/utils'
import { CaretDown, Pause, Play } from '@phosphor-icons/react'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  orientation?: 'horizontal' | 'vertical'
  autoplay?: boolean
  autoplayDuration?: number
  pauseOnHover?: boolean
  mobileDropdown?: boolean
  className?: string
}

export function Tabs({
  tabs,
  orientation = 'horizontal',
  autoplay = false,
  autoplayDuration = 5,
  pauseOnHover = false,
  mobileDropdown = false,
  className,
}: TabsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const {
    activeIndex,
    setActiveTab,
    isPaused,
    togglePause,
    containerRef,
    handleMouseEnter,
    handleMouseLeave,
    handleKeyDown,
    registerTabs,
    progressKey,
  } = useTabs({
    autoplay,
    autoplayDuration,
    pauseOnHover,
  })

  // Register tab count
  useEffect(() => {
    registerTabs(tabs.length)
  }, [tabs.length, registerTabs])

  const activeLabel = tabs[activeIndex]?.label || 'Select tab'

  return (
    <div
      ref={containerRef}
      className={cn('tabs-component', isPaused && 'autoplay-paused', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ '--autoplay-duration': `${autoplayDuration}s` } as React.CSSProperties}
    >
      <div
        className={cn('tabs-menu', orientation === 'vertical' && 'cc-vertical')}
        role="tablist"
      >
        {/* Mobile dropdown toggle */}
        {mobileDropdown && (
          <button
            className={cn('tabs-menu_dropdown-toggle', dropdownOpen && 'cc-open')}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <span className="tabs-menu_dropdown-text">{activeLabel}</span>
            <span className="tabs-menu_dropdown-arrow">
              <CaretDown className="icon" />
            </span>
          </button>
        )}

        {/* Tab links */}
        <div className={cn(
          'tabs-menu_dropdown-menu',
          mobileDropdown && dropdownOpen && 'cc-open'
        )}>
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              role="tab"
              aria-selected={index === activeIndex}
              className={cn('tabs-link', index === activeIndex && 'cc-active')}
            >
              <span className="tabs-link-text">{tab.label}</span>
              <button
                aria-label={tab.label}
                tabIndex={index === activeIndex ? 0 : -1}
                className="u-link-cover cc-tabs-link"
                onClick={() => {
                  setActiveTab(index)
                  setDropdownOpen(false)
                }}
                onKeyDown={handleKeyDown}
              />
              {autoplay && (
                <div
                  key={`progress-${progressKey}`}
                  className="tabs-autoplay-progress"
                />
              )}
            </div>
          ))}
        </div>

        {/* Autoplay toggle */}
        {autoplay && (
          <button
            className="tabs-autoplay-toggle"
            onClick={togglePause}
            aria-label={isPaused ? 'Play autoplay' : 'Pause autoplay'}
          >
            <span className="tabs-autoplay-toggle_pause">
              <Pause className="icon" weight="fill" />
            </span>
            <span className="tabs-autoplay-toggle_play">
              <Play className="icon" weight="fill" />
            </span>
          </button>
        )}
      </div>

      {/* Tab panes */}
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          aria-hidden={index !== activeIndex}
          className="tabs-pane"
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
```

### 8.5 Implementation Requirements Summary

| Component | Hook | Lines (Est.) | Key Features |
|-----------|------|--------------|--------------|
| Accordion | `useAccordion` | ~80 | Height animation, reduced motion |
| Modal | `useModal` | ~100 | Open/close, cooldown, click-outside |
| Tabs | `useTabs` | ~150 | Autoplay, keyboard nav, deep linking |

**Shared utilities needed:**
- `useReducedMotion()` - Hook for checking `prefers-reduced-motion`
- `useLocalStorage()` - Hook for modal cooldown persistence

**Total estimated lines:** ~400 (vs ~630 in external JS files)

### 8.6 Migration Steps

1. **Create hooks directory:** `frontend/app/hooks/`
2. **Implement hooks in order:**
   - `useReducedMotion.ts` (shared)
   - `useAccordion.ts`
   - `useModal.ts`
   - `useTabs.ts`
3. **Update components** to use new hooks with Mast CSS classes
4. **Remove external script tags** from layout
5. **Test each component:**
   - Accordion: open/close animation, reduced motion, keyboard
   - Modal: trigger, close button, ESC key, click-outside, cooldown
   - Tabs: click, keyboard, autoplay, mobile dropdown, visibility pause

### 8.7 Benefits Over External JS

| Aspect | External JS | React Hooks |
|--------|-------------|-------------|
| Bundle | Separate CDN requests | Tree-shaken with app |
| Loading | After page load | With component |
| TypeScript | None | Full type safety |
| SSR | May flash/rehydrate | Consistent rendering |
| Customization | Fork repo needed | Props and composition |
| Debugging | Minified, external | Source maps, React DevTools |
| Dependencies | jsdelivr CDN | Zero external |

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
- [ ] **Phase 8**: Replace external JS with React hooks:
  - [ ] Create `useReducedMotion.ts` shared utility
  - [ ] Create `useAccordion.ts` hook (~80 lines)
  - [ ] Create `useModal.ts` hook (~100 lines)
  - [ ] Create `useTabs.ts` hook (~150 lines)
  - [ ] Update Accordion component to use hook
  - [ ] Update Modal component to use hook
  - [ ] Update Tabs component to use hook
  - [ ] Remove external jsdelivr script tags from layout
  - [ ] Test all interactive components

---

## Notes

- **No build complexity** - Pure CSS, no PurgeCSS or additional processing
- **~20KB gzipped** - Acceptable size for cached framework CSS
- **Simple selectors** - Fast parsing, no specificity wars
- **Portable** - Framework can be extracted for other projects
