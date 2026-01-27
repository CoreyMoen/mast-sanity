import React, {useState, useEffect, useCallback} from 'react'
import {BlockElementIcon, ChevronDownIcon, CheckmarkIcon} from '@sanity/icons'
import {
  Button,
  Card,
  Flex,
  Text,
  Stack,
  Menu,
  MenuButton,
  MenuItem,
  MenuDivider,
  Box,
  Spinner,
  Badge,
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
      cloned[key] = crypto.randomUUID().slice(0, 8)
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

  const applyTemplate = useCallback(
    async (template: SectionTemplate) => {
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
        await new Promise((resolve) => setTimeout(resolve, 800))
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
            <MenuButton
              button={
                <Button
                  text="Choose Template"
                  tone="primary"
                  icon={BlockElementIcon}
                  iconRight={ChevronDownIcon}
                  mode="ghost"
                  fontSize={1}
                  padding={2}
                />
              }
              id="template-menu"
              menu={
                <Menu>
                  {sortedCategories.map((category, categoryIndex) => (
                    <React.Fragment key={category}>
                      {categoryIndex > 0 && <MenuDivider />}
                      <Box padding={2} paddingBottom={1}>
                        <Text size={0} weight="semibold" muted>
                          {CATEGORY_LABELS[category] || category}
                        </Text>
                      </Box>
                      {groupedTemplates[category].map((template) => (
                        <MenuItem
                          key={template._id}
                          text={template.name}
                          onClick={() => applyTemplate(template)}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </Menu>
              }
              popover={{portal: true, placement: 'bottom-end'}}
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

      {props.renderDefault(props)}
    </>
  )
}
