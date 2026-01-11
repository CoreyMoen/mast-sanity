/**
 * useWorkflows Hook
 *
 * Fetches and manages Claude workflow templates from Sanity.
 * Users can select a workflow to get pre-configured context for their chat.
 */

import {useState, useCallback, useEffect, useRef, useMemo} from 'react'
import {useClient, useCurrentUser} from 'sanity'

const API_VERSION = '2024-01-01'

/**
 * Workflow document from Sanity
 */
export interface Workflow {
  id: string
  name: string
  description?: string
  systemInstructions?: string
  starterPrompt?: string
  icon?: string
  order: number
  roles?: string[]
  active: boolean
}

/**
 * Return type for useWorkflows hook
 */
export interface UseWorkflowsReturn {
  workflows: Workflow[]
  isLoading: boolean
  error: string | null
  selectedWorkflow: Workflow | null
  selectWorkflow: (workflowId: string | null) => void
  refetch: () => Promise<void>
}

/**
 * Hook for managing Claude workflows
 */
export function useWorkflows(): UseWorkflowsReturn {
  const client = useClient({apiVersion: API_VERSION})
  const currentUser = useCurrentUser()

  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)

  // Track if we've already fetched to prevent re-fetching
  const hasFetchedRef = useRef(false)

  // Memoize user roles to prevent dependency array changes
  const userRolesString = currentUser?.roles?.map((r) => r.name).join(',') || ''
  const userRoles = useMemo(() => userRolesString.split(',').filter(Boolean), [userRolesString])

  // Fetch workflows from Sanity
  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const query = `*[_type == "claudeWorkflow" && active == true] | order(order asc) {
        "id": _id,
        name,
        description,
        systemInstructions,
        starterPrompt,
        icon,
        order,
        roles,
        active
      }`

      const results = await client.fetch<Workflow[]>(query)

      // Filter by user roles if specified
      const filteredWorkflows = results.filter((workflow) => {
        // If no roles specified, workflow is available to everyone
        if (!workflow.roles || workflow.roles.length === 0) {
          return true
        }
        // Check if user has any of the required roles
        return workflow.roles.some((role) => userRoles.includes(role))
      })

      setWorkflows(filteredWorkflows)
    } catch (err) {
      console.error('Failed to fetch workflows:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workflows')
    } finally {
      setIsLoading(false)
    }
  }, [client, userRoles])

  // Fetch workflows on mount only (once)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchWorkflows()
    }
  }, [fetchWorkflows])

  // Select a workflow
  const selectWorkflow = useCallback((workflowId: string | null) => {
    setSelectedWorkflowId(workflowId)
  }, [])

  // Get the selected workflow object
  const selectedWorkflow = selectedWorkflowId
    ? workflows.find((w) => w.id === selectedWorkflowId) || null
    : null

  return {
    workflows,
    isLoading,
    error,
    selectedWorkflow,
    selectWorkflow,
    refetch: fetchWorkflows,
  }
}

/**
 * Build workflow context to append to system prompt
 */
export function buildWorkflowContext(workflow: Workflow | null): string {
  if (!workflow?.systemInstructions) {
    return ''
  }

  return `

## Active Workflow: ${workflow.name}

${workflow.systemInstructions}
`
}
