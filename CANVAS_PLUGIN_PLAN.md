# Sanity Canvas Plugin — Design & Feasibility Plan

## Concept

A Sanity Studio tool plugin called **"Canvas"** that provides a Figma-like infinite canvas where editors can view, arrange, and compare multiple pages/posts side by side. Appears as a tab in the Studio's top toolbar (alongside Structure, Presentation, Claude, etc.).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Sanity Studio (Top Bar)                                │
│  [Structure] [Presentation] [Canvas] [Claude] [Vision]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Canvas Tool (infinite canvas)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  /about     │  │  /services  │  │  /contact   │     │
│  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │     │
│  │  │iframe │  │  │  │iframe │  │  │  │iframe │  │     │
│  │  │preview│  │  │  │preview│  │  │  │preview│  │     │
│  │  │       │  │  │  │       │  │  │  │       │  │     │
│  │  └───────┘  │  │  └───────┘  │  │  └───────┘  │     │
│  │  [Edit] [↗] │  │  [Edit] [↗] │  │  [Edit] [↗] │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  [+ Add Page]  [Zoom: 75%]  [Fit All]  [Grid/Free]     │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Choices

### Canvas Engine: **React Flow** (Recommended for MVP)

After researching tldraw, React Flow, Excalidraw, and other options:

| Library | Pros | Cons |
|---------|------|------|
| **React Flow** | Nodes are real React components (DOM-based), native iframe support, MIT license, built-in minimap/controls, auto-layout support, pan/zoom built-in | Performance degrades with many DOM nodes |
| **tldraw** | True infinite canvas, built-in collaboration, feels more like Figma | Canvas-based rendering (iframes need custom shapes), requires watermark or license, more complex iframe integration |
| **Excalidraw** | Great drawing tools | Not designed for embedding live content |

**Why React Flow wins for this use case:**
- Each page frame is a **custom React node** — you literally render `<iframe>` inside a node component. No hacks needed.
- Built-in **pan, zoom, minimap, controls, and drag** — all the canvas primitives.
- **Auto-layout** via dagre or elkjs for the initial grid arrangement.
- MIT licensed, no watermark.
- Nodes can contain any React component — buttons, menus, badges, etc.
- Performance is fine for 5-20 page frames (this isn't a 1000-node graph).

**tldraw is worth revisiting** for a Phase 3+ if you want freeform drawing, annotation, and a more "Figma-native" feel. It supports custom shapes that can render iframes, and has built-in collaboration.

### Key Dependencies

```json
{
  "@xyflow/react": "^12.x",       // React Flow v12
  "elkjs": "^0.9.x",              // Auto-layout engine (optional)
  "@sanity/ui": "already installed" // Sanity's design system
}
```

---

## Plugin Registration (Same Pattern as Claude Assistant)

```typescript
// studio/src/plugins/canvas/index.ts
import {definePlugin} from 'sanity'
import {CanvasTool} from './CanvasTool'
import {CanvasToolIcon} from './components/CanvasToolIcon'

export const canvasPlugin = definePlugin(() => ({
  name: 'sanity-canvas',
  tools: [
    {
      name: 'canvas',
      title: 'Canvas',
      icon: CanvasToolIcon,
      component: CanvasTool,
    },
  ],
}))
```

```typescript
// studio/sanity.config.ts (add to plugins array)
canvasPlugin(),
```

---

## Feature Tiers

### Phase 1 — MVP: View & Arrange

**Goal:** Open multiple pages side by side on an infinite canvas, rearrange them, zoom in/out.

#### Features
- **Page picker**: Search/select pages and posts to add to the canvas
- **Auto-layout**: New pages arrange in a grid automatically (e.g., 3 columns)
- **Iframe preview frames**: Each page renders in a sandboxed iframe pointing at your frontend in draft mode
- **Pan & zoom**: Mouse wheel zoom, click-drag to pan the canvas
- **Drag to rearrange**: Grab any frame and move it anywhere
- **Resize frames**: Drag handles to resize (test responsive breakpoints)
- **Frame toolbar**: Each frame has a mini toolbar with:
  - Page title / slug
  - "Open in Presentation" link (opens in new tab)
  - "Edit in Structure" link
  - Remove from canvas
  - Viewport size presets (Desktop / Tablet / Mobile)
- **Canvas controls**: Zoom slider, fit-all button, minimap toggle
- **Persist layout**: Save canvas state (which pages, positions, sizes) to localStorage or a Sanity document

#### Technical Implementation

**Page Frame Node (React Flow Custom Node):**
```typescript
function PageFrameNode({ data }: NodeProps<PageFrameData>) {
  const { page, previewUrl } = data
  return (
    <div className="canvas-frame">
      <div className="canvas-frame-header">
        <span>{page.name}</span>
        <div className="canvas-frame-actions">
          <Button icon={EditIcon} onClick={() => openInPresentation(page)} />
          <Button icon={TrashIcon} onClick={() => removeFrame(page._id)} />
        </div>
      </div>
      <div className="canvas-frame-body">
        <iframe
          src={`${previewUrl}/${page.slug.current}?preview=true`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}
```

**Canvas Tool Component:**
```typescript
function CanvasTool() {
  const [nodes, setNodes] = useNodesState([])
  const [edges, setEdges] = useEdgesState([])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={{ pageFrame: PageFrameNode }}
      onNodesChange={onNodesChange}
      fitView
      minZoom={0.1}
      maxZoom={2}
    >
      <Controls />
      <MiniMap />
      <Background />
    </ReactFlow>
  )
}
```

#### Estimated Complexity
- Plugin scaffolding: straightforward (follow Claude plugin pattern)
- React Flow integration: well-documented, standard setup
- Iframe previews: simple — point at frontend URL with draft mode
- Layout persistence: localStorage for quick wins, Sanity document for cross-session

---

### Phase 2 — Enhanced Navigation & Collaboration

**Goal:** Deeper integration with Sanity's document system and team workflows.

#### Features
- **Canvas presets/templates**: Save and load named canvas arrangements ("Homepage Redesign", "Blog Overview", etc.) — stored as Sanity documents
- **Bulk actions**: Select multiple frames → batch open in Structure, batch remove
- **Frame annotations**: Add text labels/sticky notes next to frames (stored in canvas document)
- **Link lines**: Draw connection lines between related frames (React Flow edges)
- **Snapshot export**: Export the current canvas view as a PNG/PDF for sharing
- **Live reload**: Frames auto-refresh when content changes (via Sanity's listener API)
- **Responsive preview**: Toggle all frames between Desktop/Tablet/Mobile simultaneously
- **Frame grouping**: Group related frames with a visual container

#### Technical Notes
- Canvas presets stored as `canvasLayout` Sanity document type:
  ```typescript
  {
    _type: 'canvasLayout',
    name: 'Homepage Redesign Q1',
    nodes: [{ pageRef, position, size }],
    annotations: [{ text, position }],
    viewport: { x, y, zoom }
  }
  ```
- Live reload uses `client.listen()` to subscribe to document changes
- Snapshot export via `html2canvas` or React Flow's `toImage()` utility

---

### Phase 3 — Inline Visual Editing (Stretch Goal)

**Goal:** Edit content directly within canvas frames, like Presentation mode but multi-page.

#### Feasibility Assessment

**What's possible:**
- Each iframe already runs your Next.js frontend with draft mode enabled
- The `<VisualEditing />` component in your frontend renders click-to-edit overlays
- Stega encoding is active in draft mode, making fields clickable
- Your existing `BlockContextBridge` sends click events via `postMessage`

**What's challenging:**
- Sanity's Presentation tool has a **tight bidirectional coupling** between the iframe and the Studio's document editing pane. The canvas plugin would need to replicate this.
- When a user clicks a field in the iframe, you'd need to:
  1. Intercept the click (already works via overlays)
  2. Open a **side panel or popover** with the field editor for that specific document/field
  3. Mutations made in the editor need to flow back to the iframe via live preview

**Approach:** Rather than fully replicating Presentation mode, use a **"click to open field editor" pattern**:

```
User clicks text in iframe frame
  → postMessage sends { documentId, fieldPath } to Studio
  → Canvas plugin opens a slide-out panel with that document's form
  → Form is focused on the specific field
  → Edits are saved via Sanity client
  → iframe reloads/live-updates via defineLive()
```

This gives you "edit from canvas" without rebuilding the full Presentation tool internals. The side panel could use Sanity's `DocumentPane` or `useDocumentStore` to render the native form editor.

#### Key Technical Pieces
- `useDocumentStore()` from `sanity` — access document editing state
- `DocumentPane` component — render a document editor in a panel
- `postMessage` listener — already proven in your Claude plugin's `useBlockContext.ts`
- `client.listen()` — real-time updates to refresh iframes

---

### Phase 4 — Native Commenting (Stretch Goal)

**Goal:** Add comments to blocks/fields from within canvas frames, using Sanity's built-in commenting.

#### Feasibility Assessment

**Current state of Sanity's Comments API:**
- Comments are a **UI-level feature** built into Sanity Studio (available on paid plans, v3.40.0+)
- Comments can be attached to specific document fields or even words within Portable Text
- Comments are stored in a separate add-on dataset (e.g., `production-comments`)
- **There is NO public programmatic API** for creating comments from custom plugins
- [GitHub issue #7610](https://github.com/sanity-io/sanity/issues/7610) tracks the request for an external commenting API

**What this means for the Canvas plugin:**

| Approach | Feasibility | Notes |
|----------|-------------|-------|
| Use Sanity's native comment UI | Not possible from custom tool | No public API to trigger comment creation programmatically |
| Build custom comment system | Fully possible | Store comments as Sanity documents, but they won't appear in Studio's native comment sidebar |
| Open document in Structure to comment | Possible (MVP workaround) | "Open in Structure" button lets users use native comments there |
| Wait for Sanity's API | Unknown timeline | Issue #7610 is open but no ETA |

**Recommended approach:** For MVP/Phase 2, provide a "Comment" button that opens the specific document in Structure mode (where native commenting works). For Phase 4, build a lightweight custom annotation system stored as Sanity documents. If/when Sanity exposes a programmatic commenting API, migrate to that.

---

### Phase 5 — Freeform Creative Canvas (Future Vision)

**Goal:** Add non-page elements to the canvas for a more Figma-like creative workspace.

#### Possible Elements
- **Sticky notes** — text annotations on the canvas
- **Images** — drag-and-drop images for reference/moodboarding
- **Text blocks** — rich text annotations
- **Drawing/shapes** — basic shapes, arrows, connectors
- **External embeds** — Figma frames, Loom videos, Google Docs
- **Color swatches** — reference design tokens

#### Technology Pivot
At this stage, **tldraw becomes the better foundation** than React Flow:
- tldraw is purpose-built for freeform creative canvases
- It supports custom shapes (page iframes), drawing, text, images, sticky notes natively
- Built-in real-time collaboration via Yjs
- The "Make Real" demo proves iframes work on the tldraw canvas

You could either:
1. **Migrate from React Flow to tldraw** at this phase
2. **Hybrid approach** — use React Flow for the structured page grid, and overlay tldraw for freeform annotations

---

## File Structure

```
studio/src/plugins/canvas/
├── index.ts                    # Plugin definition (definePlugin)
├── CanvasTool.tsx              # Main tool component
├── types.ts                    # TypeScript types
├── styles.css                  # Custom styles
│
├── components/
│   ├── CanvasToolIcon.tsx      # Tab icon
│   ├── PageFrameNode.tsx       # React Flow custom node (iframe frame)
│   ├── PagePicker.tsx          # Search & add pages to canvas
│   ├── CanvasToolbar.tsx       # Top toolbar (add, zoom, fit, layout)
│   ├── FrameToolbar.tsx        # Per-frame actions (edit, remove, resize)
│   ├── ViewportPresets.tsx     # Desktop/Tablet/Mobile toggles
│   ├── CanvasControls.tsx      # Zoom, minimap, fit-all
│   └── StickyNote.tsx          # Phase 5: annotation node
│
├── hooks/
│   ├── useCanvasState.ts       # Node positions, zoom, persistence
│   ├── usePageSearch.ts        # Search pages/posts via Sanity client
│   ├── useAutoLayout.ts        # Grid/auto-arrange logic
│   ├── useFrameMessage.ts      # postMessage listener for iframe clicks
│   └── useCanvasPresets.ts     # Save/load canvas arrangements
│
└── lib/
    ├── layout.ts               # Layout algorithms (grid, masonry)
    ├── persistence.ts          # Save/load to localStorage or Sanity
    └── preview-url.ts          # Build preview URLs for pages
```

---

## Key Technical Decisions

### 1. How do iframes get draft mode?

Each iframe points at your frontend with draft mode enabled. The URL pattern:
```
https://your-frontend.com/page-slug
```

Draft mode is activated by the Presentation tool's `/api/draft-mode/enable` endpoint. For the Canvas plugin, you have two options:

**Option A: Shared draft mode cookie** — If the user has already opened Presentation mode in the same browser session, the draft mode cookie persists and all iframes will show draft content automatically.

**Option B: Programmatic activation** — The Canvas plugin calls `/api/draft-mode/enable` when mounting, setting the draft mode cookie for all subsequent iframe loads. This is the more reliable approach.

### 2. How many iframes can we realistically render?

- Each iframe is a full browser rendering context
- Practically, **5-15 iframes** are comfortable on modern hardware
- Beyond that, use **lazy loading** — only render iframes for frames currently in viewport
- React Flow has built-in viewport culling that helps here

### 3. Where is canvas state stored?

| Storage | Pros | Cons |
|---------|------|------|
| localStorage | Instant, no API calls | Per-browser, not shared |
| Sanity document | Shared across team, versioned | API overhead, needs schema |
| Both | Best UX — fast local with sync | More complex |

**Recommendation:** Start with localStorage for MVP, add Sanity document storage in Phase 2 for shared presets.

### 4. Can we make frame content interactive?

By default, iframes in React Flow nodes won't receive pointer events (React Flow captures them for drag). Solution:

```typescript
// When user is in "interact" mode (not "move" mode)
<iframe
  style={{ pointerEvents: isInteractMode ? 'auto' : 'none' }}
/>
```

Toggle between "Move" mode (drag frames) and "Interact" mode (click inside frames). This is how tools like Framer handle it.

---

## Phased Delivery Summary

| Phase | Scope | Canvas Lib | Key Milestone |
|-------|-------|------------|---------------|
| **1 — MVP** | View, arrange, zoom, per-frame menu | React Flow | "I can see 5 pages side by side and zoom around" |
| **2 — Collaboration** | Presets, annotations, live reload, responsive | React Flow | "My team can save and share canvas layouts" |
| **3 — Inline Editing** | Click-to-edit via side panel, postMessage | React Flow | "I can edit content from the canvas" |
| **4 — Commenting** | Custom or native comments on fields | React Flow | "I can leave feedback on specific blocks" |
| **5 — Freeform** | Images, text, drawing, full creative canvas | tldraw (migrate) | "This feels like Figma for content" |

---

## Open Questions

1. **Licensing**: If you eventually move to tldraw, are you comfortable with the watermark, or would you purchase a business license?
2. **Draft mode strategy**: Should every canvas iframe show draft content, or should there be a toggle for published vs. draft?
3. **Performance budget**: What's the max number of pages you'd realistically want on a canvas at once? (Affects iframe strategy)
4. **Team sharing**: Is localStorage sufficient for MVP, or do you need shared canvas layouts from day one?
5. **Sanity plan**: Are you on a paid plan (required for native commenting features)?

---

## References

- [React Flow Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)
- [React Flow Minimap & Controls](https://reactflow.dev/api-reference/react-flow)
- [tldraw SDK](https://tldraw.dev/)
- [tldraw Custom Embeds](https://tldraw.dev/examples/shapes/tools/custom-embed)
- [tldraw Embed Shape](https://tldraw.dev/sdk-features/embed-shape)
- [tldraw Custom Shapes](https://tldraw.dev/examples/custom-shape)
- [Sanity Comments Docs](https://www.sanity.io/docs/studio/comments)
- [Sanity Comments Configuration](https://www.sanity.io/docs/studio/configuring-comments)
- [Sanity External Comments API Request (GitHub #7610)](https://github.com/sanity-io/sanity/issues/7610)
- [Sanity Plugins API](https://www.sanity.io/docs/studio/plugins-api-reference)
- [Sanity Presentation Tool](https://www.sanity.io/docs/visual-editing/presentation-tool)
