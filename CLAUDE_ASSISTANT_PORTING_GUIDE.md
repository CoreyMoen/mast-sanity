# Claude Assistant Plugin - Porting Guide

This guide explains how to extract the Claude Assistant plugin from this project and integrate it into another Next.js + Sanity Studio project.

---

## Overview

The Claude Assistant is a custom Sanity Studio plugin that provides an AI-powered content creation tool. It consists of:

1. **Sanity Studio Plugin** - The main tool UI with chat interface, conversation history, and document operations
2. **API Routes** - Next.js backend routes that proxy requests to the Anthropic API
3. **Schema Types** - Sanity document types for storing conversations and configuration

---

## Prerequisites

Your target project must have:
- **Sanity Studio v3** (v4.x recommended)
- **Next.js 13+** with App Router
- **React 18+** (React 19 recommended)
- A valid **Anthropic API key**

---

## Required Files

### 1. Studio Plugin Directory

Copy the entire plugin folder:

```
studio/src/plugins/claude-assistant/
├── index.ts                    # Plugin entry point & exports
├── ClaudeTool.tsx              # Main tool component
├── types.ts                    # TypeScript definitions
├── styles.css                  # Plugin styles
├── components/
│   ├── ChatInterface.tsx       # Main chat UI
│   ├── MessageList.tsx         # Message display
│   ├── MessageInput.tsx        # Input with image support
│   ├── Message.tsx             # Individual message
│   ├── ActionCard.tsx          # Action execution UI
│   ├── QuickActions.tsx        # Quick action buttons
│   ├── ConversationSidebar.tsx # Conversation history
│   ├── SettingsPanel.tsx       # Settings UI
│   ├── FloatingChat.tsx        # Floating chat overlay
│   ├── StudioLayout.tsx        # Studio layout wrapper
│   └── ImagePickerDialog.tsx   # Image selection dialog
├── hooks/
│   ├── useClaudeChat.ts        # Chat messaging & streaming
│   ├── useConversations.ts     # Conversation persistence
│   ├── useContentOperations.ts # Document CRUD operations
│   ├── useInstructions.ts      # Custom instructions
│   ├── useWorkflows.ts         # Workflow management
│   └── useKeyboardShortcuts.ts # Keyboard navigation
└── lib/
    ├── anthropic.ts            # Anthropic API wrapper
    ├── operations.ts           # Sanity document operations
    ├── actions.ts              # Action parsing & validation
    ├── instructions.ts         # System prompt building
    ├── schema-context.ts       # Schema extraction
    └── format-instructions.ts  # Instruction formatting
```

### 2. Schema Types

Copy these three schema files:

```
studio/src/schemaTypes/documents/
├── claudeConversation.ts   # Stores chat history
├── claudeInstructions.ts   # AI configuration (singleton)
└── claudeWorkflow.ts       # Workflow templates
```

### 3. API Routes

Copy the API routes to your Next.js frontend:

```
frontend/app/api/claude/
├── route.ts                # Main chat endpoint (streaming)
└── generate-title/
    └── route.ts            # Conversation title generation
```

---

## Installation Steps

### Step 1: Copy Plugin Files

```bash
# From your source project root
cp -r studio/src/plugins/claude-assistant YOUR_PROJECT/studio/src/plugins/

# Copy schema types
cp studio/src/schemaTypes/documents/claudeConversation.ts YOUR_PROJECT/studio/src/schemaTypes/documents/
cp studio/src/schemaTypes/documents/claudeInstructions.ts YOUR_PROJECT/studio/src/schemaTypes/documents/
cp studio/src/schemaTypes/documents/claudeWorkflow.ts YOUR_PROJECT/studio/src/schemaTypes/documents/

# Copy API routes
mkdir -p YOUR_PROJECT/frontend/app/api/claude/generate-title
cp frontend/app/api/claude/route.ts YOUR_PROJECT/frontend/app/api/claude/
cp frontend/app/api/claude/generate-title/route.ts YOUR_PROJECT/frontend/app/api/claude/generate-title/
```

### Step 2: Install Dependencies

**Studio dependencies** (`studio/package.json`):

```bash
cd YOUR_PROJECT/studio
npm install @sanity/icons @sanity/ui styled-components date-fns
```

**Frontend dependencies** (`frontend/package.json`):

```bash
cd YOUR_PROJECT/frontend
npm install @anthropic-ai/sdk
```

### Step 3: Register Schema Types

Add the Claude schema types to your `studio/src/schemaTypes/index.ts`:

```typescript
// Add imports
import {claudeConversation} from './documents/claudeConversation'
import {claudeInstructions} from './documents/claudeInstructions'
import {claudeWorkflow} from './documents/claudeWorkflow'

// Add to schemaTypes array
export const schemaTypes = [
  // ... your existing schemas
  claudeConversation,
  claudeInstructions,
  claudeWorkflow,
]
```

### Step 4: Configure Sanity Studio

Update your `studio/sanity.config.ts`:

```typescript
import {defineConfig} from 'sanity'
import {claudeAssistant, createStudioLayout} from './src/plugins/claude-assistant'

// Get the preview URL for API endpoint
const PREVIEW_URL = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000'

export default defineConfig({
  // ... your existing config

  plugins: [
    // ... your existing plugins

    // Add Claude Assistant as a tool
    claudeAssistant({
      apiEndpoint: `${PREVIEW_URL}/api/claude`,
    }),
  ],

  // OPTIONAL: Add floating chat accessible from all tools
  studio: {
    components: {
      layout: createStudioLayout({
        apiEndpoint: `${PREVIEW_URL}/api/claude`,
      }),
    },
  },

  // OPTIONAL: Hide Claude documents from "Create new" menu
  document: {
    newDocumentOptions: (prev, context) =>
      prev.filter((item) =>
        !['claudeConversation', 'claudeInstructions', 'claudeWorkflow'].includes(item.templateId)
      ),
  },
})
```

### Step 5: Set Up Environment Variables

**Frontend** (`.env.local` or `.env`):

```bash
# REQUIRED: Your Anthropic API key
# Get one at: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

**Studio** (`.env` or environment):

```bash
# URL where your Next.js frontend runs
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000
```

> **IMPORTANT:** Never commit your `ANTHROPIC_API_KEY` to version control. Add `.env.local` to your `.gitignore`.

---

## Configuration Options

### Plugin Options

```typescript
claudeAssistant({
  // Custom title in Studio navigation (default: 'Claude')
  title: 'AI Assistant',

  // API endpoint for chat requests (required)
  apiEndpoint: 'https://your-domain.com/api/claude',
})
```

### Floating Chat Options

```typescript
createStudioLayout({
  // API endpoint (required)
  apiEndpoint: 'https://your-domain.com/api/claude',
})
```

### Customizing the AI Models

Edit the API routes to change models:

**Main chat** (`frontend/app/api/claude/route.ts`):
```typescript
// Line 37 - Main chat model
const MODEL = 'claude-sonnet-4-20250514'  // Change to your preferred model

// Line 40 - Response length
const MAX_TOKENS = 4096  // Adjust as needed
```

**Title generation** (`frontend/app/api/claude/generate-title/route.ts`):
```typescript
// Line 37 - Uses cheaper/faster model for titles
const MODEL = 'claude-3-5-haiku-20241022'

// Line 40 - Keep short for titles
const MAX_TOKENS = 50
```

---

## Directory Structure After Installation

```
your-project/
├── frontend/
│   ├── app/
│   │   └── api/
│   │       └── claude/
│   │           ├── route.ts              # Main chat endpoint
│   │           └── generate-title/
│   │               └── route.ts          # Title generation
│   ├── .env.local                        # ANTHROPIC_API_KEY here
│   └── package.json
│
└── studio/
    ├── src/
    │   ├── plugins/
    │   │   └── claude-assistant/         # Full plugin folder
    │   └── schemaTypes/
    │       ├── documents/
    │       │   ├── claudeConversation.ts
    │       │   ├── claudeInstructions.ts
    │       │   └── claudeWorkflow.ts
    │       └── index.ts                  # Register schemas here
    ├── sanity.config.ts                  # Configure plugin here
    ├── .env                              # SANITY_STUDIO_PREVIEW_URL
    └── package.json
```

---

## Features Overview

### Chat Interface
- Real-time streaming responses from Claude
- Multimodal support (text + images)
- Action execution (create/update/delete documents)
- Conversation history with persistence

### Floating Chat
- Accessible from any Studio tool via keyboard shortcut
- Maintains context across navigation
- Can be minimized/maximized

### Custom Instructions
- Configure via the `claudeInstructions` document
- Set writing guidelines, brand voice, forbidden terms
- Define component-specific rules

### Workflows
- Create reusable workflow templates
- Pre-filled prompts for common tasks
- Role-based access control

---

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable is not configured"

**Cause:** The API key is not set or not being read.

**Solution:**
1. Ensure `ANTHROPIC_API_KEY` is in your frontend's `.env.local` file
2. Restart your Next.js dev server after adding the variable
3. Verify the key format: `sk-ant-api03-...`

### "Invalid API key" (401 error)

**Cause:** The API key is invalid or expired.

**Solution:**
1. Generate a new key at [console.anthropic.com](https://console.anthropic.com/)
2. Update your `.env.local` file
3. Restart your development server

### "Rate limit exceeded" (429 error)

**Cause:** Too many requests to the Anthropic API.

**Solution:**
1. Wait a moment and try again
2. Consider implementing request queuing
3. Check your Anthropic usage limits

### Chat not connecting / CORS errors

**Cause:** Studio can't reach the API endpoint.

**Solution:**
1. Ensure your Next.js frontend is running
2. Verify `SANITY_STUDIO_PREVIEW_URL` matches your frontend URL
3. Check that the API route files are in the correct location
4. Verify CORS headers in the API routes (default allows all origins)

### Conversations not saving

**Cause:** Schema types not registered or database issue.

**Solution:**
1. Verify schema types are exported in `schemaTypes/index.ts`
2. Run `sanity deploy` if using Sanity's hosted studio
3. Check Sanity Studio console for errors

### Actions not executing

**Cause:** Document operation permissions or validation errors.

**Solution:**
1. Check Studio console for error details
2. Verify the user has write permissions
3. Ensure referenced document types exist in your schema

---

## Security Considerations

### API Key Protection

- **Never expose** your `ANTHROPIC_API_KEY` in client-side code
- Keep it in `.env.local` (not committed to git)
- Use environment variables in production

### CORS Configuration

The default API routes allow all origins (`*`). For production, restrict this:

```typescript
// In route.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-studio-domain.sanity.studio',
  // ... rest of headers
}
```

### Rate Limiting

Consider adding rate limiting for production:

```typescript
// Example using a simple in-memory store
const rateLimiter = new Map<string, number[]>()

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const requests = rateLimiter.get(ip) || []
  const recentRequests = requests.filter(t => t > now - windowMs)

  if (recentRequests.length >= limit) {
    return false
  }

  rateLimiter.set(ip, [...recentRequests, now])
  return true
}
```

---

## Customization Tips

### Adding Custom Actions

Edit `lib/actions.ts` to add new action types:

```typescript
export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'yourCustomAction'  // Add new types here
```

Then handle them in `lib/operations.ts`.

### Modifying System Prompts

Edit `lib/instructions.ts` to customize how Claude behaves:

```typescript
export const BASE_SYSTEM_PROMPT = `
You are an AI assistant for [Your Company Name].
// Add your custom instructions here
`
```

### Styling the UI

The plugin uses styled-components and Sanity UI. Customize in:
- `styles.css` for global styles
- Individual component files for component-specific styling

---

## Support

This plugin was custom-built for this project. For issues:

1. Check the [Anthropic API documentation](https://docs.anthropic.com/)
2. Review the [Sanity Studio plugin docs](https://www.sanity.io/docs/plugin-development)
3. Examine the source code in the plugin folder

## Additional Resources

This project includes best practices toolkits that may be helpful when building with Next.js and Sanity:

- **Vercel React Best Practices** (`.claude/skills/react-best-practices/`) - 45+ React/Next.js performance optimization rules
- **Sanity Agent Toolkit** (`.cursor/rules/`) - 20+ Sanity CMS best practices for schemas, GROQ, visual editing, and more

These were sourced from:
- [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills)
- [Sanity Agent Toolkit](https://github.com/sanity-io/agent-toolkit)

---

## Version Compatibility

| Component | Tested Version | Minimum Version |
|-----------|---------------|-----------------|
| Sanity Studio | v4.20.0 | v3.0.0 |
| Next.js | v15.5.9 | v13.0.0 |
| React | v19.2.1 | v18.0.0 |
| @anthropic-ai/sdk | v0.71.2 | v0.6.0 |
| styled-components | v6.1.19 | v5.0.0 |

---

*Last updated: January 2026*
