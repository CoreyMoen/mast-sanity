import Link from 'next/link'
import Image from 'next/image'

import {sanityFetch} from '@/sanity/lib/live'
import {morePostsQuery, allPostsQuery} from '@/sanity/lib/queries'
import {AllPostsQueryResult} from '@/sanity.types'
import DateComponent from '@/app/components/Date'
import OnBoarding from '@/app/components/Onboarding'
import {urlForImage} from '@/sanity/lib/utils'

const Post = ({post}: {post: AllPostsQueryResult[number]}) => {
  const {_id, title, slug, summary, coverImage, date, author, categories} = post as any

  const imageUrl = coverImage?.asset?._ref
    ? urlForImage(coverImage)?.width(600).height(400).url()
    : null

  return (
    <article
      key={_id}
      className="group border border-border rounded-lg overflow-hidden bg-muted-background flex flex-col transition-colors hover:bg-background relative"
    >
      <Link href={`/posts/${slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">Read {title}</span>
      </Link>

      {imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={imageUrl}
            alt={coverImage?.alt || title || ''}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="flex flex-col flex-1 p-5">
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((category: any) => (
              <span
                key={category._id}
                className="text-xs font-medium text-brand uppercase tracking-wide"
              >
                {category.title}
              </span>
            ))}
          </div>
        )}

        <h3 className="text-xl font-bold mb-2 leading-tight group-hover:text-brand transition-colors">
          {title}
        </h3>

        {summary && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground flex-1">
            {summary}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          {author && author.firstName && author.lastName && (
            <span className="text-sm font-medium">
              {author.firstName} {author.lastName}
            </span>
          )}
          <time className="text-muted-foreground text-xs font-mono" dateTime={date}>
            <DateComponent dateString={date} />
          </time>
        </div>
      </div>
    </article>
  )
}

const Posts = ({
  children,
  heading,
  subHeading,
}: {
  children: React.ReactNode
  heading?: string
  subHeading?: string
}) => (
  <div>
    {heading && (
      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {heading}
      </h2>
    )}
    {subHeading && <p className="mt-2 text-lg leading-8 text-muted-foreground">{subHeading}</p>}
    <div className="pt-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">{children}</div>
  </div>
)

export const MorePosts = async ({skip, limit}: {skip: string; limit: number}) => {
  const {data} = await sanityFetch({
    query: morePostsQuery,
    params: {skip, limit},
  })

  if (!data || data.length === 0) {
    return null
  }

  return (
    <Posts heading="Other posts">
      {data?.map((post: any) => (
        <Post key={post._id} post={post} />
      ))}
    </Posts>
  )
}

export const AllPosts = async () => {
  const {data} = await sanityFetch({query: allPostsQuery})

  if (!data || data.length === 0) {
    return <OnBoarding />
  }

  return (
    <Posts
      heading="Recent Posts"
      subHeading={`${data.length === 1 ? 'This blog post is' : `These ${data.length} blog posts are`} populated from your Sanity Studio.`}
    >
      {data.map((post: any) => (
        <Post key={post._id} post={post} />
      ))}
    </Posts>
  )
}
