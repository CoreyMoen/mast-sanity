'use client'

import {SanityDocument} from 'next-sanity'
import {useOptimistic} from 'next-sanity/hooks'
import Link from 'next/link'

import BlockRenderer from '@/app/components/BlockRenderer'
import {GetPageQueryResult} from '@/sanity.types'
import {dataAttr} from '@/sanity/lib/utils'
import {studioUrl} from '@/sanity/lib/api'

type PageBuilderPageProps = {
  page: GetPageQueryResult
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

function renderSections(pageBuilderSections: PageBuilderSection[], page: GetPageQueryResult, isDraftMode?: boolean) {
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
      <p className="mt-2 text-base text-muted-foreground">Open the page in Sanity Studio to add content.</p>
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

export default function PageBuilder({page, isDraftMode}: PageBuilderPageProps) {
  const pageBuilderSections = useOptimistic<
    PageBuilderSection[] | undefined,
    SanityDocument<PageData>
  >(page?.pageBuilder || [], (currentSections, action) => {
    // The action contains updated document data from Sanity
    // when someone makes an edit in the Studio

    // If the edit was to a different document, ignore it
    if (action.id !== page?._id) {
      return currentSections
    }

    // If there are sections in the updated document, use them
    if (action.document.pageBuilder) {
      // Reconcile References for drag-and-drop reordering only.
      // https://www.sanity.io/docs/enabling-drag-and-drop#ffe728eea8c1
      //
      // We need to distinguish between:
      // 1. Reordering (same sections, different order) - preserve expanded GROQ data
      // 2. Field changes - use the new data from the live update
      //
      // Check if this is a reorder by comparing keys
      const currentKeys = currentSections?.map((s) => s._key).sort().join(',') || ''
      const newKeys = action.document.pageBuilder.map((s: PageBuilderSection) => s._key).sort().join(',')
      const isReorder = currentKeys === newKeys && currentKeys.length > 0

      if (isReorder) {
        // This is a reorder - preserve expanded reference data from original query
        return action.document.pageBuilder.map(
          (section: PageBuilderSection) => currentSections?.find((s) => s._key === section?._key) || section,
        )
      }

      // This is a content change - use the new data directly
      // Note: This means live preview won't have GROQ-expanded references until refresh
      // but at least the changes will be visible
      return action.document.pageBuilder
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
