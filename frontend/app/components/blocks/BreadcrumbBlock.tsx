'use client'

import {stegaClean} from 'next-sanity'
import {Breadcrumb} from '../ui/breadcrumb'

interface BreadcrumbItem {
  _key: string
  label: string
  link?: {
    linkType?: string
    href?: string
    page?: string
    post?: string
  }
}

interface BreadcrumbBlockProps {
  items?: BreadcrumbItem[]
  separator?: 'slash' | 'chevron'
  align?: 'left' | 'center' | 'right'
}

// Helper to resolve link URL
function resolveLink(link?: BreadcrumbItem['link']): string | undefined {
  if (!link) return undefined
  if (link.linkType === 'href' && link.href) return link.href
  if (link.linkType === 'page' && link.page) return `/${link.page}`
  if (link.linkType === 'post' && link.post) return `/posts/${link.post}`
  return undefined
}

const alignClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

export default function BreadcrumbBlock({
  items,
  separator = 'chevron',
  align = 'left',
}: BreadcrumbBlockProps) {
  if (!items || items.length === 0) return null

  const cleanSeparator = stegaClean(separator)
  const cleanAlign = stegaClean(align)

  // Transform Sanity items to breadcrumb format
  const breadcrumbItems = items.map((item) => ({
    label: item.label,
    href: resolveLink(item.link),
  }))

  return (
    <div className={`flex ${alignClasses[cleanAlign]}`}>
      <Breadcrumb items={breadcrumbItems} separator={cleanSeparator} />
    </div>
  )
}
