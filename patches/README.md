# Patches

Applied automatically on `npm install` via `patch-package` (see the
`postinstall` script in the root `package.json`).

## `@sanity/visual-editing@5.5.0`

### Instant Presentation preview — perspective race-condition fix

**File:** `dist/react/index.js` (the `usePresentationQuery` hook)

**Symptom:** In the Presentation tool, the live preview did not update
per-keystroke right away — the hook could take up to 20 seconds to start
streaming, so edits only appeared after the slower save round-trip.

**Root cause:** `usePresentationQuery` subscribes to live query results via a
`loader/query-listen` message, but only sends it once `projectId`, `dataset`,
**and `perspective`** are all set. Its subscription effect depends only on
`[comlink2]`, so it fires the instant the loader comlink connects — a beat
_before_ `perspective` arrives. It sees `!perspective`, skips the subscribe,
and only retries on its 20-second heartbeat (`LISTEN_HEARTBEAT_INTERVAL`).

**Fix:** make the effect's dependency array include `perspective` so it
re-subscribes the moment the perspective arrives:

```diff
- useEffect(t5, t6);                      // deps: [comlink2]
+ useEffect(t5, [comlink2, perspective]);
```

**Maintenance:** `patch-package` fails the install loudly if the installed
version no longer matches the patch. When upgrading `@sanity/visual-editing`
(pinned in `frontend/package.json`), check whether upstream has fixed the
subscription effect to react to `perspective`; if so, delete this patch and
unpin. Otherwise re-apply the same one-line change and regenerate with
`npx patch-package @sanity/visual-editing`.

(Credit: race documented by the
[flowtricks/remarkable](https://github.com/flowtricks/remarkable) project.)
