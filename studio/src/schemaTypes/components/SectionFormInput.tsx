import React, {useState, useEffect, useCallback} from 'react'
import {BlockElementIcon} from '@sanity/icons'
import {
  Button,
  Card,
  Flex,
  Text,
  Stack,
  Box,
  Spinner,
  Badge,
  Dialog,
  Grid,
} from '@sanity/ui'
import {
  type ObjectInputProps,
  useClient,
  useFormValue,
  set,
  unset,
  PatchEvent,
} from 'sanity'

interface SectionTemplate {
  _id: string
  name: string
  description?: string
  category?: string
  thumbnailUrl?: string
  rows?: any[]
  backgroundColor?: string
  minHeight?: string
  verticalAlign?: string
  maxWidth?: string
  paddingTop?: string
}

interface GroupedTemplates {
  [category: string]: SectionTemplate[]
}

const CATEGORY_LABELS: Record<string, string> = {
  heroes: 'Heroes',
  features: 'Features',
  content: 'Content',
  testimonials: 'Testimonials',
  ctas: 'CTAs',
  pricing: 'Pricing',
  faq: 'FAQ',
  other: 'Other',
}

const CATEGORY_ORDER = ['heroes', 'features', 'content', 'testimonials', 'ctas', 'pricing', 'faq', 'other']

/** Delay in ms to show success state after applying template */
const TEMPLATE_APPLICATION_DELAY = 300

/**
 * Generate a unique key for Sanity array items.
 * Uses crypto.randomUUID when available, falls back to Math.random for older browsers.
 */
function generateUniqueKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8)
  }
  // Fallback for browsers without crypto.randomUUID
  return Math.random().toString(36).substring(2, 10)
}

/**
 * Deep clones an object and generates new _key values for all array items.
 * This ensures that when a template is applied, all keys are unique.
 */
function deepCloneWithNewKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepCloneWithNewKeys(item))
  }

  const cloned: any = {}
  for (const key of Object.keys(obj)) {
    if (key === '_key') {
      // Generate a new unique key
      cloned[key] = generateUniqueKey()
    } else {
      cloned[key] = deepCloneWithNewKeys(obj[key])
    }
  }
  return cloned
}

/**
 * Custom form input for Section objects that adds a "Start from template" option.
 * Fetches available templates from sectionTemplate documents and allows
 * users to apply a template to populate the section with pre-built content.
 */
export function SectionFormInput(props: ObjectInputProps) {
  const {onChange} = props
  const client = useClient({apiVersion: '2024-01-01'})

  const [templates, setTemplates] = useState<SectionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Check if section already has content
  const rows = useFormValue([...props.path, 'rows']) as any[] | undefined
  const hasContent = rows && rows.length > 0

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const result = await client.fetch<SectionTemplate[]>(`
          *[_type == "sectionTemplate"] | order(category asc, name asc) {
            _id,
            name,
            description,
            category,
            "thumbnailUrl": thumbnail.asset->url,
            rows,
            backgroundColor,
            minHeight,
            verticalAlign,
            maxWidth,
            paddingTop
          }
        `)
        setTemplates(result)
      } catch (error) {
        console.error('Failed to fetch section templates:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [client])

  // Group templates by category
  const groupedTemplates = templates.reduce<GroupedTemplates>((acc, template) => {
    const category = template.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {})

  // Get sorted categories that have templates
  const sortedCategories = CATEGORY_ORDER.filter((cat) => groupedTemplates[cat]?.length > 0)

  // Get templates for current tab
  const displayedTemplates = selectedCategory === 'all'
    ? templates
    : groupedTemplates[selectedCategory] || []

  const applyTemplate = useCallback(
    async (template: SectionTemplate) => {
      setDialogOpen(false)
      setApplying(true)
      setAppliedTemplate(template.name)

      try {
        // Clone the template content with new keys
        const clonedRows = template.rows ? deepCloneWithNewKeys(template.rows) : []

        // Create patch events for each field
        const patches: PatchEvent[] = []

        // Set the rows content
        patches.push(PatchEvent.from(set(clonedRows, ['rows'])))

        // Set section settings from template
        if (template.backgroundColor) {
          patches.push(PatchEvent.from(set(template.backgroundColor, ['backgroundColor'])))
        }
        if (template.minHeight) {
          patches.push(PatchEvent.from(set(template.minHeight, ['minHeight'])))
        }
        if (template.verticalAlign) {
          patches.push(PatchEvent.from(set(template.verticalAlign, ['verticalAlign'])))
        }
        if (template.maxWidth) {
          patches.push(PatchEvent.from(set(template.maxWidth, ['maxWidth'])))
        }
        if (template.paddingTop) {
          patches.push(PatchEvent.from(set(template.paddingTop, ['paddingTop'])))
        }

        // Apply all patches
        for (const patch of patches) {
          onChange(patch)
        }

        // Brief delay to show success state
        await new Promise((resolve) => setTimeout(resolve, TEMPLATE_APPLICATION_DELAY))
      } catch (error) {
        console.error('Failed to apply template:', error)
      } finally {
        setApplying(false)
        setAppliedTemplate(null)
      }
    },
    [onChange]
  )

  // Don't show template selector if no templates exist
  if (!loading && templates.length === 0) {
    return props.renderDefault(props)
  }

  return (
    <>
      <Card padding={3} tone="transparent" border radius={2} marginBottom={4}>
        <Flex align="center" justify="space-between" gap={3}>
          <Flex align="center" gap={2}>
            <Text size={1}>
              <BlockElementIcon />
            </Text>
            <Text size={1}>
              {hasContent
                ? 'Replace content with a template'
                : 'Start from a template (optional)'}
            </Text>
          </Flex>

          {loading ? (
            <Flex align="center" gap={2}>
              <Spinner muted />
              <Text size={1} muted>
                Loading templates...
              </Text>
            </Flex>
          ) : applying ? (
            <Flex align="center" gap={2}>
              <Spinner />
              <Text size={1}>
                Applying {appliedTemplate}...
              </Text>
            </Flex>
          ) : (
            <Button
              text="Choose Template"
              tone="primary"
              icon={BlockElementIcon}
              mode="ghost"
              fontSize={1}
              padding={2}
              onClick={() => setDialogOpen(true)}
            />
          )}
        </Flex>

        {hasContent && !applying && (
          <Box marginTop={2}>
            <Text size={0} muted>
              Warning: Applying a template will replace all existing content in this section.
            </Text>
          </Box>
        )}
      </Card>

      {/* Template Selection Dialog */}
      {dialogOpen && (
        <Dialog
          id="template-picker-dialog"
          header="Choose a Section Template"
          onClose={() => setDialogOpen(false)}
          width={2}
        >
          <Box padding={4}>
            <Stack space={4}>
              {/* Category Filter */}
              <Flex gap={2} wrap="wrap">
                <Button
                  text="All"
                  mode={selectedCategory === 'all' ? 'default' : 'ghost'}
                  tone={selectedCategory === 'all' ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory('all')}
                  fontSize={1}
                  padding={2}
                />
                {sortedCategories.map((category) => (
                  <Button
                    key={category}
                    text={CATEGORY_LABELS[category] || category}
                    mode={selectedCategory === category ? 'default' : 'ghost'}
                    tone={selectedCategory === category ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(category)}
                    fontSize={1}
                    padding={2}
                  />
                ))}
              </Flex>

              {/* Template Grid */}
              <Box style={{maxHeight: '60vh', overflowY: 'auto', padding: '2px'}}>
                {displayedTemplates.length === 0 ? (
                  <Card padding={5} tone="transparent">
                    <Text align="center" muted>
                      No templates in this category
                    </Text>
                  </Card>
                ) : (
                  <Grid columns={[1, 2, 3]} gap={3}>
                    {displayedTemplates.map((template) => (
                      <Card
                        key={template._id}
                        radius={2}
                        shadow={1}
                        style={{
                          cursor: 'pointer',
                          overflow: 'hidden',
                          transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                        }}
                        onClick={() => applyTemplate(template)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.transform = ''
                        }}
                      >
                        {/* Thumbnail */}
                        <Box
                          style={{
                            position: 'relative',
                            paddingBottom: '66.67%', // 3:2 aspect ratio
                            backgroundColor: 'var(--card-bg-color)',
                            overflow: 'hidden',
                          }}
                        >
                          {template.thumbnailUrl ? (
                            <img
                              src={`${template.thumbnailUrl}?w=400&h=267&fit=crop`}
                              alt={template.name}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <Flex
                              align="center"
                              justify="center"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'var(--card-hairline-soft-color)',
                              }}
                            >
                              <Text muted size={4}>
                                <BlockElementIcon />
                              </Text>
                            </Flex>
                          )}
                          {/* Category Badge */}
                          {template.category && (
                            <Box
                              style={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                              }}
                            >
                              <Badge tone="primary" fontSize={0}>
                                {CATEGORY_LABELS[template.category] || template.category}
                              </Badge>
                            </Box>
                          )}
                        </Box>

                        {/* Template Info */}
                        <Box padding={3}>
                          <Stack space={2}>
                            <Text weight="semibold" size={1}>
                              {template.name}
                            </Text>
                            {template.description && (
                              <Text size={0} muted>
                                {template.description}
                              </Text>
                            )}
                          </Stack>
                        </Box>
                      </Card>
                    ))}
                  </Grid>
                )}
              </Box>
            </Stack>
          </Box>
        </Dialog>
      )}

      {props.renderDefault(props)}
    </>
  )
}
