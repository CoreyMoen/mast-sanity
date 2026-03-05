# Phase 5: Polish

**Priority**: MEDIUM — UX quality before launch
**Parallelism**: #17 and #18 can start immediately; #16 blocked on all Phase 2

---

## Task #16: Error Handling, Loading States, and Empty States Audit

- **Status**: `DONE`
- **Assignee**: Claude
- **Blocked by**: Tasks #4, #5, #6, #7, #8 (all Phase 2 — pages must use real data first)
- **Blocks**: Task #20 (production deployment)

### What to Do

1. Audit every dashboard page for:
   - **Loading states**: Use `<PageSkeleton />` from `components/ui/page-skeleton.tsx` while Convex queries load
   - **Empty states**: Use `<EmptyState />` from `components/ui/empty-state.tsx` when no data exists
   - **Error states**: Use `<ErrorBanner />` from `components/ui/error-banner.tsx` for query/mutation failures
2. Verify `useQuery` hooks handle `undefined` (loading) vs `null` (no data) vs data correctly
3. Ensure failed post publishing shows actionable error messages with retry button
4. Add toast notifications (`components/ui/toast.tsx`) for CRUD actions
5. Verify `<UpgradeGate />` renders correctly for tier-limited features
6. Check notification bell (`components/ui/notification-bell.tsx`) works with real notifications

### Pages to Audit
- Dashboard home (`page.tsx`)
- Calendar (`calendar/page.tsx`)
- Posts list (`posts/page.tsx`)
- Post composer (`posts/new/page.tsx`)
- Recurring posts (`posts/recurring/page.tsx`)
- Analytics (`analytics/page.tsx`)
- Media (`media/page.tsx`)
- Accounts (`accounts/page.tsx`)
- Team (`team/page.tsx`)
- Approvals (`approvals/page.tsx`)
- Settings (`settings/page.tsx`)

---

## Task #17: Mobile-Responsive Design Pass

- **Status**: `DONE`
- **Assignee**: Claude
- **Blocked by**: nothing (can start immediately)
- **Blocks**: Task #20 (production deployment)

### What to Do

1. **Sidebar**: Verify `components/ui/mobile-drawer.tsx` opens/closes correctly on mobile
2. **Calendar**: May need a simplified list-view fallback on small screens (monthly grid is hard to use on phone)
3. **Post Composer**: Ensure platform toggles, media picker, and schedule picker work on touch
4. **Analytics Charts**: Verify Recharts components resize with `ResponsiveContainer`
5. **Settings Tabs**: Verify tab navigation works on mobile (may need horizontal scroll)
6. **Team/Approvals**: Tables and member lists need mobile-friendly layouts
7. **General**: Test all pages at 375px, 768px, 1024px breakpoints
8. Fix any overflow, truncation, or touch-target issues

### Files
- `app/dashboard/layout.tsx` — sidebar/drawer toggle
- `components/ui/sidebar.tsx` — desktop sidebar
- `components/ui/mobile-drawer.tsx` — mobile drawer
- `components/calendar/calendar-view.tsx` — calendar responsive
- `components/composer/post-composer.tsx` — composer responsive
- All dashboard page files

---

## Task #18: TypeScript Compilation and Lint Audit

- **Status**: `DONE`
- **Assignee**: Claude
- **Blocked by**: nothing (can start immediately)
- **Blocks**: Task #20 (production deployment)

### What to Do

1. Run `npx tsc --noEmit` — fix ALL TypeScript errors
2. Run `npx next lint` — fix all ESLint errors and warnings
3. Pay special attention to:
   - Type mismatches between Convex function args and frontend calls
   - Missing imports from commented-out Convex integrations (Phase 2 leftovers)
   - `any` types that should be properly typed
   - Unused variables and imports
4. Verify Convex generated types are up to date (`npx convex dev` or `npx convex codegen`)
5. Ensure no `@ts-ignore` or `@ts-expect-error` without justification

### Commands
```bash
npx tsc --noEmit
npx next lint
```

---

## Completion Checklist

- [x] Task #16: All pages have proper loading/empty/error states
- [x] Task #17: All pages work on mobile (375px+)
- [x] Task #18: Zero TypeScript errors, zero lint errors (14 non-critical warnings remain)
- [x] All changes pass `npx tsc --noEmit`
