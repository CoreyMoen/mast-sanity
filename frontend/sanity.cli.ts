/**
 * Minimal Sanity CLI config so commands like `sanity typegen generate`
 * can run from the frontend directory. The full Studio config lives in
 * ../studio/sanity.config.ts. The dataset and projectId here are only
 * used by typegen to validate the schema.
 */
import {defineCliConfig} from 'sanity/cli'

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  '<your-project-id>'

const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  'production'

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
})
