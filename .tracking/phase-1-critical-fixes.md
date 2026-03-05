# Phase 1: Critical Fixes

**Priority**: HIGHEST — blocks Phase 2
**Parallelism**: All 3 tasks can run simultaneously
**Estimated scope**: Small fixes, high impact

---

## Task #1: Fix Clerk Webhook Field Mismatch (CRITICAL BLOCKER)

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: nothing
- **Blocks**: Tasks #4, #5, #6, #7, #8 (all of Phase 2)

### Problem

`app/api/webhooks/clerk/route.ts` (line 19) calls:
```ts
api.users.createUser({ clerkId, email, firstName, lastName, imageUrl })
```

But `convex/users.ts` (line 80-84) `createUser` is an `internalMutation` that only accepts:
```ts
{ clerkId: v.string(), email: v.string(), name: v.string() }
```

**Two bugs:**
1. Field mismatch: webhook sends `firstName/lastName/imageUrl`, Convex expects `name`
2. Visibility mismatch: `createUser` is `internalMutation` but webhook calls it via `api.users.createUser` (public API path)

### Fix

**Option A (recommended):** Update the webhook handler to combine names and use `internal` API:
- Change webhook to send `name: \`${first_name} ${last_name}\`.trim()`
- Switch from `api.users.createUser` to using a Convex HTTP action or adding public mutations
- Same fix for `updateUser`

**Option B:** Update Convex mutations to accept `firstName`, `lastName`, `imageUrl` and update schema to store them separately.

Also add missing handlers for:
- `organization.created` / `organization.updated`
- `organizationMembership.created` / `organizationMembership.deleted`

### Files
- `app/api/webhooks/clerk/route.ts`
- `convex/users.ts`
- `convex/schema.ts` (if adding new fields)

---

## Task #2: Wire Up Stripe Billing Stubs in Convex

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: nothing
- **Blocks**: nothing directly (but billing is non-functional without this)

### Problem

`convex/billing.ts` has two stubbed actions:
- `createCheckoutSession` → returns `{ url: "" }` (line ~varies)
- `createPortalSession` → returns `{ url: "" }`

The actual Stripe logic exists in `lib/payments/stripe.ts` (fully implemented with signature verification) but is never called from Convex.

`convex/http.ts` has:
- Stripe webhook signature verification **commented out** — just parses raw JSON
- `mapPriceToTier()` has an **empty** price-to-tier map (all price IDs commented out)
- Org/membership webhook handlers are **empty TODO stubs**

### Fix

1. Wire `convex/billing.ts` `createCheckoutSession` to instantiate and call `StripePaymentProvider`
2. Wire `convex/billing.ts` `createPortalSession` similarly
3. In `convex/http.ts`: uncomment/implement Stripe signature verification
4. In `convex/http.ts`: populate `mapPriceToTier()` with actual Stripe price IDs (or make it configurable via env vars)
5. Update `app/api/billing/checkout/route.ts` and `portal/route.ts` if needed

### Files
- `convex/billing.ts`
- `convex/http.ts`
- `lib/payments/stripe.ts` (reference — already done)
- `lib/payments/config.ts` (reference — has `getPriceId()`)
- `app/api/billing/checkout/route.ts`
- `app/api/billing/portal/route.ts`

---

## Task #3: Fix Accounts Page Tier Limit Hardcoding

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: nothing
- **Blocks**: nothing

### Problem

`app/dashboard/accounts/page.tsx` line 77:
```ts
const tierLimit = TIER_LIMITS.free; // TODO: Fetch from user subscription tier
```

This means all users see the Free tier account limit regardless of their actual plan.

### Fix

1. Use `useQuery(api.users.getMe)` or `useQuery(api.featureGates.checkAccountLimit)` to get the user's actual tier
2. Replace `TIER_LIMITS.free` with dynamic lookup: `TIER_LIMITS[user.subscriptionTier]`
3. Handle loading state while fetching

### Files
- `app/dashboard/accounts/page.tsx`

---

## Completion Checklist

- [x] Task #1: Clerk webhook field mismatch fixed (combined firstName/lastName → name, added imageUrl, switched to public mutations)
- [x] Task #2: Stripe billing wired up end-to-end (checkout, portal, webhook signature verification, price-to-tier mapping)
- [x] Task #3: Accounts page uses real tier limit (reads user.subscriptionTier via api.users.getMe)
- [x] All changes pass type check (no new errors introduced)
