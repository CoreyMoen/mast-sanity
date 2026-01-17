/**
 * DocumentPicker Component
 *
 * A dropdown component for selecting documents (pages and posts) as context
 * for the Claude conversation.
 *
 * Features:
 * - Search/filter documents
 * - Multi-select support
 * - Shows document type icons
 * - Virtualized list for performance
 */

import {useState, useCallback, useEffect, useRef, useMemo} from 'react'
import {
  Box,
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
  Button,
  Spinner,
  Popover,
  Tooltip,
  useClickOutside,
  Layer,
} from '@sanity/ui'
import {DocumentIcon, SearchIcon, CloseIcon, DocumentsIcon} from '@sanity/icons'
import type {SanityClient} from 'sanity'
import type {DocumentContext} from '../types'

export interface DocumentPickerProps {
  /** Sanity client for querying documents */
  client: SanityClient
  /** Currently selected documents */
  selectedDocuments: DocumentContext[]
  /** Callback when documents are selected/deselected */
  onDocumentsChange: (documents: DocumentContext[]) => void
  /** Optional: limit to specific document types */
  documentTypes?: string[]
  /** Compact mode for floating chat */
  compact?: boolean
  /** Controlled open state (optional - if not provided, manages own state) */
  open?: boolean
  /** Callback when open state changes (required if `open` is provided) */
  onOpenChange?: (open: boolean) => void
  /** Reference element for positioning the popover (optional) */
  referenceElement?: HTMLElement | null
}

interface DocumentResult {
  _id: string
  _type: string
  name?: string
  title?: string
  slug?: {current: string}
}

// Default document types for DocumentPicker - defined outside component for stable reference
const PICKER_DEFAULT_DOCUMENT_TYPES = ['page', 'post']

export function DocumentPicker({
  client,
  selectedDocuments,
  onDocumentsChange,
  documentTypes: documentTypesProp,
  compact = false,
  open: controlledOpen,
  onOpenChange,
}: DocumentPickerProps) {
  // Memoize document types to prevent infinite re-renders
  const documentTypes = useMemo(
    () => documentTypesProp ?? PICKER_DEFAULT_DOCUMENT_TYPES,
    [documentTypesProp]
  )

  // Use controlled or uncontrolled state
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value)
    } else {
      setUncontrolledOpen(value)
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [documents, setDocuments] = useState<DocumentResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close popover (only for uncontrolled mode)
  useClickOutside(() => {
    if (isOpen && controlledOpen === undefined) setIsOpen(false)
  }, [popoverRef.current, buttonRef.current])

  // Deduplicate documents - prefer draft over published when both exist
  const deduplicateDocuments = useCallback((docs: DocumentResult[]): DocumentResult[] => {
    const byBaseId = new Map<string, DocumentResult>()

    for (const doc of docs) {
      const baseId = doc._id.replace(/^drafts\./, '')
      const existing = byBaseId.get(baseId)

      // Keep draft version if it exists, otherwise keep published
      if (!existing || doc._id.startsWith('drafts.')) {
        byBaseId.set(baseId, doc)
      }
    }

    return Array.from(byBaseId.values())
  }, [])

  // Fetch documents based on search query
  const fetchDocuments = useCallback(async (query: string) => {
    setIsLoading(true)
    try {
      // Wrap type filter in parentheses to ensure correct operator precedence with search filter
      const typeFilter = `(${documentTypes.map(t => `_type == "${t}"`).join(' || ')})`
      const searchFilter = query
        ? `&& (name match "*${query}*" || title match "*${query}*" || slug.current match "*${query}*")`
        : ''

      const groqQuery = `*[${typeFilter} ${searchFilter}] | order(_updatedAt desc) [0...50] {
        _id,
        _type,
        name,
        title,
        slug
      }`

      const results = await client.fetch<DocumentResult[]>(groqQuery)
      // Deduplicate to show only one entry per document (prefer draft over published)
      setDocuments(deduplicateDocuments(results))
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }, [client, documentTypes, deduplicateDocuments])

  // Track if we just opened the popover (for immediate vs debounced fetch)
  const justOpenedRef = useRef(false)

  // Handle popover open - reset search and mark as just opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      justOpenedRef.current = true
    }
  }, [isOpen])

  // Unified fetch effect - handles both initial load and search
  useEffect(() => {
    if (!isOpen) return

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Fetch immediately on open, debounce for search
    if (justOpenedRef.current) {
      justOpenedRef.current = false
      fetchDocuments(searchQuery)
    } else {
      // Debounce search queries
      searchTimeoutRef.current = setTimeout(() => {
        fetchDocuments(searchQuery)
      }, 300)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [isOpen, searchQuery, fetchDocuments])

  const handleToggleDocument = useCallback((doc: DocumentResult) => {
    const displayName = doc.name || doc.title || 'Untitled'
    const docContext: DocumentContext = {
      _id: doc._id,
      _type: doc._type,
      name: displayName,
      slug: doc.slug?.current,
    }

    const isSelected = selectedDocuments.some(d => d._id === doc._id)

    if (isSelected) {
      onDocumentsChange(selectedDocuments.filter(d => d._id !== doc._id))
    } else {
      onDocumentsChange([...selectedDocuments, docContext])
    }
  }, [selectedDocuments, onDocumentsChange])

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return <DocumentIcon />
      case 'post':
        return <DocumentsIcon />
      default:
        return <DocumentIcon />
    }
  }

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'page':
        return 'Page'
      case 'post':
        return 'Post'
      default:
        return type
    }
  }

  const content = (
    <Card
      ref={popoverRef}
      radius={2}
      shadow={3}
      style={{
        width: compact ? 280 : 320,
        maxHeight: 400,
        overflow: 'hidden',
      }}
    >
      <Stack>
        {/* Search input */}
        <Box padding={2} style={{borderBottom: '1px solid var(--card-border-color)'}}>
          <TextInput
            icon={SearchIcon}
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            autoFocus
            fontSize={1}
          />
        </Box>

        {/* Document list */}
        <Box
          style={{
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {isLoading ? (
            <Flex align="center" justify="center" padding={4}>
              <Spinner muted />
            </Flex>
          ) : documents.length === 0 ? (
            <Box padding={4}>
              <Text size={1} muted align="center">
                {searchQuery ? 'No documents found' : 'No documents available'}
              </Text>
            </Box>
          ) : (
            <Stack padding={1} space={1}>
              {documents.map((doc) => {
                const isSelected = selectedDocuments.some(d => d._id === doc._id)
                const displayName = doc.name || doc.title || 'Untitled'

                return (
                  <Card
                    key={doc._id}
                    as="button"
                    padding={2}
                    radius={2}
                    tone={isSelected ? 'primary' : 'default'}
                    style={{
                      cursor: 'pointer',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                    }}
                    onClick={() => handleToggleDocument(doc)}
                  >
                    <Flex align="center" gap={2}>
                      <Box style={{color: isSelected ? 'inherit' : 'var(--card-muted-fg-color)'}}>
                        {getDocTypeIcon(doc._type)}
                      </Box>
                      <Stack space={1} style={{flex: 1, minWidth: 0}}>
                        <Text
                          size={1}
                          weight={isSelected ? 'semibold' : 'regular'}
                          textOverflow="ellipsis"
                        >
                          {displayName}
                        </Text>
                        <Text size={0} muted>
                          {getDocTypeLabel(doc._type)}
                          {doc.slug?.current && ` · /${doc.slug.current}`}
                        </Text>
                      </Stack>
                      {isSelected && (
                        <Text size={0} weight="semibold" style={{color: 'var(--card-focus-ring-color)'}}>
                          ✓
                        </Text>
                      )}
                    </Flex>
                  </Card>
                )
              })}
            </Stack>
          )}
        </Box>

        {/* Selected count footer */}
        {selectedDocuments.length > 0 && (
          <Box
            padding={2}
            style={{
              borderTop: '1px solid var(--card-border-color)',
              backgroundColor: 'var(--card-bg2-color)',
            }}
          >
            <Flex align="center" justify="space-between">
              <Text size={0} muted>
                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
              </Text>
              <Button
                text="Clear all"
                mode="ghost"
                tone="critical"
                fontSize={0}
                padding={2}
                onClick={() => onDocumentsChange([])}
              />
            </Flex>
          </Box>
        )}
      </Stack>
    </Card>
  )

  return (
    <Popover
      content={content}
      open={isOpen}
      placement="top-start"
      portal
    >
      <Tooltip
        content={
          <Box padding={2}>
            <Text size={1}>Add document context</Text>
          </Box>
        }
        placement="top"
        portal
      >
        <Button
          ref={buttonRef}
          icon={DocumentIcon}
          mode="bleed"
          style={{
            opacity: selectedDocuments.length > 0 ? 1 : 0.7,
            borderRadius: 8,
          }}
          aria-label="Add document context"
          onClick={() => setIsOpen(!isOpen)}
        />
      </Tooltip>
    </Popover>
  )
}

/**
 * DocumentPills Component
 *
 * Displays selected documents as small pill tags with remove buttons
 */
export interface DocumentPillsProps {
  documents: DocumentContext[]
  onRemove: (documentId: string) => void
  compact?: boolean
}

export function DocumentPills({documents, onRemove, compact = false}: DocumentPillsProps) {
  if (documents.length === 0) return null

  return (
    <Flex gap={2} wrap="wrap">
      {documents.map((doc) => (
        <Card
          key={doc._id}
          padding={2}
          radius={2}
          tone="primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            maxWidth: compact ? 160 : 200,
          }}
        >
          <DocumentIcon style={{fontSize: 14, flexShrink: 0, opacity: 0.8}} />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
            title={doc.name}
          >
            {doc.name}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(doc._id)
            }}
            aria-label={`Remove ${doc.name}`}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              opacity: 0.7,
              transition: 'opacity 150ms ease',
              flexShrink: 0,
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            <CloseIcon style={{fontSize: 14}} />
          </button>
        </Card>
      ))}
    </Flex>
  )
}

/**
 * DocumentPickerDialog Component
 *
 * Modal dialog version of the document picker for controlled use cases
 */
export interface DocumentPickerDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Callback when dialog should close */
  onClose: () => void
  /** Sanity client for querying documents */
  client?: SanityClient
  /** Currently selected documents */
  selectedDocuments: DocumentContext[]
  /** Callback when documents are selected/deselected */
  onDocumentsChange: (documents: DocumentContext[]) => void
  /** Optional: limit to specific document types */
  documentTypes?: string[]
}

// Default document types - defined outside component to maintain stable reference
const DEFAULT_DOCUMENT_TYPES = ['page', 'post']

export function DocumentPickerDialog({
  isOpen,
  onClose,
  client,
  selectedDocuments,
  onDocumentsChange,
  documentTypes: documentTypesProp,
}: DocumentPickerDialogProps) {
  // Memoize document types to prevent infinite re-renders
  const documentTypes = useMemo(
    () => documentTypesProp ?? DEFAULT_DOCUMENT_TYPES,
    [documentTypesProp]
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [documents, setDocuments] = useState<DocumentResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useClickOutside(() => {
    if (isOpen) onClose()
  }, [dialogRef.current])

  // Deduplicate documents - prefer draft over published when both exist
  const deduplicateDocuments = useCallback((docs: DocumentResult[]): DocumentResult[] => {
    const byBaseId = new Map<string, DocumentResult>()

    for (const doc of docs) {
      const baseId = doc._id.replace(/^drafts\./, '')
      const existing = byBaseId.get(baseId)

      // Keep draft version if it exists, otherwise keep published
      if (!existing || doc._id.startsWith('drafts.')) {
        byBaseId.set(baseId, doc)
      }
    }

    return Array.from(byBaseId.values())
  }, [])

  // Fetch documents based on search query
  const fetchDocuments = useCallback(async (query: string) => {
    if (!client) return
    setIsLoading(true)
    try {
      // Wrap type filter in parentheses to ensure correct operator precedence with search filter
      const typeFilter = `(${documentTypes.map(t => `_type == "${t}"`).join(' || ')})`
      const searchFilter = query
        ? `&& (name match "*${query}*" || title match "*${query}*" || slug.current match "*${query}*")`
        : ''

      const groqQuery = `*[${typeFilter} ${searchFilter}] | order(_updatedAt desc) [0...50] {
        _id,
        _type,
        name,
        title,
        slug
      }`

      const results = await client.fetch<DocumentResult[]>(groqQuery)
      // Deduplicate to show only one entry per document (prefer draft over published)
      setDocuments(deduplicateDocuments(results))
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }, [client, documentTypes, deduplicateDocuments])

  // Track if we just opened the dialog (for immediate vs debounced fetch)
  const justOpenedRef = useRef(false)

  // Handle dialog open - reset search and mark as just opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      justOpenedRef.current = true
    }
  }, [isOpen])

  // Unified fetch effect - handles both initial load and search
  useEffect(() => {
    if (!isOpen) return

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Fetch immediately on open, debounce for search
    if (justOpenedRef.current) {
      justOpenedRef.current = false
      fetchDocuments(searchQuery)
    } else {
      // Debounce search queries
      searchTimeoutRef.current = setTimeout(() => {
        fetchDocuments(searchQuery)
      }, 300)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [isOpen, searchQuery, fetchDocuments])

  const handleToggleDocument = useCallback((doc: DocumentResult) => {
    const displayName = doc.name || doc.title || 'Untitled'
    const docContext: DocumentContext = {
      _id: doc._id,
      _type: doc._type,
      name: displayName,
      slug: doc.slug?.current,
    }

    const isSelected = selectedDocuments.some(d => d._id === doc._id)

    if (isSelected) {
      onDocumentsChange(selectedDocuments.filter(d => d._id !== doc._id))
    } else {
      onDocumentsChange([...selectedDocuments, docContext])
    }
  }, [selectedDocuments, onDocumentsChange])

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'page':
        return 'Page'
      case 'post':
        return 'Post'
      default:
        return type
    }
  }

  if (!isOpen) return null

  return (
    <Layer zOffset={1000}>
      <Card
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e: React.MouseEvent) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <Card
          ref={dialogRef}
          radius={3}
          shadow={4}
          style={{
            width: 400,
            maxWidth: '90vw',
            maxHeight: '70vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Flex
            align="center"
            justify="space-between"
            padding={3}
            style={{borderBottom: '1px solid var(--card-border-color)'}}
          >
            <Text weight="semibold">Select Documents</Text>
            <Button
              icon={CloseIcon}
              mode="bleed"
              onClick={onClose}
              aria-label="Close"
            />
          </Flex>

          {/* Search input */}
          <Box padding={3} style={{borderBottom: '1px solid var(--card-border-color)'}}>
            <TextInput
              icon={SearchIcon}
              placeholder="Search pages and posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              autoFocus
            />
          </Box>

          {/* Document list */}
          <Box
            style={{
              flex: 1,
              overflow: 'auto',
              minHeight: 200,
            }}
          >
            {isLoading ? (
              <Flex align="center" justify="center" padding={4}>
                <Spinner muted />
              </Flex>
            ) : documents.length === 0 ? (
              <Box padding={4}>
                <Text size={1} muted align="center">
                  {searchQuery ? 'No documents found' : 'No documents available'}
                </Text>
              </Box>
            ) : (
              <Stack padding={2} space={1}>
                {documents.map((doc) => {
                  const isSelected = selectedDocuments.some(d => d._id === doc._id)
                  const displayName = doc.name || doc.title || 'Untitled'

                  return (
                    <Card
                      key={doc._id}
                      as="button"
                      padding={3}
                      radius={2}
                      tone={isSelected ? 'primary' : 'default'}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                      }}
                      onClick={() => handleToggleDocument(doc)}
                    >
                      <Flex align="center" gap={3}>
                        <Box style={{color: isSelected ? 'inherit' : 'var(--card-muted-fg-color)'}}>
                          <DocumentIcon />
                        </Box>
                        <Stack space={1} style={{flex: 1, minWidth: 0}}>
                          <Text
                            size={1}
                            weight={isSelected ? 'semibold' : 'regular'}
                            textOverflow="ellipsis"
                          >
                            {displayName}
                          </Text>
                          <Text size={0} muted>
                            {getDocTypeLabel(doc._type)}
                            {doc.slug?.current && ` · /${doc.slug.current}`}
                          </Text>
                        </Stack>
                        {isSelected && (
                          <Text size={1} weight="semibold" style={{color: 'var(--card-focus-ring-color)'}}>
                            ✓
                          </Text>
                        )}
                      </Flex>
                    </Card>
                  )
                })}
              </Stack>
            )}
          </Box>

          {/* Footer */}
          <Flex
            align="center"
            justify="space-between"
            padding={3}
            style={{
              borderTop: '1px solid var(--card-border-color)',
              backgroundColor: 'var(--card-bg2-color)',
            }}
          >
            <Text size={1} muted>
              {selectedDocuments.length} selected
            </Text>
            <Flex gap={2}>
              {selectedDocuments.length > 0 && (
                <Button
                  text="Clear"
                  mode="ghost"
                  tone="critical"
                  onClick={() => onDocumentsChange([])}
                />
              )}
              <Button
                text="Done"
                tone="primary"
                onClick={onClose}
              />
            </Flex>
          </Flex>
        </Card>
      </Card>
    </Layer>
  )
}
