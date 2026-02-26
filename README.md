# Mast Component Framework for Sanity

A Sanity + Next.js implementation of the [Mast Component Framework](https://www.nocodesupply.co/mast), originally built for Webflow. This project brings Mast's powerful page-building system to the headless CMS world with real-time visual editing and AI-powered content creation.

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

### Claude AI Assistant

A custom Sanity Studio plugin that provides AI-powered content creation and document operations:

- **Real-time streaming** responses from Claude API
- **Document operations** — create, update, and delete content via natural language
- **Schema awareness** — Claude understands your content structure
- **Conversation persistence** — chat history stored in Sanity
- **Custom instructions** — configure writing guidelines and brand voice
- **Workflows** — reusable prompt templates for common tasks

See the [Claude Assistant Porting Guide](docs/claude-assistant-porting-guide.md) for instructions on extracting this plugin for use in other projects.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack)
- **CMS:** Sanity v5 with Presentation Tool
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

**`.env`** (project root — used by seed scripts)

```
SANITY_API_TOKEN="your-write-token"
```

> Create a token with **Editor** permissions at [sanity.io/manage](https://www.sanity.io/manage) → your project → API → Tokens

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
SANITY_API_READ_TOKEN="your-read-token"
ANTHROPIC_API_KEY="your-anthropic-key"  # Optional — enables Claude assistant
```

3. Seed starter content:

```shell
npm run seed
```

This single command populates your Sanity dataset with everything you need to get started:

| Category | What gets created |
|----------|-------------------|
| **Singletons** | Site Settings, Navigation (links + CTA), Footer (link columns + social links) |
| **Pages** | Home page (hero section) + Mast demo page (all block types) |
| **Blog** | 3 categories + 5 sample blog posts |
| **People** | 2 sample authors (Jane Doe, Alex Chen) |
| **Section Templates** | Hero Center, Features 3-Column, CTA Banner, FAQ Accordion |
| **Content Variables** | Brand Name, Support Email, Tagline |
| **Claude AI Config** | API Settings, Training/Instructions, 4 Quick Actions |

After seeding, open Sanity Studio and **publish all documents** so they appear on the frontend.

4. Start the development servers:

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

## Documentation

| Document | Description |
|----------|-------------|
| [Full Project Code Review](docs/full-project-code-review.md) | Comprehensive technical specification of the codebase |
| [Claude Assistant Porting Guide](docs/claude-assistant-porting-guide.md) | Extract the AI assistant plugin for other projects |
| [CLAUDE.md](CLAUDE.md) | Project-specific context for Claude Code |

This project is configured to work with AI assistants like Claude Code. The `.claude/` directory contains performance optimization skills (React and Sanity best practices) that provide context for high-quality code generation.

## Credits

- **Mast Framework** by [NoCode Supply](https://www.nocodesupply.co/mast)
- **Starter Template** — [Next.js + Sanity Clean](https://www.sanity.io/templates/nextjs-sanity-clean) by Sanity
- **React Best Practices** by [@shuding](https://x.com/shuding) at [Vercel](https://vercel.com) — [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- **Sanity Best Practices** from [sanity-io/agent-toolkit](https://github.com/sanity-io/agent-toolkit)
- Built with [Sanity](https://www.sanity.io/) and [Next.js](https://nextjs.org/)

## License

This project is open source under the [MIT License](LICENSE).
