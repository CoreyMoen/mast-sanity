# Phase 3: Backend Completeness

**Priority**: HIGH — these are gaps in backend functionality
**Parallelism**: All 4 tasks can run simultaneously; no Phase 1/2 blockers
**Can start**: Immediately (no dependencies)

---

## Task #9: Implement Social Account Token Refresh

- **Status**: `IN PROGRESS`
- **Assignee**: _agent_
- **Blocked by**: nothing
- **Blocks**: nothing (but publishing will break when tokens expire)

### Problem

`convex/socialAccounts.ts` `refreshToken` action has an empty body — it does nothing. OAuth tokens will expire and publishing will silently fail.

### What to Do

1. Implement `refreshToken` in `convex/socialAccounts.ts` to call platform-specific refresh logic
2. Platform refresh implementations already exist in `lib/platforms/`:
   - `instagram.ts` — `refreshToken()` done (long-lived token exchange)
   - `facebook.ts` — `refreshToken()` done (long-lived token exchange)
   - `twitter.ts` — `refreshToken()` done (OAuth 2.0 PKCE refresh)
   - `linkedin.ts` — `refreshToken()` done (OAuth 2.0 refresh)
3. Wire the Convex action to decrypt stored token → call platform refresh → encrypt new token → store
4. Add a pre-publish check: before publishing, check if token expires within 1 hour and refresh if needed
5. Optionally add a cron job to proactively refresh tokens nearing expiration

### Files
- `convex/socialAccounts.ts` — implement `refreshToken` action
- `lib/platforms/*.ts` (reference — all have refresh implementations)
- `lib/utils/encryption.ts` (reference — for decrypt/encrypt)
- `convex/crons.ts` — optional: add token refresh cron

---

## Task #10: Complete Platform API Clients (Twitter Media Upload)

- **Status**: `IN PROGRESS`
- **Assignee**: _agent_
- **Blocked by**: nothing
- **Blocks**: Task #13 (publishing pipeline verification)

### Current Status (Verified)

| Platform | publish | analytics | refresh | Notes |
|----------|---------|-----------|---------|-------|
| Instagram | DONE | DONE | DONE | Full implementation |
| Facebook | DONE | DONE | DONE | Full implementation |
| Twitter | PARTIAL | DONE | DONE | **Media upload is empty placeholder** — text-only tweets work |
| LinkedIn | DONE | DONE | DONE | Personal profile metrics sparse but functional |

### What to Do

1. **Twitter media upload**: Implement the media upload flow in `lib/platforms/twitter.ts`
   - Twitter API v2 media upload uses chunked upload endpoint
   - Upload media first → get `media_id` → attach to tweet
2. Fix `convex/publishing.ts` TODO: resolve `mediaIds` to actual Convex storage URLs before passing to platform clients
   - Use `ctx.storage.getUrl(storageId)` to get public URL
   - Download and pass to platform APIs

### Files
- `lib/platforms/twitter.ts` — implement media upload
- `convex/publishing.ts` — resolve mediaIds to storage URLs

---

## Task #11: Verify LLM Provider Implementations

- **Status**: `DONE` (verified during audit)
- **Assignee**: _N/A_
- **Result**: All 3 providers are fully implemented

### Verification Results

| Provider | File | Status | Model |
|----------|------|--------|-------|
| Gemini | `lib/llm/gemini.ts` | DONE | Gemini 2.0 Flash via raw fetch |
| OpenAI | `lib/llm/openai.ts` | DONE | GPT via REST API (no SDK) |
| Anthropic | `lib/llm/anthropic.ts` | DONE | claude-haiku-4-5-20251001 via REST API |

Factory in `lib/llm/index.ts` works correctly. No SDK packages needed — all use raw `fetch`.

**No action required.**

---

## Task #12: Wire Post Composer Media Attachment

- **Status**: `IN PROGRESS`
- **Assignee**: _agent_
- **Blocked by**: nothing
- **Blocks**: nothing

### Problem

`components/composer/post-composer.tsx` has a media attachment button that is a placeholder — clicking it does nothing. Users can only manage media separately via the Media Library page.

### What to Do

1. Add a media picker modal that shows existing media from the library (reuse `components/media/media-grid.tsx`)
2. Add inline upload support (reuse `components/media/media-upload.tsx`)
3. Store selected `mediaIds` on the post record when saving/scheduling
4. Show thumbnails of attached media in the composer with remove buttons
5. Enforce platform-specific media limits:
   - Instagram: up to 10 images (carousel), 1 video
   - Facebook: up to 10 images, 1 video
   - Twitter: up to 4 images, 1 video
   - LinkedIn: up to 9 images, 1 video
6. Wire to `convex/media.ts` for fetching and `convex/posts.ts` for saving

### Files
- `components/composer/post-composer.tsx` — add media picker/upload UI
- `components/media/media-grid.tsx` (reuse)
- `components/media/media-upload.tsx` (reuse)
- `convex/posts.ts` — ensure `mediaIds` is properly saved
- `lib/utils/validation.ts` — reference for platform limits

---

## Completion Checklist

- [x] Task #9: Token refresh implemented (cron job + ensureValidToken for just-in-time refresh)
- [x] Task #10: Twitter media upload implemented (simple + chunked); publishing resolves mediaIds
- [x] Task #11: LLM providers verified — all complete (no action needed)
- [x] Task #12: Post composer has working media attachment (MediaAttachments + MediaLibraryPicker)
- [ ] All changes pass `npx tsc --noEmit`
