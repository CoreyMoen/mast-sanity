'use client'

import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {VisualEditing, type HistoryAdapterNavigate} from '@sanity/visual-editing/react'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {customOverlayComponents} from './CustomOverlay'
import {BlockContextBridge} from './BlockContextBridge'

/**
 * Renders `@sanity/visual-editing/react`'s VisualEditing DIRECTLY instead of
 * next-sanity's `next/dynamic` wrapper.
 *
 * Why: `useOptimistic` and `usePresentationQuery` read module-global state
 * (the optimistic "actor" and comlink stores) that VisualEditing populates.
 * When VisualEditing is code-split into a `next/dynamic` chunk, that global
 * can be duplicated across chunks, so the state VisualEditing sets is
 * invisible to the hooks and per-keystroke live updates silently never
 * arrive. Importing everything from the same entry, statically, keeps them
 * in one chunk → one shared instance.
 *
 * The history adapter below replicates what next-sanity's wrapper does
 * (minus basePath/trailingSlash handling, which this app doesn't use), and
 * we only render after mount to stay SSR-safe — the dynamic wrapper got that
 * via `ssr: false`.
 */
export default function VisualEditingWithPlugins() {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only mount gate, replacing the `ssr: false` behavior of next-sanity's dynamic wrapper
  useEffect(() => setMounted(true), [])

  const router = useRouter()
  const [navigate, setNavigate] = useState<HistoryAdapterNavigate | undefined>()

  const history = useMemo(
    () => ({
      subscribe: (nav: HistoryAdapterNavigate) => {
        setNavigate(() => nav)
        return () => setNavigate(undefined)
      },
      update: (update: {type: 'push' | 'replace' | 'pop'; url: string}) => {
        switch (update.type) {
          case 'push':
            router.push(update.url)
            return
          case 'replace':
            router.replace(update.url)
            return
          case 'pop':
            router.back()
            return
        }
      },
    }),
    [router],
  )

  // Keep the Presentation tool's URL bar in sync with in-app navigation
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (!navigate) return
    const qs = searchParams?.size ? `?${searchParams.toString()}` : ''
    navigate({type: 'push', url: `${pathname}${qs}`})
  }, [navigate, pathname, searchParams])

  const handleRefresh = useCallback(
    (payload: {source: 'manual' | 'mutation'}) => {
      if (payload.source === 'manual') {
        router.refresh()
        return new Promise<void>((resolve) => setTimeout(resolve, 1000))
      }
      // "mutation": the live/optimistic layers already show the change —
      // skip the server refresh so the preview doesn't flash stale content
      // after each save.
      return false as const
    },
    [router],
  )

  if (!mounted) return null

  return (
    <>
      <VisualEditing
        components={customOverlayComponents}
        history={history}
        portal
        refresh={handleRefresh}
      />
      <BlockContextBridge />
    </>
  )
}
