/**
 * Canvas Viewer Plugin for Sanity Studio
 *
 * A visual canvas tool that displays all pages as cards in a pannable,
 * zoomable grid. Provides quick access to preview pages in Presentation
 * mode or edit them in Structure mode (where native comments are available).
 *
 * @example
 * ```ts
 * // sanity.config.ts
 * import {canvasViewer} from './src/plugins/canvas-viewer'
 *
 * export default defineConfig({
 *   plugins: [
 *     canvasViewer(),
 *   ],
 * })
 * ```
 */

import {definePlugin, type Tool} from 'sanity'
import {CanvasViewerTool, CanvasViewerIcon} from './CanvasViewerTool'
import type {CanvasViewerOptions} from './types'
import './styles.css'

export const canvasViewer = definePlugin<CanvasViewerOptions | void>((options) => {
  const {title = 'Canvas'} = options || {}

  return {
    name: 'canvas-viewer',
    tools: [
      {
        name: 'canvas',
        title,
        icon: CanvasViewerIcon,
        component: CanvasViewerTool,
      } satisfies Tool,
    ],
  }
})

export type {CanvasViewerOptions, PageDocument, PageStatus, PageWithStatus} from './types'
export {CanvasViewerTool, CanvasViewerIcon} from './CanvasViewerTool'
