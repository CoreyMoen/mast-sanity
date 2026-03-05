# Angela v1 — Phase Tracking

This folder tracks all implementation phases, their tasks, and completion status.
Engineers/agents should update the relevant phase file when starting or completing work.

## How to Use

1. **Before starting work**: Check the phase file for the task you want to pick up. Make sure it's not already `IN PROGRESS` or `DONE`.
2. **When starting work**: Update the task status to `IN PROGRESS` and add your name/agent-id.
3. **When done**: Update the task status to `DONE` and note the commit hash or PR.
4. **If blocked**: Update status to `BLOCKED` and note the reason.

## Phase Overview

| Phase | File | Focus | Status |
|-------|------|-------|--------|
| 1 | [phase-1-critical-fixes.md](./phase-1-critical-fixes.md) | Critical blockers — auth, billing, tier limits | DONE |
| 2 | [phase-2-connect-mock-pages.md](./phase-2-connect-mock-pages.md) | Replace all mock data with real Convex queries | DONE |
| 3 | [phase-3-backend-completeness.md](./phase-3-backend-completeness.md) | Platform APIs, LLM providers, media, token refresh | DONE |
| 4 | [phase-4-integration-verification.md](./phase-4-integration-verification.md) | End-to-end pipeline, utilities, payment abstraction | DONE |
| 5 | [phase-5-polish.md](./phase-5-polish.md) | UX polish, mobile, TypeScript audit | DONE |
| 6 | [phase-6-ship.md](./phase-6-ship.md) | Security hardening, production deployment | NOT STARTED |

## Dependency Graph

```
Phase 1: [#1] [#2] [#3]              <- all parallel, start immediately
              |
Phase 2: [#4][#5][#6][#7][#8]        <- all parallel, blocked on #1

Phase 3: [#9][#10][#11][#12]         <- all parallel, start immediately
                |
Phase 4: [#14][#15]  [#13]           <- #13 blocked on #10; #14,#15 start anytime

Phase 5: [#17][#18]  [#16]           <- #16 blocked on all Phase 2; #17,#18 start anytime

Phase 6: [#19] -> [#20]              <- #19 blocked on Phase 4; #20 blocked on everything
```

## Codebase Inventory Snapshot

See [inventory.md](./inventory.md) for a full file-by-file status audit.
