/**
 * useInstructions Hook (Training)
 *
 * Fetches and manages Claude training from the Sanity claudeInstructions document.
 * Only fetches **published** documents (not drafts).
 * Replaces localStorage with Sanity for centralized training management.
 */

import {useState, useCallback, useEffect, useRef} from 'react'
import {useClient} from 'sanity'
import type {
  InstructionSet,
  SystemPromptContext,
  UseInstructionsReturn,
} from '../types'
import {buildSystemPrompt} from '../lib/instructions'
import {
  formatInstructionsForClaude,
  getDefaultInstructions,
  type SanityClaudeInstructions,
  type SectionTemplateForContext,
} from '../lib/format-instructions'

// Re-export for convenience
export {formatInstructionsForClaude, type SanityClaudeInstructions, type SectionTemplateForContext} from '../lib/format-instructions'

const API_VERSION = '2024-01-01'

/**
 * Convert Sanity training to internal InstructionSet format
 */
function sanityToInstructionSet(doc: SanityClaudeInstructions): InstructionSet {
  return {
    id: doc._id,
    name: 'Claude Training',
    content: formatInstructionsForClaude(doc),
    isDefault: true,
    createdAt: new Date(),
  }
}

/**
 * Default instruction sets for backward compatibility
 */
const DEFAULT_INSTRUCTION_SETS: InstructionSet[] = [
  {
    id: 'default',
    name: 'Default',
    content: getDefaultInstructions(),
    isDefault: true,
    createdAt: new Date(),
  },
]

/**
 * Hook for fetching and managing Claude instructions from Sanity
 */
export function useInstructions(): UseInstructionsReturn & {
  rawInstructions: SanityClaudeInstructions | null
  sectionTemplates: SectionTemplateForContext[]
  isLoading: boolean
  refetch: () => Promise<void>
} {
  const client = useClient({apiVersion: API_VERSION})

  const [instructions, setInstructions] = useState<InstructionSet[]>(DEFAULT_INSTRUCTION_SETS)
  const [rawInstructions, setRawInstructions] = useState<SanityClaudeInstructions | null>(null)
  const [sectionTemplates, setSectionTemplates] = useState<SectionTemplateForContext[]>([])
  const [activeInstructionId, setActiveInstructionId] = useState<string>('default')
  const [isLoading, setIsLoading] = useState(true)

  // Cache ref to avoid refetching
  const cacheRef = useRef<{
    data: SanityClaudeInstructions | null
    templates: SectionTemplateForContext[]
    timestamp: number
  } | null>(null)

  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Fetch instructions from Sanity
   */
  const fetchInstructions = useCallback(async () => {
    // Check cache first
    if (cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_TTL) {
      return
    }

    setIsLoading(true)

    try {
      // Query for published document only (exclude drafts)
      // Published documents don't have 'drafts.' prefix in their _id
      const instructionsQuery = `*[_type == "claudeInstructions" && !(_id in path("drafts.**"))][0] {
        _id,
        writingGuidelines,
        brandVoice,
        forbiddenTerms,
        preferredTerms,
        designSystemRules,
        componentGuidelines,
        technicalConstraints,
        maxNestingDepth,
        requiredFields,
        writingKeywords,
        designKeywords,
        technicalKeywords,
        includeSectionTemplates,
        sectionTemplateGuidance
      }`

      const result = await client.fetch<SanityClaudeInstructions | null>(instructionsQuery)

      // Fetch section templates if enabled (default to true if not set)
      let templates: SectionTemplateForContext[] = []
      if (result?.includeSectionTemplates !== false) {
        const templatesQuery = `*[_type == "sectionTemplate" && !(_id in path("drafts.**"))] | order(category asc, name asc) {
          _id,
          name,
          description,
          category,
          rows,
          backgroundColor,
          paddingTop,
          maxWidth,
          minHeight,
          verticalAlign
        }`
        templates = await client.fetch<SectionTemplateForContext[]>(templatesQuery)
      }

      // Update cache
      cacheRef.current = {
        data: result,
        templates,
        timestamp: Date.now(),
      }

      setRawInstructions(result)
      setSectionTemplates(templates)

      if (result) {
        const instructionSet = sanityToInstructionSet(result)
        setInstructions([instructionSet])
        setActiveInstructionId(result._id)
      } else {
        // No instructions document exists, use defaults
        setInstructions(DEFAULT_INSTRUCTION_SETS)
        setActiveInstructionId('default')
      }
    } catch (err) {
      console.error('Failed to fetch Claude instructions:', err)
      // Fall back to defaults on error
      setInstructions(DEFAULT_INSTRUCTION_SETS)
      setActiveInstructionId('default')
      setSectionTemplates([])
    } finally {
      setIsLoading(false)
    }
  }, [client])

  // Fetch instructions on mount
  useEffect(() => {
    fetchInstructions()
  }, [fetchInstructions])

  /**
   * Get the active instruction set
   */
  const activeInstruction = instructions.find((i) => i.id === activeInstructionId) || null

  /**
   * Create a new instruction set (not supported with Sanity backend - use Studio to edit)
   */
  const createInstruction = useCallback(
    (name: string, content: string): InstructionSet => {
      console.warn('Creating training is not supported. Please use Sanity Studio to edit Claude Training.')
      const newInstruction: InstructionSet = {
        id: `local_${Date.now()}`,
        name,
        content,
        isDefault: false,
        createdAt: new Date(),
      }
      return newInstruction
    },
    []
  )

  /**
   * Update an instruction set (not supported with Sanity backend - use Studio to edit)
   */
  const updateInstruction = useCallback(
    (id: string, updates: Partial<InstructionSet>) => {
      console.warn('Updating training is not supported. Please use Sanity Studio to edit Claude Training.')
    },
    []
  )

  /**
   * Delete an instruction set (not supported with Sanity backend)
   */
  const deleteInstruction = useCallback(
    (id: string) => {
      console.warn('Deleting training is not supported. Please use Sanity Studio to manage Claude Training.')
    },
    []
  )

  /**
   * Set the active instruction set
   */
  const setActiveInstruction = useCallback((id: string) => {
    setActiveInstructionId(id)
  }, [])

  /**
   * Build a system prompt with the current context
   */
  const buildPrompt = useCallback(
    (context: SystemPromptContext): string => {
      const customInstructions = activeInstruction?.content || getDefaultInstructions()
      return buildSystemPrompt({
        ...context,
        customInstructions:
          context.customInstructions || customInstructions,
      })
    },
    [activeInstruction]
  )

  /**
   * Refetch instructions from Sanity
   */
  const refetch = useCallback(async () => {
    // Clear cache to force refetch
    cacheRef.current = null
    await fetchInstructions()
  }, [fetchInstructions])

  return {
    instructions,
    activeInstruction,
    createInstruction,
    updateInstruction,
    deleteInstruction,
    setActiveInstruction,
    buildSystemPrompt: buildPrompt,
    rawInstructions,
    sectionTemplates,
    isLoading,
    refetch,
  }
}

/**
 * Hook for managing a single editable instruction (for local/temporary use)
 */
export function useEditableInstruction(initialContent: string = '') {
  const [content, setContent] = useState(initialContent)
  const [isDirty, setIsDirty] = useState(false)

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent)
    setIsDirty(true)
  }, [])

  const resetContent = useCallback((newContent: string = '') => {
    setContent(newContent)
    setIsDirty(false)
  }, [])

  return {
    content,
    isDirty,
    updateContent,
    resetContent,
  }
}

// Re-export default instruction sets for backward compatibility
export {DEFAULT_INSTRUCTION_SETS}
