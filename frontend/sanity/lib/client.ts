import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId, studioUrl} from '@/sanity/lib/api'
import {token} from './token'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  token, // Required if you have a private dataset
  stega: {
    // Stega is disabled by default - defineLive will enable it automatically
    // when in draft mode (Presentation tool or Vercel Toolbar Edit Mode)
    enabled: false,
    studioUrl,
    // Set logger to 'console' for more verbose logging
    // logger: console,
    filter: (props) => {
      if (props.sourcePath.at(-1) === 'title') {
        return true
      }

      return props.filterDefault(props)
    },
  },
})
