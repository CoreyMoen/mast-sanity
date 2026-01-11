/**
 * StudioLayout Component
 *
 * Custom studio layout wrapper that renders the FloatingChat
 * component on top of the default Studio layout.
 *
 * This component wraps the entire Studio UI, making the floating
 * chat accessible from any tool (Structure, Presentation, Vision, etc.)
 */

import type {LayoutProps} from 'sanity'
import {FloatingChat} from './FloatingChat'

export interface StudioLayoutProps extends LayoutProps {
  /** API endpoint for Claude requests */
  apiEndpoint?: string
}

/**
 * Custom Studio Layout with Floating Claude Chat
 *
 * Usage in sanity.config.ts:
 * ```ts
 * import {StudioLayout} from './src/plugins/claude-assistant'
 *
 * export default defineConfig({
 *   // ...
 *   studio: {
 *     components: {
 *       layout: (props) => <StudioLayout {...props} apiEndpoint="/api/claude" />
 *     }
 *   }
 * })
 * ```
 */
export function StudioLayout(props: StudioLayoutProps) {
  const {renderDefault, apiEndpoint} = props

  return (
    <>
      {/* Render the default Studio layout */}
      {renderDefault(props)}

      {/* Floating Claude Chat overlay */}
      <FloatingChat apiEndpoint={apiEndpoint} />
    </>
  )
}

/**
 * Factory function to create a StudioLayout with custom options
 *
 * Usage in sanity.config.ts:
 * ```ts
 * import {createStudioLayout} from './src/plugins/claude-assistant'
 *
 * export default defineConfig({
 *   // ...
 *   studio: {
 *     components: {
 *       layout: createStudioLayout({ apiEndpoint: '/api/claude' })
 *     }
 *   }
 * })
 * ```
 */
export function createStudioLayout(options: {apiEndpoint?: string} = {}) {
  return function CustomStudioLayout(props: LayoutProps) {
    return <StudioLayout {...props} apiEndpoint={options.apiEndpoint} />
  }
}

export default StudioLayout
