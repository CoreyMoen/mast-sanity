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

- A [Sanity](https://www.sanity.io/) account and project; you can create a project from the web interface, or from the CLI using `sanity projects create`.

- EITHER:
    - Bun 1.3 or later
    - Docker Desktop or a compatible runtime like [OrbStack](https://orbstack.dev/)


### Installation


#### Create environment files:

You'll need to create `.env.local` files at the project root and in each of the two sub-apps, `frontend` and `studio`. However, to make things easy to manage, I recommend putting all env vars in the root and symlinking that file to the other apps. (If you're using Docker, you can skip this step as the env vars will be set up within the containers.)

First, copy the `.env.example` at the root to `.env.local`:

```shell
cp .env.example .env.local
```

Then add symbolic links in each sub-app:

```shell
cd website && ln -s ../.env.local .env.local && cd ..
cd studio && ln -s ../.env.local .env.local && cd ..
```

The root `.env.local` file will have all the variables needed for both apps; note you'll need to enter some values twice, e.g. `NEXT_PUBLIC_SANITY_PROJECT_ID` _and_ `SANITY_STUDIO_PROJECT_ID`.

#### Get and populate Sanity read/write tokens

In that file, you'll need to fill in your Sanity project ID and read/write tokens. If you don't already have tokens set up, you can create them in either of two ways:

**Web console at [sanity.io/manage](https://www.sanity.io/manage)**: From your project settings, go to _API → Tokens_. Create one new token with **Editor** permissions (for seeding your database and running scripts) and another with **Viewer** permissions.

**CLI:** Once your project ID is entered in your `.env.local` file, you can use the Sanity CLI to create and get tokens:

```shell
cd studio

bun sanity tokens create "Read/Write Token" --role=editor
# Copy the token displayed into your .env file's SANITY_API_TOKEN variable; it won't be shown again

bun sanity tokens create "Read-only Token" --role=viewer
# Copy the token displayed into your .env file's SANITY_API_READ_TOKEN variable; it won't be shown again
```

#### Don't forget to add CORS origins!

This project makes use of Sanity's visual editing and Live Content APIs, which require your dev server URLs to be registered with Sanity's CDN. As with tokens, you can use either the web GUI or the CLI:

**Web console at [sanity.io/manage](https://www.sanity.io/manage)**: From your project settings, go to _API → CORS Origins_. Add _both_ app URLs — `http://localhost:3001` and `http://localhost:3334`.

**CLI:** Once your project ID is entered in your `.env.local` file, you can use the Sanity CLI to add CORS origins:

```shell
cd studio
bun sanity cors add http://localhost:3001
bun sanity cors add http://localhost:3334
```

#### Seed your project's dataset

```shell
bun run seed
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

### Running the dev servers

Option 1: Local development using [Bun](https://bun.com/):

```shell
gh repo clone CoreyMoren/mast-sanity
cd mast-sanity && bun install

# To run everything:
bun dev
```

Option 2: Container-based setup using Docker/OrbStack:

```shell
gh repo clone CoreyMoren/mast-sanity
cd mast-sanity
bun dev:docker # or docker compose up
```

With either setup, you can access your project's apps at the following URLs:

- **Sanity Studio:** http://localhost:3334
- **Next.js Frontend:** http://localhost:3001


### Type Generation

TypeScript types for your Sanity schema and queries are generated automatically when you start the dev server. If you need to regenerate these for any reason, you can run _either_ of these commands (they do the same thing):

```shell
# In the frontend/ directory
bun run typegen

# In the studio directory
bun sanity typegen generate
```

To check types across the whole project you can run `bun type-check` at the project root, which runs `turbo run type-check` under the hood.


```shell
bun run type-check                    # Check TypeScript types for both projects
bun run type-check --filter=frontend  # Check TypeScript types for frontend 
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
