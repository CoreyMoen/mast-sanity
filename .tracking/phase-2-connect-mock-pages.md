# Phase 2: Connect Mock Pages to Convex

**Priority**: HIGH — these pages show fake data to users
**Parallelism**: All 5 tasks can run simultaneously (after Phase 1 Task #1 is done)
**Blocked by**: Phase 1 Task #1 (Clerk webhook fix — auth must work for queries)

---

## Task #4: Connect Calendar Page to Convex

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: Task #1
- **Blocks**: Task #16

### Problem

`components/calendar/calendar-view.tsx` uses `generateMockPosts()` (line 25) which creates 8 hardcoded mock posts. The backend query `api.posts.listScheduled` exists and works.

### What to Do

1. Replace `generateMockPosts()` with `useQuery(api.posts.listScheduled, { ... })` or create a new query that returns posts for a date range
2. Map Convex post records to the `CalendarPost` interface used by the calendar components
3. Wire drag-and-drop rescheduling to `useMutation(api.scheduling.reschedulePost)`
4. Wire click-to-create to navigate to `/dashboard/posts/new` or open a quick-create modal
5. Ensure month/week navigation updates the query date range
6. Handle loading and empty states

### Files
- `components/calendar/calendar-view.tsx` — main mock data removal
- `components/calendar/calendar-day.tsx` — may need event handler updates
- `components/calendar/week-view.tsx` — same
- `convex/posts.ts` — `listScheduled` (reference, already done)
- `convex/scheduling.ts` — `reschedulePost` (reference, already done)

---

## Task #5: Connect Team Page to Convex

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: Task #1
- **Blocks**: Task #16

### Problem

`app/dashboard/team/page.tsx` uses:
- `INITIAL_MEMBERS` hardcoded array (line ~varies) with 5 fake members
- `CURRENT_TIER` hardcoded to `"business"` (line 124)
- All role changes and removals are local `useState` only

### What to Do

1. Create Convex queries/mutations for org member management if not already present (check `convex/schema.ts` `orgMembers` table)
2. Replace `INITIAL_MEMBERS` with `useQuery(api.orgMembers.list)` or equivalent
3. Wire role change dropdown to a Convex mutation
4. Wire member removal to a Convex mutation
5. Wire the invite modal (`components/ui/invite-modal.tsx`) to Clerk organization invitation API
6. Fetch actual subscription tier from `api.users.getMe` or `api.featureGates.checkTeamLimit`
7. Handle loading, empty, and error states

### Files
- `app/dashboard/team/page.tsx` — main mock data removal
- `components/ui/invite-modal.tsx` — wire to real invite API
- `convex/schema.ts` — `orgMembers` table (reference)

---

## Task #6: Connect Analytics Page to Convex

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: Task #1
- **Blocks**: Task #16

### Problem

`app/dashboard/analytics/page.tsx` uses local `generate*()` functions for all chart data. Comment at top: "Uses mock data while Convex analytics API integration is pending." The full backend exists in `convex/analytics.ts`.

### What to Do

1. Replace `generateEngagementData()` with `useQuery(api.analytics.getDashboardStats)` or equivalent
2. Replace `generatePlatformData()` with `useQuery(api.analytics.getPlatformBreakdown)` or equivalent
3. Replace `generateTopPosts()` with `useQuery(api.analytics.getTopPosts)` or equivalent
4. Wire date range selector to query parameters
5. Map Convex return types to the shapes expected by Recharts components in `components/analytics/`
6. Enforce data retention limits per subscription tier (7d free / 90d pro / 1yr business)
7. Handle loading states with skeleton charts

### Files
- `app/dashboard/analytics/page.tsx` — main mock data removal
- `components/analytics/engagement-chart.tsx`
- `components/analytics/platform-breakdown.tsx`
- `components/analytics/stats-card.tsx`
- `components/analytics/top-posts-list.tsx`
- `convex/analytics.ts` (reference — already done)

---

## Task #7: Connect Approvals Page to Convex

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: Task #1
- **Blocks**: Task #16

### Problem

`app/dashboard/approvals/page.tsx` has Convex imports commented out with `// TODO: Replace with Convex query`. Uses `MOCK_PENDING_POSTS`, `MOCK_APPROVED_POSTS`, `MOCK_REJECTED_POSTS`, `MOCK_HISTORY` arrays.

### What to Do

1. Uncomment `useQuery(api.approvals.listPendingApprovals)` and wire it up
2. Uncomment `useQuery(api.approvals.getApprovalHistory)` and wire it up
3. Wire approve button to `useMutation(api.approvals.approve)`
4. Wire reject button to `useMutation(api.approvals.reject)`
5. Wire "request changes" to `useMutation(api.approvals.requestChanges)`
6. Remove all `MOCK_*` arrays
7. Gate the approvals feature to Pro/Business tiers using `UpgradeGate`
8. Wire approval notifications via `convex/notifications.ts`

### Files
- `app/dashboard/approvals/page.tsx` — uncomment Convex, remove mocks
- `components/approvals/approval-dialog.tsx` — wire to mutations
- `components/approvals/approval-timeline.tsx`
- `convex/approvals.ts` (reference — already done)

---

## Task #8: Connect Recurring Posts Page to Convex

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: Task #1
- **Blocks**: Task #16

### Problem

`app/dashboard/posts/recurring/page.tsx` has all Convex imports commented out with `// TODO: Uncomment when Convex is wired up`. Uses `MOCK_RULES` array and `MOCK_TIER = "pro"`. All handlers have TODO comments showing exact Convex calls needed.

### What to Do

1. Uncomment `useQuery(api.recurringPosts.list)` and wire it up
2. Wire create form to `useMutation(api.recurringPosts.create)`
3. Wire edit to `useMutation(api.recurringPosts.update)`
4. Wire delete to `useMutation(api.recurringPosts.remove)` or deactivate
5. Wire toggle active/inactive
6. Replace `MOCK_TIER` with real tier from `api.users.getMe`
7. Gate to Pro/Business tiers using `UpgradeGate`
8. Remove all `MOCK_*` data
9. Verify `processRecurringRules` cron in `convex/crons.ts` creates posts correctly

### Files
- `app/dashboard/posts/recurring/page.tsx` — uncomment Convex, remove mocks
- `components/recurring/recurring-rule-card.tsx`
- `components/recurring/recurring-rule-form.tsx`
- `convex/recurringPosts.ts` (reference — already done)

---

## Completion Checklist

- [x] Task #4: Calendar shows real posts from Convex (useQuery api.posts.listScheduled with date range)
- [x] Task #5: Team page manages real org members (convex/orgMembers.ts created, page rewired)
- [x] Task #6: Analytics displays real metrics from Convex (getEngagementTimeSeries + getPlatformBreakdown added)
- [x] Task #7: Approvals page uses real approval workflow (Convex queries/mutations wired, history sub-component)
- [x] Task #8: Recurring posts page manages real recurring rules (all CRUD via Convex mutations, real tier)
- [x] All pages handle loading/empty/error states
- [ ] All changes pass `npx tsc --noEmit`
