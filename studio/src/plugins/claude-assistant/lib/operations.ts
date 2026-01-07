/**
 * Sanity Content Operations
 *
 * Handles CRUD operations on Sanity documents based on Claude's actions.
 * Includes support for incremental page creation to avoid Sanity's nesting depth limits.
 */

import type {SanityClient, SanityDocument} from 'sanity'
import type {ActionPayload, ActionResult, ParsedAction} from '../types'

/**
 * Interface for page structure used in incremental creation
 */
export interface PageStructure {
  title: string
  slug: string
  sections: SectionStructure[]
}

export interface SectionStructure {
  _key?: string
  _type: 'section'
  label?: string
  backgroundColor?: 'primary' | 'secondary'
  paddingTop?: 'none' | 'compact' | 'default' | 'spacious'
  maxWidth?: 'full' | 'container' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  minHeight?: 'auto' | 'small' | 'medium' | 'large' | 'screen' | 'custom'
  rows?: RowStructure[]
  children?: ComponentStructure[]
}

export interface RowStructure {
  _key?: string
  _type: 'row'
  columns?: ColumnStructure[]
  horizontalAlign?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  verticalAlign?: 'start' | 'center' | 'end' | 'stretch' | 'baseline' | 'between'
  gap?: '0' | '2' | '4' | '6' | '8' | '12'
}

export interface ColumnStructure {
  _key?: string
  _type: 'column'
  content?: ComponentStructure[]
  widthDesktop?: 'auto' | 'fill' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  widthMobile?: 'inherit' | 'auto' | 'fill' | '12'
  verticalAlign?: 'start' | 'center' | 'end' | 'between'
  padding?: '0' | '2' | '4' | '6' | '8'
}

export interface ComponentStructure {
  _key?: string
  _type: string
  [key: string]: unknown
}

/**
 * Generate a unique key for Sanity array items
 */
function generateKey(): string {
  return Math.random().toString(36).substring(2, 12)
}

/**
 * Ensure all array items have _key values
 */
function ensureKeys<T extends {_key?: string}>(items: T[]): T[] {
  return items.map((item) => ({
    ...item,
    _key: item._key || generateKey(),
  }))
}

export class ContentOperations {
  private client: SanityClient

  constructor(client: SanityClient) {
    this.client = client
  }

  /**
   * Execute a parsed action from Claude
   */
  async executeAction(action: ParsedAction): Promise<ActionResult> {
    try {
      switch (action.type) {
        case 'create':
          return await this.createDocument(action.payload)
        case 'update':
          return await this.updateDocument(action.payload)
        case 'delete':
          return await this.deleteDocument(action.payload)
        case 'query':
          return await this.queryDocuments(action.payload)
        case 'navigate':
          return this.navigateToDocument(action.payload)
        case 'explain':
          return {
            success: true,
            message: action.payload.explanation || 'No explanation provided',
          }
        default:
          return {
            success: false,
            message: `Unknown action type: ${action.type}`,
          }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Create a new document
   */
  async createDocument(payload: ActionPayload): Promise<ActionResult> {
    if (!payload.documentType) {
      return {success: false, message: 'Document type is required'}
    }

    const doc = {
      _type: payload.documentType,
      ...payload.fields,
    }

    const result = await this.client.create(doc)

    return {
      success: true,
      documentId: result._id,
      message: `Created ${payload.documentType} document`,
      data: result,
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(payload: ActionPayload): Promise<ActionResult> {
    if (!payload.documentId) {
      return {success: false, message: 'Document ID is required'}
    }

    if (!payload.fields || Object.keys(payload.fields).length === 0) {
      return {success: false, message: 'No fields to update'}
    }

    const result = await this.client
      .patch(payload.documentId)
      .set(payload.fields)
      .commit()

    return {
      success: true,
      documentId: result._id,
      message: `Updated document ${payload.documentId}`,
      data: result,
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(payload: ActionPayload): Promise<ActionResult> {
    if (!payload.documentId) {
      return {success: false, message: 'Document ID is required'}
    }

    await this.client.delete(payload.documentId)

    return {
      success: true,
      documentId: payload.documentId,
      message: `Deleted document ${payload.documentId}`,
    }
  }

  /**
   * Query documents using GROQ
   */
  async queryDocuments(payload: ActionPayload): Promise<ActionResult> {
    if (!payload.query) {
      return {success: false, message: 'Query is required'}
    }

    const results = await this.client.fetch(payload.query)

    return {
      success: true,
      message: `Found ${Array.isArray(results) ? results.length : 1} result(s)`,
      data: results,
    }
  }

  /**
   * Navigate to a document (returns navigation info, actual navigation handled by UI)
   */
  navigateToDocument(payload: ActionPayload): ActionResult {
    if (!payload.documentId && !payload.path) {
      return {success: false, message: 'Document ID or path is required'}
    }

    return {
      success: true,
      documentId: payload.documentId,
      message: `Navigate to ${payload.path || payload.documentId}`,
      data: {path: payload.path, documentId: payload.documentId},
    }
  }

  /**
   * Preview what an action would do without executing it
   */
  async previewAction(action: ParsedAction): Promise<unknown> {
    switch (action.type) {
      case 'create':
        return {
          operation: 'create',
          documentType: action.payload.documentType,
          fields: action.payload.fields,
        }
      case 'update':
        if (action.payload.documentId) {
          const currentDoc = await this.client.getDocument(action.payload.documentId)
          return {
            operation: 'update',
            documentId: action.payload.documentId,
            currentValues: currentDoc,
            newValues: action.payload.fields,
          }
        }
        return {operation: 'update', error: 'No document ID'}
      case 'delete':
        if (action.payload.documentId) {
          const docToDelete = await this.client.getDocument(action.payload.documentId)
          return {
            operation: 'delete',
            document: docToDelete,
          }
        }
        return {operation: 'delete', error: 'No document ID'}
      case 'query':
        return {
          operation: 'query',
          query: action.payload.query,
        }
      default:
        return {operation: action.type}
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(documentId: string): Promise<SanityDocument | null> {
    const doc = await this.client.getDocument(documentId)
    return doc ?? null
  }

  /**
   * Fetch documents by type
   */
  async getDocumentsByType(
    type: string,
    limit: number = 10
  ): Promise<SanityDocument[]> {
    return this.client.fetch(
      `*[_type == $type][0...$limit]`,
      {type, limit}
    )
  }

  /**
   * Create a page incrementally to avoid Sanity's nesting depth limits.
   *
   * This method builds pages step by step:
   * 1. Creates the base page document with empty pageBuilder
   * 2. Adds sections one at a time
   * 3. Adds rows to each section
   * 4. Adds columns to each row
   * 5. Adds content blocks to each column
   *
   * @param pageStructure - The complete page structure to create
   * @returns ActionResult with the created document ID
   */
  async createPageIncrementally(pageStructure: PageStructure): Promise<ActionResult> {
    try {
      // Step 1: Create the base page document
      const page = await this.client.create({
        _type: 'page',
        name: pageStructure.title,
        slug: {_type: 'slug', current: pageStructure.slug},
        pageBuilder: [], // Start empty
      })

      const documentId = page._id

      // Step 2: Add sections one at a time
      for (let sectionIndex = 0; sectionIndex < pageStructure.sections.length; sectionIndex++) {
        const section = pageStructure.sections[sectionIndex]

        // Build the section without nested content first
        const sectionData: SectionStructure = {
          _key: section._key || generateKey(),
          _type: 'section',
          label: section.label,
          backgroundColor: section.backgroundColor,
          paddingTop: section.paddingTop || 'default',
          maxWidth: section.maxWidth || 'container',
          minHeight: section.minHeight || 'auto',
          rows: [], // Start with empty rows
        }

        // Add the section shell to the page
        await this.client
          .patch(documentId)
          .setIfMissing({pageBuilder: []})
          .append('pageBuilder', [sectionData])
          .commit()

        // Step 3: Add rows to this section
        if (section.rows && section.rows.length > 0) {
          await this.addRowsToSection(documentId, sectionIndex, section.rows)
        }
      }

      return {
        success: true,
        documentId,
        message: `Created page "${pageStructure.title}" with ${pageStructure.sections.length} section(s)`,
        data: {_id: documentId, _type: 'page', name: pageStructure.title},
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error
          ? `Failed to create page: ${error.message}`
          : 'Failed to create page: Unknown error',
      }
    }
  }

  /**
   * Add rows to a section incrementally
   */
  private async addRowsToSection(
    documentId: string,
    sectionIndex: number,
    rows: RowStructure[]
  ): Promise<void> {
    const sectionPath = `pageBuilder[${sectionIndex}]`

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]

      // Build the row without column content first
      const rowData: RowStructure = {
        _key: row._key || generateKey(),
        _type: 'row',
        horizontalAlign: row.horizontalAlign,
        verticalAlign: row.verticalAlign,
        gap: row.gap || '4',
        columns: [], // Start with empty columns
      }

      // Add the row shell to the section
      await this.client
        .patch(documentId)
        .setIfMissing({[`${sectionPath}.rows`]: []})
        .append(`${sectionPath}.rows`, [rowData])
        .commit()

      // Add columns to this row
      if (row.columns && row.columns.length > 0) {
        await this.addColumnsToRow(documentId, sectionIndex, rowIndex, row.columns)
      }
    }
  }

  /**
   * Add columns to a row incrementally
   */
  private async addColumnsToRow(
    documentId: string,
    sectionIndex: number,
    rowIndex: number,
    columns: ColumnStructure[]
  ): Promise<void> {
    const rowPath = `pageBuilder[${sectionIndex}].rows[${rowIndex}]`

    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const column = columns[colIndex]

      // Build the column without content first
      const columnData: ColumnStructure = {
        _key: column._key || generateKey(),
        _type: 'column',
        widthDesktop: column.widthDesktop || 'auto',
        widthMobile: column.widthMobile || 'inherit',
        verticalAlign: column.verticalAlign,
        padding: column.padding,
        content: [], // Start with empty content
      }

      // Add the column shell to the row
      await this.client
        .patch(documentId)
        .setIfMissing({[`${rowPath}.columns`]: []})
        .append(`${rowPath}.columns`, [columnData])
        .commit()

      // Add content blocks to this column
      if (column.content && column.content.length > 0) {
        await this.addContentToColumn(documentId, sectionIndex, rowIndex, colIndex, column.content)
      }
    }
  }

  /**
   * Add content blocks to a column incrementally
   */
  private async addContentToColumn(
    documentId: string,
    sectionIndex: number,
    rowIndex: number,
    columnIndex: number,
    content: ComponentStructure[]
  ): Promise<void> {
    const columnPath = `pageBuilder[${sectionIndex}].rows[${rowIndex}].columns[${columnIndex}]`

    // Add content blocks in batches to reduce API calls
    // But keep batches small to avoid depth issues
    const BATCH_SIZE = 5
    const contentWithKeys = ensureKeys(content)

    for (let i = 0; i < contentWithKeys.length; i += BATCH_SIZE) {
      const batch = contentWithKeys.slice(i, i + BATCH_SIZE)

      await this.client
        .patch(documentId)
        .setIfMissing({[`${columnPath}.content`]: []})
        .append(`${columnPath}.content`, batch)
        .commit()
    }
  }

  /**
   * Add a single section to an existing page
   */
  async addSectionToPage(documentId: string, section: SectionStructure): Promise<ActionResult> {
    try {
      // First, get the current page to determine the section index
      const page = await this.client.fetch<{pageBuilder?: unknown[]}>(`*[_id == $id][0]{pageBuilder}`, {
        id: documentId,
      })

      if (!page) {
        return {success: false, message: `Document ${documentId} not found`}
      }

      const sectionIndex = page.pageBuilder?.length || 0

      // Add the section shell
      const sectionData: SectionStructure = {
        _key: section._key || generateKey(),
        _type: 'section',
        label: section.label,
        backgroundColor: section.backgroundColor,
        paddingTop: section.paddingTop || 'default',
        maxWidth: section.maxWidth || 'container',
        minHeight: section.minHeight || 'auto',
        rows: [],
      }

      await this.client
        .patch(documentId)
        .setIfMissing({pageBuilder: []})
        .append('pageBuilder', [sectionData])
        .commit()

      // Add rows if present
      if (section.rows && section.rows.length > 0) {
        await this.addRowsToSection(documentId, sectionIndex, section.rows)
      }

      return {
        success: true,
        documentId,
        message: `Added section "${section.label || 'Untitled'}" to page`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error
          ? `Failed to add section: ${error.message}`
          : 'Failed to add section: Unknown error',
      }
    }
  }

  /**
   * Update a specific section in a page
   */
  async updateSection(
    documentId: string,
    sectionIndex: number,
    updates: Partial<SectionStructure>
  ): Promise<ActionResult> {
    try {
      const sectionPath = `pageBuilder[${sectionIndex}]`

      // Build the set operations for non-undefined fields
      const setOps: Record<string, unknown> = {}

      if (updates.label !== undefined) setOps[`${sectionPath}.label`] = updates.label
      if (updates.backgroundColor !== undefined) setOps[`${sectionPath}.backgroundColor`] = updates.backgroundColor
      if (updates.paddingTop !== undefined) setOps[`${sectionPath}.paddingTop`] = updates.paddingTop
      if (updates.maxWidth !== undefined) setOps[`${sectionPath}.maxWidth`] = updates.maxWidth
      if (updates.minHeight !== undefined) setOps[`${sectionPath}.minHeight`] = updates.minHeight

      if (Object.keys(setOps).length > 0) {
        await this.client.patch(documentId).set(setOps).commit()
      }

      return {
        success: true,
        documentId,
        message: `Updated section ${sectionIndex}`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error
          ? `Failed to update section: ${error.message}`
          : 'Failed to update section: Unknown error',
      }
    }
  }

  /**
   * Append content blocks to an existing column
   */
  async appendContentToColumn(
    documentId: string,
    sectionIndex: number,
    rowIndex: number,
    columnIndex: number,
    content: ComponentStructure[]
  ): Promise<ActionResult> {
    try {
      await this.addContentToColumn(documentId, sectionIndex, rowIndex, columnIndex, content)

      return {
        success: true,
        documentId,
        message: `Added ${content.length} content block(s) to column`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error
          ? `Failed to append content: ${error.message}`
          : 'Failed to append content: Unknown error',
      }
    }
  }

  /**
   * Publish a document (remove 'drafts.' prefix)
   */
  async publishDocument(documentId: string): Promise<ActionResult> {
    try {
      const draftId = documentId.startsWith('drafts.') ? documentId : `drafts.${documentId}`
      const publishedId = documentId.replace(/^drafts\./, '')

      // Get the draft document
      const draft = await this.client.getDocument(draftId)

      if (!draft) {
        return {success: false, message: `Draft document ${draftId} not found`}
      }

      // Create/replace the published version
      const {_id, ...docWithoutId} = draft
      await this.client.createOrReplace({
        ...docWithoutId,
        _id: publishedId,
      })

      // Delete the draft
      await this.client.delete(draftId)

      return {
        success: true,
        documentId: publishedId,
        message: `Published document ${publishedId}`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error
          ? `Failed to publish: ${error.message}`
          : 'Failed to publish: Unknown error',
      }
    }
  }

  /**
   * Unpublish a document (delete published version, keep draft)
   */
  async unpublishDocument(documentId: string): Promise<ActionResult> {
    try {
      const publishedId = documentId.replace(/^drafts\./, '')

      // Check if published version exists
      const published = await this.client.getDocument(publishedId)

      if (!published) {
        return {success: false, message: `Published document ${publishedId} not found`}
      }

      // Ensure draft exists before unpublishing
      const draftId = `drafts.${publishedId}`
      const draft = await this.client.getDocument(draftId)

      if (!draft) {
        // Create draft from published version
        const {_id, ...docWithoutId} = published
        await this.client.create({
          ...docWithoutId,
          _id: draftId,
        })
      }

      // Delete the published version
      await this.client.delete(publishedId)

      return {
        success: true,
        documentId: draftId,
        message: `Unpublished document. Draft preserved at ${draftId}`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error
          ? `Failed to unpublish: ${error.message}`
          : 'Failed to unpublish: Unknown error',
      }
    }
  }
}

/**
 * Create a new ContentOperations instance
 */
export function createContentOperations(client: SanityClient): ContentOperations {
  return new ContentOperations(client)
}

/**
 * Re-export the generateKey utility for use in other modules
 */
export {generateKey}
