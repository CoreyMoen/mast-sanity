'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {stegaClean} from 'next-sanity'
import {createClient} from 'next-sanity'

import {cn} from '@/lib/utils'
import {urlForImage} from '@/sanity/lib/utils'

// Create a client-side Sanity client (no server-only token needed for public reads)
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-09-25',
  useCdn: true,
  perspective: 'published',
})

interface BlogGridBlockProps {
  block: {
    _key: string
    _type: string
    selectionMode?: 'all' | 'specific' | 'category'
    specificPosts?: Array<{_ref: string}>
    category?: {_ref: string}
    limit?: number
    sortBy?: 'date' | 'title'
    sortOrder?: 'asc' | 'desc'
    columnsDesktop?: string
    columnsTablet?: string
    columnsMobile?: string
    gap?: string
    customStyle?: string
  }
  index: number
}

interface PostData {
  _id: string
  title: string
  slug: string
  summary?: string
  coverImage?: {
    asset?: {_ref: string}
    alt?: string
  }
  date: string
  author?: {
    firstName: string | null
    lastName: string | null
    picture?: any
  }
  categories?: Array<{
    _id: string
    title: string
    slug: string
  }>
}

// GROQ query fragments
const postFields = `
  _id,
  "title": coalesce(title, "Untitled"),
  "slug": slug.current,
  summary,
  coverImage,
  "date": coalesce(date, _updatedAt),
  "author": author->{firstName, lastName, picture},
  "categories": categories[]->{ _id, title, "slug": slug.current }
`

// Map gap values to Tailwind classes
const gapClasses: Record<string, string> = {
  '0': 'gap-0',
  '2': 'gap-2',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
  '12': 'gap-12',
}

// Map column values to Tailwind grid classes
const columnClassesDesktop: Record<string, string> = {
  '1': 'lg:grid-cols-1',
  '2': 'lg:grid-cols-2',
  '3': 'lg:grid-cols-3',
  '4': 'lg:grid-cols-4',
}

const columnClassesTablet: Record<string, string> = {
  '1': 'md:grid-cols-1',
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-3',
  '4': 'md:grid-cols-4',
}

const columnClassesMobile: Record<string, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-2',
}

// Helper function to parse custom CSS styles
function parseCustomStyle(customStyle?: string): React.CSSProperties {
  if (!customStyle) return {}
  try {
    const cleanStyle = stegaClean(customStyle)
    const styles: React.CSSProperties = {}
    cleanStyle.split(';').forEach((rule: string) => {
      const [property, value] = rule.split(':').map((s: string) => s.trim())
      if (property && value) {
        const camelProperty = property.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase())
        ;(styles as any)[camelProperty] = value
      }
    })
    return styles
  } catch {
    return {}
  }
}

// Format date for display
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

// Post card component
function PostCard({post}: {post: PostData}) {
  const {_id, title, slug, summary, coverImage, date, author, categories} = post

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

      {/* Cover image */}
      {imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={imageUrl}
            alt={coverImage?.alt || title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
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

        {/* Title */}
        <h3 className="text-xl font-bold mb-2 leading-tight group-hover:text-brand transition-colors">
          {title}
        </h3>

        {/* Summary */}
        {summary && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground flex-1">
            {summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          {author && author.firstName && author.lastName && (
            <span className="text-sm font-medium">
              {author.firstName} {author.lastName}
            </span>
          )}
          <time className="text-muted-foreground text-xs font-mono" dateTime={date}>
            {formatDate(date)}
          </time>
        </div>
      </div>
    </article>
  )
}

export default function BlogGridBlock({block}: BlogGridBlockProps) {
  const [posts, setPosts] = useState<PostData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const {
    selectionMode = 'all',
    specificPosts,
    category,
    limit,
    sortBy = 'date',
    sortOrder = 'desc',
    columnsDesktop = '3',
    columnsTablet = '2',
    columnsMobile = '1',
    gap = '6',
    customStyle,
  } = block

  // Clean stega values
  const cleanSelectionMode = stegaClean(selectionMode)
  const cleanSortBy = stegaClean(sortBy)
  const cleanSortOrder = stegaClean(sortOrder)
  const cleanLimit = limit ? stegaClean(limit) : 100
  const cleanColumnsDesktop = stegaClean(columnsDesktop)
  const cleanColumnsTablet = stegaClean(columnsTablet)
  const cleanColumnsMobile = stegaClean(columnsMobile)
  const cleanGap = stegaClean(gap)

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true)
      try {
        let query: string
        let params: Record<string, any> = {}

        const orderClause = cleanSortBy === 'date'
          ? `order(date ${cleanSortOrder}, _updatedAt ${cleanSortOrder})`
          : `order(title ${cleanSortOrder})`

        if (cleanSelectionMode === 'specific' && specificPosts && specificPosts.length > 0) {
          const ids = specificPosts.map((ref) => stegaClean(ref._ref))
          query = `*[_type == "post" && _id in $ids && defined(slug.current)] { ${postFields} }`
          params = {ids}
        } else if (cleanSelectionMode === 'category' && category?._ref) {
          const categoryId = stegaClean(category._ref)
          query = `*[_type == "post" && defined(slug.current) && $categoryId in categories[]._ref] | ${orderClause} [0...$limit] { ${postFields} }`
          params = {categoryId, limit: cleanLimit}
        } else {
          query = `*[_type == "post" && defined(slug.current)] | ${orderClause} [0...$limit] { ${postFields} }`
          params = {limit: cleanLimit}
        }

        let data = await client.fetch<PostData[]>(query, params)

        // Sort specific posts client-side if needed (since query doesn't sort them)
        if (cleanSelectionMode === 'specific' && data.length > 0) {
          if (cleanSortBy === 'date') {
            data.sort((a, b) => {
              const dateA = new Date(a.date).getTime()
              const dateB = new Date(b.date).getTime()
              return cleanSortOrder === 'desc' ? dateB - dateA : dateA - dateB
            })
          } else {
            data.sort((a, b) => {
              const titleA = a.title.toLowerCase()
              const titleB = b.title.toLowerCase()
              return cleanSortOrder === 'desc'
                ? titleB.localeCompare(titleA)
                : titleA.localeCompare(titleB)
            })
          }
          // Apply limit
          if (cleanLimit && data.length > cleanLimit) {
            data = data.slice(0, cleanLimit)
          }
        }

        setPosts(data || [])
      } catch (error) {
        console.error('Error fetching blog posts:', error)
        setPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [cleanSelectionMode, cleanSortBy, cleanSortOrder, cleanLimit, specificPosts, category])

  // Calculate effective column values (handle 'inherit')
  const effectiveTablet = cleanColumnsTablet === 'inherit' ? cleanColumnsDesktop : cleanColumnsTablet
  const effectiveMobile = cleanColumnsMobile === 'inherit' ? effectiveTablet : cleanColumnsMobile

  // Build grid classes
  const gridClasses = cn(
    'grid',
    gapClasses[cleanGap] || 'gap-6',
    columnClassesMobile[effectiveMobile] || 'grid-cols-1',
    columnClassesTablet[effectiveTablet] || 'md:grid-cols-2',
    columnClassesDesktop[cleanColumnsDesktop] || 'lg:grid-cols-3',
  )

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-border rounded-lg overflow-hidden bg-muted-background animate-pulse">
            <div className="aspect-[16/9] bg-border" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-border rounded w-1/4" />
              <div className="h-6 bg-border rounded w-3/4" />
              <div className="h-4 bg-border rounded w-full" />
              <div className="h-4 bg-border rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No posts found
      </div>
    )
  }

  return (
    <div className={gridClasses} style={parseCustomStyle(customStyle)}>
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  )
}
