# Figma Integration Implementation Plan

This document outlines the implementation plan for adding Figma integration to the Claude Assistant plugin, enabling users to create Sanity pages from Figma designs.

## Overview

The Figma integration allows users to:
1. Paste a Figma URL into the Claude Assistant chat
2. Claude fetches the frame data via a secure API endpoint
3. Claude interprets the component structure using mapping instructions from the Skill
4. Claude creates a corresponding page in Sanity with uploaded images

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Claude Assistant Chat                              │
│  User: "Create page from https://figma.com/design/xyz?node-id=1-100"        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Claude outputs action block:                                                │
│  ```action                                                                   │
│  { "type": "fetchFigmaFrame", "url": "...", "description": "..." }          │
│  ```                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  useContentOperations.ts handles the action:                                 │
│  - Validates skill has enableFigmaFetch: true                               │
│  - Calls /api/figma/fetch-frame endpoint                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  /api/figma/fetch-frame/route.ts:                                           │
│  - Validates FIGMA_ACCESS_TOKEN env var                                     │
│  - Parses Figma URL to extract fileKey and nodeId                           │
│  - Calls Figma API: GET /v1/files/{fileKey}/nodes?ids={nodeId}             │
│  - Returns structured node tree data                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Claude receives frame data, uses Skill instructions to:                     │
│  - Map Figma components → Sanity blocks                                     │
│  - Extract text content                                                      │
│  - Identify images for upload                                               │
│  - Generate page document structure                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  For each image, Claude outputs:                                             │
│  ```action                                                                   │
│  { "type": "uploadFigmaImage", "nodeId": "...", "filename": "..." }         │
│  ```                                                                         │
│  /api/figma/export-image handles: export from Figma → upload to Sanity     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Claude outputs final create action with complete page document              │
│  including Sanity asset references for uploaded images                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Phase 1: Schema & Hook Updates (COMPLETED)

- [x] Update `claudeWorkflow.ts` schema:
  - [x] Add `enableFigmaFetch` boolean field
  - [x] Convert `systemInstructions` from plain text to Portable Text
  - [x] Add field groups (Content, Integrations, Access Control)
  - [x] Update preview to show Figma badge

- [x] Update `useWorkflows.ts` hook:
  - [x] Include `enableFigmaFetch` in query
  - [x] Import `contentToMarkdown` utility
  - [x] Convert Portable Text to Markdown when fetching

- [x] Create Figma skill instructions template:
  - [x] Document at `docs/figma-skill-instructions.md`

---

### Phase 2: Action Types & Handlers

#### 2.1 Update Action Types

**File:** `studio/src/plugins/claude-assistant/lib/actions.ts`

Add new action types:
```typescript
export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'duplicate'
  | 'fetchFigmaFrame'      // NEW
  | 'uploadFigmaImage'     // NEW
```

Update `ActionData` interface:
```typescript
export interface FetchFigmaFrameAction {
  type: 'fetchFigmaFrame'
  url: string
  description?: string
}

export interface UploadFigmaImageAction {
  type: 'uploadFigmaImage'
  nodeId: string
  filename: string
  fileKey?: string  // Optional, extracted from original URL if not provided
  description?: string
}
```

#### 2.2 Update Content Operations Hook

**File:** `studio/src/plugins/claude-assistant/hooks/useContentOperations.ts`

Add handlers for new action types:
- `handleFetchFigmaFrame`: Calls `/api/figma/fetch-frame`, returns frame data
- `handleUploadFigmaImage`: Calls `/api/figma/export-image`, returns Sanity asset reference

Add validation:
- Check if current workflow has `enableFigmaFetch: true`
- If not enabled, return error message

---

### Phase 3: API Endpoints

#### 3.1 Figma Status Endpoint

**File:** `frontend/app/api/figma/status/route.ts`

Simple endpoint to check if Figma integration is configured:
```typescript
export async function GET() {
  return Response.json({
    configured: !!process.env.FIGMA_ACCESS_TOKEN
  })
}
```

#### 3.2 Fetch Frame Endpoint

**File:** `frontend/app/api/figma/fetch-frame/route.ts`

**Request:**
```typescript
interface FetchFrameRequest {
  url: string  // Figma URL with node-id parameter
}
```

**Response:**
```typescript
interface FetchFrameResponse {
  success: boolean
  fileKey: string
  nodeId: string
  name: string
  document: FigmaNode  // Simplified node tree
  images: ImageReference[]  // Nodes that contain images
  error?: string
}

interface FigmaNode {
  id: string
  name: string
  type: 'FRAME' | 'INSTANCE' | 'TEXT' | 'GROUP' | 'COMPONENT' | 'RECTANGLE' | string
  componentName?: string  // For INSTANCE nodes
  characters?: string  // For TEXT nodes
  style?: {
    fontSize?: number
    textAlignHorizontal?: string
    // ... other relevant styles
  }
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE'
  itemSpacing?: number
  primaryAxisAlignItems?: string
  counterAxisAlignItems?: string
  fills?: FigmaFill[]
  children?: FigmaNode[]
}

interface ImageReference {
  nodeId: string
  name: string
  type: 'fill' | 'export'  // Image as fill vs exportable node
}
```

**Implementation steps:**
1. Validate `FIGMA_ACCESS_TOKEN` exists
2. Parse Figma URL to extract `fileKey` and `nodeId`
3. Call Figma API: `GET https://api.figma.com/v1/files/{fileKey}/nodes?ids={nodeId}`
4. Transform response to simplified node structure
5. Identify nodes with image fills or exportable content
6. Return structured data for Claude to interpret

**URL Parsing:**
```typescript
// Handles various Figma URL formats:
// https://www.figma.com/design/ABC123/File-Name?node-id=1-234
// https://www.figma.com/file/ABC123/File-Name?node-id=1:234
// https://figma.com/design/ABC123?node-id=1-234

function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  const urlObj = new URL(url)
  const pathMatch = urlObj.pathname.match(/\/(design|file)\/([a-zA-Z0-9]+)/)
  const fileKey = pathMatch?.[2]

  const nodeIdParam = urlObj.searchParams.get('node-id')
  // Figma uses both "1-234" and "1:234" formats
  const nodeId = nodeIdParam?.replace('-', ':')

  if (!fileKey || !nodeId) return null
  return { fileKey, nodeId }
}
```

#### 3.3 Export Image Endpoint

**File:** `frontend/app/api/figma/export-image/route.ts`

**Request:**
```typescript
interface ExportImageRequest {
  fileKey: string
  nodeId: string
  filename: string
  scale?: number  // Default: 2 (2x for retina)
  format?: 'png' | 'jpg' | 'svg'  // Default: 'png'
}
```

**Response:**
```typescript
interface ExportImageResponse {
  success: boolean
  asset?: {
    _type: 'reference'
    _ref: string  // Sanity asset ID
  }
  error?: string
}
```

**Implementation steps:**
1. Validate `FIGMA_ACCESS_TOKEN` and `SANITY_API_TOKEN` exist
2. Call Figma API: `GET https://api.figma.com/v1/images/{fileKey}?ids={nodeId}&scale=2&format=png`
3. Download image from returned URL
4. Upload to Sanity using `client.assets.upload()`
5. Return Sanity asset reference

---

### Phase 4: System Prompt Injection

#### 4.1 Update Instructions Builder

**File:** `studio/src/plugins/claude-assistant/lib/instructions.ts`

When building the system prompt, check if the active workflow has `enableFigmaFetch: true`.
If enabled, inject Figma action documentation:

```typescript
function buildFigmaActionDocs(): string {
  return `
## Figma Integration Actions

When the user provides a Figma URL, you can fetch the frame data:

\`\`\`action
{
  "type": "fetchFigmaFrame",
  "url": "[figma URL]",
  "description": "Fetch frame data from Figma"
}
\`\`\`

To upload images from the Figma design:

\`\`\`action
{
  "type": "uploadFigmaImage",
  "nodeId": "[node id from frame data]",
  "filename": "[descriptive-name.png]",
  "description": "Upload image for hero section"
}
\`\`\`

The uploadFigmaImage action returns a Sanity asset reference that you can use in imageBlock.
`
}
```

#### 4.2 Pass Workflow to Instructions Builder

**File:** `studio/src/plugins/claude-assistant/ClaudeTool.tsx`

Ensure the active workflow (with `enableFigmaFetch` flag) is passed to the instructions builder so it can conditionally include Figma documentation.

---

### Phase 5: Environment Validation UI

#### 5.1 Check Figma Configuration

**File:** `studio/src/plugins/claude-assistant/components/WorkflowPicker.tsx` (or similar)

When user selects a workflow with `enableFigmaFetch: true`:
1. Call `/api/figma/status` to check if token is configured
2. If not configured, show warning banner:
   > ⚠️ Figma integration requires `FIGMA_ACCESS_TOKEN` environment variable. [Setup guide →](docs/figma-setup-guide.md)

---

### Phase 6: Documentation

#### 6.1 Figma Setup Guide

**File:** `docs/figma-setup-guide.md`

Contents:
- How to generate a Figma Personal Access Token
- Where to add `FIGMA_ACCESS_TOKEN` in environment
- Figma file permissions required (Viewer access minimum)
- Troubleshooting common issues

#### 6.2 Update Porting Guide

**File:** `docs/claude-assistant-porting-guide.md`

Add section on Figma integration:
- Optional setup for Figma features
- Required environment variables
- API endpoint files to copy

---

## File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `frontend/app/api/figma/status/route.ts` | Check if Figma token configured |
| `frontend/app/api/figma/fetch-frame/route.ts` | Fetch Figma frame data |
| `frontend/app/api/figma/export-image/route.ts` | Export & upload Figma images |
| `docs/figma-setup-guide.md` | Setup documentation |

### Files to Modify

| File | Changes |
|------|---------|
| `studio/src/schemaTypes/documents/claudeWorkflow.ts` | ✅ DONE - Added Portable Text, enableFigmaFetch |
| `studio/src/plugins/claude-assistant/hooks/useWorkflows.ts` | ✅ DONE - PT conversion, enableFigmaFetch |
| `studio/src/plugins/claude-assistant/lib/actions.ts` | Add new action types |
| `studio/src/plugins/claude-assistant/hooks/useContentOperations.ts` | Handle new actions |
| `studio/src/plugins/claude-assistant/lib/instructions.ts` | Inject Figma action docs |
| `studio/src/plugins/claude-assistant/ClaudeTool.tsx` | Pass workflow to instructions |
| `studio/src/plugins/claude-assistant/components/WorkflowPicker.tsx` | Env validation UI |
| `docs/claude-assistant-porting-guide.md` | Document Figma integration |

---

## Environment Variables

### Required for Figma Integration

```env
# Figma Personal Access Token
# Generate at: https://www.figma.com/developers/api#access-tokens
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxxxxxxx

# For image upload to Sanity (may already exist)
SANITY_API_TOKEN=skxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Existing (unchanged)

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000
```

---

## Testing Checklist

### Schema Changes
- [ ] Skill documents show new field groups (Content, Integrations, Access Control)
- [ ] System Instructions field accepts rich text / markdown paste
- [ ] Enable Figma Integration toggle appears in Integrations group
- [ ] Preview shows "Figma" badge when enabled

### API Endpoints
- [ ] `/api/figma/status` returns `{ configured: true }` when token set
- [ ] `/api/figma/status` returns `{ configured: false }` when token missing
- [ ] `/api/figma/fetch-frame` returns frame data for valid URL
- [ ] `/api/figma/fetch-frame` returns error for invalid URL
- [ ] `/api/figma/fetch-frame` returns error when token missing
- [ ] `/api/figma/export-image` exports and uploads image successfully
- [ ] `/api/figma/export-image` returns Sanity asset reference

### Action Handling
- [ ] `fetchFigmaFrame` action calls API and returns data to Claude
- [ ] `uploadFigmaImage` action uploads image and returns reference
- [ ] Actions fail gracefully when skill doesn't have Figma enabled
- [ ] Error messages are clear and actionable

### End-to-End
- [ ] User can paste Figma URL in chat with Figma-enabled skill
- [ ] Claude outputs `fetchFigmaFrame` action
- [ ] Frame data is returned and Claude interprets it
- [ ] Images are uploaded via `uploadFigmaImage` actions
- [ ] Final page is created with correct structure and images

---

## Implementation Order

1. **Phase 2:** Action types and handlers (foundation for API calls)
2. **Phase 3:** API endpoints (actual Figma integration)
3. **Phase 4:** System prompt injection (enable Claude to use actions)
4. **Phase 5:** Environment validation UI (user feedback)
5. **Phase 6:** Documentation (developer experience)

Each phase can be implemented by a focused subagent with this document as context.
