/**
 * SettingsPanel Component
 *
 * Settings dialog for configuring the Claude Assistant.
 * Includes role-based access control - only administrators can edit instructions.
 * Non-admin users see a read-only view.
 *
 * Accessibility features (WCAG 2.1 AA):
 * - Focus trap inside dialog
 * - Return focus to trigger element on close
 * - Escape key to close
 * - Proper ARIA roles and labels
 */

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient, useCurrentUser} from 'sanity'
import {useRouter} from 'sanity/router'
import {contentToMarkdown} from '../lib/portable-text-to-markdown'
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Label,
  Select,
  Spinner,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Text,
  TextArea,
  TextInput,
} from '@sanity/ui'
import {BoltIcon, CogIcon, EditIcon, LockIcon, WarningOutlineIcon} from '@sanity/icons'
import type {PluginSettings} from '../types'
import {useFocusTrap} from '../hooks/useKeyboardShortcuts'
import {useQuickActions} from '../hooks/useQuickActions'

// ============================================================================
// Types
// ============================================================================

export interface SettingsPanelProps {
  settings: PluginSettings
  onSettingsChange: (settings: PluginSettings) => void
  isOpen: boolean
  onClose: () => void
  /** Reference to the element that triggered the dialog, for focus return */
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

interface ClaudeInstructions {
  _id: string
  _type: 'claudeInstructions'
  // Portable Text fields (rich text stored as arrays)
  writingGuidelines?: unknown[]
  brandVoice?: unknown[]
  designSystemRules?: unknown[]
  technicalConstraints?: unknown[]
  // Simple fields
  forbiddenTerms?: string[]
  preferredTerms?: Array<{avoid: string; useInstead: string}>
  componentGuidelines?: Array<{component: string; guidelines: string; doNot: string}>
  maxNestingDepth?: number
  requiredFields?: Array<{component: string; fields: string[]}>
  // Configurable trigger keywords for conditional instruction inclusion
  writingKeywords?: string
  designKeywords?: string
  technicalKeywords?: string
}

interface InstructionFieldProps {
  label: string
  description: string
  value: string
  onChange: (value: string) => void
  readOnly: boolean
  multiline?: boolean
  type?: 'text' | 'number'
  rows?: number
  placeholder?: string
}

// ============================================================================
// Constants
// ============================================================================

const ADMIN_ROLES = ['administrator']

const AVAILABLE_MODELS = [
  {value: 'claude-opus-4-5-20251101', title: 'Claude Opus 4.5 (Most Capable)'},
  {value: 'claude-sonnet-4-20250514', title: 'Claude Sonnet 4 (Recommended)'},
]

const DEBOUNCE_DELAY = 1000

// ============================================================================
// InstructionField Component
// ============================================================================

function InstructionField({
  label,
  description,
  value,
  onChange,
  readOnly,
  multiline = false,
  type = 'text',
  rows = 6,
  placeholder,
}: InstructionFieldProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isDirty, setIsDirty] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local value when prop changes (e.g., after fetch)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced save
  useEffect(() => {
    if (!isDirty) return

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onChange(localValue)
      setIsDirty(false)
    }, DEBOUNCE_DELAY)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [localValue, isDirty, onChange])

  const handleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (readOnly) return
      setLocalValue(e.currentTarget.value)
      setIsDirty(true)
    },
    [readOnly]
  )

  const inputStyle = useMemo(
    () => ({
      opacity: readOnly ? 0.7 : 1,
      cursor: readOnly ? 'not-allowed' : 'text',
    }),
    [readOnly]
  )

  return (
    <Stack space={2}>
      <Flex align="center" gap={2}>
        <Text size={1} weight="semibold">
          {label}
        </Text>
        {isDirty && (
          <Text size={0} muted>
            (unsaved)
          </Text>
        )}
      </Flex>
      <Text size={0} muted>
        {description}
      </Text>
      {multiline ? (
        <TextArea
          value={localValue}
          onChange={handleChange}
          readOnly={readOnly}
          rows={rows}
          placeholder={placeholder}
          style={inputStyle}
        />
      ) : (
        <TextInput
          value={localValue}
          onChange={handleChange}
          readOnly={readOnly}
          type={type}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
    </Stack>
  )
}

// ============================================================================
// ArrayFieldDisplay Component (Read-only display for array fields)
// ============================================================================

interface ArrayFieldDisplayProps {
  label: string
  description: string
  items: string[] | undefined
  emptyMessage?: string
}

function ArrayFieldDisplay({label, description, items, emptyMessage = 'None'}: ArrayFieldDisplayProps) {
  return (
    <Stack space={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Text size={0} muted>
        {description}
      </Text>
      <Card padding={3} radius={2} tone="transparent" border>
        {items && items.length > 0 ? (
          <Flex gap={2} wrap="wrap">
            {items.map((item, index) => (
              <Card key={index} padding={2} radius={2} tone="primary">
                <Text size={1}>{item}</Text>
              </Card>
            ))}
          </Flex>
        ) : (
          <Text size={1} muted>
            {emptyMessage}
          </Text>
        )}
      </Card>
    </Stack>
  )
}

// ============================================================================
// RichTextPreview Component (Read-only display for Portable Text fields)
// ============================================================================

interface RichTextPreviewProps {
  label: string
  description: string
  content: unknown[] | undefined
  emptyMessage?: string
}

function RichTextPreview({label, description, content, emptyMessage = 'Not configured'}: RichTextPreviewProps) {
  const markdown = contentToMarkdown(content)

  return (
    <Stack space={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Text size={0} muted>
        {description}
      </Text>
      <Card padding={3} radius={2} tone="transparent" border style={{maxHeight: '200px', overflow: 'auto'}}>
        {markdown ? (
          <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
            {markdown}
          </Text>
        ) : (
          <Text size={1} muted>
            {emptyMessage}
          </Text>
        )}
      </Card>
    </Stack>
  )
}

// ============================================================================
// Main SettingsPanel Component
// ============================================================================

export function SettingsPanel({settings, onSettingsChange, isOpen, onClose, triggerRef}: SettingsPanelProps) {
  const currentUser = useCurrentUser()
  const client = useClient({apiVersion: '2024-01-01'})
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Navigate to Instructions document in Structure mode
  // Sanity uses semicolon (;) to separate nested pane segments in URLs
  const navigateToInstructions = useCallback((tab?: 'writing' | 'design' | 'technical') => {
    // Close the dialog first
    onClose()
    // Navigate to the Instructions document (semicolon opens the nested pane)
    // The tab parameter is informational - Sanity doesn't support URL-based tab selection
    router.navigateUrl({path: '/structure/claudeSettings;claudeInstructions'})
  }, [router, onClose])

  // Navigate to Quick Actions list in Structure mode
  const navigateToQuickActions = useCallback(() => {
    onClose()
    router.navigateUrl({path: '/structure/claudeSettings;claudeQuickActions'})
  }, [router, onClose])

  // State
  const [instructions, setInstructions] = useState<ClaudeInstructions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'writing' | 'design' | 'technical' | 'quickActions'>('settings')

  // Fetch quick actions from Sanity
  const {quickActions, isLoading: isLoadingQuickActions, isUsingDefaults} = useQuickActions()

  // Apply focus trap when dialog is open
  useFocusTrap(dialogRef, isOpen)

  // Handle closing the dialog and returning focus
  const handleClose = useCallback(() => {
    onClose()
    // Return focus to the trigger element
    setTimeout(() => {
      triggerRef?.current?.focus()
    }, 0)
  }, [onClose, triggerRef])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return currentUser?.roles?.some((role) => ADMIN_ROLES.includes(role.name)) ?? false
  }, [currentUser?.roles])

  // Update setting helper
  const updateSetting = useCallback(
    <K extends keyof PluginSettings>(key: K, value: PluginSettings[K]) => {
      onSettingsChange({...settings, [key]: value})
    },
    [settings, onSettingsChange]
  )

  // Fetch instructions on mount
  useEffect(() => {
    if (!isOpen) return

    const fetchInstructions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await client.fetch<ClaudeInstructions | null>(
          `*[_type == "claudeInstructions"][0]`
        )

        if (result) {
          setInstructions(result)
        } else if (isAdmin) {
          // Create the singleton if it doesn't exist (admin only)
          await createDefaultInstructions()
        } else {
          // Non-admin and no instructions exist
          setInstructions(null)
        }
      } catch (err) {
        console.error('Failed to fetch Claude instructions:', err)
        setError('Failed to load instructions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstructions()
  }, [isOpen, client, isAdmin])

  // Create default instructions document
  const createDefaultInstructions = async () => {
    try {
      const newDoc = await client.create({
        _type: 'claudeInstructions',
        // Portable Text fields use empty arrays (not strings)
        writingGuidelines: [],
        brandVoice: [],
        designSystemRules: [],
        technicalConstraints: [],
        maxNestingDepth: 12,
        forbiddenTerms: [],
        preferredTerms: [],
        componentGuidelines: [],
        requiredFields: [],
      })
      setInstructions(newDoc as ClaudeInstructions)
    } catch (err) {
      console.error('Failed to create Claude instructions:', err)
      setError('Failed to create instructions document')
    }
  }

  // Save instruction field
  const handleSaveField = useCallback(
    async (field: string, value: unknown) => {
      if (!instructions?._id || !isAdmin) return

      setIsSaving(true)
      try {
        await client.patch(instructions._id).set({[field]: value}).commit()

        setInstructions((prev) => (prev ? {...prev, [field]: value} : null))
      } catch (err) {
        console.error('Failed to save field:', err)
        setError(`Failed to save ${field}`)
      } finally {
        setIsSaving(false)
      }
    },
    [client, instructions?._id, isAdmin]
  )

  if (!isOpen) return null

  // Loading state
  if (isLoading) {
    return (
      <Dialog
        id="claude-settings-dialog"
        header="Claude Assistant Settings"
        onClose={handleClose}
        width={2}
        aria-label="Claude Assistant Settings - Loading"
        aria-describedby="settings-loading-status"
      >
        <Box padding={4} ref={dialogRef}>
          <Flex align="center" justify="center" padding={6}>
            <Spinner muted />
            <Box marginLeft={3}>
              <Text muted id="settings-loading-status" role="status" aria-live="polite">
                Loading settings...
              </Text>
            </Box>
          </Flex>
        </Box>
      </Dialog>
    )
  }

  return (
    <Dialog
      id="claude-settings-dialog"
      header={
        <Flex align="center" gap={2}>
          <CogIcon aria-hidden="true" />
          <Text weight="semibold">Claude Assistant Settings</Text>
          {!isAdmin && <LockIcon aria-label="Read-only access" />}
          {isSaving && (
            <Flex align="center" gap={2} marginLeft={2} role="status" aria-live="polite">
              <Spinner muted />
              <Text size={1} muted>
                Saving...
              </Text>
            </Flex>
          )}
        </Flex>
      }
      onClose={handleClose}
      width={2}
      aria-label="Claude Assistant Settings"
    >
      <Box padding={4} ref={dialogRef}>
        <Stack space={4}>
          {/* Error display */}
          {error && (
            <Card padding={3} tone="critical" radius={2}>
              <Flex align="center" gap={2}>
                <WarningOutlineIcon />
                <Text size={1}>{error}</Text>
              </Flex>
            </Card>
          )}

          {/* Role indicator for non-admins */}
          {!isAdmin && (
            <Card padding={3} tone="caution" radius={2}>
              <Flex align="flex-start" gap={2}>
                <Box style={{flexShrink: 0, marginTop: 2}}>
                  <LockIcon />
                </Box>
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Read-Only Access
                  </Text>
                  <Text size={1}>
                    You can view the Claude instructions but cannot modify them. Contact an administrator
                    to request changes to writing guidelines, design rules, or technical constraints.
                  </Text>
                </Stack>
              </Flex>
            </Card>
          )}

          {/* Tab navigation */}
          <TabList space={2}>
            <Tab
              aria-controls="settings-panel"
              id="settings-tab"
              label="API Settings"
              onClick={() => setActiveTab('settings')}
              selected={activeTab === 'settings'}
            />
            <Tab
              aria-controls="writing-panel"
              id="writing-tab"
              label="Writing"
              onClick={() => setActiveTab('writing')}
              selected={activeTab === 'writing'}
            />
            <Tab
              aria-controls="design-panel"
              id="design-tab"
              label="Design"
              onClick={() => setActiveTab('design')}
              selected={activeTab === 'design'}
            />
            <Tab
              aria-controls="technical-panel"
              id="technical-tab"
              label="Technical"
              onClick={() => setActiveTab('technical')}
              selected={activeTab === 'technical'}
            />
            <Tab
              aria-controls="quick-actions-panel"
              id="quick-actions-tab"
              label="Quick Actions"
              onClick={() => setActiveTab('quickActions')}
              selected={activeTab === 'quickActions'}
            />
          </TabList>

          {/* API Settings Tab */}
          <TabPanel aria-labelledby="settings-tab" hidden={activeTab !== 'settings'} id="settings-panel">
            <Stack space={5}>
              {/* Model Selection */}
              <Stack space={3}>
                <Label>Model</Label>
                <Select value={settings.model} onChange={(e) => updateSetting('model', e.currentTarget.value)}>
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.title}
                    </option>
                  ))}
                </Select>
                <Text size={0} muted>
                  Select the Claude model to use. Sonnet is recommended for most tasks.
                </Text>
              </Stack>

              {/* Max Tokens */}
              <Stack space={3}>
                <Label>Max Output Tokens</Label>
                <TextInput
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => updateSetting('maxTokens', parseInt(e.currentTarget.value) || 4096)}
                  min={100}
                  max={8192}
                />
                <Text size={0} muted>
                  Maximum number of tokens in Claude's response (100-8192).
                </Text>
              </Stack>

              {/* Temperature */}
              <Stack space={3}>
                <Label>Temperature ({settings.temperature})</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => updateSetting('temperature', parseFloat(e.currentTarget.value))}
                  style={{width: '100%'}}
                />
                <Text size={0} muted>
                  Lower values make responses more focused, higher values more creative.
                </Text>
              </Stack>

              {/* Streaming */}
              <Card padding={3} radius={2} border>
                <Flex align="center" justify="space-between">
                  <Stack space={2}>
                    <Text size={1} weight="semibold">
                      Enable Streaming
                    </Text>
                    <Text size={0} muted>
                      Show responses as they're generated
                    </Text>
                  </Stack>
                  <Switch
                    checked={settings.enableStreaming}
                    onChange={() => updateSetting('enableStreaming', !settings.enableStreaming)}
                  />
                </Flex>
              </Card>
            </Stack>
          </TabPanel>

          {/* Writing Tab */}
          <TabPanel aria-labelledby="writing-tab" hidden={activeTab !== 'writing'} id="writing-panel">
            <Stack space={5}>
              <RichTextPreview
                label="Writing Guidelines"
                description="General guidelines for writing style, tone, and voice (edit in Studio for rich text formatting)"
                content={instructions?.writingGuidelines}
                emptyMessage="No writing guidelines configured"
              />

              <RichTextPreview
                label="Brand Voice"
                description="Description of the brand voice and personality"
                content={instructions?.brandVoice}
                emptyMessage="No brand voice defined"
              />

              <ArrayFieldDisplay
                label="Forbidden Terms"
                description="Words or phrases that should never be used"
                items={instructions?.forbiddenTerms}
                emptyMessage="No forbidden terms defined"
              />

              {/* Preferred Terms Display */}
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Preferred Terms
                </Text>
                <Text size={0} muted>
                  Term replacements - what to avoid and what to use instead
                </Text>
                <Card padding={3} radius={2} tone="transparent" border>
                  {instructions?.preferredTerms && instructions.preferredTerms.length > 0 ? (
                    <Stack space={2}>
                      {instructions.preferredTerms.map((term, index) => (
                        <Flex key={index} align="center" gap={2}>
                          <Card padding={2} radius={2} tone="caution">
                            <Text size={1}>{term.avoid}</Text>
                          </Card>
                          <Text size={1} muted>
                            →
                          </Text>
                          <Card padding={2} radius={2} tone="positive">
                            <Text size={1}>{term.useInstead}</Text>
                          </Card>
                        </Flex>
                      ))}
                    </Stack>
                  ) : (
                    <Text size={1} muted>
                      No preferred terms defined
                    </Text>
                  )}
                </Card>
              </Stack>

              {isAdmin && (
                <Card padding={3} tone="transparent" border radius={2}>
                  <Stack space={3}>
                    <Flex align="center" gap={2}>
                      <EditIcon />
                      <Text size={1}>
                        To edit forbidden terms and preferred terms, open the full editor and select the <strong>Writing</strong> tab.
                      </Text>
                    </Flex>
                    <Button
                      text="Edit Writing Instructions"
                      mode="ghost"
                      icon={EditIcon}
                      onClick={() => navigateToInstructions('writing')}
                    />
                  </Stack>
                </Card>
              )}
            </Stack>
          </TabPanel>

          {/* Design Tab */}
          <TabPanel aria-labelledby="design-tab" hidden={activeTab !== 'design'} id="design-panel">
            <Stack space={5}>
              <RichTextPreview
                label="Design System Rules"
                description="General rules for the design system and visual consistency (edit in Studio for rich text formatting)"
                content={instructions?.designSystemRules}
                emptyMessage="No design system rules configured"
              />

              {/* Component Guidelines Display */}
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Component Guidelines
                </Text>
                <Text size={0} muted>
                  Specific guidelines for individual components
                </Text>
                <Card padding={3} radius={2} tone="transparent" border>
                  {instructions?.componentGuidelines && instructions.componentGuidelines.length > 0 ? (
                    <Stack space={3}>
                      {instructions.componentGuidelines.map((guideline, index) => (
                        <Card key={index} padding={3} radius={2} border>
                          <Stack space={2}>
                            <Text size={1} weight="semibold">
                              {guideline.component}
                            </Text>
                            {guideline.guidelines && (
                              <Text size={1} muted>
                                {guideline.guidelines}
                              </Text>
                            )}
                            {guideline.doNot && (
                              <Card padding={2} radius={2} tone="caution">
                                <Text size={0}>
                                  <strong>Avoid:</strong> {guideline.doNot}
                                </Text>
                              </Card>
                            )}
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Text size={1} muted>
                      No component guidelines defined
                    </Text>
                  )}
                </Card>
              </Stack>

              {isAdmin && (
                <Card padding={3} tone="transparent" border radius={2}>
                  <Stack space={3}>
                    <Flex align="center" gap={2}>
                      <EditIcon />
                      <Text size={1}>
                        To add or edit component guidelines, open the full editor and select the <strong>Design</strong> tab.
                      </Text>
                    </Flex>
                    <Button
                      text="Edit Design Instructions"
                      mode="ghost"
                      icon={EditIcon}
                      onClick={() => navigateToInstructions('design')}
                    />
                  </Stack>
                </Card>
              )}
            </Stack>
          </TabPanel>

          {/* Technical Tab */}
          <TabPanel aria-labelledby="technical-tab" hidden={activeTab !== 'technical'} id="technical-panel">
            <Stack space={5}>
              <RichTextPreview
                label="Technical Constraints"
                description="Technical limitations and constraints Claude should be aware of (edit in Studio for rich text formatting)"
                content={instructions?.technicalConstraints}
                emptyMessage="No technical constraints configured"
              />

              <InstructionField
                label="Max Nesting Depth"
                description="Maximum nesting depth for page structures (Sanity hard limit is 20)"
                value={instructions?.maxNestingDepth?.toString() || '12'}
                onChange={(value) => handleSaveField('maxNestingDepth', parseInt(value) || 12)}
                readOnly={!isAdmin}
                type="number"
              />

              {/* Required Fields Display */}
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Required Fields by Component
                </Text>
                <Text size={0} muted>
                  Fields that must be filled for specific components
                </Text>
                <Card padding={3} radius={2} tone="transparent" border>
                  {instructions?.requiredFields && instructions.requiredFields.length > 0 ? (
                    <Stack space={2}>
                      {instructions.requiredFields.map((rule, index) => (
                        <Flex key={index} align="center" gap={2}>
                          <Card padding={2} radius={2} tone="primary">
                            <Text size={1} weight="semibold">
                              {rule.component}
                            </Text>
                          </Card>
                          <Text size={1} muted>
                            {rule.fields?.join(', ') || 'No fields specified'}
                          </Text>
                        </Flex>
                      ))}
                    </Stack>
                  ) : (
                    <Text size={1} muted>
                      No required field rules defined
                    </Text>
                  )}
                </Card>
              </Stack>

              {isAdmin && (
                <Card padding={3} tone="transparent" border radius={2}>
                  <Stack space={3}>
                    <Flex align="center" gap={2}>
                      <EditIcon />
                      <Text size={1}>
                        To add or edit required field rules, open the full editor and select the <strong>Technical</strong> tab.
                      </Text>
                    </Flex>
                    <Button
                      text="Edit Technical Instructions"
                      mode="ghost"
                      icon={EditIcon}
                      onClick={() => navigateToInstructions('technical')}
                    />
                  </Stack>
                </Card>
              )}
            </Stack>
          </TabPanel>

          {/* Quick Actions Tab */}
          <TabPanel aria-labelledby="quick-actions-tab" hidden={activeTab !== 'quickActions'} id="quick-actions-panel">
            <Stack space={4}>
              <Text size={1} muted>
                Quick Actions are shortcut buttons that pre-populate the chat input with common prompts.
              </Text>

              {isUsingDefaults && (
                <Card padding={3} tone="caution" radius={2}>
                  <Text size={1}>
                    Using default quick actions. Create custom actions in the Studio to override these.
                  </Text>
                </Card>
              )}

              <Card padding={3} radius={2} tone="transparent" border>
                <Flex align="center" justify="space-between">
                  <Text size={1}>
                    <strong>{quickActions.length}</strong> quick actions {isUsingDefaults ? '(defaults)' : 'configured'}
                  </Text>
                </Flex>
              </Card>

              {/* Quick Actions List */}
              {isLoadingQuickActions ? (
                <Flex justify="center" padding={4}>
                  <Spinner muted />
                </Flex>
              ) : (
                <Stack space={3}>
                  {quickActions.map((action, index) => (
                    <Card key={action.id} padding={3} radius={2} border>
                      <Flex align="center" gap={3}>
                        <Box style={{flexShrink: 0}}>
                          <Card padding={2} radius={2} tone="primary">
                            <BoltIcon />
                          </Card>
                        </Box>
                        <Stack space={2} style={{flex: 1}}>
                          <Flex align="center" gap={2}>
                            <Text size={1} weight="semibold">
                              {action.label}
                            </Text>
                            <Card padding={1} paddingX={2} radius={2} tone="transparent">
                              <Text size={0} muted>
                                {action.category}
                              </Text>
                            </Card>
                          </Flex>
                          <Text size={1} muted>
                            {action.description}
                          </Text>
                          <Text size={0} style={{fontStyle: 'italic'}}>
                            "{action.prompt}"
                          </Text>
                        </Stack>
                        <Box style={{flexShrink: 0}}>
                          <Text size={0} muted>
                            #{index + 1}
                          </Text>
                        </Box>
                      </Flex>
                    </Card>
                  ))}
                </Stack>
              )}

              {isAdmin && (
                <Button
                  text="Edit Quick Actions in Studio"
                  mode="ghost"
                  icon={EditIcon}
                  onClick={navigateToQuickActions}
                />
              )}

              {!isAdmin && (
                <Card padding={3} tone="transparent" border radius={2}>
                  <Text size={1} muted>
                    Contact an administrator to add or modify quick actions.
                  </Text>
                </Card>
              )}
            </Stack>
          </TabPanel>

          {/* Actions */}
          <Flex gap={2} justify="flex-end" paddingTop={3}>
            <Button text="Close" mode="ghost" onClick={handleClose} aria-label="Close settings dialog" />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
