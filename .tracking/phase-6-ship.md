# Phase 6: Ship

**Priority**: FINAL — launch preparation
**Parallelism**: #19 first, then #20 (sequential)
**Blocked by**: Phases 4 and 5

---

## Task #19: Security Hardening Pass

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: Tasks #13, #14, #15 (Phase 4 must be complete)
- **Blocks**: Task #20

### What to Do

1. **Auth on every Convex function**: Verify all queries/mutations/actions call `ctx.auth.getUserIdentity()` and reject unauthenticated requests
2. **Encryption audit**: Verify all OAuth tokens and user API keys are encrypted with AES-256-GCM before storage (`lib/utils/encryption.ts`)
3. **Stripe webhook verification**: Verify `convex/http.ts` uses proper signature verification (currently commented out — must be fixed in Task #2)
4. **Clerk webhook verification**: Confirmed working — uses `verifyWebhook` from `@clerk/nextjs/webhooks`
5. **CSRF on OAuth**: Verify `app/api/oauth/[platform]/route.ts` generates and validates CSRF state tokens
6. **CSP headers**: Audit Content-Security-Policy in `middleware.ts` and `next.config.ts` — ensure no unsafe-inline/unsafe-eval without justification
7. **No leaked secrets**: Grep for any `NEXT_PUBLIC_` env vars that contain sensitive data (only publishable keys should be public)
8. **Rate limiting**: Verify AI generation endpoints (`convex/ai.ts`) enforce rate limits via `convex/rateLimits.ts`
9. **XSS prevention**: Check rendering of user-generated content (post captions, comments) — ensure no `dangerouslySetInnerHTML` without sanitization
10. **Input validation**: Verify Convex function args are properly validated with `v.string()`, `v.number()`, etc.

### Files
- `middleware.ts` — CSP, HSTS, security headers
- `next.config.ts` — security headers
- `convex/http.ts` — webhook verification
- `app/api/webhooks/clerk/route.ts` — webhook verification
- `app/api/oauth/*/route.ts` — CSRF state
- `lib/utils/encryption.ts` — encryption implementation
- All `convex/*.ts` files — auth checks

---

## Task #20: Production Deployment Preparation

- **Status**: `TODO`
- **Assignee**: _unassigned_
- **Blocked by**: Tasks #16, #17, #18, #19 (everything else must be done)
- **Blocks**: nothing (this is the final task)

### What to Do

1. **Environment variables**: Verify `.env.example` lists every required variable with descriptions
2. **Next.js config**: Verify `next.config.ts` production settings:
   - `output: "standalone"` for Docker deployment
   - Image remote patterns for all 4 social platforms
   - Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
   - www → non-www redirect
3. **Convex deployment**: Ensure `npx convex deploy` works with production URL
4. **Webhook URLs**: Configure production URLs for:
   - Stripe webhook → `https://yourdomain.com/api/webhooks/stripe`
   - Clerk webhook → `https://yourdomain.com/api/webhooks/clerk`
5. **OAuth redirect URLs**: Update all 4 platform OAuth apps with production callback URLs
6. **Docker**: Verify `Dockerfile` builds and runs correctly
7. **Final type check**: Run `npx tsc --noEmit` — must be zero errors
8. **Onboarding flow**: Test full onboarding path for a new user
9. **Cron job intervals**: Verify production intervals make sense:
   - Publish due posts: every 1 minute
   - Process recurring rules: every 15 minutes
   - Fetch analytics: every 6 hours
   - Enforce data retention: every 24 hours
10. **Smoke test**: Create a post, schedule it, verify it publishes via the pipeline

### Files
- `.env.example`
- `next.config.ts`
- `Dockerfile`
- `.dockerignore`
- `convex/crons.ts`
- `app/dashboard/onboarding/page.tsx`

---

## Completion Checklist

- [ ] Task #19: Security audit passed, all issues fixed
- [ ] Task #20: Production deployment verified
- [ ] All env vars documented
- [ ] Zero TypeScript errors
- [ ] Onboarding flow works end-to-end
- [ ] Publishing pipeline works end-to-end
- [ ] Ready to deploy
