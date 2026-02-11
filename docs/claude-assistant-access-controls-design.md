# Claude Assistant Access Controls Design

This document explores access control and scoping functionality for the Claude Assistant tool when porting it to a new project. It covers document type restrictions, field-level visibility by role, admin approval workflows, and Sanity plan requirements.

---

## Table of Contents

1. [Document Type Access Control](#1-document-type-access-control)
2. [Admin Approval Workflow (Toggle Field Pattern)](#2-admin-approval-workflow-toggle-field-pattern)
3. [Claude Settings Visibility (Admin-Only)](#3-claude-settings-visibility-admin-only)
4. [Sanity Plan Requirements](#4-sanity-plan-requirements)
5. [Implementation Summary](#5-implementation-summary)
6. [Enforcement Layers](#6-enforcement-layers)

---

## 1. Document Type Access Control

**Question**: Can we add a field to Claude settings that selects which document types Claude is allowed to edit or create?

**Answer**: Yes. This is implementable with a multi-layer approach.

### 1a. New Schema: `claudeAccessControl` (Singleton)

Add a new singleton document to the Claude settings that defines which document types the assistant can interact with:

```ts
// studio/src/schemaTypes/documents/claudeAccessControl.ts
import {LockIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const claudeAccessControl = defineType({
  name: 'claudeAccessControl',
  title: 'Access Control',
  type: 'document',
  icon: LockIcon,
  fields: [
    defineField({
      name: 'allowedDocumentTypes',
      title: 'Allowed Document Types',
      type: 'array',
      description:
        'Which document types Claude is allowed to create and edit. If empty, all types are allowed.',
      of: [defineArrayMember({type: 'string'})],
      options: {
        // This list would be dynamically populated or hardcoded per project
        list: [
          {title: 'Ad Landing Pages', value: 'adLandingPage'},
          {title: 'Feature Landing Pages', value: 'featureLandingPage'},
          {title: 'Blog Posts', value: 'post'},
          {title: 'Pages', value: 'page'},
          // ... other project document types
        ],
        layout: 'tags',
      },
    }),
    defineField({
      name: 'allowedOperations',
      title: 'Allowed Operations',
      type: 'array',
      description: 'Which operations Claude can perform. If empty, all operations are allowed.',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Create', value: 'create'},
          {title: 'Update', value: 'update'},
          {title: 'Delete', value: 'delete'},
          {title: 'Publish', value: 'publish'},
          {title: 'Query', value: 'query'},
        ],
        layout: 'tags',
      },
    }),
    defineField({
      name: 'blockPublishing',
      title: 'Block Direct Publishing',
      type: 'boolean',
      description:
        'When enabled, Claude can create and edit drafts but cannot publish documents directly. An admin must review and publish.',
      initialValue: true,
    }),
  ],
})
```

### 1b. Enforcement Points

Document type restrictions need to be enforced at **three layers**:

#### Layer 1: System Prompt (Soft Enforcement)

In `lib/instructions.ts`, filter the schema context sent to Claude so it only sees allowed document types:

```ts
// In buildSystemPrompt(), filter schema before formatting
if (context.schemaContext && accessControl?.allowedDocumentTypes?.length) {
  const filteredSchema = {
    ...context.schemaContext,
    documentTypes: context.schemaContext.documentTypes.filter((dt) =>
      accessControl.allowedDocumentTypes.includes(dt.name)
    ),
  }
  parts.push(formatSchemaForPrompt(filteredSchema))
}
```

Also inject a constraint into the system prompt:

```
You are ONLY allowed to create or edit documents of these types: ${allowedTypes.join(', ')}.
If the user asks you to work with any other document type, politely explain that
you don't have permission and suggest they contact an administrator.
```

#### Layer 2: Action Validation (Hard Enforcement)

In `lib/operations.ts`, add a pre-execution check in `executeAction()`:

```ts
// Before executing any create/update/delete action
async executeAction(action: ParsedAction): Promise<ActionResult> {
  // Load access control settings
  const accessControl = await this.getAccessControl()

  if (action.type === 'create') {
    const docType = action.payload.documentType
    if (!this.isTypeAllowed(docType, accessControl)) {
      return {
        success: false,
        message: `Access denied: Claude is not configured to create "${docType}" documents. Contact an administrator to update access settings.`,
      }
    }
  }

  if (action.type === 'update' || action.type === 'delete') {
    const doc = await this.client.getDocument(action.payload.documentId)
    if (doc && !this.isTypeAllowed(doc._type, accessControl)) {
      return {
        success: false,
        message: `Access denied: Claude is not configured to modify "${doc._type}" documents.`,
      }
    }
  }

  if (action.type === 'publish' && accessControl.blockPublishing) {
    return {
      success: false,
      message: 'Publishing is disabled for Claude. An administrator must review and publish this document.',
    }
  }

  // ... proceed with normal execution
}
```

#### Layer 3: API Endpoint Validation (Server-Side Enforcement)

In `frontend/app/api/claude/remote/content-operations.ts`, add the same checks for the remote/headless API. This prevents bypassing Studio-side restrictions via the API.

### 1c. Hook: `useAccessControl`

Create a new hook that loads and caches the access control settings:

```ts
// studio/src/plugins/claude-assistant/hooks/useAccessControl.ts
export function useAccessControl() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [accessControl, setAccessControl] = useState<AccessControlSettings | null>(null)

  useEffect(() => {
    const query = '*[_type == "claudeAccessControl"][0]'
    client.fetch(query).then(setAccessControl)

    // Listen for real-time changes
    const subscription = client
      .listen(query)
      .subscribe((update) => {
        if (update.result) setAccessControl(update.result)
      })

    return () => subscription.unsubscribe()
  }, [client])

  return {
    allowedDocumentTypes: accessControl?.allowedDocumentTypes || [],
    allowedOperations: accessControl?.allowedOperations || [],
    blockPublishing: accessControl?.blockPublishing ?? true,
    isTypeAllowed: (type: string) => {
      if (!accessControl?.allowedDocumentTypes?.length) return true // empty = all allowed
      return accessControl.allowedDocumentTypes.includes(type)
    },
    isOperationAllowed: (op: string) => {
      if (!accessControl?.allowedOperations?.length) return true
      return accessControl.allowedOperations.includes(op)
    },
  }
}
```

---

## 2. Admin Approval Workflow (Toggle Field Pattern)

**Question**: Can we add a toggle field that only admins can see, which must be enabled before a document can be published?

**Answer**: Yes. Sanity supports role-based field visibility on **all plans** (including Free) via the `hidden` callback on schema fields. Combined with custom Document Actions, this creates an effective approval workflow.

### 2a. Add an Admin-Only Approval Field to Document Types

```ts
// In any document schema where Claude can build pages (e.g., adLandingPage.ts)
defineField({
  name: 'adminApproved',
  title: 'Admin Approved',
  type: 'boolean',
  description: 'Only administrators can see and toggle this field. Must be enabled before publishing.',
  initialValue: false,
  group: 'admin', // Put in a separate admin group
  // HIDDEN from non-admins - this is a UI-level restriction
  hidden: ({currentUser}) => {
    return !currentUser?.roles?.some((role) => role.name === 'administrator')
  },
  // READ-ONLY for non-admins as a safety net
  readOnly: ({currentUser}) => {
    return !currentUser?.roles?.some((role) => role.name === 'administrator')
  },
})
```

### 2b. Custom Document Action: Block Publishing Without Approval

Replace the default Publish action with a custom one that checks the approval field:

```tsx
// studio/src/actions/ApprovedPublishAction.tsx
import {useState, useEffect} from 'react'
import {useDocumentOperation, useCurrentUser, useClient} from 'sanity'
import {PublishIcon} from '@sanity/icons'

export function ApprovedPublishAction(props) {
  const {publish} = useDocumentOperation(props.id, props.type)
  const currentUser = useCurrentUser()
  const client = useClient({apiVersion: '2024-01-01'})
  const [isApproved, setIsApproved] = useState(false)

  const isAdmin = currentUser?.roles?.some((r) => r.name === 'administrator')

  // Check approval status
  useEffect(() => {
    client
      .fetch(`*[_id == $id][0].adminApproved`, {id: `drafts.${props.id}`})
      .then((approved) => setIsApproved(!!approved))
  }, [props.id, props.draft])

  // Document types that require approval
  const requiresApproval = ['adLandingPage'].includes(props.type)

  if (requiresApproval && !isApproved && !isAdmin) {
    return {
      label: 'Pending Admin Approval',
      icon: PublishIcon,
      disabled: true,
      tone: 'caution',
      title: 'This document must be approved by an administrator before publishing.',
      onHandle: () => {},
    }
  }

  return {
    label: isApproved ? 'Publish (Approved)' : 'Publish',
    icon: PublishIcon,
    disabled: publish.disabled,
    onHandle: () => {
      publish.execute()
      props.onComplete()
    },
  }
}
```

Register it in `sanity.config.ts`:

```ts
document: {
  actions: (prev, context) => {
    const typesRequiringApproval = ['adLandingPage']
    if (typesRequiringApproval.includes(context.schemaType)) {
      return prev.map((action) =>
        action.action === 'publish' ? ApprovedPublishAction : action
      )
    }
    return prev
  },
}
```

### 2c. Workflow Summary

1. **Collaborator** uses Claude to generate a page (e.g., an `adLandingPage` document)
2. Claude creates the document as a **draft** (publishing is blocked by `blockPublishing` in access control)
3. Collaborator previews in Presentation mode / staging
4. Collaborator notifies admin the page is ready for review
5. **Admin** opens the document, sees the hidden `adminApproved` toggle
6. Admin reviews content, toggles `adminApproved` to `true`
7. Admin (or now the collaborator, if approval-only gating is used) publishes the document

### 2d. Important Caveats

- **`hidden` is UI-only**: The `adminApproved` field is still readable/writable via the Sanity API. A non-admin with API access could theoretically set it to `true`. For true server-side enforcement, you need Sanity's Enterprise plan with custom roles and GROQ filter resources.
- **For most teams this is sufficient**: If collaborators are only interacting through Studio (not the API directly), the UI-level restriction is effective.
- **Enterprise alternative**: On Enterprise, you could create a custom role that explicitly denies `publish` permission on certain document types, enforced server-side regardless of how the user accesses the data.

---

## 3. Claude Settings Visibility (Admin-Only)

**Question**: Can Claude settings documents (`claudeApiSettings`, `claudeInstructions`, `claudeWorkflow`, etc.) be restricted to admin-only visibility?

**Answer**: Yes. This is achievable on all plans through Structure Builder customization.

### 3a. Role-Based Structure Builder

Modify `studio/src/structure/index.ts` to conditionally show the Claude Settings folder:

```ts
export const structure: StructureResolver = (S: StructureBuilder, context) => {
  const {currentUser} = context
  const isAdmin = currentUser?.roles?.some((role) => role.name === 'administrator')

  const items = [
    // Content items visible to everyone
    S.documentTypeListItem('page').title('Pages'),
    // ... other content items

    S.divider(),

    // ... other settings

    // Claude Settings - ADMIN ONLY
    ...(isAdmin
      ? [
          S.listItem()
            .id('claudeSettings')
            .title('Claude Settings')
            .icon(RobotIcon)
            .child(
              S.list()
                .id('claudeSettingsList')
                .title('Claude Settings')
                .items([
                  S.listItem()
                    .id('claudeAccessControl')
                    .title('Access Control')
                    .child(
                      S.document()
                        .schemaType('claudeAccessControl')
                        .documentId('claudeAccessControl')
                    )
                    .icon(LockIcon),
                  S.listItem()
                    .id('claudeApiSettings')
                    .title('API Settings')
                    .child(
                      S.document()
                        .schemaType('claudeApiSettings')
                        .documentId('claudeApiSettings')
                    )
                    .icon(CogIcon),
                  // ... other Claude settings items
                ])
            ),
        ]
      : []),
  ]

  return S.list().title('Content').items(items)
}
```

### 3b. Block "Create New" Menu

Also prevent non-admins from creating Claude settings documents via the "Create new" menu:

```ts
// sanity.config.ts
document: {
  newDocumentOptions: (prev, {currentUser}) => {
    const isAdmin = currentUser?.roles?.some((r) => r.name === 'administrator')
    const claudeTypes = [
      'claudeApiSettings',
      'claudeInstructions',
      'claudeAccessControl',
      'claudeQuickAction',
      'claudeWorkflow',
    ]

    if (!isAdmin) {
      return prev.filter((item) => !claudeTypes.includes(item.templateId))
    }
    return prev
  },
}
```

### 3c. Claude Tool Visibility

You can also conditionally show/hide the Claude chat tool itself based on role:

```ts
// sanity.config.ts
plugins: [
  // Only register Claude tool for roles that should have access
  ...(shouldShowClaude
    ? [claudeAssistant({apiEndpoint: '...'})]
    : []),
],
```

However, since the tool registration happens at config time (before user context is available), a more practical approach is to check the user's role inside the tool component itself and render a "no access" message:

```tsx
// In ClaudeTool.tsx
const currentUser = useCurrentUser()
const hasAccess = currentUser?.roles?.some(
  (r) => r.name === 'administrator' || r.name === 'editor'
)

if (!hasAccess) {
  return <Card padding={4}><Text>You don't have access to the Claude Assistant.</Text></Card>
}
```

### 3d. Caveats (Same as Section 2)

- Structure Builder hiding and field `hidden` callbacks are **UI-level only**
- Documents are still accessible via Sanity API unless you use Enterprise GROQ filter resources
- For most internal teams, UI-level restriction is sufficient since collaborators interact through Studio

---

## 4. Sanity Plan Requirements

| Capability | Free | Growth | Enterprise |
|---|---|---|---|
| Hide structure items by role (Structure Builder) | Yes | Yes | Yes |
| Hide fields by role (`hidden` callback) | Yes | Yes | Yes |
| `readOnly` fields by role | Yes | Yes | Yes |
| Custom Document Actions (approval workflow) | Yes | Yes | Yes |
| Filter `newDocumentOptions` by role | Yes | Yes | Yes |
| `useCurrentUser()` hook in components | Yes | Yes | Yes |
| Private datasets (API-level read restriction) | No | Yes | Yes |
| Custom roles | No | No | Yes |
| GROQ filter resources (server-side doc-level permissions) | No | No | Yes |
| Content Releases (grouped publishing) | No | No | Yes (add-on) |
| SAML SSO | No | No | Yes |

### What You Can Do on Free/Growth Plans

Everything in this design document is implementable on **Free or Growth plans** as UI-level restrictions. The key limitations:

1. **No server-side enforcement**: A technically savvy user with API credentials could bypass UI restrictions by calling the Sanity API directly
2. **Built-in roles only**: Free has 2 roles (Editor, Viewer), Growth has 5 roles. You cannot create custom roles like "Content Collaborator" or "Page Builder"
3. **Search leakage**: Hidden structure items may still appear in Studio's global search results

### When Enterprise Is Worth It

Consider Enterprise if:
- You have external collaborators or contractors who shouldn't be able to bypass UI restrictions
- You need custom roles beyond Administrator/Editor/Viewer
- You want server-side guarantees that document type access is enforced regardless of client
- You need Content Releases for coordinated publishing workflows
- You require SSO integration

---

## 5. Implementation Summary

### New Files to Create

| File | Purpose |
|---|---|
| `studio/src/schemaTypes/documents/claudeAccessControl.ts` | Access control settings schema |
| `studio/src/plugins/claude-assistant/hooks/useAccessControl.ts` | Hook to load/cache access control settings |
| `studio/src/actions/ApprovedPublishAction.tsx` | Custom publish action with approval gate |

### Files to Modify

| File | Change |
|---|---|
| `studio/src/structure/index.ts` | Conditionally show Claude Settings based on user role |
| `studio/src/plugins/claude-assistant/lib/instructions.ts` | Filter schema context by allowed types; inject access constraints into system prompt |
| `studio/src/plugins/claude-assistant/lib/operations.ts` | Add pre-execution type/operation validation in `executeAction()` |
| `studio/src/plugins/claude-assistant/hooks/useContentOperations.ts` | Integrate `useAccessControl` to block disallowed operations before execution |
| `studio/sanity.config.ts` | Register new schema, filter `newDocumentOptions`, register custom Document Action |
| `frontend/app/api/claude/remote/content-operations.ts` | Add server-side access control checks for remote API |

### Per-Project Schema Changes

For each document type Claude should manage (e.g., `adLandingPage`):
- Add `adminApproved` boolean field with `hidden`/`readOnly` callbacks
- Add an `admin` field group for admin-only fields

---

## 6. Enforcement Layers

The design uses **defense in depth** with three enforcement layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     Layer 1: System Prompt                   │
│  Claude only sees schemas for allowed document types.        │
│  Prompt explicitly states which types it can work with.      │
│  → Prevents Claude from even suggesting disallowed actions   │
├─────────────────────────────────────────────────────────────┤
│                   Layer 2: Action Validation                 │
│  Before any action executes, check document type and         │
│  operation against access control settings.                  │
│  → Hard block even if Claude somehow suggests a              │
│    disallowed action                                         │
├─────────────────────────────────────────────────────────────┤
│                   Layer 3: Studio UI Gating                  │
│  Structure Builder hides admin-only items.                   │
│  Document Actions block publishing without approval.         │
│  Field `hidden` callbacks hide admin fields from             │
│  collaborators.                                              │
│  → Users never see controls they shouldn't interact with     │
├─────────────────────────────────────────────────────────────┤
│              Layer 4 (Enterprise only): API-Level            │
│  GROQ filter resources on custom roles.                      │
│  Server-side enforcement regardless of client.               │
│  → True security boundary, not just UI obfuscation           │
└─────────────────────────────────────────────────────────────┘
```

For most internal teams, Layers 1-3 provide sufficient control. Layer 4 (Enterprise) is recommended when working with external collaborators or when compliance requirements demand server-side enforcement.
