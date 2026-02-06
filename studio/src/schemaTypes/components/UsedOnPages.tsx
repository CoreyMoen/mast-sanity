import React, {useMemo, useState, useEffect} from 'react'
import {Card, Flex, Text, Stack, Spinner, Badge} from '@sanity/ui'
import {LinkIcon} from '@sanity/icons'
import {useDocumentStore, useFormValue, type SanityDocument} from 'sanity'
import {IntentLink} from 'sanity/router'

interface UsagePage {
  _id: string
  name?: string
  title?: string
  _type: string
  slug?: {current: string}
}

/**
 * Displays a live-updating list of pages that reference the current document.
 * Uses Sanity's reactive document store to automatically update when
 * pages add or remove references to this global section template.
 */
export function UsedOnPages() {
  const document = useFormValue([]) as SanityDocument | undefined
  const documentStore = useDocumentStore()
  const [pages, setPages] = useState<UsagePage[]>([])
  const [loading, setLoading] = useState(true)

  // Extract clean ID (remove drafts. prefix)
  const blockId = useMemo(() => {
    return document?._id?.replace(/^drafts\./, '') ?? ''
  }, [document?._id])

  // Subscribe to the reactive query
  useEffect(() => {
    if (!blockId) {
      setLoading(false)
      return
    }

    const subscription = documentStore
      .listenQuery(
        `*[references($blockId) && _type in ["page", "post"]]{ _id, name, title, _type, slug }`,
        {blockId},
        {apiVersion: '2024-01-01'},
      )
      .subscribe({
        next: (result) => {
          setPages(result as UsagePage[])
          setLoading(false)
        },
        error: (err) => {
          console.error('UsedOnPages query error:', err)
          setLoading(false)
        },
      })

    return () => subscription.unsubscribe()
  }, [documentStore, blockId])

  if (!blockId) return null

  return (
    <Card padding={3} tone="transparent" border radius={2}>
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Text size={1}>
            <LinkIcon />
          </Text>
          <Text size={1} weight="semibold">
            Used on {loading ? '...' : `${pages.length} page${pages.length !== 1 ? 's' : ''}`}
          </Text>
        </Flex>

        {loading ? (
          <Flex align="center" gap={2} paddingLeft={1}>
            <Spinner muted />
            <Text size={1} muted>
              Loading...
            </Text>
          </Flex>
        ) : pages.length === 0 ? (
          <Text size={1} muted style={{paddingLeft: 4}}>
            Not referenced on any pages yet. Add it to a page via the page builder.
          </Text>
        ) : (
          <Stack space={2} style={{paddingLeft: 4}}>
            {pages.map((page) => (
              <Flex key={page._id} align="center" gap={2}>
                <IntentLink
                  intent="edit"
                  params={{id: page._id, type: page._type}}
                  style={{
                    color: 'var(--card-link-color)',
                    textDecoration: 'none',
                    fontSize: '13px',
                  }}
                >
                  {page.name || page.title || '[Untitled]'}
                </IntentLink>
                {page.slug?.current && (
                  <Badge tone="default" fontSize={0}>
                    /{page.slug.current}
                  </Badge>
                )}
              </Flex>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
