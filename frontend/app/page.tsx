import type {Metadata} from 'next'
import {draftMode} from 'next/headers'

import PageBuilderPage from '@/app/components/PageBuilder'
import {sanityFetch} from '@/sanity/lib/live'
import {getPageQuery} from '@/sanity/lib/queries'
import {GetPageQueryResult} from '@/sanity.types'
import {PageOnboarding} from '@/app/components/Onboarding'

/**
 * Generate metadata for the home page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const {data: page} = await sanityFetch({
    query: getPageQuery,
    params: {slug: 'home'},
    stega: false,
  })

  return {
    title: page?.name || 'Home',
  } satisfies Metadata
}

export default async function Page() {
  const {isEnabled: isDraftMode} = await draftMode()
  const {data: page} = await sanityFetch({
    query: getPageQuery,
    params: {slug: 'home'},
  })

  if (!page?._id) {
    return (
      <div className="py-40">
        <PageOnboarding />
      </div>
    )
  }

  return (
    <div>
      <PageBuilderPage page={page as GetPageQueryResult} isDraftMode={isDraftMode} />
    </div>
  )
}
