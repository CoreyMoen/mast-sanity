# Claude Assistant for Sanity Studio

## Product Specification

**Version:** 1.0 Draft  
**Last Updated:** January 2025

---

## Overview

A custom Claude-powered chat interface embedded directly within Sanity Studio, enabling non-technical team members to create, manage, and query content using natural language — without needing to set up external tools like the Sanity MCP.

### Goals

1. **Eliminate setup friction** — Team members access Claude directly within the Studio, no MCP configuration required
2. **Empower non-technical users** — Natural language content creation and management
3. **Maintain consistency** — Built-in guardrails enforce writing guidelines, design system rules, and technical constraints
4. **Native experience** — UI feels like part of Sanity Studio, not a bolted-on tool

---

## Architecture Decision: Custom Studio Tool vs. App SDK

There are two approaches to building this:

### Option A: Custom Studio Tool (Recommended)

A custom tool added directly to the Studio via the `tools` array in `sanity.config.ts`.

**Pros:**
- Lives inside the Studio navigation alongside Structure, Presentation, Vision
- Inherits Studio authentication automatically
- Direct access to `useClient()` hook for content operations
- Simpler deployment — ships with your Studio
- Single codebase to maintain

**Cons:**
- Tied to the Studio's React version and build process
- Less isolation if the tool grows complex

### Option B: Standalone App SDK App

A separate application built with the App SDK, accessed via the Sanity Dashboard.

**Pros:**
- Complete UI freedom
- Can work across multiple projects/datasets
- Separate deployment lifecycle

**Cons:**
- Users must switch context (leave Studio, go to Dashboard)
- Separate codebase and deployment
- Doesn't appear in Studio's top navigation

### Recommendation

**Use Option A (Custom Studio Tool)** for your use case because:

1. You want Claude to appear as a tab alongside Structure, Presentation, Vision — this is only possible with a custom tool
2. Your users are already in the Studio; context-switching to Dashboard adds friction
3. The tool's scope is focused on a single project/dataset
4. You get `useClient()` with authenticated access out of the box

---

## User Experience

### Navigation

The "Claude" tool appears in the Studio's top navigation bar:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]   Structure │ Presentation │ Vision │ Claude    [User] │
└─────────────────────────────────────────────────────────────────┘
```

### Main Interface

When users click the Claude tab, they see a chat interface:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     [Claude Logo/Icon]                          │
│                                                                 │
│              How can I help you today?                          │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │ Create a    │  │ Find        │  │ Ask a       │            │
│   │ page        │  │ content     │  │ question    │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐                             │
│   │ Edit        │  │ Review      │                             │
│   │ existing    │  │ guidelines  │                             │
│   └─────────────┘  └─────────────┘                             │
│                                                                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Message Claude...                                    [➤]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Conversation View

Once a conversation begins:

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─ New Chat ─┐                                    [Settings ⚙] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ User ─────────────────────────────────────────────────────┐ │
│  │ Create a new About page with a hero section, team grid,   │ │
│  │ and contact form                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Claude ───────────────────────────────────────────────────┐ │
│  │ I'll create that page for you. Based on your component    │ │
│  │ system, I'll structure it with:                           │ │
│  │                                                            │ │
│  │ • Hero section with heading and subtext                   │ │
│  │ • Team grid using card components                         │ │
│  │ • Contact section with form embed                         │ │
│  │                                                            │ │
│  │ Creating the page now...                                  │ │
│  │                                                            │ │
│  │ ✓ Created: "About Us" page                                │ │
│  │   [View in Structure →]  [Open Preview →]                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Message Claude...                                    [➤]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Action Cards

The suggested prompts should cover common workflows:

| Card | Description | Example Prompt |
|------|-------------|----------------|
| Create a page | Build new pages with components | "Create a landing page for our Q1 campaign" |
| Find content | Search and locate existing content | "Find all blog posts from December" |
| Ask a question | Get help with Sanity or content | "How do I add a video to a page?" |
| Edit existing | Modify existing documents | "Update the homepage hero headline" |
| Review guidelines | Check writing/design rules | "What are our button text guidelines?" |

---

## Technical Architecture

### File Structure

```
studio/
├── sanity.config.ts              # Add claude tool here
├── plugins/
│   └── claude-assistant/
│       ├── index.ts              # Plugin definition
│       ├── ClaudeTool.tsx        # Main tool component
│       ├── components/
│       │   ├── ChatInterface.tsx
│       │   ├── MessageList.tsx
│       │   ├── MessageInput.tsx
│       │   ├── QuickActions.tsx
│       │   ├── Message.tsx
│       │   └── SettingsPanel.tsx
│       ├── hooks/
│       │   ├── useClaudeChat.ts
│       │   ├── useContentOperations.ts
│       │   └── useInstructions.ts
│       ├── lib/
│       │   ├── anthropic.ts      # API client
│       │   ├── operations.ts     # Sanity operations
│       │   └── schema-context.ts # Schema extraction
│       └── types.ts
├── api/                          # If using Next.js embedded studio
│   └── claude/
│       └── route.ts              # API route for Claude
```

### Plugin Registration

```typescript
// sanity.config.ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { visionTool } from '@sanity/vision'
import { claudeAssistant } from './plugins/claude-assistant'

export default defineConfig({
  // ...other config
  plugins: [
    structureTool(),
    presentationTool({ /* config */ }),
    visionTool(),
  ],
  tools: [
    claudeAssistant({
      // Plugin options
      apiEndpoint: '/api/claude', // Your API route
    }),
  ],
})
```

### Tool Definition

```typescript
// plugins/claude-assistant/index.ts
import { definePlugin, type Tool } from 'sanity'
import { RobotIcon } from '@sanity/icons' // or custom Claude icon
import { ClaudeTool } from './ClaudeTool'

export interface ClaudeAssistantOptions {
  apiEndpoint: string
}

export const claudeAssistant = definePlugin<ClaudeAssistantOptions>(
  (options) => ({
    name: 'claude-assistant',
    tools: [
      {
        name: 'claude',
        title: 'Claude',
        icon: RobotIcon,
        component: (props) => <ClaudeTool {...props} options={options} />,
      },
    ],
  })
)
```

### Main Component

```typescript
// plugins/claude-assistant/ClaudeTool.tsx
import { useClient, useSchema, useCurrentUser } from 'sanity'
import { Card, Stack, Box } from '@sanity/ui'
import { ChatInterface } from './components/ChatInterface'
import { useClaudeChat } from './hooks/useClaudeChat'

export function ClaudeTool({ options }) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const schema = useSchema()
  const currentUser = useCurrentUser()
  
  const { messages, sendMessage, isLoading } = useClaudeChat({
    client,
    schema,
    apiEndpoint: options.apiEndpoint,
  })

  return (
    <Card height="fill" overflow="auto">
      <ChatInterface
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
        userName={currentUser?.name}
      />
    </Card>
  )
}
```

---

## Backend Architecture

### API Route (Next.js Example)

Since Sanity Studio can be embedded in Next.js, you can create an API route:

```typescript
// app/api/claude/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  const { messages, schema, instructions } = await request.json()

  const systemPrompt = buildSystemPrompt(schema, instructions)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages,
  })

  return NextResponse.json(response)
}

function buildSystemPrompt(schema: object, instructions: string): string {
  return `You are an AI assistant embedded in Sanity Studio, helping users create and manage content.

## Your Capabilities
- Create new documents and pages
- Query existing content using GROQ
- Update and patch documents
- Explain how to use the CMS

## Content Schema
The following schema types are available:
${JSON.stringify(schema, null, 2)}

## Guidelines and Rules
${instructions}

## Important Constraints
- When creating nested page structures, build incrementally to avoid depth limits
- Always create documents as drafts first
- Validate that referenced documents exist before creating references
- Follow the writing guidelines strictly

## Response Format
When performing content operations, respond with structured JSON actions that the frontend will execute:

\`\`\`json
{
  "action": "create" | "update" | "query" | "explain",
  "documentType": "page",
  "data": { ... },
  "message": "Human-readable explanation"
}
\`\`\`
`
}
```

### Alternative: Sanity Function

If you don't want to embed the Studio in Next.js, you can use Sanity Functions:

```typescript
// functions/claude-chat.ts
import { defineFunction } from 'sanity/functions'
import Anthropic from '@anthropic-ai/sdk'

export default defineFunction({
  name: 'claude-chat',
  handler: async (request, context) => {
    // Similar implementation to Next.js route
  },
})
```

### Title Generation Endpoint

A lightweight endpoint to generate conversation titles:

```typescript
// app/api/claude/generate-title/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  const { userMessage, assistantResponse } = await request.json()

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5-20250514',
    max_tokens: 50,
    messages: [
      {
        role: 'user',
        content: `Generate a short, descriptive title (3-6 words) for this conversation. Return ONLY the title, no quotes or punctuation.

User's message: "${userMessage}"

Assistant's response summary: "${assistantResponse.slice(0, 200)}..."`,
      },
    ],
  })

  const title = response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : 'New conversation'

  return NextResponse.json({ title })
}
```

---

## Remote API for External Integrations

A headless API endpoint that enables external services (like Slack, automation tools, or custom integrations) to interact with Claude using the same instructions and workflows as the Sanity Studio Claude Assistant tool.

### Use Cases

- **Slack Integration**: Allow team members to create/edit Sanity content via Slack commands
- **Automation Workflows**: Trigger content creation from Zapier, Make, or custom scripts
- **CI/CD Pipelines**: Automatically generate content during deployments
- **Custom Dashboards**: Build external tools that leverage your Claude instructions

### Endpoint

```
POST /api/claude/remote
```

### Authentication

Requires a secret token in the `Authorization` header:

```bash
Authorization: Bearer your-secret-key
```

The secret is configured via the `CLAUDE_REMOTE_API_SECRET` environment variable. Uses timing-safe comparison to prevent timing attacks.

### Required Environment Variables

```bash
# Required
ANTHROPIC_API_KEY="sk-ant-..."           # Anthropic API key
CLAUDE_REMOTE_API_SECRET="your-secret"   # Secret for authenticating remote requests
SANITY_API_TOKEN="sk..."                 # Sanity API token with write access
SANITY_PROJECT_ID="your-project-id"      # Sanity project ID

# Optional
SANITY_DATASET="production"              # Dataset (defaults to "production")
SANITY_STUDIO_URL="https://..."          # Studio URL for generating document links
ALLOWED_CORS_ORIGINS="https://..."       # Comma-separated allowed CORS origins
```

### Request Format

```typescript
interface RemoteClaudeRequest {
  // Required
  message: string                    // The natural language request (max 50,000 chars)

  // Optional
  workflow?: string                  // Workflow name or ID to apply
  includeInstructions?: Array<       // Categories of instructions to include
    'writing' | 'design' | 'technical'
  >
  context?: {
    documents?: string[]             // Document IDs to include as context (max 20)
    additionalContext?: string       // Extra context text
  }
  conversationHistory?: Array<{      // Previous messages for multi-turn (max 50)
    role: 'user' | 'assistant'
    content: string
  }>
  dryRun?: boolean                   // If true, parse actions but don't execute
  model?: string                     // Override model (default: claude-sonnet-4-20250514)
  maxTokens?: number                 // Override max tokens (default: 4096)
  temperature?: number               // Override temperature (default: 0.7)
}
```

### Response Format

```typescript
interface RemoteClaudeResponse {
  success: boolean
  response: string                   // Claude's text response (actions stripped)
  error?: string                     // Error message if success is false

  // Action execution results
  actions: Array<{
    action: {
      id: string
      type: 'create' | 'update' | 'delete' | 'query'
      description: string
      status: 'completed' | 'failed' | 'pending'
      payload: object
      error?: string
    }
    result: {
      success: boolean
      message: string
      documentId?: string
      data?: unknown
    }
    dryRun: boolean
  }>

  // Summary of changes
  summary: {
    totalActions: number
    successfulActions: number
    failedActions: number
    createdDocuments: string[]
    updatedDocuments: string[]
    deletedDocuments: string[]
  }

  // Links to view/edit affected documents
  studioLinks?: Array<{
    documentId: string
    documentType: string
    structureUrl: string
    presentationUrl?: string
  }>

  // What was applied
  appliedWorkflow?: { id: string; name: string }
  includedInstructions: Array<'writing' | 'design' | 'technical'>

  // Metadata
  metadata: {
    processingTime: number           // Total time in milliseconds
    model: string                    // Model used
    dryRun: boolean
  }
}
```

### Example Usage

#### Basic Request

```bash
curl -X POST https://your-site.com/api/claude/remote \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a landing page for our Q1 campaign with a hero section and CTA"
  }'
```

#### With Workflow

```bash
curl -X POST https://your-site.com/api/claude/remote \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a product announcement page",
    "workflow": "landing-page-workflow",
    "includeInstructions": ["writing", "design"]
  }'
```

#### Dry Run (Preview Actions)

```bash
curl -X POST https://your-site.com/api/claude/remote \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Delete all draft blog posts from December",
    "dryRun": true
  }'
```

#### Multi-Turn Conversation

```bash
curl -X POST https://your-site.com/api/claude/remote \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add a testimonials section below the hero",
    "conversationHistory": [
      {
        "role": "user",
        "content": "Create a landing page for our Q1 campaign"
      },
      {
        "role": "assistant",
        "content": "I created the landing page with a hero section..."
      }
    ],
    "context": {
      "documents": ["drafts.landing-page-q1-2025"]
    }
  }'
```

### Example Response

```json
{
  "success": true,
  "response": "I've created a new landing page for your Q1 campaign with a hero section featuring a headline, subheading, and call-to-action button. The page is saved as a draft so you can review it before publishing.",
  "actions": [
    {
      "action": {
        "id": "action_1706547200000_abc123",
        "type": "create",
        "description": "Create Q1 Campaign landing page with hero section",
        "status": "completed",
        "payload": {
          "documentType": "page",
          "fields": { "name": "Q1 Campaign", "slug": { "current": "q1-campaign" } }
        }
      },
      "result": {
        "success": true,
        "message": "Created document drafts.q1-campaign-2025",
        "documentId": "drafts.q1-campaign-2025"
      },
      "dryRun": false
    }
  ],
  "summary": {
    "totalActions": 1,
    "successfulActions": 1,
    "failedActions": 0,
    "createdDocuments": ["drafts.q1-campaign-2025"],
    "updatedDocuments": [],
    "deletedDocuments": []
  },
  "studioLinks": [
    {
      "documentId": "drafts.q1-campaign-2025",
      "documentType": "page",
      "structureUrl": "https://your-studio.sanity.studio/structure/page;drafts.q1-campaign-2025",
      "presentationUrl": "https://your-studio.sanity.studio/presentation?preview=/q1-campaign-2025"
    }
  ],
  "includedInstructions": ["writing", "design", "technical"],
  "metadata": {
    "processingTime": 3420,
    "model": "claude-sonnet-4-20250514",
    "dryRun": false
  }
}
```

### Security Features

1. **Timing-Safe Authentication**: Uses `crypto.timingSafeEqual` with SHA256 hashing to prevent timing attacks
2. **Input Size Limits**:
   - Message: 50,000 characters max
   - Conversation history: 50 messages max
   - Context documents: 20 documents max
3. **Query Validation**: GROQ queries are validated against dangerous patterns
4. **Configurable CORS**: Set `ALLOWED_CORS_ORIGINS` to restrict which domains can call the API

### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid JSON | Request body is not valid JSON |
| 400 | message required | Missing required `message` field |
| 401 | Missing Authorization | No Authorization header provided |
| 401 | Invalid API secret | Token doesn't match configured secret |
| 404 | Workflow not found | Specified workflow doesn't exist or is inactive |
| 429 | Rate limit exceeded | Anthropic API rate limit reached |
| 500 | ANTHROPIC_API_KEY not configured | Server missing required config |
| 500 | SANITY_API_TOKEN not configured | Server missing required config |

### File Location

```
frontend/app/api/claude/remote/
├── route.ts              # Main API endpoint
├── types.ts              # TypeScript interfaces
├── sanity-loader.ts      # Load instructions, workflows from Sanity
├── prompt-builder.ts     # Build system prompt with categories
├── action-parser.ts      # Parse action blocks from Claude response
└── content-operations.ts # Execute Sanity CRUD operations
```

---

## Conversation Persistence

### Recommended Approach: Sanity Documents

Store conversations as Sanity documents for maximum scalability and cross-device access.

### Schema

```typescript
// schemas/claudeConversation.ts
export default {
  name: 'claudeConversation',
  title: 'Claude Conversation',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Auto-generated from first message or user-editable',
    },
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'sanity.user' }], // Built-in user reference
      description: 'The user who owns this conversation',
      readOnly: true,
    },
    {
      name: 'userId',
      title: 'User ID',
      type: 'string',
      description: 'Fallback user identifier',
      readOnly: true,
      hidden: true,
    },
    {
      name: 'messages',
      title: 'Messages',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'message',
          fields: [
            {
              name: 'role',
              type: 'string',
              options: {
                list: ['user', 'assistant'],
              },
            },
            {
              name: 'content',
              type: 'text',
            },
            {
              name: 'timestamp',
              type: 'datetime',
            },
            {
              name: 'actions',
              title: 'Actions Taken',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'type', type: 'string' }, // create, update, delete, query
                    { name: 'documentId', type: 'string' },
                    { name: 'documentType', type: 'string' },
                    { name: 'status', type: 'string' }, // success, error, pending
                    { name: 'error', type: 'string' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'lastActivity',
      title: 'Last Activity',
      type: 'datetime',
      readOnly: true,
    },
    {
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      initialValue: false,
    },
  ],
  orderings: [
    {
      title: 'Last Activity',
      name: 'lastActivityDesc',
      by: [{ field: 'lastActivity', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      lastActivity: 'lastActivity',
    },
    prepare({ title, lastActivity }) {
      return {
        title: title || 'Untitled conversation',
        subtitle: lastActivity 
          ? new Date(lastActivity).toLocaleDateString() 
          : 'No activity',
      }
    },
  },
}
```

### Access Control

Conversations are private to each user. Use GROQ filters and document-level permissions:

```typescript
// In your conversation list query
const userConversations = await client.fetch(
  `*[_type == "claudeConversation" && userId == $userId] | order(lastActivity desc)`,
  { userId: currentUser.id }
)
```

For stricter enforcement, use Sanity's access control:

```typescript
// sanity.config.ts - document-level access
export default defineConfig({
  // ...
  document: {
    // Prevent users from seeing other users' conversations in Structure tool
    productionUrl: async (prev, context) => {
      // Custom logic
    },
  },
})
```

Or hide conversations from the Structure tool entirely and only access via the Claude tool:

```typescript
// In your structure configuration
structureTool({
  structure: (S) =>
    S.list()
      .title('Content')
      .items([
        // Explicitly list your document types, excluding claudeConversation
        S.documentTypeListItem('page'),
        S.documentTypeListItem('post'),
        // ... other types
        // claudeConversation is NOT listed here
      ]),
})
```

### UI: Conversation Sidebar

```
┌──────────────────────────────────────────────────────────────────────┐
│  Claude                                                    [⚙ Settings] │
├────────────────┬─────────────────────────────────────────────────────┤
│                │                                                      │
│  [+ New Chat]  │           [Claude Logo/Icon]                        │
│                │                                                      │
│  Today         │        How can I help you today?                    │
│  ├─ Homepage   │                                                      │
│  │  updates    │   ┌─────────────┐  ┌─────────────┐                  │
│  └─ Q1 landing │   │ Create a    │  │ Find        │                  │
│     page       │   │ page        │  │ content     │                  │
│                │   └─────────────┘  └─────────────┘                  │
│  Yesterday     │                                                      │
│  ├─ Blog post  │                                                      │
│  │  help       │                                                      │
│  └─ Team page  │                                                      │
│                │                                                      │
│  Last 7 days   │                                                      │
│  └─ ...        │  ┌──────────────────────────────────────────────┐   │
│                │  │ Message Claude...                        [➤] │   │
│  [Archive ▾]   │  └──────────────────────────────────────────────┘   │
│                │                                                      │
└────────────────┴─────────────────────────────────────────────────────┘
```

### Conversation Hook

```typescript
// hooks/useConversations.ts
import { useClient, useCurrentUser } from 'sanity'
import { useState, useEffect, useCallback } from 'react'

interface Conversation {
  _id: string
  title: string
  lastActivity: string
  messages: Message[]
}

export function useConversations() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const currentUser = useCurrentUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user's conversations
  useEffect(() => {
    if (!currentUser?.id) return

    const query = `*[_type == "claudeConversation" && userId == $userId && !archived] | order(lastActivity desc) {
      _id,
      title,
      lastActivity,
      "messageCount": count(messages)
    }`

    client.fetch(query, { userId: currentUser.id }).then((results) => {
      setConversations(results)
      setIsLoading(false)
    })

    // Subscribe to real-time updates
    const subscription = client
      .listen(query, { userId: currentUser.id })
      .subscribe((update) => {
        // Handle real-time updates
      })

    return () => subscription.unsubscribe()
  }, [client, currentUser?.id])

  // Create new conversation
  const createConversation = useCallback(async () => {
    const newConversation = await client.create({
      _type: 'claudeConversation',
      userId: currentUser?.id,
      title: 'New conversation',
      messages: [],
      lastActivity: new Date().toISOString(),
      archived: false,
    })
    setActiveConversation(newConversation)
    return newConversation
  }, [client, currentUser?.id])

  // Add message to conversation
  const addMessage = useCallback(
    async (conversationId: string, message: Message) => {
      await client
        .patch(conversationId)
        .setIfMissing({ messages: [] })
        .append('messages', [message])
        .set({ lastActivity: new Date().toISOString() })
        .commit()
    },
    [client]
  )

  // Load full conversation
  const loadConversation = useCallback(
    async (conversationId: string) => {
      const conversation = await client.fetch(
        `*[_type == "claudeConversation" && _id == $id][0]`,
        { id: conversationId }
      )
      setActiveConversation(conversation)
      return conversation
    },
    [client]
  )

  // Archive conversation
  const archiveConversation = useCallback(
    async (conversationId: string) => {
      await client.patch(conversationId).set({ archived: true }).commit()
    },
    [client]
  )

  // Auto-generate title from first message
  const updateTitleFromContent = useCallback(
    async (conversationId: string, firstMessage: string) => {
      // Truncate to first ~50 chars or first sentence
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
      await client.patch(conversationId).set({ title }).commit()
    },
    [client]
  )

  // Generate title using Claude (called after first assistant response)
  const generateTitleWithClaude = useCallback(
    async (conversationId: string, userMessage: string, assistantResponse: string) => {
      try {
        const response = await fetch('/api/claude/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage,
            assistantResponse,
          }),
        })
        
        const { title } = await response.json()
        
        if (title) {
          await client.patch(conversationId).set({ title }).commit()
        }
      } catch (error) {
        // Fallback to simple truncation if title generation fails
        const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
        await client.patch(conversationId).set({ title: fallbackTitle }).commit()
      }
    },
    [client]
  )

  return {
    conversations,
    activeConversation,
    isLoading,
    createConversation,
    loadConversation,
    addMessage,
    archiveConversation,
    updateTitleFromContent,
    setActiveConversation,
  }
}
```

### Performance Considerations

1. **Lazy load messages** — For long conversations, only load the last N messages initially:
   ```groq
   *[_type == "claudeConversation" && _id == $id][0] {
     ...,
     "messages": messages[-50..] // Last 50 messages
   }
   ```

2. **Pagination** — For conversation list, paginate:
   ```groq
   *[_type == "claudeConversation" && userId == $userId] | order(lastActivity desc) [0...20]
   ```

3. **Indexing** — The `userId` and `lastActivity` fields will be automatically indexed by Sanity

4. **Archiving** — Encourage users to archive old conversations to keep the active list fast

5. **Message batching** — When streaming responses, batch message updates to avoid excessive writes:
   ```typescript
   // Debounce message updates during streaming
   const debouncedUpdate = useDebouncedCallback(
     (content) => addMessage(conversationId, { role: 'assistant', content }),
     500
   )
   ```

---

## Instructions Management

### Approach: Sanity Documents with Role-Based Access

Store instructions as Sanity documents, editable only by designated roles (e.g., administrators).

### Schema

```typescript
// schemas/claudeInstructions.ts
export default {
  name: 'claudeInstructions',
  title: 'Claude Instructions',
  type: 'document',
  // Singleton pattern - only one instructions document
  __experimental_singleton: true,
  groups: [
    { name: 'writing', title: 'Writing Guidelines' },
    { name: 'design', title: 'Design System' },
    { name: 'technical', title: 'Technical Constraints' },
    { name: 'examples', title: 'Examples' },
  ],
  fields: [
    // Writing Guidelines
    {
      name: 'writingGuidelines',
      title: 'Writing Guidelines',
      type: 'text',
      group: 'writing',
      rows: 10,
      description: 'Rules for tone, voice, style, and content standards',
    },
    {
      name: 'brandVoice',
      title: 'Brand Voice',
      type: 'text',
      group: 'writing',
      rows: 5,
      description: 'Description of the brand voice and personality',
    },
    {
      name: 'forbiddenTerms',
      title: 'Forbidden Terms',
      type: 'array',
      group: 'writing',
      of: [{ type: 'string' }],
      description: 'Words or phrases that should never be used',
    },
    {
      name: 'preferredTerms',
      title: 'Preferred Terms',
      type: 'array',
      group: 'writing',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'avoid', type: 'string', title: 'Avoid' },
            { name: 'useInstead', type: 'string', title: 'Use Instead' },
          ],
          preview: {
            select: { avoid: 'avoid', useInstead: 'useInstead' },
            prepare: ({ avoid, useInstead }) => ({
              title: `"${avoid}" → "${useInstead}"`,
            }),
          },
        },
      ],
    },

    // Design System Rules
    {
      name: 'designSystemRules',
      title: 'Design System Rules',
      type: 'text',
      group: 'design',
      rows: 10,
      description: 'Component usage guidelines and layout rules',
    },
    {
      name: 'componentGuidelines',
      title: 'Component Guidelines',
      type: 'array',
      group: 'design',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'component', type: 'string', title: 'Component Name' },
            { name: 'guidelines', type: 'text', title: 'Usage Guidelines' },
            { name: 'doNot', type: 'text', title: 'What to Avoid' },
          ],
        },
      ],
    },

    // Technical Constraints
    {
      name: 'technicalConstraints',
      title: 'Technical Constraints',
      type: 'text',
      group: 'technical',
      rows: 10,
      description: 'Nesting limits, required fields, performance guidelines',
    },
    {
      name: 'maxNestingDepth',
      title: 'Maximum Nesting Depth',
      type: 'number',
      group: 'technical',
      initialValue: 12,
      description: 'Maximum levels of component nesting (recommend 12, hard limit ~20)',
    },
    {
      name: 'requiredFields',
      title: 'Required Fields by Component',
      type: 'array',
      group: 'technical',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'component', type: 'string', title: 'Component Type' },
            { 
              name: 'fields', 
              type: 'array', 
              of: [{ type: 'string' }],
              title: 'Required Fields',
            },
          ],
        },
      ],
    },

    // Examples
    {
      name: 'examplePrompts',
      title: 'Example Prompts & Responses',
      type: 'array',
      group: 'examples',
      description: 'Help Claude understand expected behavior through examples',
      of: [
        {
          type: 'object',
          fields: [
            { 
              name: 'category', 
              type: 'string',
              options: {
                list: [
                  'Page Creation',
                  'Content Updates',
                  'Finding Content',
                  'Style/Formatting',
                  'Error Handling',
                ],
              },
            },
            { name: 'userPrompt', type: 'text', title: 'User Prompt' },
            { name: 'idealResponse', type: 'text', title: 'Ideal Response' },
            { name: 'notes', type: 'text', title: 'Notes for Claude' },
          ],
        },
      ],
    },
  ],
}
```

### Access Control: Hidden from Structure, Role-Gated in Settings

The instructions document is:
1. **Hidden from the Structure tool** — users can't browse to it directly
2. **Hidden from "Create new" menu** — prevents accidental duplicates
3. **Accessible only via Claude tool's Settings panel** — with role-based editing

#### Step 1: Hide from Structure Tool

```typescript
// structure.ts (or wherever you define your desk structure)
import { structureTool } from 'sanity/structure'

export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      // Filter out claudeInstructions and claudeConversation from the list
      ...S.documentTypeListItems().filter(
        (item) => !['claudeInstructions', 'claudeConversation'].includes(item.getId())
      ),
    ])
```

#### Step 2: Hide from "Create New" Menu

```typescript
// sanity.config.ts
export default defineConfig({
  // ...other config
  document: {
    // Hide from global "Create new" menu
    newDocumentOptions: (prev, { creationContext }) => {
      // Filter out internal Claude documents
      return prev.filter(
        (templateItem) => 
          !['claudeInstructions', 'claudeConversation'].includes(templateItem.templateId)
      )
    },
  },
})
```

#### Step 3: Settings Panel with Role Check

The Settings panel is accessible from within the Claude tool. It checks the user's role to determine edit access:

```typescript
// components/SettingsPanel.tsx
import { useCurrentUser, useClient } from 'sanity'
import { 
  Card, 
  Stack, 
  Text, 
  Button, 
  TextArea, 
  TextInput,
  Spinner,
  Dialog,
  Box,
  Flex,
  Tab,
  TabList,
  TabPanel,
} from '@sanity/ui'
import { useState, useEffect, useCallback } from 'react'
import { CogIcon, EditIcon, LockIcon } from '@sanity/icons'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const currentUser = useCurrentUser()
  const client = useClient({ apiVersion: '2024-01-01' })
  const [instructions, setInstructions] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('writing')
  
  // Define which roles can edit instructions
  const ADMIN_ROLES = ['administrator']
  
  const isAdmin = currentUser?.roles?.some(
    (role) => ADMIN_ROLES.includes(role.name)
  )

  // Fetch instructions
  useEffect(() => {
    client
      .fetch(`*[_type == "claudeInstructions"][0]`)
      .then((result) => {
        if (result) {
          setInstructions(result)
        } else {
          // Create the singleton if it doesn't exist (admin only)
          if (isAdmin) {
            createDefaultInstructions()
          }
        }
      })
      .finally(() => setIsLoading(false))
  }, [client, isAdmin])

  const createDefaultInstructions = async () => {
    const newDoc = await client.create({
      _type: 'claudeInstructions',
      writingGuidelines: '',
      brandVoice: '',
      designSystemRules: '',
      technicalConstraints: '',
      maxNestingDepth: 12,
      forbiddenTerms: [],
      preferredTerms: [],
      componentGuidelines: [],
      requiredFields: [],
      examplePrompts: [],
    })
    setInstructions(newDoc)
  }

  const handleSave = useCallback(async (field: string, value: any) => {
    if (!instructions?._id || !isAdmin) return
    
    setIsSaving(true)
    try {
      await client
        .patch(instructions._id)
        .set({ [field]: value })
        .commit()
      
      setInstructions((prev) => ({ ...prev, [field]: value }))
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }, [client, instructions?._id, isAdmin])

  if (isLoading) {
    return (
      <Dialog header="Settings" onClose={onClose} id="settings-dialog" width={2}>
        <Box padding={4}>
          <Flex align="center" justify="center" padding={6}>
            <Spinner muted />
          </Flex>
        </Box>
      </Dialog>
    )
  }

  return (
    <Dialog 
      header={
        <Flex align="center" gap={2}>
          <CogIcon />
          <Text weight="semibold">Claude Instructions</Text>
          {!isAdmin && <LockIcon />}
        </Flex>
      } 
      onClose={onClose} 
      id="settings-dialog" 
      width={2}
    >
      <Box padding={4}>
        <Stack space={4}>
          {/* Role indicator */}
          {!isAdmin && (
            <Card padding={3} tone="caution" radius={2}>
              <Text size={1}>
                You have read-only access. Contact an administrator to modify these settings.
              </Text>
            </Card>
          )}

          {/* Tab navigation */}
          <TabList space={2}>
            <Tab
              aria-controls="writing-panel"
              selected={activeTab === 'writing'}
              onClick={() => setActiveTab('writing')}
              label="Writing"
            />
            <Tab
              aria-controls="design-panel"
              selected={activeTab === 'design'}
              onClick={() => setActiveTab('design')}
              label="Design"
            />
            <Tab
              aria-controls="technical-panel"
              selected={activeTab === 'technical'}
              onClick={() => setActiveTab('technical')}
              label="Technical"
            />
            <Tab
              aria-controls="examples-panel"
              selected={activeTab === 'examples'}
              onClick={() => setActiveTab('examples')}
              label="Examples"
            />
          </TabList>

          {/* Writing Guidelines Tab */}
          <TabPanel
            aria-labelledby="writing-tab"
            hidden={activeTab !== 'writing'}
            id="writing-panel"
          >
            <Stack space={4}>
              <InstructionField
                label="Writing Guidelines"
                description="Rules for tone, voice, style, and content standards"
                value={instructions?.writingGuidelines || ''}
                onChange={(value) => handleSave('writingGuidelines', value)}
                readOnly={!isAdmin}
                multiline
              />
              <InstructionField
                label="Brand Voice"
                description="Description of the brand voice and personality"
                value={instructions?.brandVoice || ''}
                onChange={(value) => handleSave('brandVoice', value)}
                readOnly={!isAdmin}
                multiline
              />
            </Stack>
          </TabPanel>

          {/* Design Tab */}
          <TabPanel
            aria-labelledby="design-tab"
            hidden={activeTab !== 'design'}
            id="design-panel"
          >
            <Stack space={4}>
              <InstructionField
                label="Design System Rules"
                description="Component usage guidelines and layout rules"
                value={instructions?.designSystemRules || ''}
                onChange={(value) => handleSave('designSystemRules', value)}
                readOnly={!isAdmin}
                multiline
              />
            </Stack>
          </TabPanel>

          {/* Technical Tab */}
          <TabPanel
            aria-labelledby="technical-tab"
            hidden={activeTab !== 'technical'}
            id="technical-panel"
          >
            <Stack space={4}>
              <InstructionField
                label="Technical Constraints"
                description="Nesting limits, required fields, performance guidelines"
                value={instructions?.technicalConstraints || ''}
                onChange={(value) => handleSave('technicalConstraints', value)}
                readOnly={!isAdmin}
                multiline
              />
              <InstructionField
                label="Maximum Nesting Depth"
                description="Maximum levels of component nesting (recommend 12)"
                value={instructions?.maxNestingDepth?.toString() || '12'}
                onChange={(value) => handleSave('maxNestingDepth', parseInt(value) || 12)}
                readOnly={!isAdmin}
                type="number"
              />
            </Stack>
          </TabPanel>

          {/* Examples Tab */}
          <TabPanel
            aria-labelledby="examples-tab"
            hidden={activeTab !== 'examples'}
            id="examples-panel"
          >
            <Stack space={4}>
              <Text size={1} muted>
                Example prompts help Claude understand expected behavior.
              </Text>
              {/* Example prompts would be managed here - simplified for spec */}
              <Card padding={3} tone="transparent" border>
                <Text size={1}>
                  {instructions?.examplePrompts?.length || 0} examples configured
                </Text>
              </Card>
              {isAdmin && (
                <Button text="Manage Examples" mode="ghost" icon={EditIcon} />
              )}
            </Stack>
          </TabPanel>

          {/* Save indicator */}
          {isSaving && (
            <Flex align="center" gap={2}>
              <Spinner muted />
              <Text size={1} muted>Saving...</Text>
            </Flex>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}

// Reusable field component
interface InstructionFieldProps {
  label: string
  description: string
  value: string
  onChange: (value: string) => void
  readOnly: boolean
  multiline?: boolean
  type?: 'text' | 'number'
}

function InstructionField({ 
  label, 
  description, 
  value, 
  onChange, 
  readOnly, 
  multiline,
  type = 'text',
}: InstructionFieldProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isDirty, setIsDirty] = useState(false)

  // Debounced save
  useEffect(() => {
    if (!isDirty) return
    const timeout = setTimeout(() => {
      onChange(localValue)
      setIsDirty(false)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [localValue, isDirty, onChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalValue(e.target.value)
    setIsDirty(true)
  }

  return (
    <Stack space={2}>
      <Text size={1} weight="semibold">{label}</Text>
      <Text size={0} muted>{description}</Text>
      {multiline ? (
        <TextArea
          value={localValue}
          onChange={handleChange}
          readOnly={readOnly}
          rows={6}
          style={{ 
            opacity: readOnly ? 0.7 : 1,
            cursor: readOnly ? 'not-allowed' : 'text',
          }}
        />
      ) : (
        <TextInput
          value={localValue}
          onChange={handleChange}
          readOnly={readOnly}
          type={type}
          style={{ 
            opacity: readOnly ? 0.7 : 1,
            cursor: readOnly ? 'not-allowed' : 'text',
          }}
        />
      )}
    </Stack>
  )
}
```

#### Configuring Admin Roles

The `ADMIN_ROLES` array determines who can edit. Currently set to:

```typescript
const ADMIN_ROLES = ['administrator']
```

To find your role names, check your project at `sanity.io/manage` under **Members** → **Roles**, or use:

```typescript
// Log current user's roles to console
console.log(currentUser?.roles?.map(r => r.name))
```

### Fetching Instructions for Claude

```typescript
// lib/instructions.ts
import { SanityClient } from '@sanity/client'

export async function getInstructions(client: SanityClient): Promise<string> {
  const instructions = await client.fetch(`*[_type == "claudeInstructions"][0] {
    writingGuidelines,
    brandVoice,
    forbiddenTerms,
    preferredTerms,
    designSystemRules,
    componentGuidelines,
    technicalConstraints,
    maxNestingDepth,
    requiredFields,
    examplePrompts
  }`)

  if (!instructions) {
    return getDefaultInstructions()
  }

  return formatInstructionsForClaude(instructions)
}

function formatInstructionsForClaude(instructions: any): string {
  return `
## Writing Guidelines
${instructions.writingGuidelines || 'No specific guidelines set.'}

### Brand Voice
${instructions.brandVoice || 'No brand voice defined.'}

### Forbidden Terms
${instructions.forbiddenTerms?.length 
  ? instructions.forbiddenTerms.map(t => `- Never use: "${t}"`).join('\n')
  : 'No forbidden terms.'}

### Preferred Terms
${instructions.preferredTerms?.length
  ? instructions.preferredTerms.map(t => `- Instead of "${t.avoid}", use "${t.useInstead}"`).join('\n')
  : 'No term preferences.'}

## Design System Rules
${instructions.designSystemRules || 'No design rules set.'}

### Component Guidelines
${instructions.componentGuidelines?.length
  ? instructions.componentGuidelines.map(c => `
**${c.component}**
- Guidelines: ${c.guidelines}
- Avoid: ${c.doNot}
`).join('\n')
  : 'No component-specific guidelines.'}

## Technical Constraints
${instructions.technicalConstraints || 'No technical constraints set.'}

- Maximum nesting depth: ${instructions.maxNestingDepth || 12} levels
- Build pages incrementally to avoid depth limits

### Required Fields
${instructions.requiredFields?.length
  ? instructions.requiredFields.map(r => `- ${r.component}: ${r.fields.join(', ')}`).join('\n')
  : 'Follow schema validation rules.'}

## Examples
${instructions.examplePrompts?.length
  ? instructions.examplePrompts.map(ex => `
### Example: ${ex.category}
**User:** ${ex.userPrompt}
**Expected Response:** ${ex.idealResponse}
${ex.notes ? `**Notes:** ${ex.notes}` : ''}
`).join('\n')
  : 'No examples provided.'}
`
}

function getDefaultInstructions(): string {
  return `
## Default Guidelines
- Use clear, concise language
- Follow the schema structure
- Build pages incrementally
- Maximum nesting depth: 12 levels
`
}
```

---

## Content Operations

### Handling the Nesting Depth Issue

The tool should build pages incrementally:

```typescript
// lib/operations.ts

export async function createPageIncrementally(
  client: SanityClient,
  pageStructure: PageStructure
) {
  // Step 1: Create the base page document
  const page = await client.create({
    _type: 'page',
    title: pageStructure.title,
    slug: { current: pageStructure.slug },
    sections: [], // Start empty
  })

  // Step 2: Add sections one at a time
  for (const section of pageStructure.sections) {
    await client
      .patch(page._id)
      .setIfMissing({ sections: [] })
      .append('sections', [buildSection(section)])
      .commit()
  }

  // Step 3: Add nested content to each section
  for (let i = 0; i < pageStructure.sections.length; i++) {
    const section = pageStructure.sections[i]
    if (section.children) {
      await addNestedContent(client, page._id, `sections[${i}]`, section.children)
    }
  }

  return page
}

async function addNestedContent(
  client: SanityClient,
  docId: string,
  path: string,
  children: Component[]
) {
  for (const child of children) {
    await client
      .patch(docId)
      .setIfMissing({ [`${path}.children`]: [] })
      .append(`${path}.children`, [buildComponent(child)])
      .commit()
    
    // Recursively add nested content
    if (child.children) {
      const newIndex = /* calculate index */
      await addNestedContent(client, docId, `${path}.children[${newIndex}]`, child.children)
    }
  }
}
```

### Operation Types

```typescript
// types.ts

export type ClaudeAction = 
  | CreateDocumentAction
  | UpdateDocumentAction
  | QueryAction
  | ExplainAction

export interface CreateDocumentAction {
  action: 'create'
  documentType: string
  data: Record<string, unknown>
  incremental?: boolean // For deep structures
}

export interface UpdateDocumentAction {
  action: 'update'
  documentId: string
  operations: PatchOperation[]
}

export interface QueryAction {
  action: 'query'
  groq: string
  params?: Record<string, unknown>
}

export interface ExplainAction {
  action: 'explain'
  message: string
}
```

---

## UI Components (Using Sanity UI)

### Available Sanity UI Components

Sanity UI provides these primitives you should use:

- **Layout:** `Box`, `Card`, `Container`, `Flex`, `Grid`, `Stack`, `Inline`
- **Typography:** `Text`, `Heading`, `Label`, `Code`
- **Forms:** `TextInput`, `TextArea`, `Button`, `Checkbox`, `Select`
- **Feedback:** `Spinner`, `Badge`, `Toast`, `Tooltip`
- **Overlay:** `Dialog`, `Popover`, `Menu`

### Example Chat Message Component

```typescript
// components/Message.tsx
import { Box, Card, Stack, Text, Avatar, Flex } from '@sanity/ui'
import { RobotIcon, UserIcon } from '@sanity/icons'

interface MessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  actions?: ActionResult[]
}

export function Message({ role, content, timestamp, actions }: MessageProps) {
  const isAssistant = role === 'assistant'
  
  return (
    <Card 
      padding={3} 
      radius={2}
      tone={isAssistant ? 'transparent' : 'primary'}
      border={!isAssistant}
    >
      <Flex gap={3}>
        <Box>
          <Avatar
            size={1}
            icon={isAssistant ? RobotIcon : UserIcon}
          />
        </Box>
        <Stack space={2} flex={1}>
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              {isAssistant ? 'Claude' : 'You'}
            </Text>
            {timestamp && (
              <Text size={0} muted>
                {timestamp}
              </Text>
            )}
          </Flex>
          <Text size={1}>{content}</Text>
          
          {actions?.map((action, i) => (
            <ActionResultCard key={i} action={action} />
          ))}
        </Stack>
      </Flex>
    </Card>
  )
}
```

### Quick Actions Grid

```typescript
// components/QuickActions.tsx
import { Grid, Card, Stack, Text, Box } from '@sanity/ui'
import { 
  DocumentIcon, 
  SearchIcon, 
  HelpCircleIcon,
  EditIcon,
  BookIcon 
} from '@sanity/icons'

const actions = [
  { icon: DocumentIcon, title: 'Create a page', prompt: 'Help me create a new page' },
  { icon: SearchIcon, title: 'Find content', prompt: 'Help me find ' },
  { icon: HelpCircleIcon, title: 'Ask a question', prompt: '' },
  { icon: EditIcon, title: 'Edit existing', prompt: 'Help me update ' },
  { icon: BookIcon, title: 'Review guidelines', prompt: 'Show me the writing guidelines' },
]

export function QuickActions({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <Grid columns={[2, 3, 3]} gap={3}>
      {actions.map((action) => (
        <Card
          key={action.title}
          as="button"
          padding={4}
          radius={2}
          tone="default"
          onClick={() => onSelect(action.prompt)}
          style={{ cursor: 'pointer' }}
        >
          <Stack space={3} align="center">
            <Text size={3}>
              <action.icon />
            </Text>
            <Text size={1} weight="medium" align="center">
              {action.title}
            </Text>
          </Stack>
        </Card>
      ))}
    </Grid>
  )
}
```

---

## Schema Context Extraction

To give Claude full awareness of your component system:

```typescript
// lib/schema-context.ts
import { Schema } from 'sanity'

export function extractSchemaContext(schema: Schema) {
  const types = schema._original?.types || []
  
  const relevantTypes = types.filter(type => 
    // Filter to your page builder types
    ['page', 'section', 'row', 'column', 'hero', 'card', /* etc */].includes(type.name) ||
    type.name.startsWith('component.')
  )

  return relevantTypes.map(type => ({
    name: type.name,
    title: type.title,
    description: type.description,
    fields: type.fields?.map(field => ({
      name: field.name,
      type: field.type,
      title: field.title,
      description: field.description,
      required: field.validation?.some(v => v._rules?.some(r => r.flag === 'presence')),
      options: field.options,
    })),
  }))
}
```

---

## Streaming Responses

### API Implementation

Use the Anthropic SDK's streaming capability:

```typescript
// app/api/claude/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  const { messages, schema, instructions } = await request.json()

  const systemPrompt = buildSystemPrompt(schema, instructions)

  // Return a streaming response
  const stream = await anthropic.messages.stream({
    model: 'claude-opus-4-5-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages,
  })

  // Convert to ReadableStream for Next.js
  const encoder = new TextEncoder()
  
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          )
        }
        
        if (event.type === 'message_stop') {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        }
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

### Frontend Hook

```typescript
// hooks/useClaudeChat.ts
import { useState, useCallback, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: ActionResult[]
  isStreaming?: boolean
}

export function useClaudeChat({ client, schema, apiEndpoint, conversationId, addMessage }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (userMessage: string) => {
    // Add user message
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    
    // Persist user message
    if (conversationId) {
      await addMessage(conversationId, userMsg)
    }

    // Create placeholder for assistant response
    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }
    setMessages(prev => [...prev, assistantMsg])
    setIsLoading(true)

    // Setup abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          schema: extractSchemaContext(schema),
          instructions: await getInstructions(client),
        }),
        signal: abortControllerRef.current.signal,
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.replace('data: ', '')
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            fullContent += parsed.text

            // Update the streaming message
            setMessages(prev => {
              const updated = [...prev]
              const lastIdx = updated.length - 1
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: fullContent,
              }
              return updated
            })
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // Finalize message
      const finalMsg: Message = {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date().toISOString(),
        isStreaming: false,
        actions: parseActionsFromResponse(fullContent),
      }

      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = finalMsg
        return updated
      })

      // Persist assistant message
      if (conversationId) {
        await addMessage(conversationId, finalMsg)
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1].content += '\n\n*[Response cancelled]*'
          updated[updated.length - 1].isStreaming = false
          return updated
        })
      } else {
        // Handle error
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: 'Sorry, there was an error processing your request.',
            isStreaming: false,
          }
          return updated
        })
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [messages, schema, client, apiEndpoint, conversationId, addMessage])

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return { messages, sendMessage, isLoading, cancelStream, setMessages }
}
```

### Streaming Message UI

```typescript
// components/Message.tsx
import { Box, Card, Stack, Text, Flex, Spinner } from '@sanity/ui'

export function Message({ role, content, isStreaming, actions }: MessageProps) {
  const isAssistant = role === 'assistant'
  
  return (
    <Card padding={3} radius={2} tone={isAssistant ? 'transparent' : 'primary'}>
      <Stack space={2}>
        <Flex align="center" gap={2}>
          <Text size={1} weight="semibold">
            {isAssistant ? 'Claude' : 'You'}
          </Text>
          {isStreaming && <Spinner size={1} />}
        </Flex>
        
        <Text size={1} style={{ whiteSpace: 'pre-wrap' }}>
          {content}
          {isStreaming && <span className="cursor-blink">▋</span>}
        </Text>

        {actions?.map((action, i) => (
          <ActionCard key={i} action={action} />
        ))}
      </Stack>
    </Card>
  )
}
```

---

## Action Confirmations & Preview Links

### Confirmation Flow for Destructive Actions

When Claude proposes a destructive action (delete, unpublish, bulk update), show a confirmation UI:

```typescript
// types.ts
export interface PendingAction {
  id: string
  type: 'create' | 'update' | 'delete' | 'publish' | 'unpublish'
  description: string
  documentId?: string
  documentType?: string
  data?: Record<string, unknown>
  isDestructive: boolean
}

export interface ActionResult {
  actionId: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'success' | 'error'
  documentId?: string
  documentType?: string
  error?: string
}
```

### Parsing Actions from Claude's Response

Claude should respond with structured action blocks:

```typescript
// lib/actions.ts

const ACTION_REGEX = /```action\n([\s\S]*?)\n```/g

export function parseActionsFromResponse(content: string): PendingAction[] {
  const actions: PendingAction[] = []
  let match

  while ((match = ACTION_REGEX.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      actions.push({
        id: crypto.randomUUID(),
        ...parsed,
        isDestructive: ['delete', 'unpublish'].includes(parsed.type),
      })
    } catch {
      // Skip malformed action blocks
    }
  }

  return actions
}
```

### Action Card Component

```typescript
// components/ActionCard.tsx
import { Card, Stack, Text, Flex, Button, Badge } from '@sanity/ui'
import { CheckmarkIcon, CloseIcon, LaunchIcon } from '@sanity/icons'
import { useState } from 'react'
import { useClient } from 'sanity'

interface ActionCardProps {
  action: PendingAction
  onExecute: (action: PendingAction) => Promise<ActionResult>
  onOpenPreview: (documentId: string, documentType: string) => void
}

export function ActionCard({ action, onExecute, onOpenPreview }: ActionCardProps) {
  const [status, setStatus] = useState<'pending' | 'executing' | 'success' | 'error' | 'cancelled'>(
    action.isDestructive ? 'pending' : 'executing'
  )
  const [result, setResult] = useState<ActionResult | null>(null)

  // Auto-execute non-destructive actions
  useEffect(() => {
    if (!action.isDestructive && status === 'executing') {
      executeAction()
    }
  }, [])

  const executeAction = async () => {
    setStatus('executing')
    try {
      const result = await onExecute(action)
      setResult(result)
      setStatus(result.status === 'success' ? 'success' : 'error')
    } catch (error) {
      setStatus('error')
      setResult({ actionId: action.id, status: 'error', error: error.message })
    }
  }

  const getTone = () => {
    switch (status) {
      case 'pending': return action.isDestructive ? 'caution' : 'primary'
      case 'executing': return 'primary'
      case 'success': return 'positive'
      case 'error': return 'critical'
      case 'cancelled': return 'default'
    }
  }

  return (
    <Card padding={3} radius={2} border tone={getTone()}>
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Badge tone={getTone()}>
              {action.type.toUpperCase()}
            </Badge>
            <Text size={1} weight="medium">
              {action.description}
            </Text>
          </Flex>
          
          {status === 'success' && (
            <Badge tone="positive">✓ Done</Badge>
          )}
        </Flex>

        {/* Destructive action confirmation */}
        {status === 'pending' && action.isDestructive && (
          <Flex gap={2}>
            <Button
              tone="critical"
              text="Confirm"
              icon={CheckmarkIcon}
              onClick={executeAction}
            />
            <Button
              mode="ghost"
              text="Cancel"
              icon={CloseIcon}
              onClick={() => setStatus('cancelled')}
            />
          </Flex>
        )}

        {/* Success state with preview link */}
        {status === 'success' && result?.documentId && (
          <Flex gap={2}>
            <Button
              mode="ghost"
              tone="primary"
              text="Open in Structure"
              icon={LaunchIcon}
              onClick={() => {
                // Navigate to document in Structure tool
                window.location.href = `/structure/${action.documentType};${result.documentId}`
              }}
            />
            <Button
              mode="ghost"
              tone="primary"
              text="Open Preview"
              icon={LaunchIcon}
              onClick={() => onOpenPreview(result.documentId, action.documentType)}
            />
          </Flex>
        )}

        {/* Error state */}
        {status === 'error' && (
          <Text size={1} tone="critical">
            Error: {result?.error || 'Unknown error'}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
```

### Opening Preview

Integrate with Sanity's Presentation tool:

```typescript
// hooks/usePreview.ts
import { useRouter } from 'sanity/router'

export function usePreview() {
  const router = useRouter()

  const openInPresentation = (documentId: string, documentType: string) => {
    // Navigate to Presentation tool with the document
    router.navigateIntent('edit', {
      id: documentId,
      type: documentType,
    })
    
    // Or open in a new tab with preview URL
    // This depends on your Presentation tool configuration
    const previewUrl = `/presentation?preview=/&id=${documentId}`
    window.open(previewUrl, '_blank')
  }

  const openInStructure = (documentId: string, documentType: string) => {
    router.navigateIntent('edit', {
      id: documentId,
      type: documentType,
    })
  }

  return { openInPresentation, openInStructure }
}
```

### System Prompt for Structured Actions

Update the system prompt to instruct Claude to output actions in a parseable format:

```typescript
function buildSystemPrompt(schema: object, instructions: string): string {
  return `You are an AI assistant embedded in Sanity Studio...

## Action Format

When you need to perform content operations, output them in action blocks:

\`\`\`action
{
  "type": "create",
  "documentType": "page",
  "description": "Create 'About Us' page with hero section",
  "data": {
    "title": "About Us",
    "slug": { "current": "about-us" },
    "sections": [...]
  }
}
\`\`\`

For destructive operations, always explain what will happen first:

\`\`\`action
{
  "type": "delete",
  "documentId": "abc123",
  "documentType": "page", 
  "description": "Delete the 'Old Landing Page' document"
}
\`\`\`

The user will see a confirmation button for destructive actions (delete, unpublish).

After successful creation or update, I'll provide links for the user to:
- View the document in Structure
- Open the page in Preview

## Response Style

1. Acknowledge the request
2. Explain what you'll do
3. Output action blocks
4. Wait for execution results
5. Confirm completion with links to view the result

${instructions}
`
}
```

---

## Security Considerations

1. **API Key Management** — Never expose the Anthropic API key to the client. All Claude API calls go through your backend route.

2. **User Context** — Include the current user's info in requests so Claude can respect permissions:
   ```typescript
   const user = useCurrentUser()
   // Send user.id and user.roles to backend
   ```

3. **Input Validation** — Validate all Sanity operations before executing:
   ```typescript
   // In your operation handler
   if (action.documentType && !allowedTypes.includes(action.documentType)) {
     throw new Error('Invalid document type')
   }
   ```

4. **Rate Limiting** — Consider implementing rate limits to prevent abuse (though less critical for internal tools)

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create plugin structure and file organization
- [ ] Basic chat UI with Sanity UI components
- [ ] API route setup with Anthropic SDK
- [ ] Simple message exchange (non-streaming)
- [ ] Tool registration in sanity.config.ts

### Phase 2: Streaming & Conversations
- [ ] Implement streaming responses
- [ ] Conversation schema and persistence
- [ ] Conversation sidebar UI
- [ ] New chat / load conversation / archive
- [ ] Auto-generate conversation titles

### Phase 3: Content Operations
- [ ] Schema context extraction
- [ ] Action parsing from Claude responses
- [ ] Document creation (non-nested first)
- [ ] GROQ query execution
- [ ] Basic content updates (patch)

### Phase 4: Page Builder Integration
- [ ] Incremental page creation for deep structures
- [ ] Handle nesting depth limits gracefully
- [ ] Component-aware prompting
- [ ] Action confirmation UI for destructive operations
- [ ] Preview/Structure links after operations

### Phase 5: Instructions System
- [ ] Instructions schema (singleton document)
- [ ] Settings panel UI in Claude tool
- [ ] Role-based access control (admin only editing)
- [ ] Fallback to default instructions
- [ ] Format instructions for Claude's system prompt

### Phase 6: Polish & UX
- [ ] Quick action cards on welcome screen
- [ ] Loading states and animations
- [ ] Error handling and recovery
- [ ] Conversation search/filter
- [ ] Keyboard shortcuts (Cmd+Enter to send, etc.)
- [ ] Mobile-responsive layout

---

## Implementation Guidance for Claude Code

### Recommended Sub-Agents

To ensure high-quality implementation, Claude Code should spawn specialized sub-agents for different concerns:

#### 1. Architecture Agent
**Responsibility:** Project structure, file organization, dependency management
- Set up the plugin folder structure
- Configure TypeScript paths and imports
- Ensure proper module boundaries
- Review for circular dependencies

#### 2. UI/Component Agent  
**Responsibility:** All React components using Sanity UI
- Build components using only `@sanity/ui` primitives
- Ensure consistent spacing, typography, and color usage
- Implement responsive layouts
- Handle loading, empty, and error states for every component

#### 3. API/Backend Agent
**Responsibility:** API routes, streaming, Anthropic integration
- Implement streaming SSE endpoint
- Handle authentication and error responses
- Manage API key security
- Implement request validation

#### 4. Data/Hooks Agent
**Responsibility:** All custom hooks, Sanity client operations, state management
- Implement GROQ queries with proper typing
- Handle real-time subscriptions
- Manage optimistic updates
- Implement pagination and lazy loading

#### 5. Testing Agent
**Responsibility:** Test coverage for all functionality
- Unit tests for utility functions and hooks
- Component tests with React Testing Library
- Integration tests for API routes
- E2E test scenarios (manual testing guide if no E2E framework)

#### 6. Accessibility Agent
**Responsibility:** WCAG 2.1 AA compliance
- Audit all components for a11y
- Ensure keyboard navigation works throughout
- Add proper ARIA labels and roles
- Test with screen reader announcements
- Verify focus management in dialogs and modals

#### 7. Performance Agent
**Responsibility:** Optimize for speed and efficiency
- Implement lazy loading for conversation messages
- Add pagination for conversation list
- Debounce/throttle where appropriate
- Memoize expensive computations
- Profile and optimize re-renders
- Ensure bundle size is reasonable

---

### Testing Requirements

#### Unit Tests
```typescript
// Example test structure
describe('useConversations', () => {
  it('fetches only current user conversations', async () => {})
  it('paginates results correctly', async () => {})
  it('handles empty state', async () => {})
  it('subscribes to real-time updates', async () => {})
})

describe('parseActionsFromResponse', () => {
  it('extracts action blocks from Claude response', () => {})
  it('handles malformed action blocks gracefully', () => {})
  it('identifies destructive actions correctly', () => {})
})

describe('buildSystemPrompt', () => {
  it('includes schema context', () => {})
  it('includes instructions', () => {})
  it('formats correctly for Claude', () => {})
})
```

#### Component Tests
```typescript
describe('Message', () => {
  it('renders user messages correctly', () => {})
  it('renders assistant messages with streaming indicator', () => {})
  it('displays action cards for completed actions', () => {})
  it('shows confirmation buttons for destructive actions', () => {})
})

describe('SettingsPanel', () => {
  it('shows read-only view for non-admin users', () => {})
  it('shows editable form for admin users', () => {})
  it('saves changes with debouncing', () => {})
})
```

#### Integration Tests
```typescript
describe('API: /api/claude', () => {
  it('streams response chunks correctly', async () => {})
  it('handles authentication errors', async () => {})
  it('validates request body', async () => {})
  it('includes proper CORS headers', async () => {})
})
```

#### Manual E2E Test Checklist
- [ ] Create new conversation
- [ ] Send message and receive streamed response
- [ ] Action block parsed and displayed correctly
- [ ] Destructive action shows confirmation
- [ ] Non-destructive action executes automatically
- [ ] "Open in Structure" link works
- [ ] "Open Preview" link works
- [ ] Switch between conversations
- [ ] Conversation persists after refresh
- [ ] Settings panel opens/closes
- [ ] Admin can edit instructions
- [ ] Non-admin sees read-only instructions
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces messages

---

### Accessibility Requirements

#### Keyboard Navigation
| Action | Shortcut |
|--------|----------|
| Send message | `Cmd/Ctrl + Enter` |
| New conversation | `Cmd/Ctrl + N` |
| Focus message input | `/` |
| Close dialog | `Escape` |
| Navigate conversation list | `Arrow Up/Down` |

#### ARIA Requirements
```typescript
// Chat container
<div role="log" aria-label="Conversation with Claude" aria-live="polite">

// Message list
<div role="list" aria-label="Messages">
  <div role="listitem" aria-label="Your message">...</div>
  <div role="listitem" aria-label="Claude's response">...</div>
</div>

// Action cards
<div role="alert" aria-live="assertive"> // For destructive action confirmations

// Loading states
<div aria-busy="true" aria-label="Claude is responding...">

// Conversation sidebar
<nav aria-label="Conversation history">
  <ul role="listbox" aria-label="Your conversations">
```

#### Focus Management
- When a new message is added, do NOT steal focus from input
- When opening Settings dialog, trap focus inside
- When closing dialog, return focus to trigger element
- When switching conversations, focus the message input
- Announce new messages to screen readers via `aria-live`

#### Color Contrast
- All text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Sanity UI components handle this by default, but verify custom styles

---

### Performance Requirements

#### Benchmarks
| Metric | Target |
|--------|--------|
| Initial load (conversation list) | < 500ms |
| Load conversation messages | < 300ms |
| Time to first streamed token | < 1s |
| Message input response | < 16ms (60fps) |
| Conversation switch | < 200ms |

#### Lazy Loading Strategy

```typescript
// Conversation list: paginate
const CONVERSATIONS_PER_PAGE = 20

const query = `*[_type == "claudeConversation" && userId == $userId && !archived] 
  | order(lastActivity desc) 
  [$start...$end] {
    _id,
    title,
    lastActivity,
    "messageCount": count(messages)
  }`

// Load more when scrolling near bottom
const loadMore = () => {
  setPage(prev => prev + 1)
}
```

```typescript
// Messages: load last N, with "load earlier" option
const MESSAGES_PER_PAGE = 50

// Initial load - last 50 messages
const query = `*[_type == "claudeConversation" && _id == $id][0] {
  _id,
  title,
  "messages": messages[-${MESSAGES_PER_PAGE}..]
}`

// Load earlier messages
const loadEarlierMessages = async (conversationId: string, beforeIndex: number) => {
  const start = Math.max(0, beforeIndex - MESSAGES_PER_PAGE)
  const end = beforeIndex
  
  const result = await client.fetch(
    `*[_type == "claudeConversation" && _id == $id][0].messages[$start...$end]`,
    { id: conversationId, start, end }
  )
  
  return result
}
```

#### Debouncing & Throttling

```typescript
// Settings auto-save: debounce 1000ms
const debouncedSave = useDebouncedCallback(
  (field, value) => saveInstruction(field, value),
  1000
)

// Streaming message updates: throttle to avoid excessive re-renders
const throttledSetContent = useThrottledCallback(
  (content) => setStreamingContent(content),
  50 // Update UI max 20 times per second
)

// Conversation list real-time updates: debounce to batch rapid changes
const debouncedRefresh = useDebouncedCallback(
  () => refetchConversations(),
  500
)
```

#### Memoization

```typescript
// Memoize expensive schema extraction
const schemaContext = useMemo(
  () => extractSchemaContext(schema),
  [schema]
)

// Memoize conversation grouping (Today, Yesterday, Last 7 days)
const groupedConversations = useMemo(
  () => groupConversationsByDate(conversations),
  [conversations]
)

// Memoize message rendering
const MessageMemo = memo(Message, (prev, next) => {
  return prev.content === next.content && 
         prev.isStreaming === next.isStreaming &&
         prev.actions?.length === next.actions?.length
})
```

#### Bundle Optimization
- Import only needed icons from `@sanity/icons`
- Use dynamic imports for Settings panel (not needed on initial load)
- Ensure no duplicate dependencies

```typescript
// Dynamic import for settings
const SettingsPanel = lazy(() => import('./components/SettingsPanel'))

// In component
<Suspense fallback={<Spinner />}>
  {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
</Suspense>
```

---

### Error Handling Strategy

#### User-Facing Errors
```typescript
type ErrorType = 
  | 'network'      // API unreachable
  | 'auth'         // Authentication failed
  | 'rate_limit'   // Too many requests
  | 'invalid_response' // Claude returned unparseable response
  | 'operation_failed' // Sanity operation failed
  | 'unknown'

const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'Unable to connect. Please check your internet connection.',
  auth: 'Your session has expired. Please refresh the page.',
  rate_limit: 'Too many requests. Please wait a moment.',
  invalid_response: 'Received an unexpected response. Please try again.',
  operation_failed: 'The operation could not be completed.',
  unknown: 'Something went wrong. Please try again.',
}
```

#### Error Recovery
- Network errors: Show retry button
- Auth errors: Prompt to refresh page
- Rate limit: Show countdown timer
- Invalid response: Allow user to regenerate response
- Operation failed: Show error details, allow retry

#### Logging
```typescript
// Log errors to console in development
// In production, consider sending to error tracking service
const logError = (error: Error, context: Record<string, unknown>) => {
  console.error('[Claude Assistant]', error.message, context)
  
  // Optional: Send to error tracking
  // errorTracker.capture(error, { extra: context })
}
```

---

## Design Decisions

| Question | Decision |
|----------|----------|
| Conversation persistence | Yes — store in Sanity documents |
| Destructive action confirmations | Yes — show confirmation buttons before executing |
| Preview integration | Yes — offer button to open in Presentation preview |
| Streaming responses | Yes — stream for better UX |
| Instructions management | Sanity documents with role-based access control |
| Hide from Structure | Yes — both `claudeConversation` and `claudeInstructions` |
| Lazy loading | Yes — paginate conversations (20), lazy load messages (50) |
| Claude model | `claude-opus-4-5-20250514` |
| Conversation titles | Claude-generated after first exchange |
| Delete conversations | Archive only (no permanent delete) |
| Conversation search | Title and date filter only (no full-text) |
| Schema access | Denylist — allow all types except system/internal |
| Admin roles | `administrator` role only |

---

## Configuration Notes for Claude Code

The following items need to be determined by inspecting the existing project:

### 1. Preview URL Pattern
**Action:** Check the Presentation tool configuration in `sanity.config.ts` to determine how preview URLs are constructed.

Look for:
```typescript
presentationTool({
  previewUrl: '...',
  // or
  resolve: {
    locations: {...}
  }
})
```

Ask the user to clarify if the pattern is not obvious from the code.

### 2. Backend Architecture
**Action:** Determine if the Studio is embedded in Next.js or standalone.

Check for:
- Is there a `/app` or `/pages` directory with API routes?
- Is the Studio at a sub-route like `/studio` or `/admin`?
- Is there a separate `studio/` folder with its own `package.json`?

**If embedded in Next.js:** Use `/app/api/claude/route.ts` for the API endpoint
**If standalone:** Use Sanity Functions or discuss alternative approaches with the user

### 3. Existing Schema Types
**Action:** Catalog all existing document types to build the denylist.

System types to automatically exclude:
- `claudeConversation` (this plugin)
- `claudeInstructions` (this plugin)  
- `sanity.imageAsset`
- `sanity.fileAsset`
- Any type starting with `sanity.`
- Any type starting with `system.`

Ask the user if there are additional internal types to exclude.

---

## Resources

- [Sanity Custom Studio Tools](https://www.sanity.io/docs/studio/custom-studio-tool)
- [Sanity UI Components](https://www.sanity.io/ui/docs)
- [Sanity UI Arcade (playground)](https://www.sanity.io/ui/arcade)
- [Sanity Icons](https://www.sanity.io/ui/docs/primitive/icon)
- [Studio React Hooks](https://www.sanity.io/docs/studio/studio-react-hooks)
- [Anthropic API Reference](https://docs.anthropic.com/en/api/getting-started)
