'use client'

import {SanityDocument} from 'next-sanity'
import {useOptimistic, usePresentationQuery} from 'next-sanity/hooks'
import Link from 'next/link'
import {useMemo, useState} from 'react'

import BlockRenderer from '@/app/components/BlockRenderer'
import {GetPageQueryResult} from '@/sanity.types'
import {getPageQuery} from '@/sanity/lib/queries'
import {dataAttr} from '@/sanity/lib/utils'
import {studioUrl} from '@/sanity/lib/api'

type PageBuilderPageProps = {
  page: GetPageQueryResult
  /** The page slug — lets the Presentation tool stream live query results per keystroke */
  slug?: string
  isDraftMode?: boolean
}

type PageBuilderSection = {
  _key: string
  _type: string
}

type PageData = {
  _id: string
  _type: string
  pageBuilder?: PageBuilderSection[]
}

/**
 * The PageBuilder component is used to render the blocks from the `pageBuilder` field in the Page type in your Sanity Studio.
 */

function renderSections(
  pageBuilderSections: PageBuilderSection[],
  page: GetPageQueryResult,
  isDraftMode?: boolean,
) {
  if (!page) {
    return null
  }
  // Only add data-sanity attributes when in draft mode (for visual editing)
  const dataSanityAttr = isDraftMode
    ? dataAttr({
        id: page._id,
        type: page._type,
        path: `pageBuilder`,
      }).toString()
    : undefined

  return (
    <div data-sanity={dataSanityAttr}>
      {pageBuilderSections.map((block: any, index: number) => (
        <BlockRenderer
          key={block._key}
          index={index}
          block={block}
          pageId={isDraftMode ? page._id : undefined}
          pageType={isDraftMode ? page._type : undefined}
        />
      ))}
    </div>
  )
}

function renderEmptyState(page: GetPageQueryResult) {
  if (!page) {
    return null
  }
  return (
    <div className="container">
      <h1 className="text-4xl font-extrabold text-foreground tracking-tight sm:text-5xl">
        This page has no content!
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        Open the page in Sanity Studio to add content.
      </p>
      <div className="mt-10 flex">
        <Link
          className="rounded-[0.5rem] flex gap-2 mr-6 items-center bg-brand hover:bg-brand-dark focus:bg-brand-dark py-3 px-6 text-white transition-colors duration-300"
          href={`${studioUrl}/structure/intent/edit/template=page;type=page;path=pageBuilder;id=${page._id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Add content to this page
        </Link>
      </div>
    </div>
  )
}

/** Normalizes a Sanity id: strips `drafts.` and `versions.<release>.` prefixes. */
function baseIdOf(id: string | undefined): string {
  return (id ?? '').replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '')
}

/**
 * Fingerprint of a value's nested array `_key` structure, at every depth.
 * Changes on any reorder/insert/remove anywhere in the tree, but NOT on field
 * edits, and deliberately ignores non-array object shapes — so GROQ-expanded
 * data (dereferenced links, asset URLs) fingerprints the same as its raw
 * draft counterpart.
 */
function keySignature(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value
      .map((item) => {
        const key =
          item && typeof item === 'object' && typeof (item as {_key?: unknown})._key === 'string'
            ? ((item as {_key: string})._key as string)
            : ''
        return key + keySignature(item)
      })
      .join(',')}]`
  }
  if (value && typeof value === 'object') {
    let out = ''
    for (const prop of Object.keys(value).sort()) {
      const sig = keySignature((value as Record<string, unknown>)[prop])
      if (sig) out += prop + sig
    }
    return out
  }
  return ''
}

export default function PageBuilder({page, slug, isDraftMode}: PageBuilderPageProps) {
  // Live query results streamed from the Presentation tool over postMessage.
  // The Studio runs the query against its in-memory draft on every keystroke,
  // so edits appear here immediately — no Content Lake round-trip, no server
  // refetch. Inactive (data: null) outside the Presentation iframe.
  const liveParams = useMemo(() => ({slug: slug ?? ''}), [slug])
  const {data: liveData} = usePresentationQuery({
    query: getPageQuery,
    params: liveParams,
  })

  // Keep the last non-null live result so a transient null doesn't flash the
  // stale server-fetched page mid-edit (render-phase state adjustment, per
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  const [lastLive, setLastLive] = useState<GetPageQueryResult | null>(null)
  const currentLive = slug ? (liveData as GetPageQueryResult | null) : null
  if (currentLive && currentLive !== lastLive) {
    setLastLive(currentLive)
  }
  const basePage = currentLive ?? lastLive ?? page

  const pageBuilderSections = useOptimistic<
    PageBuilderSection[] | undefined,
    SanityDocument<PageData>
  >(basePage?.pageBuilder || [], (currentSections, action) => {
    // The action contains updated document data from Sanity
    // when someone makes an edit in the Studio

    // If the edit was to a different document, ignore it
    if (baseIdOf(action.id) !== baseIdOf(page?._id)) {
      return currentSections
    }

    // If there are sections in the updated document, use them.
    // `action.document` is the RAW draft (no GROQ expansion), so reconcile
    // per section against what's currently displayed:
    // https://www.sanity.io/docs/enabling-drag-and-drop#ffe728eea8c1
    if (action.document.pageBuilder) {
      return action.document.pageBuilder.map((rawSection: PageBuilderSection) => {
        const displayed = currentSections?.find((s) => s._key === rawSection?._key)

        // Newly inserted/duplicated section — render raw until the live query
        // streams the expanded version moments later
        if (!displayed) return rawSection

        // Global sections are bare `reference` items in the raw draft (the
        // query remaps them to section shape) — keep the expanded version
        if (rawSection._type === 'reference') return displayed

        // Same nested _key structure at every depth = a field edit (the live
        // query streams those) — keep the expanded section. Different = a
        // nested reorder/insert/remove — show the raw section instantly and
        // let the live query re-expand it right after.
        return keySignature(rawSection) === keySignature(displayed) ? displayed : rawSection
      })
    }

    // Otherwise keep the current sections
    return currentSections
  })

  if (!page) {
    return renderEmptyState(page)
  }

  if (pageBuilderSections && pageBuilderSections.length > 0) {
    return renderSections(pageBuilderSections, page, isDraftMode)
  }

  return renderEmptyState(page)
}
