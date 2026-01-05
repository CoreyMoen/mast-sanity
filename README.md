# Mast Component Framework for Sanity

A Sanity + Next.js implementation of the [Mast Component Framework](https://mast.webflow.io/), originally built for Webflow. This project brings Mast's powerful page-building system to the headless CMS world with real-time visual editing.

## What is Mast?

Mast is a component-based design system and page builder framework that provides a structured, flexible approach to building websites. It uses a hierarchical **Section → Row → Column → Content Block** architecture that gives designers and developers precise control over layout and content.

## Features

### Page Builder Architecture

- **Sections** - Top-level containers with background options, padding controls, and max-width settings
- **Rows** - Flexible layouts with horizontal/vertical alignment, gap controls, and wrap options
- **Columns** - Responsive width controls (12-column grid), with desktop/tablet/mobile breakpoints
- **Content Blocks** - Modular components including headings, rich text, images, buttons, sliders, tabs, accordions, and more

### Visual Editing

- **Real-time Preview** - Edit content in Sanity Studio and see changes instantly in the presentation view
- **Custom Overlay Labels** - Hover over any component to see its type (Section, Row, Column, Heading, etc.)
- **Column Gutter Indicators** - Visual SVG pattern showing column padding/gaps in edit mode
- **Drag-and-Drop** - Reorder sections, rows, and content blocks with Sanity's visual editing tools

### Responsive Design

- **Breakpoint Controls** - Set different column widths for desktop, tablet, and mobile
- **Mobile-First** - Columns stack vertically on mobile with optional reverse order
- **Flexible Gaps** - Configurable spacing between columns using a Bootstrap-style gutter system

### Component Library

- Heading Block
- Rich Text Block
- Image Block
- Button Block
- Spacer Block
- Divider Block
- Slider/Carousel Block
- Tabs Block
- Accordion Block
- Card Block
- Icon Block
- Modal Block
- Video Block
- Marquee Block
- Breadcrumb Block
- Table Block

## Tech Stack

- **Frontend:** Next.js 15 (App Router, Turbopack)
- **CMS:** Sanity v3 with Presentation Tool
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI primitives
- **Icons:** Phosphor Icons, Lucide React

## Project Structure

```
├── frontend/          # Next.js application
│   ├── app/
│   │   ├── components/
│   │   │   ├── blocks/      # Content block components
│   │   │   ├── overlays/    # Visual editing overlay components
│   │   │   └── ui/          # Reusable UI components
│   │   └── ...
│   └── sanity/              # Sanity client configuration
│
└── studio/            # Sanity Studio
    └── src/
        ├── schemaTypes/     # Content schemas
        └── structure/       # Studio structure configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Sanity account ([sanity.io](https://www.sanity.io/))

### Installation

1. Clone the repository and install dependencies:

```shell
npm install
```

2. Create environment files:

**`studio/.env`**
```
SANITY_STUDIO_PROJECT_ID="your-project-id"
SANITY_STUDIO_DATASET="production"
SANITY_STUDIO_PREVIEW_URL="http://localhost:4000"
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2025-09-25"
NEXT_PUBLIC_SANITY_STUDIO_URL="http://localhost:3333"
SANITY_API_READ_TOKEN="your-api-token"
```

3. Start the development servers:

```shell
npm run dev
```

- **Sanity Studio:** http://localhost:3333
- **Next.js Frontend:** http://localhost:4000

## Development

### Running Dev Servers

```shell
npm run dev           # Run both Studio and Next.js
npm run dev:studio    # Run only Sanity Studio
npm run dev:next      # Run only Next.js frontend
```

### Type Generation

```shell
npm run type-check    # Check TypeScript types
```

## Credits

- Original Mast Framework: [mast.webflow.io](https://mast.webflow.io/)
- Built with [Sanity](https://www.sanity.io/) and [Next.js](https://nextjs.org/)

## License

This project is for educational and demonstration purposes.
