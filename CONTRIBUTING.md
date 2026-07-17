# Contributing

Thanks for your interest in contributing! This project is a Mast design system implementation for Sanity + Next.js.

## Getting Started

1. Fork and clone the repository
2. Install dependencies: `npm install` (Node 22.12+ required)
3. Copy the env templates and fill in your Sanity project details:
   - `.env.example` → `.env` (seed scripts)
   - `frontend/.env.example` → `frontend/.env.local`
   - `studio/.env.example` → `studio/.env`
4. Start the dev servers: `npm run dev` (frontend on port 3001, Studio on port 3334)

See the [README](README.md) for full setup instructions, including creating a Sanity project and seeding starter content.

## Before Submitting a PR

Run the same checks CI runs:

```bash
npm run lint          # ESLint on the frontend
npm run type-check    # TypeScript in both workspaces
```

If you change any Sanity schema, regenerate the typed query results and commit the generated files:

```bash
cd frontend && npm run typegen
```

CI fails if `studio/schema.json` or `frontend/sanity.types.ts` are stale.

## Project Structure

- `frontend/` — Next.js 16 app (App Router, Tailwind CSS v4)
- `studio/` — Sanity Studio v6 (schemas, plugins, structure)
- `scripts/` — seed scripts (`.mjs`, run with plain `node`)
- `docs/` — feature guides and design documents

[CLAUDE.md](CLAUDE.md) documents the content architecture (page builder hierarchy, nesting-depth limits, block types) and is worth reading before schema work.

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Match the existing code style (Prettier config is enforced; run `npm run format`)
- Update documentation when behavior changes
- For new blocks: add the schema in `studio/src/schemaTypes/objects/`, the component in `frontend/app/components/blocks/`, and register both

## Reporting Issues

Open an issue at [GitHub Issues](https://github.com/CoreyMoen/mast-sanity/issues) with reproduction steps. For security issues, see [SECURITY.md](SECURITY.md).
