# Angela — Social Media Scheduling SaaS

## Project Overview

**Angela** is a SaaS web application for scheduling, managing, and optimizing social media posts across multiple platforms. It features AI-assisted caption writing, a visual calendar/list scheduler, analytics, and a tiered subscription model.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js (App Router) |
| **Frontend** | React, Tailwind CSS |
| **Backend / Database** | Convex (real-time backend-as-a-service) |
| **Authentication** | Clerk (user auth, org management, role-based access) |
| **Payments** | Stripe (primary), Converge (alternative/future) |
| **AI / LLM** | Google Gemini (default), BYOK support (user-provided API keys) |
| **Hosting** | Vercel |
| **File Storage** | Convex file storage (for media assets) |
| **Job Scheduling** | Convex cron jobs + scheduled functions |

---

## Supported Platforms

- **Instagram** (via Meta Graph API)
- **Facebook** (via Meta Graph API)
- **X / Twitter** (via X API v2)
- **LinkedIn** (via LinkedIn Marketing API)

Each platform requires OAuth-based account connection. Users connect their social accounts through the app and authorize posting permissions.

---

## User Model & Pricing Tiers

### Pricing Structure: Free + Pro + Business

| Feature | Free | Pro | Business |
|---|---|---|---|
| Connected social accounts | 1 | 10 | 25 |
| Scheduled posts per month | 10 | Unlimited | Unlimited |
| Team members | 1 (solo) | 3 | 15 |
| AI caption generation | 10/month | 100/month | Unlimited |
| Analytics retention | 7 days | 90 days | 1 year |
| Approval workflows | ✗ | ✓ | ✓ |
| Recurring posts | ✗ | ✓ | ✓ |
| Priority support | ✗ | ✗ | ✓ |
| Custom branding | ✗ | ✗ | ✓ |

### Subscription Management

- **Stripe** is the primary payment processor for managing subscriptions, invoicing, and billing portal access.
- **Converge** should be architected as a swappable payment provider via an abstraction layer, enabling future migration or A/B testing between processors.
- Clerk handles user identity; Stripe handles billing. Link them via `clerkUserId` stored on the Stripe customer object.
- Use Stripe webhooks to sync subscription status back to Convex.

---

## Core Features (v1)

### 1. Post Scheduling & Calendar (Priority 1)

The primary feature of Angela. Users create posts and schedule them for future publication across one or more platforms.

#### Post Composer
- Rich text editor for post content/caption
- Platform-specific previews (show how the post will look on each selected platform)
- Media attachment support: images (up to 10 for carousels), video, GIFs
- Character count warnings per platform (e.g., 280 for X, 2200 for Instagram)
- Platform selection toggle (choose which platforms to publish to)
- Hashtag input with suggestions
- Schedule date/time picker with timezone support
- "Post now" option in addition to scheduling

#### Calendar View
- Monthly/weekly calendar with drag-and-drop rescheduling
- Color-coded by platform or status (draft, scheduled, published, failed)
- Click on a day to quick-create a new post
- Drag posts between time slots to reschedule
- Visual density indicator for days with many posts

#### List/Queue View
- Chronological list of upcoming scheduled posts
- Filterable by platform, status, date range
- Bulk actions: reschedule, delete, duplicate
- Sort by date, platform, or status

#### Post Statuses
- `draft` — saved but not scheduled
- `pending_approval` — awaiting team review (Pro/Business)
- `scheduled` — approved and queued for publishing
- `publishing` — currently being sent to platform APIs
- `published` — successfully posted
- `failed` — API error or issue; retry available

### 2. AI-Assisted Caption Writing (Priority 2)

AI-powered content generation to help users write better captions and post copy.

#### Features
- **Generate caption**: Provide a topic/prompt, get multiple caption suggestions
- **Rewrite/improve**: Paste existing text, get improved versions
- **Tone adjustment**: Casual, professional, humorous, inspirational, promotional
- **Platform optimization**: Tailor output for specific platform norms (e.g., shorter for X, hashtag-heavy for Instagram)
- **Hashtag generation**: AI-suggested relevant hashtags based on content
- **Multi-language support**: Generate captions in different languages

#### LLM Architecture
- **Default provider**: Google Gemini API (server-side calls via Convex actions)
- **BYOK (Bring Your Own Key)**: Users can input their own API key for Gemini, OpenAI, or Anthropic in settings. Keys are encrypted and stored in Convex.
- **Abstraction layer**: Implement a provider-agnostic interface so adding new LLM providers is straightforward:

```typescript
// Suggested interface
interface LLMProvider {
  generateCaption(prompt: string, options: CaptionOptions): Promise<string[]>;
  rewriteCaption(text: string, tone: Tone): Promise<string[]>;
  suggestHashtags(content: string): Promise<string[]>;
}
```

- Rate limit AI usage based on subscription tier (see pricing table above)

### 3. Analytics & Reporting (Priority 3)

Post-level and account-level analytics pulled from platform APIs.

#### Metrics to Track
- **Per post**: impressions, reach, likes, comments, shares/retweets, saves, clicks
- **Per account**: follower growth, engagement rate, best posting times
- **Per period**: weekly/monthly summary of activity and growth

#### Dashboard
- Overview cards: total posts, total engagement, follower count across platforms
- Charts: engagement over time (line chart), top-performing posts (bar chart)
- Best time to post heatmap (based on historical engagement data)
- Platform comparison view

#### Data Retention
- Free: 7 days
- Pro: 90 days
- Business: 1 year

#### Implementation Notes
- Fetch analytics via platform APIs on a scheduled basis (Convex cron jobs)
- Store aggregated metrics in Convex tables for fast dashboard rendering
- Platform APIs have rate limits — use batched, off-peak fetching

### 4. Media Library / Asset Management (Priority 4)

Centralized storage for images, videos, and other media assets.

#### Features
- Upload and organize media files
- Folder/tag-based organization
- Search by filename, tag, or upload date
- Quick-insert media into post composer
- Image preview and basic metadata display (dimensions, file size)
- Storage limits tied to subscription tier

#### Implementation
- Use Convex file storage for media uploads
- Store metadata (filename, tags, dimensions, uploader, date) in a Convex table
- Generate thumbnails server-side for faster browsing

---

## Additional v1 Features

### 5. Approval Workflows (Pro & Business)

Multi-step content review process for teams.

#### Workflow
1. **Creator** writes a post → status: `draft`
2. Creator submits for review → status: `pending_approval`
3. **Reviewer/Admin** receives notification
4. Reviewer can: approve (→ `scheduled`), request changes (→ `draft` with comments), or reject
5. Approved posts are automatically queued for publishing

#### Roles (managed via Clerk organizations)
- **Admin**: Full access, can approve/reject, manage team
- **Editor**: Can create, edit, and approve posts
- **Creator**: Can create and edit own posts, submit for approval
- **Viewer**: Read-only access to calendar and analytics

### 6. Recurring / Repeating Posts

Allow users to set posts on a recurring schedule.

#### Options
- Repeat: daily, weekly, bi-weekly, monthly, custom interval
- End condition: after N occurrences, on a specific date, or indefinitely
- Editable: modify all future instances or just one
- Each instance is created as a separate scheduled post linked to the recurring rule

---

## Database Schema (Convex Tables)

### Users & Organizations

```
users
├── clerkId: string (indexed)
├── email: string
├── name: string
├── stripeCustomerId: string?
├── subscriptionTier: "free" | "pro" | "business"
├── subscriptionStatus: "active" | "past_due" | "canceled"
├── aiCreditsUsed: number
├── aiCreditsLimit: number
├── llmProvider: "gemini" | "openai" | "anthropic"
├── encryptedApiKey: string? (for BYOK)
└── createdAt: number

organizations
├── clerkOrgId: string (indexed)
├── name: string
├── ownerId: string (ref → users)
├── subscriptionTier: "free" | "pro" | "business"
├── stripeSubscriptionId: string?
└── createdAt: number

orgMembers
├── orgId: string (ref → organizations, indexed)
├── userId: string (ref → users, indexed)
├── role: "admin" | "editor" | "creator" | "viewer"
└── joinedAt: number
```

### Social Accounts

```
socialAccounts
├── userId: string (ref → users, indexed)
├── orgId: string? (ref → organizations, indexed)
├── platform: "instagram" | "facebook" | "twitter" | "linkedin"
├── platformAccountId: string
├── accountName: string
├── accessToken: string (encrypted)
├── refreshToken: string? (encrypted)
├── tokenExpiresAt: number?
├── profileImageUrl: string?
├── isActive: boolean
└── connectedAt: number
```

### Posts

```
posts
├── authorId: string (ref → users, indexed)
├── orgId: string? (ref → organizations, indexed)
├── content: string
├── platforms: string[] (target platforms)
├── mediaIds: string[] (ref → media)
├── hashtags: string[]
├── status: "draft" | "pending_approval" | "scheduled" | "publishing" | "published" | "failed"
├── scheduledAt: number? (indexed)
├── publishedAt: number?
├── timezone: string
├── recurringRuleId: string? (ref → recurringRules)
├── approvalNote: string?
├── approvedBy: string? (ref → users)
├── failureReason: string?
├── createdAt: number
└── updatedAt: number

platformPosts (one per platform per post — tracks platform-specific publish state)
├── postId: string (ref → posts, indexed)
├── socialAccountId: string (ref → socialAccounts)
├── platform: string
├── platformPostId: string? (ID returned by platform after publishing)
├── status: "pending" | "published" | "failed"
├── failureReason: string?
└── publishedAt: number?
```

### Recurring Rules

```
recurringRules
├── authorId: string (ref → users, indexed)
├── orgId: string? (ref → organizations)
├── frequency: "daily" | "weekly" | "biweekly" | "monthly" | "custom"
├── customIntervalDays: number?
├── endType: "never" | "after_count" | "on_date"
├── endAfterCount: number?
├── endOnDate: number?
├── nextOccurrence: number
├── templateContent: string
├── templatePlatforms: string[]
├── templateHashtags: string[]
├── templateMediaIds: string[]
├── isActive: boolean
└── createdAt: number
```

### Media

```
media
├── uploaderId: string (ref → users, indexed)
├── orgId: string? (ref → organizations, indexed)
├── storageId: string (Convex file storage ID)
├── filename: string
├── mimeType: string
├── fileSize: number
├── width: number?
├── height: number?
├── thumbnailStorageId: string?
├── tags: string[]
├── folder: string?
└── uploadedAt: number
```

### Analytics

```
postAnalytics
├── postId: string (ref → posts, indexed)
├── platformPostId: string (ref → platformPosts)
├── platform: string
├── impressions: number
├── reach: number
├── likes: number
├── comments: number
├── shares: number
├── saves: number
├── clicks: number
├── fetchedAt: number
└── periodStart: number (indexed, for retention cleanup)

accountAnalytics
├── socialAccountId: string (ref → socialAccounts, indexed)
├── date: number (indexed)
├── followers: number
├── following: number
├── engagementRate: number
├── postsCount: number
└── fetchedAt: number
```

### AI Usage Log

```
aiUsageLog
├── userId: string (ref → users, indexed)
├── orgId: string? (ref → organizations)
├── action: "generate" | "rewrite" | "hashtags"
├── provider: string
├── inputTokens: number
├── outputTokens: number
├── createdAt: number (indexed)
```

---

## Key Architecture Decisions

### Authentication & Authorization Flow

1. **Clerk** manages all user auth (sign-up, login, OAuth, MFA)
2. Clerk organizations feature handles team/workspace management
3. Clerk webhook syncs user data to Convex `users` table on signup
4. Use Clerk's `getAuth()` in Convex functions to validate requests
5. Role-based access control (RBAC) checked at the Convex function level

### Publishing Pipeline

```
User creates post → saves to Convex (status: draft/scheduled)
                          ↓
         Convex cron job checks for due posts every minute
                          ↓
         Picks up posts where scheduledAt <= now AND status = "scheduled"
                          ↓
         Sets status → "publishing"
                          ↓
         Convex action calls platform APIs (one per platform)
                          ↓
         On success: status → "published", stores platformPostId
         On failure: status → "failed", stores failureReason, queues retry
```

### Real-Time Updates

Convex provides real-time subscriptions out of the box. Use this for:
- Live calendar updates when team members create/edit posts
- Real-time status changes (scheduled → published → etc.)
- Instant notification when a post is submitted for approval
- Live analytics dashboard updates

### API Key Security

- User-provided LLM API keys are encrypted before storage using a server-side encryption key (stored as Convex environment variable)
- Keys are only decrypted server-side within Convex actions when making LLM calls
- Keys are never sent to the frontend

### Stripe Integration

```
User selects plan → Stripe Checkout session (created via Convex action)
                          ↓
                   User completes payment
                          ↓
         Stripe webhook → Convex HTTP endpoint
                          ↓
         Update user/org subscription tier in Convex
                          ↓
         Feature gates enforced in Convex query/mutation validators
```

### Converge Abstraction

Implement a `PaymentProvider` interface so Stripe and Converge can be swapped:

```typescript
interface PaymentProvider {
  createCheckoutSession(params: CheckoutParams): Promise<string>; // returns URL
  createBillingPortalSession(customerId: string): Promise<string>;
  handleWebhook(request: Request): Promise<WebhookEvent>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}
```

---

## Project Structure

```
angela/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (Clerk)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/              # Authenticated app shell
│   │   ├── layout.tsx            # Sidebar + header layout
│   │   ├── page.tsx              # Dashboard home / overview
│   │   ├── calendar/             # Calendar view
│   │   ├── posts/                # List view + post composer
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── media/                # Media library
│   │   ├── accounts/             # Connected social accounts
│   │   ├── team/                 # Team management (Pro/Business)
│   │   └── settings/             # User/org settings, billing, API keys
│   ├── api/                      # Next.js API routes
│   │   ├── webhooks/
│   │   │   ├── stripe/           # Stripe webhook handler
│   │   │   └── clerk/            # Clerk webhook handler
│   │   └── oauth/                # Social platform OAuth callbacks
│   ├── layout.tsx                # Root layout (providers)
│   └── page.tsx                  # Landing page / marketing
├── components/
│   ├── ui/                       # Shared UI components (shadcn/ui)
│   ├── calendar/                 # Calendar-specific components
│   ├── composer/                 # Post composer components
│   ├── analytics/                # Charts and analytics widgets
│   └── media/                    # Media library components
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema definition
│   ├── posts.ts                  # Post CRUD + scheduling logic
│   ├── publishing.ts             # Platform API publishing actions
│   ├── analytics.ts              # Analytics fetching + aggregation
│   ├── media.ts                  # Media upload + management
│   ├── ai.ts                     # LLM integration (caption generation)
│   ├── billing.ts                # Stripe/Converge subscription logic
│   ├── socialAccounts.ts         # OAuth + account management
│   ├── recurringPosts.ts         # Recurring post rule engine
│   ├── approvals.ts              # Approval workflow logic
│   ├── crons.ts                  # Cron job definitions
│   └── http.ts                   # HTTP endpoints (webhooks)
├── lib/
│   ├── llm/                      # LLM provider abstraction
│   │   ├── types.ts
│   │   ├── gemini.ts
│   │   ├── openai.ts
│   │   └── anthropic.ts
│   ├── payments/                 # Payment provider abstraction
│   │   ├── types.ts
│   │   ├── stripe.ts
│   │   └── converge.ts
│   ├── platforms/                # Social platform API clients
│   │   ├── types.ts
│   │   ├── instagram.ts
│   │   ├── facebook.ts
│   │   ├── twitter.ts
│   │   └── linkedin.ts
│   └── utils/                    # Shared utilities
│       ├── encryption.ts
│       ├── timezone.ts
│       └── validation.ts
├── public/                       # Static assets
├── package.json
├── next.config.js
├── tailwind.config.js
├── convex.json
└── .env.local                    # Environment variables
```

---

## Environment Variables

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Converge (future)
CONVERGE_API_KEY=
CONVERGE_WEBHOOK_SECRET=

# Google Gemini (default LLM)
GEMINI_API_KEY=

# Social Platform OAuth
META_APP_ID=
META_APP_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Encryption
ENCRYPTION_KEY=  # For encrypting stored API keys & tokens
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1–2)
- [ ] Next.js project setup with Tailwind, Convex, Clerk
- [ ] Clerk authentication (sign-up, sign-in, org creation)
- [ ] Convex schema definition and basic CRUD operations
- [ ] App shell: sidebar navigation, dashboard layout
- [ ] Landing page / marketing page

### Phase 2: Core Scheduling (Weeks 3–5)
- [ ] Post composer (text, platform selection, media upload)
- [ ] Calendar view with drag-and-drop (weekly + monthly)
- [ ] List/queue view with filters and sorting
- [ ] Social account OAuth connection (Instagram, Facebook, X, LinkedIn)
- [ ] Publishing pipeline (Convex cron + platform API calls)
- [ ] Post status tracking and error handling with retry

### Phase 3: AI Captions (Weeks 6–7)
- [ ] Gemini API integration for caption generation
- [ ] Caption rewrite and tone adjustment UI
- [ ] Hashtag suggestion engine
- [ ] BYOK settings UI (encrypted key storage)
- [ ] LLM provider abstraction (Gemini, OpenAI, Anthropic)
- [ ] Usage tracking and tier-based rate limiting

### Phase 4: Billing & Teams (Weeks 8–9)
- [ ] Stripe integration (Checkout, billing portal, webhooks)
- [ ] Subscription tier enforcement (feature gates in Convex)
- [ ] Team management UI (invite, roles, permissions)
- [ ] Approval workflows (submit, review, approve/reject)
- [ ] Payment provider abstraction for future Converge support

### Phase 5: Analytics & Media (Weeks 10–12)
- [ ] Platform analytics API integration (fetch metrics)
- [ ] Analytics dashboard (charts, top posts, engagement trends)
- [ ] Best time to post heatmap
- [ ] Media library (upload, organize, tag, search)
- [ ] Recurring/repeating posts engine
- [ ] Data retention enforcement per tier

### Phase 6: Polish & Launch (Weeks 13–14)
- [ ] Error handling, loading states, empty states
- [ ] Mobile-responsive design pass
- [ ] Onboarding flow for new users
- [ ] Email notifications (post published, approval needed, failures)
- [ ] Rate limiting and abuse prevention
- [ ] Performance optimization and testing
- [ ] Production deployment to Vercel

---

## Notes for AI Coding Agent

- **Convex is the backend**: There is no separate Express/Node server. All backend logic lives in `convex/` as queries, mutations, actions, and cron jobs.
- **No REST API needed**: Convex functions are called directly from the frontend via the Convex React client. The only HTTP endpoints are for webhooks.
- **Real-time by default**: Use Convex `useQuery` hooks — the UI auto-updates when data changes. No manual polling or refetching needed.
- **Clerk + Convex integration**: Use the official `@clerk/clerk-react` and Convex's Clerk integration for auth. Validate `clerkUserId` in all Convex functions.
- **Platform API rate limits**: All social media platform API calls should be made from Convex actions (not mutations) since they're external HTTP calls. Implement exponential backoff and respect rate limits.
- **Encryption**: Use `aes-256-gcm` for encrypting OAuth tokens and user API keys at rest. The encryption key is a Convex environment variable.
- **Timezone handling**: Always store times as UTC timestamps. Convert to user's timezone only in the UI layer. Use `Intl.DateTimeFormat` or a library like `date-fns-tz`.