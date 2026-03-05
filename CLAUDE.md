# Claude Code Project Instructions

This document contains project-specific instructions and context for Claude Code when working on this codebase.

## Project Overview

**Angela** is a SaaS web application for scheduling, managing, and optimizing social media posts across multiple platforms (Instagram, Facebook, X/Twitter, LinkedIn). It features AI-assisted caption writing, a visual calendar/list scheduler, analytics, and a tiered subscription model.

### Tech Stack
- **Framework**: Next.js (App Router)
- **Frontend**: React 19, Tailwind CSS v4
- **Backend / Database**: Convex (real-time backend-as-a-service)
- **Authentication**: Clerk (user auth, org management, role-based access)
- **Payments**: Stripe (primary), Converge (future alternative)
- **AI / LLM**: Google Gemini (default), BYOK support (OpenAI, Anthropic)
- **Hosting**: Vercel
- **File Storage**: Convex file storage (for media assets)
- **Job Scheduling**: Convex cron jobs + scheduled functions

## Environment Constraints

### No esbuild/tsx on this machine
The `npx tsx` command does not work due to esbuild issues. When creating scripts or Node.js utilities:
- Use `.mjs` extension with ES modules (`import`/`export`)
- Run with plain `node scripts/filename.mjs`
- Avoid TypeScript for scripts that need to run directly

### Dev Servers via Docker/OrbStack
**IMPORTANT**: Dev servers cannot be started directly from the terminal on this machine. They must be run via Docker containers in the OrbStack app.

- **Do NOT** attempt to run `npm run dev` directly
- The user manages dev servers through OrbStack's Docker interface
- For verification, use TypeScript compilation (`npx tsc --noEmit`) instead of starting dev servers
- If the user needs to restart servers, they will do it manually via OrbStack

## Project Structure

```
angela/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (Clerk)
│   │   ├── sign-in/[[...sign-in]]/
│   │   └── sign-up/[[...sign-up]]/
│   ├── (dashboard)/              # Authenticated app shell
│   │   ├── layout.tsx            # Sidebar + header layout
│   │   ├── page.tsx              # Dashboard home / overview
│   │   ├── calendar/
│   │   ├── posts/
│   │   ├── analytics/
│   │   ├── media/
│   │   ├── accounts/
│   │   ├── team/
│   │   └── settings/
│   ├── api/webhooks/             # Webhook handlers (Stripe, Clerk)
│   ├── providers.tsx             # ClerkProvider + ConvexProvider
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page / marketing
├── components/
│   ├── ui/                       # Shared UI components
│   ├── calendar/                 # Calendar-specific components
│   ├── composer/                 # Post composer components
│   ├── analytics/                # Charts and analytics widgets
│   └── media/                    # Media library components
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema (12 tables)
│   ├── auth.config.ts            # Clerk auth config
│   ├── posts.ts                  # Post CRUD + scheduling
│   ├── publishing.ts             # Platform API publishing actions
│   ├── users.ts                  # User management (Clerk sync)
│   ├── analytics.ts              # Analytics fetching + aggregation
│   ├── media.ts                  # Media upload + management
│   ├── ai.ts                     # LLM integration
│   ├── billing.ts                # Stripe subscription logic
│   ├── socialAccounts.ts         # OAuth + account management
│   ├── recurringPosts.ts         # Recurring post rule engine
│   ├── approvals.ts              # Approval workflow logic
│   ├── crons.ts                  # Cron job definitions
│   └── http.ts                   # HTTP endpoints (webhooks)
├── lib/
│   ├── utils.ts                  # cn() helper for Tailwind classes
│   ├── llm/                      # LLM provider abstraction
│   ├── payments/                 # Payment provider abstraction
│   ├── platforms/                # Social platform API clients
│   └── utils/                    # Encryption, timezone, validation
├── middleware.ts                  # Clerk auth middleware
└── package.json
```

## Key Architecture Patterns

### Convex is the Backend
- There is no separate Express/Node server. All backend logic lives in `convex/` as queries, mutations, actions, and cron jobs.
- Use `useQuery` hooks for real-time data — the UI auto-updates when data changes.
- External API calls (social platforms, LLMs, Stripe) must use Convex **actions** (not mutations).

### Authentication Flow
- Clerk manages all user auth (sign-up, login, OAuth, MFA)
- Clerk organizations handle team/workspace management
- Clerk webhook syncs user data to Convex `users` table
- Use `ctx.auth.getUserIdentity()` in Convex functions to validate requests
- Middleware protects all `/(dashboard)` routes

### Subscription Tiers
| Feature | Free | Pro | Business |
|---|---|---|---|
| Connected accounts | 1 | 10 | 25 |
| Scheduled posts/month | 10 | Unlimited | Unlimited |
| Team members | 1 | 3 | 15 |
| AI captions/month | 10 | 100 | Unlimited |
| Analytics retention | 7 days | 90 days | 1 year |

Tier limits are defined in `lib/utils/validation.ts` as `TIER_LIMITS`.

### Encryption
- Use `aes-256-gcm` for encrypting OAuth tokens and user API keys at rest
- Encryption utilities in `lib/utils/encryption.ts`
- The encryption key is stored as an environment variable

### Timezone Handling
- Always store times as UTC timestamps in Convex
- Convert to user's timezone only in the UI layer
- Timezone utilities in `lib/utils/timezone.ts`

## Design System
- **Primary accent**: Indigo-600 (`bg-indigo-600`, `text-indigo-600`)
- **CSS-first Tailwind v4**: Configuration in `app/globals.css`
- **Icons**: Lucide React (`lucide-react`)
- **Utility function**: `cn()` from `lib/utils.ts` for conditional Tailwind classes
- **Font**: Geist Sans (configured in root layout)

## Common Tasks

### Type Checking
```bash
npx tsc --noEmit
```

### Environment Variables
See `.env.example` for all required variables. Key ones:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CONVEX_URL`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `GEMINI_API_KEY`
- `ENCRYPTION_KEY` (32-byte hex for AES-256-GCM)
