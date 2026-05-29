import type {Metadata, ResolvingMetadata} from 'next'
import Image from 'next/image'
import {notFound} from 'next/navigation'
import {type PortableTextBlock} from 'next-sanity'
import {Suspense} from 'react'

import Avatar from '@/app/components/Avatar'
import {MorePosts} from '@/app/components/Posts'
import PortableText from '@/app/components/PortableText'
import {sanityFetch} from '@/sanity/lib/live'
import {postPagesSlugs, postQuery} from '@/sanity/lib/queries'
import {resolveOpenGraphImage, urlForImage} from '@/sanity/lib/utils'

type Props = {
  params: Promise<{slug: string}>
}

/**
 * Generate the static params for the page.
 * Learn more: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
 */
export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: postPagesSlugs,
    // Use the published perspective in generateStaticParams
    perspective: 'published',
    stega: false,
  })
  return data
}

/**
 * Generate metadata for the page.
 * Learn more: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#generatemetadata-function
 */
export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params
  const {data: post} = await sanityFetch({
    query: postQuery,
    params,
    // Metadata should never contain stega
    stega: false,
  })
  const previousImages = (await parent).openGraph?.images || []
  const ogImage = resolveOpenGraphImage(post?.coverImage)

  return {
    authors:
      post?.author?.firstName && post?.author?.lastName
        ? [{name: `${post.author.firstName} ${post.author.lastName}`}]
        : [],
    title: post?.title,
    description: post?.summary,
    openGraph: {
      images: ogImage ? [ogImage, ...previousImages] : previousImages,
    },
  } satisfies Metadata
}

export default async function PostPage(props: Props) {
  const params = await props.params
  const [{data: post}] = await Promise.all([sanityFetch({query: postQuery, params})])

  if (!post?._id) {
    return notFound()
  }

  const categories = (post as any).categories as
    | Array<{_id: string; title: string; slug: string}>
    | undefined
  const coverImageUrl = post?.coverImage?.asset?._ref
    ? urlForImage(post.coverImage)?.width(1600).height(900).url()
    : null

  return (
    <>
      <div className="container my-12 lg:my-24">
        <header className="max-w-3xl mx-auto flex flex-col items-center gap-6 text-center">
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <span
                  key={category._id}
                  className="text-xs font-medium text-brand uppercase tracking-wide"
                >
                  {category.title}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-7xl">
            {post.title}
          </h1>
          {post.author && post.author.firstName && post.author.lastName && (
            <div className="mt-4 text-left">
              <Avatar person={post.author} date={post.date} />
            </div>
          )}
        </header>

        {coverImageUrl && (
          <div className="max-w-4xl mx-auto my-12 lg:my-16">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
              <Image
                src={coverImageUrl}
                alt={post.coverImage?.alt || post.title || ''}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          </div>
        )}

        {post.content?.length && (
          <article className="max-w-2xl mx-auto">
            <PortableText value={post.content as PortableTextBlock[]} />
          </article>
        )}
      </div>
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="container py-12 lg:py-24 grid gap-12">
          <aside>
            <Suspense>{await MorePosts({skip: post._id, limit: 3})}</Suspense>
          </aside>
        </div>
      </div>
    </>
  )
}
