# Setup / Audit Handoff — 2026-07-17

Status notes from the cloud audit session (branch `claude/project-setup-audit-opensource-fn92jx`).
The cloud sandbox turned out to be too slow/restricted for Sanity schema extraction, so this doc
captures everything verified so far plus the exact next steps to continue locally.

## What was checked and found

### 1. Install & baseline build

- `npm install` works cleanly on Node 22 (monorepo workspaces: `frontend`, `studio`).
- **`npm run type-check` FAILS on the current branch/main** — this is a real, reproducible bug:
  - `frontend/app/preview/template/[id]/page.tsx` — 13 errors, all "Property X does not exist on type 'never'".
  - Root cause: the checked-in `frontend/sanity.types.ts` has `SectionTemplateQueryResult = null`
    because the checked-in `studio/schema.json` is **stale** — it has 31 types and is missing
    `sectionTemplate` (and possibly other recent types) entirely.
  - CI (`.github/workflows/ci.yml`) only runs `lint` + `type-check` (never typegen or build), so
    the stale generated files slipped through. CI on main is likely red right now.

### 2. Why typegen couldn't be regenerated (FIXED in this branch)

`npm run typegen` (frontend) → `sanity schema extract` failed with
`Failed to load configuration file "studio/sanity.config.ts"`. The hidden cause:

- `studio/src/schemaTypes/objects/marqueeBlock.ts` imported `TextColumns` from
  `@phosphor-icons/react`. That package (v2.1.10, latest) ships `dist/index.cjs.js` — CommonJS
  code with a `.js` extension inside a `"type": "module"` package. Node's `require()` (used by
  the schema extractor via esbuild-register) refuses to load it:
  `ReferenceError: exports is not defined in ES module scope`.
- **Fix applied:** switched to `DoubleChevronRightIcon` from `@sanity/icons`, matching the icon
  convention used by every other block schema. Every other studio schema already uses
  `@sanity/icons`; marqueeBlock was the lone exception.
- Note: `@phosphor-icons/react` is still fine in **frontend** code (bundlers use the ESM entry);
  it only breaks Node-side `require()` paths like the schema extractor.

After the fix, extraction got much further in the cloud sandbox but hit worker OOM — believed to
be a sandbox limitation (it also blocks `api.sanity.io`, which `sanity schema extract` pings for
auth state). **Run it locally** — it should just work now:

```shell
cd frontend && npm run typegen   # regenerates studio/schema.json + frontend/sanity.types.ts
npm run type-check               # should pass afterwards; commit both regenerated files
```

### 3. Secret scan

- No committed secrets found. All `sk-ant-...` / `sk...` matches are placeholder examples in docs.
- `.gitignore` correctly ignores `.env` / `.env.*` and allows `.env.example`.

### 4. Dependency audit (current → latest, as of 2026-07-17)

| Package | Current | Latest | Notes |
|---|---|---|---|
| next | 16.1.6 | 16.2.10 | minor, low risk |
| react / react-dom | 19.2.3 | 19.2.7 | patch |
| sanity | 5.9.0 (pinned) | **6.5.0** | **major** — check Sanity v6 migration notes; root `overrides.@sanity/types: 5.9.0` must be updated/removed together |
| next-sanity | 12.1.0 | **13.1.3** | **major** — pairs with sanity v6 |
| @sanity/vision | 5.9.0 | 6.5.0 | follows sanity major |
| @sanity/client | 7.14.1 | 7.23.2 | minor |
| @sanity/icons | 3.7.4 | 5.1.0 | major ×2, mostly additive icon set |
| @sanity/assist | 5.0.4 | 6.1.13 | major, pairs with sanity v6 |
| @sanity/code-input | 7.0.8 | 7.2.9 | minor |
| @sanity/orderable-document-list | 1.4.2 | 2.0.13 | major |
| sanity-plugin-asset-source-unsplash | 7.0.3 | 7.0.18 | patch |
| @anthropic-ai/sdk | 0.71.2 | 0.112.1 | big jump — verify streaming API used by the claude-assistant plugin |
| eslint | 9.39.1 | 10.7.0 | major |
| eslint-config-next | 16.1.6 | 16.2.10 | keep in lockstep with next |
| typescript | 5.9.3 | 7.0.2 | **TS 7 = native (Go) compiler rewrite** — high risk with Sanity/Next toolchains; recommend staying on latest 5.x/6.x until ecosystem catches up |
| tailwindcss / @tailwindcss/postcss | 4.1.17 | 4.3.3 | minor |
| swiper | 12.0.3 | 14.0.5 | major ×2 — check Swiper 13/14 changelogs for the slider block |
| lucide-react | 0.562.0 | 1.24.0 | 1.0 release, check renamed icons |
| styled-components | 6.1.19 | 6.4.3 | minor |
| sonner | 2.0.7 | 2.0.7 | current |

Suggested order: (1) regenerate typegen and get type-check green on current versions; (2) safe
minors/patches (next 16.2, react, client, tailwind, code-input, unsplash); (3) the sanity v6 +
next-sanity 13 + assist 6 + vision 6 major set in one commit (update the root
`overrides.@sanity/types` too); (4) remaining majors one at a time (swiper, lucide, eslint 10,
orderable-document-list 2, anthropic sdk), verifying `npm run type-check` + `npm run build` in
both workspaces after each step.

### 5. Open-source readiness findings (not yet fixed)

- ✅ Root `LICENSE` (MIT, 2026 Corey Moen) and root `package.json` `"license": "MIT"` are in place.
- ❌ `studio/package.json` says `"license": "UNLICENSED"` — contradicts the MIT project license.
  Change to `"MIT"` (or add `"private": true` semantics are already there; the field should still
  not say UNLICENSED in an MIT repo).
- ⚠️ **Port inconsistencies** between code and docs:
  - `frontend/package.json` dev script: `next dev -p 3001`, but README/CLAUDE.md say frontend is
    on **4000** (4000 appears to be the Docker mapping; verify `frontend/docker-compose.yml`).
  - `studio/sanity.cli.ts` sets `server.port: 3334`, but README says Studio is on **3333**.
  - Pick one story (probably: document real local ports, mention Docker mapping separately).
- ⚠️ `CLAUDE.md` is significantly outdated: says "Next.js 15" and "Sanity Studio v3" (project is
  Next 16 / Sanity 5), and contains machine-specific constraints (OrbStack-only dev servers,
  "no esbuild/tsx on this machine") that don't belong in an open-source repo — consider moving
  personal-machine notes to `CLAUDE.local.md` (gitignored) and keeping repo CLAUDE.md generic.
- ⚠️ CI gap: no typegen/build step, which is exactly how the stale `sanity.types.ts` landed on
  main. Consider adding `npm run typegen` + `git diff --exit-code` (or at least `next build`) to CI.
- ⚠️ `CANVAS_PLUGIN_PLAN.md` sits at repo root — internal planning doc; consider `docs/` or removal.
- ⚠️ `.github/CODEOWNERS` + `renovate.json` exist (good); no `CONTRIBUTING.md`, `SECURITY.md`, or
  issue/PR templates yet — nice-to-haves for open source.
- ⚠️ `reference/mast-framework.webflow` and `docs/original-specs/` — confirm you have the right to
  redistribute Mast reference material under MIT before open-sourcing.
- README is generally accurate and well-structured; it needs the port cleanup above and a final
  version pass after the dependency upgrades land.

## Cloud-sandbox-only caveats (ignore locally)

- The sandbox blocks `*.api.sanity.io`, so `sanity schema extract` (which resolves the studio
  config, including an auth ping) can't run without a network shim. Locally this is a non-issue.
- The extraction worker also hit OOM in the sandbox even with a large heap; not reproduced
  locally as far as we know.
