# Angela v1 — Codebase Inventory

Audited: 2026-03-01

This is the verified file-by-file status of the entire codebase. Use this to avoid re-investigating what's already been checked.

---

## Convex Backend (`convex/`)

| File | Status | Notes |
|------|--------|-------|
| `schema.ts` | DONE | 14 tables, all indexes defined |
| `auth.config.ts` | DONE | Clerk JWT configured |
| `users.ts` | DONE | `getMe`, `updateLlmSettings`, `completeOnboarding`, `createUser`, `updateUser`, `deleteUser`. Note: `createUser` accepts `{clerkId, email, name}` but webhook sends `{clerkId, email, firstName, lastName, imageUrl}` — MISMATCH |
| `posts.ts` | DONE | Full CRUD + `listScheduled` |
| `media.ts` | DONE | `generateUploadUrl`, `upload`, `list`, `get`, `update`, `remove`, `bulkDelete`, `addTag`, `removeTag`, `bulkAddTag` |
| `scheduling.ts` | DONE | `schedulePost`, `reschedulePost`, `cancelScheduledPost`, `publishNow` |
| `publishing.ts` | DONE | `publishPost`, `checkAndPublishDuePosts`, `publishPostInternal`. TODO: resolve `mediaIds` to Convex storage URLs |
| `analytics.ts` | DONE | Full fetch + aggregation, tier-gated lookbacks |
| `approvals.ts` | DONE | `submitForApproval`, `approve`, `reject`, `requestChanges`, `listPendingApprovals`, `getApprovalHistory`, `countPending` |
| `recurringPosts.ts` | DONE | Full CRUD + `processRecurringRules` cron target |
| `featureGates.ts` | DONE | `checkPostLimit`, `checkAccountLimit`, `checkTeamLimit`, `checkAILimit` |
| `notifications.ts` | DONE | `create` (internal), `list`, `getUnreadCount`, `markRead`, `markAllRead` |
| `ai.ts` | DONE | `generateCaption`, `rewriteContent`, `suggestHashtags` — credit-gated, logs usage |
| `aiUsage.ts` | DONE | `getUsageSummary`, `checkCreditsAvailable`, `logUsage` |
| `rateLimits.ts` | DONE | Sliding-window rate limiter with preset configs |
| `dataRetention.ts` | DONE | Batched retention enforcement, tier-aware |
| `crons.ts` | DONE | 4 crons: publish (1min), recurring (15min), analytics (6hr), retention (24hr) |
| `constants.ts` | DONE | `TIER_CREDIT_LIMITS`, `PROVIDER_MODELS` |
| `socialAccounts.ts` | PARTIAL | `list`, `connect`, `disconnect` done. `refreshToken` is EMPTY STUB |
| `billing.ts` | PARTIAL | `getSubscription`, `handleSubscriptionUpdate`, `linkStripeCustomer`, `resetMonthlyCredits` done. `createCheckoutSession` and `createPortalSession` are STUBS returning `{ url: "" }` |
| `http.ts` | PARTIAL | Routing works. Clerk sync calls work. Stripe webhook has NO signature verification (commented out). `mapPriceToTier` has EMPTY map. Org/membership handlers are TODO stubs |

## LLM Providers (`lib/llm/`)

| File | Status | Notes |
|------|--------|-------|
| `types.ts` | DONE | `LLMProvider` interface |
| `index.ts` | DONE | Factory: `createLLMProvider()` |
| `gemini.ts` | DONE | Raw fetch to Gemini 2.0 Flash, full implementation |
| `openai.ts` | DONE | REST API (no SDK), full `generateCaption`, `rewriteCaption`, `suggestHashtags` |
| `anthropic.ts` | DONE | REST API using `claude-haiku-4-5-20251001`, full implementation |

## Platform API Clients (`lib/platforms/`)

| File | Status | Notes |
|------|--------|-------|
| `types.ts` | DONE | `PlatformClient` interface |
| `instagram.ts` | DONE | Meta Graph API v21.0, full publish + analytics + refresh |
| `facebook.ts` | DONE | Graph API v21.0, full publish + analytics + refresh |
| `twitter.ts` | PARTIAL | Text-only publish works. **Media upload is a structural placeholder** (empty block). Analytics + refresh done |
| `linkedin.ts` | DONE | UGC Posts API, full publish + analytics + refresh. Personal profile metrics sparse |

## Payment Providers (`lib/payments/`)

| File | Status | Notes |
|------|--------|-------|
| `types.ts` | DONE | `PaymentProvider` interface |
| `index.ts` | DONE | Factory function |
| `config.ts` | DONE | `getActivePaymentProvider()`, `getPriceId()`, `PLAN_METADATA` |
| `stripe.ts` | DONE | Full Stripe integration with signature verification |
| `converge.ts` | STUB | All 4 methods throw `Error("not yet implemented")` |

## Utilities (`lib/`)

| File | Status | Notes |
|------|--------|-------|
| `utils.ts` | DONE | `cn()` Tailwind helper |
| `seo.ts` | DONE | Default metadata |
| `rate-limit.ts` | DONE | In-memory sliding-window limiter with auto-cleanup |
| `utils/encryption.ts` | DONE | AES-256-GCM encrypt/decrypt |
| `utils/validation.ts` | DONE | `PLATFORM_CHAR_LIMITS`, `TIER_LIMITS`, validators |
| `utils/timezone.ts` | DONE | `formatInUserTimezone`, `localToUtcTimestamp`, `utcToZonedDate`, `getBrowserTimezone` |
| `utils/feature-gate.ts` | DONE | Tier-based gate functions for all features |
| `utils/performance.ts` | DONE | `debounce`, `throttle`, `memoize` |
| `analytics/aggregation.ts` | DONE | `aggregatePostMetrics`, `calculateEngagementRate`, `groupByTimePeriod` |
| `notifications/types.ts` | DONE | Notification type definitions |
| `notifications/email.ts` | DONE | Resend-compatible email sender with 5 templates, graceful no-op if no key |

## Dashboard Pages (`app/dashboard/`)

| Page | Status | Notes |
|------|--------|-------|
| `page.tsx` (home) | DONE | Stat cards, usage bars from `api.featureGates.*` |
| `layout.tsx` | DONE | Sidebar + header, onboarding banner |
| `calendar/page.tsx` | MOCK DATA | Delegates to `CalendarView` which uses `generateMockPosts()`. Backend `api.posts.listScheduled` exists but unused |
| `posts/page.tsx` | DONE | Tab bar, PostList, real Convex data |
| `posts/new/page.tsx` | DONE | PostComposer, real Convex data |
| `posts/recurring/page.tsx` | MOCK DATA | All Convex imports commented out. Uses `MOCK_RULES`, `MOCK_TIER = "pro"` |
| `analytics/page.tsx` | MOCK DATA | Uses `generate*()` local functions. Comment: "Uses mock data while Convex analytics API integration is pending" |
| `media/page.tsx` | DONE | Full CRUD, search, tags, bulk ops — all Convex-connected |
| `accounts/page.tsx` | PARTIAL | Convex-connected but `tierLimit` hardcoded to `TIER_LIMITS.free` (TODO comment at line 77) |
| `team/page.tsx` | MOCK DATA | Hardcoded `INITIAL_MEMBERS`, `CURRENT_TIER = "business"`. All state local |
| `approvals/page.tsx` | MOCK DATA | Convex imports commented out. Uses `MOCK_PENDING_POSTS`, etc. |
| `settings/page.tsx` | PARTIAL | All tabs built. Billing tab calls stub Convex actions |
| `onboarding/page.tsx` | DONE | 5-step wizard, Convex-connected |

## API Routes (`app/api/`)

| Route | Status | Notes |
|-------|--------|-------|
| `oauth/[platform]/route.ts` | DONE | Generates OAuth URLs for all 4 platforms with CSRF state |
| `oauth/[platform]/callback/route.ts` | DONE | Exchanges code, encrypts tokens, calls `api.socialAccounts.connect` |
| `webhooks/stripe/route.ts` | DONE | Verifies signature via `StripePaymentProvider.handleWebhook()` |
| `webhooks/clerk/route.ts` | BUG | Sends `{firstName, lastName, imageUrl}` but Convex expects `{name}`. Also calls `api.users.createUser` but it's an `internalMutation` |
| `billing/checkout/route.ts` | EXISTS | Calls stub Convex action |
| `billing/portal/route.ts` | EXISTS | Calls stub Convex action |
| `health/route.ts` | DONE | Simple health check |

## Components (`components/`)

| Directory | Status | Notes |
|-----------|--------|-------|
| `analytics/` | DONE | Recharts-based: engagement-chart, platform-breakdown, stats-card, top-posts-list |
| `approvals/` | DONE | approval-dialog, approval-timeline |
| `composer/` | PARTIAL | ai-caption-panel, ai-rewrite-panel, hashtag-input/suggestions, platform-preview, post-composer. **Media attach button is placeholder only** |
| `media/` | DONE | media-detail, media-grid, media-upload |
| `onboarding/` | DONE | 5 steps |
| `recurring/` | DONE | recurring-rule-card, recurring-rule-form |
| `settings/` | DONE | ai-settings, ai-usage-card, billing-history, data-retention-card |
| `calendar/` | PARTIAL | calendar-day, calendar-view (mock data), week-view |
| `ui/` | DONE | 20+ shared components |

## Config Files

| File | Status | Notes |
|------|--------|-------|
| `middleware.ts` | DONE | Clerk middleware, CSP headers, HSTS |
| `next.config.ts` | DONE | Standalone output, image remote patterns, security headers |
| `.env.example` | DONE | All required env vars documented |
| `tsconfig.json` | DONE | Standard Next.js config |
| `eslint.config.mjs` | DONE | Flat config |
| `Dockerfile` | DONE | Multi-stage build |
| `.dockerignore` | DONE | |
| `package.json` | DONE | All major deps installed. Note: no `openai` or `@anthropic-ai/sdk` packages (providers use raw fetch) |
