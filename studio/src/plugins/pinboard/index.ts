/**
 * Pinboard Plugin for Sanity Studio
 *
 * A visual pinboard tool that displays all pages as cards in a pannable,
 * zoomable grid. Provides quick access to preview pages in Presentation
 * mode or edit them in Structure mode (where native comments are available).
 *
 * @example
 * ```ts
 * // sanity.config.ts
 * import {pinboard} from './src/plugins/pinboard'
 *
 * export default defineConfig({
 *   plugins: [
 *     pinboard(),
 *   ],
 * })
 * ```
 */

import {definePlugin, type Tool} from 'sanity'
import {PinboardTool, PinboardIcon} from './PinboardTool'
import type {PinboardOptions} from './types'
import './styles.css'

export const pinboard = definePlugin<PinboardOptions | void>((options) => {
  const {title = 'Pinboard'} = options || {}

  return {
    name: 'pinboard',
    tools: [
      {
        name: 'pinboard',
        title,
        icon: PinboardIcon,
        component: PinboardTool,
      } satisfies Tool,
    ],
  }
})

export type {PinboardOptions, PageDocument, PageStatus, PageWithStatus} from './types'
export {PinboardTool, PinboardIcon} from './PinboardTool'
