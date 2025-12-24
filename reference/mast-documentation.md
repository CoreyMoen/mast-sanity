# MAST Framework Documentation

> Source: https://www.nocodesupply.co/mast/docs

## Overview
Mast is a lightweight, component-first CSS framework for Webflow built on front-end development methodologies enabling efficient, scalable, and reusable development.

## Core Sections

### Getting Started
- Clone the Mast style guide project
- Update project settings (name, subdomain, fonts)
- Customize variables and classes to match brand specifications
- For existing projects: copy style guide elements in specific order to avoid class conflicts

### Fundamentals

**Mindset Principles:**
- 80/20 rule: Use default classes for ~80% of work; custom solutions for remaining 20%
- "Don't Repeat Yourself" (DRY): Maximize code reuse
- Reduce cognitive load through consistent mental models
- Already styled: Elements have intentional defaults (heading margins, column gaps)

**Class Types:**
1. Base classes (section, container, row, col, form, input, h1, btn)
2. Utility classes (prefixed u-, modified finite styling)
3. Custom classes (unique component styling)
4. Combo classes (prefixed cc-, modify base/custom variants)

**Naming Strategy:**
- Modified BEM (Block Element Modifier) approach
- Lowercase only, dashes between words, underscores for context levels
- Prefixes: u- (utility), cc- (combo), styles__ (style guide only)
- Breakpoint infixes: -lg- (desktop), -md- (tablet), -sm- (mobile landscape), -xs- (mobile portrait)
- Size notation: -sm, -md, -lg, -xl postfixes

**Class Management:**
- Avoid stacking more than 4 utility classes
- Don't combine custom and utility classes
- Clear unused classes regularly
- Use "Prevent delete" section for classes used in custom code

### Variables

**Collections:**
1. **Theme**: Base and invert modes controlling background, text, border, accent colors
2. **Typography**: Global fonts, headings, paragraph, eyebrow values with fluid clamp() sizes
3. **Components**: Section, container, card, button, input variables
4. **Layout**: Grid gap, margin, fluid values
5. **Color**: Brand color swatches organized by groups

**Nomenclature**: Title case with spaces for legibility; organized for scanning and variable association

### Interactions & Animations

**Attribute-based System:**
- Uses data-animate attribute on elements
- Example: data-animate="stagger-children" for child stagger fade-in
- Bound to props on Section, Row, Column, Content Wrap components
- Utilizes Webflow's Interactions with GSAP (IX3)

**Best Practices:**
- Avoid CSS transition: all (only transition specific properties)
- Consider motion preferences (reduced motion settings)
- Ensure interactions target classes, not individual elements
- Make interactions reusable via parent/sibling/children targeting

### Custom Code Best Practices

**Hosting Strategy:**
- Embed: When on-canvas precision needed
- Page Settings: For code used on 1-5 pages
- Custom Components: CSS in component, external JS via CDN/GitHub
- Project Settings: Global code applied site-wide

**HTML Tips:**
- Remove fixed SVG dimensions, keep viewBox
- Add <title> element for SVG accessibility
- Use currentColor for color control

**CSS/JavaScript:**
- Target attributes/IDs instead of classes
- Load external scripts in <body> (before closing tag)
- Early exit patterns for conditional execution

---

## Styles

### Typography

**Font Sizes (Fluid Clamp - Min/Max):**

| Element | Min | Max |
|---------|-----|-----|
| H1 | 5.5rem | 2.8rem |
| H2 | 3.8rem | 2rem |
| H3 | 2.3rem | 1.5rem |
| H4 | 1.5rem | 1.3rem |
| H5 | 1.2rem | 1.1rem |
| H6 | 1rem | 0.9rem |
| Paragraph XL | 1.5rem | 1.2rem |
| Paragraph LG | 1.25rem | 1.1rem |
| Body | 1rem | 0.9rem |
| Paragraph SM | 0.9rem | 0.8rem |
| Eyebrow | 0.8rem | 0.7rem |

**Spacing Strategy:**
- EM-based bottom margins on type (scales with font size)
- Automatically responsive via proportional sizing
- Heading/class consistency for semantic HTML + visual control

### Color System

**Background Colors:**
- u-bg-primary (#d14424)
- u-bg-yellow (#f8d47a)
- u-bg-blue (#0073e6)
- u-bg-black (#1d1c1a)
- u-bg-darkgray (#292825)
- u-bg-midgray-2 (#474641)
- u-bg-midgray-1 (#cccabf)
- u-bg-lightgray (#f0eee6)
- u-bg-white (#ffffff)

**Text Colors:**
- u-text-primary, u-text-black, u-text-darkgray, u-text-midgray-2, u-text-midgray-1, u-text-lightgray, u-text-white (matching bg values)

**Modes:**
- u-mode-dark: Dark theme colors
- u-mode-light: Light theme colors

### Utilities

**Margin:**
- u-mt-0/sm/md/lg, u-mt-auto
- u-mb-0/sm/md/lg, u-mb-auto
- u-m-0, u-mlr-auto (centers element)

**Padding:**
- u-pt-0, u-pb-0, u-p-0

**Alignment:**
- u-text-center, u-text-right, u-text-left

**Text Wrapping:**
- u-text-clamp-1/2/3 (truncate to lines)
- u-text-balance, u-text-pretty

**Overflow:**
- u-overflow-hidden, u-overflow-visible

**Display/Position:**
- u-d-none, u-d-block, u-d-flex, u-d-inline-flex
- u-position-relative, u-position-sticky
- Responsive variants: u-md-d-none, u-sm-d-none, u-xs-d-none, etc.

**Size:**
- u-w-100, u-h-100, u-minh-100vh

**Aspect Ratio:**
- u-aspect-1x1, u-aspect-16x9, u-aspect-4x3

**Helpers:**
- u-img-cover (absolute full image, object-fit)
- u-link-cover (absolute full link block)
- u-z-index-1, u-sr-only, u-border

---

## Layout

### Page Structure
- page-wrapper: Wraps all, controls global colors
- page-main: Semantic <main>, wraps body sections
- Custom Code: Global component on every page
- Navigation: <nav> before page-main
- Footer: <footer> after page-main

### Section
- Base class for <section>/<div> wrappers
- Default top/bottom padding
- Supports utility classes (u-pt-0, u-pb-0)

### Container
- Base class for <div> wrapping non-full-width content
- Max-width centered layout
- Default left/right spacing

### Grid System (12-column Flexbox)

**Responsive Column Classes:**
- Desktop: col-lg-1 through col-lg-12
- Tablet: col-md-1 through col-md-12
- Mobile Landscape: col-sm-1 through col-sm-12
- Mobile Portrait: col-xs-1 through col-xs-12

**Row Alignment (vertical):**
- row-align-center, row-align-end

**Row Justification (horizontal):**
- row-justify-center, row-justify-end, row-justify-around, row-justify-between

**Column Offset:**
- col-lg/md/sm/xs-offset-1 through offset-6

**Column Reorder:**
- col-lg/md/sm/xs-first, col-lg/md/sm/xs-last

**Gap Modifiers:**
- row-gap-md, row-gap-sm, row-gap-button, row-gap-0

**Other Column Utilities:**
- col-shrink (width of content)
- col-lg-contain-left, col-lg-contain-right (extend beyond container)

---

## Components

### Interactive

**Button:**
- btn (base class)
- btn-text, btn-icon (child elements)
- button (component), button Button Secondary (variant)
- All Links (text link styling)

**Form:**
- form (base <form>)
- input-group (wrapper for label + input)
- input-label, input (base styles)
- input cc-light (dark background variant)
- input cc-select (select element variant)
- input cc-textarea (textarea variant)
- input cc-toggle (checkbox/radio variant)
- input-radio, input-radio cc-light
- input-check, input-check cc-light
- form_required-note (asterisk styling)

**Accordion:**
- accordion-item, accordion-trigger, accordion-title, accordion-icon, accordion-content, accordion-content_spacer
- Uses <details>/<summary> HTML
- Accordion component with props
- Custom JS closes by default, animates with GSAP
- Group name field associates multiple accordions

**Modal:**
- modal (<dialog> element)
- button (sibling trigger)
- Uses native HTML <dialog>
- Custom JS handles open/close
- Modal component with props and slot

**Slider:**
- slider-component, slider-nav, slider-pagination, slider-pagination_button
- swiper, swiper-wrapper, swiper-slide (Swiper.js required)
- Based on Swiper.js library
- Slides Per Breakpoint and Slides Gap props
- CMS collection integration available
- Slider, Slider Slide components

**Inline Video:**
- inline-video_component, inline-video_video, inline-video_poster, inline-video_playback, inline-video_playback-button
- Lazy loading support
- Play on desktop only, scroll into view, hover options
- Inline Video component

**Marquee:**
- marquee-component, marquee-wrapper, marquee-content, marquee-group
- Pure CSS animation
- Duplicate content in each marquee-group slot
- Marquee component with animation props

**Tabs:**
- tabs-component, tabs-menu, tabs-link, tabs-pane
- tabs-menu_dropdown-toggle, tabs-menu_dropdown-text, tabs-menu_dropdown-arrow (mobile)
- tabs-autoplay-toggle, tabs-autoplay-toggle_pause, tabs-autoplay-toggle_play
- tabs-autoplay-progress (for autoplay visualization)
- Tabs, Tabs Menu, Tabs Link, Tabs Pane, Tabs Play/Pause components
- Mobile dropdown option, autoplay with pause on hover
- Tab linking via URL hash (example.com/test#tabidhere)
- cc-active class sets default active tab

### Content

**Eyebrow:**
- eyebrow-wrapper, eyebrow base classes
- Eyebrow component with alignment variants

**Breadcrumb:**
- breadcrumb-nav, breadcrumb-list, breadcrumb-item, breadcrumb-arrow
- Meta elements with content attributes for schema markup
- eyebrow cc-breadcrumb combo class

**Icon:**
- icon (base class)
- icon-color (wrapper for size variants)
- Icon, Icon Size components
- Integrates external CSS icon libraries (default: Phosphor)
- Color and size controlled via component variants

**Image:**
- img-component (base)
- Image, Image Fit components
- Aspect ratio and object-fit control

**Card:**
- card (border radius, background)
- card-body (modular padding)
- Uses component/modal padding variables
- Card, Card Body components
- slot cc-card, slot cc-card-body slots

**Table:**
- table-component (parent)
- table, table-head, table-body
- table-row, table-cell
- Table, Table Row, Table Cell components

**Heading:**
- heading-component (adjusted styles)
- Heading component with text alignment variants

**Rich Text:**
- rich-text (base class)
- Native element child selectors for fine-tuning
- rich-text All H1-6 (top margin), rich-text All Figures/Images (border radius), rich-text All Figure Captions, rich-text All Code
- Rich Text component with alignment variants
- Supports embeds, code blocks, maps, etc.

**Content Wrap:**
- content-wrap-component (base)
- Content Wrap component
- Alignment variants, role attribute support
- Animation capability
- Commonly wraps Accordion components

### Global

**Navigation:**
- nav (<nav> element)
- nav-custom-css, nav-custom-js (embeds)
- nav-skip-link (keyboard-only skip link)
- container cc-nav (combo)
- nav-logo_link, nav-menu, nav-menu_container
- nav-dropdown_overlay, nav-dropdown, nav-dropdown_content, nav-dropdown_arrow
- nav-link cc-dropdown-btn, nav-link, nav-cta-wrapper
- nav-menu_btn, nav-menu_btn-bar (hamburger icon)
- Nav component with color mode prop and menu visibility toggle
- Dropdown and mega dropdown support

**Navigation Banner:**
- nav-banner (link wrapper)
- Nav Banner component with visibility, text, link props

**Footer:**
- section cc-footer (combo)
- footer-logo_link, footer-link
- footer-social_list, footer-social_link
- Flexible layout using grid and utilities

**Theme Toggle:**
- theme-toggle-component, theme-toggle-label
- theme-toggle-state, theme-toggle-checkbox
- u-mode-dark, u-mode-light (utility classes)
- Theme Toggle component
- Uses CSS light-dark() spec and JS control
- Custom Code component contains Theme Toggle CSS/JS embeds

**Custom Code:**
- Global Canvas CSS embed
- Global CSS and JS embeds
- Per Page CSS Overrides (hidden by default)
- Canvas QA visibility prop (optional QA highlighting)
- Component-specific custom code with visibility props

### Build Mode

**Section:**
- section cc-themed (<section> with Theme combo)
- container (base class)
- slot cc-section (vertical flexbox slot)
- Section component with color mode variants

**Grid:**
- row (base class with variants for alignment/justification)
- col (base class with width variants)
- slot cc-column (vertical flexbox slot)
- Grid Row component (alignment variants)
- Grid Col component (size variants, content alignment)

**Spacer:**
- spacer-component (base with size variants)
- Spacer component

**Border:**
- u-border (utility class)
- Border component for Build Mode

---

## Design Specifications

### Breakpoints
- Desktop: >=992px (infix: -lg-)
- Tablet: 768px-991px (infix: -md-)
- Mobile Landscape: 479px-767px (infix: -sm-)
- Mobile Portrait: <=478px (infix: -xs-)

### 12-Column Grid
- Default gap: 40 pixels
- Max-width: Project-dependent
- Flexbox-based system

### Key Variables
- Font families: General Sans, Ubuntu
- Font smoothing: Antialiased
- Selection color: Background #d14424, Text #eeebdd
- Border radius: Defined by component variables
- Padding: Set by component variables

---

## Change Log

### Version 2.4 (November 2025)

**Styles/Variables:**
- Attribute-based global animation system
- Theme variables collection updates for Theme Toggle
- New column offset classes
- Column contain left/right classes (viewport edge extension)
- New Columns variable (defaults to 12)

**Components:**
- Table component (new)
- Theme Toggle component (new)
- Tabs component (new)
- Slider component (new)
- Inline Video component (new)
- Marquee component (new)

**Refinements:**
- Component prop reorganization
- Button accessibility and reusability updates
- Rich Text element example on Styles page
- Container/gap variable refactoring (gutter support)
- External JS moved to Custom Code component
- Canvas QA visibility prop
- Per-component custom code visibility toggles

### Version 2.3 (August 2025)

**Styles:**
- Responsive variables replaced by fluid clamp
- All typography with fluid font size
- Section padding fluid clamp
- Column offset utilities

**Components:**
- Image component custom aspect ratio support
- Section/Grid Column gap removed (use margins)
- Modal now proper component with props/slot
- Visibility props in Advanced group

**Refinements:**
- Custom Code component organization
- JavaScript optimization
