/**
 * Pinboard Plugin Types
 */

/** Supported document types that can be added to a pinboard */
export const PINBOARD_DOC_TYPES = ['page', 'post', 'category', 'person'] as const
export type PinboardDocType = (typeof PINBOARD_DOC_TYPES)[number]

/** A document that has been added to a pinboard (page, post, category, or person) */
export interface PageDocument {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  /** Display name — resolved from type-specific fields (name, title, firstName+lastName) */
  displayName: string
  slug?: {
    current: string
  }
}

export type PageStatus = 'published' | 'draft' | 'modified'

export interface PageWithStatus {
  page: PageDocument
  status: PageStatus
}

export interface PinboardDocument {
  _id: string
  _type: 'pinboard'
  _createdAt: string
  _updatedAt: string
  name: string
  description?: string
  order: number
  pageCount: number
}

export interface PinboardTransform {
  x: number
  y: number
  scale: number
}

export interface PinboardComment {
  _key: string
  pageRef: string
  xPercent: number
  yPercent: number
  authorId: string
  authorName: string
  text: string
  createdAt: string
  resolved: boolean
  replies: PinboardReply[]
}

export interface PinboardReply {
  _key: string
  authorId: string
  authorName: string
  text: string
  createdAt: string
}

export interface PendingComment {
  pageRef: string
  xPercent: number
  yPercent: number
}

export interface PinboardOptions {
  title?: string
  /** Origin URL for the frontend preview (e.g. http://localhost:3001) */
  previewOrigin?: string
}
