/**
 * Pinboard Plugin Types
 */

export interface PageDocument {
  _id: string
  _type: 'page'
  _createdAt: string
  _updatedAt: string
  name: string
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

export interface PinboardOptions {
  title?: string
}
