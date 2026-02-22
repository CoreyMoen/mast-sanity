import {useState, useEffect, useCallback, useRef, useMemo} from 'react'
import {useClient} from 'sanity'
import {Layer, Card, Flex, Stack, Text, TextInput, Button, Checkbox, Spinner, Box} from '@sanity/ui'
import {SearchIcon, CloseIcon, DocumentIcon} from '@sanity/icons'

interface PageResult {
  _id: string
  _type: string
  name: string
  slug?: {current: string}
}

interface PagePickerDialogProps {
  isOpen: boolean
  onClose: () => void
  existingPageIds: string[]
  onAddPages: (pageIds: string[]) => void
}

const DEBOUNCE_MS = 300

export function PagePickerDialog({
  isOpen,
  onClose,
  existingPageIds,
  onAddPages,
}: PagePickerDialogProps) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<PageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Normalize existing page IDs (strip drafts. prefix)
  const existingBaseIds = useMemo(
    () => new Set(existingPageIds.map((id) => id.replace('drafts.', ''))),
    [existingPageIds],
  )

  const fetchPages = useCallback(
    async (query: string) => {
      setLoading(true)
      try {
        const hasQuery = query.length > 0
        const groqQuery = hasQuery
          ? `*[_type == "page" && (name match $searchPattern || slug.current match $searchPattern)] | order(_updatedAt desc) [0...50] {
              _id, _type, name, slug
            }`
          : `*[_type == "page"] | order(_updatedAt desc) [0...50] {
              _id, _type, name, slug
            }`

        const params = hasQuery ? {searchPattern: `*${query}*`} : {}
        const data = await client.fetch<PageResult[]>(groqQuery, params)

        // Deduplicate drafts and published — prefer draft versions
        const byId = new Map<string, PageResult>()
        for (const doc of data) {
          const isDraft = doc._id.startsWith('drafts.')
          const baseId = isDraft ? doc._id.replace('drafts.', '') : doc._id
          if (!byId.has(baseId) || isDraft) {
            byId.set(baseId, {...doc, _id: baseId})
          }
        }

        setResults(Array.from(byId.values()))
      } catch (err) {
        console.error('PagePickerDialog: fetch error', err)
      } finally {
        setLoading(false)
      }
    },
    [client],
  )

  // Fetch on open, debounced search on query change
  useEffect(() => {
    if (!isOpen) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!searchQuery) {
      fetchPages('')
    } else {
      debounceRef.current = setTimeout(() => fetchPages(searchQuery), DEBOUNCE_MS)
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [isOpen, searchQuery, fetchPages])

  // Reset state when dialog opens
  useEffect(() => {
    if (!isOpen) return

    setSelectedIds(new Set())
    setSearchQuery('')
    // Focus search input after a brief delay for render
    const timer = setTimeout(() => searchInputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [isOpen])

  const handleToggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    },
    [],
  )

  const handleAdd = useCallback(() => {
    onAddPages(Array.from(selectedIds))
    onClose()
  }, [selectedIds, onAddPages, onClose])

  if (!isOpen) return null

  return (
    <Layer zOffset={1000}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        {/* Dialog */}
        <Card
          radius={3}
          shadow={4}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          style={{
            width: '90vw',
            maxWidth: 440,
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Card padding={3} borderBottom style={{flexShrink: 0}}>
            <Flex align="center" justify="space-between">
              <Text size={1} weight="semibold">
                Add Pages to Pinboard
              </Text>
              <Button icon={CloseIcon} mode="bleed" onClick={onClose} />
            </Flex>
          </Card>

          {/* Search */}
          <Box padding={3} style={{flexShrink: 0}}>
            <TextInput
              ref={searchInputRef}
              icon={SearchIcon}
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.currentTarget.value)
              }
              fontSize={1}
            />
          </Box>

          {/* Results list */}
          <Box style={{flex: 1, overflowY: 'auto'}} padding={2}>
            {loading ? (
              <Flex align="center" justify="center" padding={4}>
                <Spinner muted />
              </Flex>
            ) : results.length === 0 ? (
              <Box padding={3}>
                <Text size={1} muted align="center">
                  {searchQuery ? 'No pages found' : 'No pages in this project'}
                </Text>
              </Box>
            ) : (
              <Stack space={1}>
                {results.map((page) => {
                  const isExisting = existingBaseIds.has(page._id)
                  const isSelected = selectedIds.has(page._id)

                  return (
                    <Card
                      key={page._id}
                      padding={2}
                      radius={2}
                      tone={isSelected ? 'positive' : isExisting ? 'transparent' : 'default'}
                      style={{
                        cursor: isExisting ? 'default' : 'pointer',
                        opacity: isExisting ? 0.5 : 1,
                      }}
                      onClick={() => {
                        if (!isExisting) handleToggle(page._id)
                      }}
                    >
                      <Flex align="center" gap={3}>
                        <Box style={{flexShrink: 0}}>
                          {isExisting ? (
                            <Checkbox checked disabled readOnly />
                          ) : (
                            <Checkbox checked={isSelected} readOnly />
                          )}
                        </Box>
                        <Stack space={2} style={{flex: 1, minWidth: 0}}>
                          <Flex align="center" gap={2}>
                            <Text size={0} muted>
                              <DocumentIcon />
                            </Text>
                            <Text
                              size={1}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {page.name || 'Untitled'}
                            </Text>
                          </Flex>
                          <Text size={0} muted style={{fontFamily: 'monospace'}}>
                            /{page.slug?.current || '(no slug)'}
                          </Text>
                        </Stack>
                        {isExisting && (
                          <Text size={0} muted>
                            Added
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
          <Card padding={3} borderTop style={{flexShrink: 0}}>
            <Flex align="center" justify="space-between">
              <Text size={1} muted>
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : 'Select pages to add'}
              </Text>
              <Flex gap={2}>
                {selectedIds.size > 0 && (
                  <Button
                    text="Clear"
                    mode="ghost"
                    fontSize={1}
                    onClick={() => setSelectedIds(new Set())}
                  />
                )}
                <Button
                  text="Add"
                  tone="primary"
                  fontSize={1}
                  disabled={selectedIds.size === 0}
                  onClick={handleAdd}
                />
              </Flex>
            </Flex>
          </Card>
        </Card>
      </div>
    </Layer>
  )
}
