import {useState, useEffect, useCallback, useMemo} from 'react'
import {
  Autocomplete,
  Box,
  Card,
  Flex,
  Text,
  Spinner,
} from '@sanity/ui'
import {SearchIcon, DocumentIcon, HomeIcon} from '@sanity/icons'
import {useClient} from 'sanity'
import {
  type PreviewHeaderProps,
  usePresentationNavigate,
} from 'sanity/presentation'

interface PageDocument {
  _id: string
  name: string
  slug: {current: string} | null
}

interface PostDocument {
  _id: string
  title: string
  slug: {current: string} | null
}

type NavigableDocument = PageDocument | PostDocument

interface DocumentInfo {
  title: string
  path: string
  isPage: boolean
}

/**
 * Custom Presentation header component that adds a searchable
 * page/post selector to the preview toolbar.
 */
export function PageNavigator(props: PreviewHeaderProps) {
  const client = useClient({apiVersion: '2024-01-01'})
  const navigate = usePresentationNavigate()
  const [documents, setDocuments] = useState<NavigableDocument[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all pages and posts
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const [pages, posts] = await Promise.all([
          client.fetch<PageDocument[]>(
            `*[_type == "page"] | order(name asc) {_id, name, slug}`
          ),
          client.fetch<PostDocument[]>(
            `*[_type == "post"] | order(title asc) {_id, title, slug}`
          ),
        ])
        setDocuments([...pages, ...posts])
      } catch (error) {
        console.error('Error fetching documents:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [client])

  // Create a lookup map for document info by path
  const documentMap = useMemo(() => {
    const map = new Map<string, DocumentInfo>()
    documents.forEach((doc) => {
      const isPage = 'name' in doc
      const title = isPage ? doc.name : doc.title
      const slug = doc.slug?.current
      const path = isPage ? (slug ? `/${slug}` : '/') : `/posts/${slug}`
      map.set(path, {title, path, isPage})
    })
    return map
  }, [documents])

  // Convert documents to autocomplete options
  const options = useMemo(() => {
    return Array.from(documentMap.entries()).map(([path]) => ({
      value: path,
    }))
  }, [documentMap])

  // Handle selection
  const handleSelect = useCallback(
    (value: string) => {
      if (value) {
        navigate(value)
      }
    },
    [navigate]
  )

  // Render option - lookup info from map
  const renderOption = useCallback(
    (option: {value: string}) => {
      const info = documentMap.get(option.value)
      const title = info?.title ?? 'Untitled'
      const path = info?.path ?? option.value
      const isPage = info?.isPage ?? true

      return (
        <Card as="button" padding={3}>
          <Flex align="center" gap={3}>
            <Text size={1}>
              {path === '/' ? <HomeIcon /> : <DocumentIcon />}
            </Text>
            <Flex direction="column" gap={1}>
              <Text size={1} weight="medium">
                {title}
              </Text>
              <Text size={0} muted>
                {isPage ? 'Page' : 'Post'} · {path}
              </Text>
            </Flex>
          </Flex>
        </Card>
      )
    },
    [documentMap]
  )

  // Filter function for search - lookup info from map
  const filterOption = useCallback(
    (query: string, option: {value: string}) => {
      const info = documentMap.get(option.value)
      if (!info) return false

      const {title, path} = info
      const searchTerm = query.toLowerCase()
      return (
        title?.toLowerCase().includes(searchTerm) ||
        path.toLowerCase().includes(searchTerm)
      )
    },
    [documentMap]
  )

  return (
    <Flex align="center" gap={1} style={{width: '100%'}}>
      {/* Page selector on the left */}
      <Box paddingX={1} style={{minWidth: 200, maxWidth: 280}}>
        {loading ? (
          <Card padding={2}>
            <Flex align="center" gap={2}>
              <Spinner muted />
              <Text size={1} muted>
                Loading...
              </Text>
            </Flex>
          </Card>
        ) : (
          <Autocomplete
            id="page-navigator"
            icon={SearchIcon}
            placeholder="Go to page..."
            options={options}
            onSelect={handleSelect}
            renderOption={renderOption}
            filterOption={filterOption}
            openButton
            fontSize={1}
            radius={2}
          />
        )}
      </Box>

      {/* Render the default header (Edit toggle, URL bar, etc.) */}
      <Box flex={1}>{props.renderDefault(props)}</Box>
    </Flex>
  )
}
