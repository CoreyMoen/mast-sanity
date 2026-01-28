import {draftMode} from 'next/headers'
import {notFound} from 'next/navigation'

import Section from '@/app/components/blocks/Section'
import {sanityFetch} from '@/sanity/lib/live'
import {sectionTemplateQuery} from '@/sanity/lib/queries'

type Props = {
  params: Promise<{id: string}>
}

export default async function SectionTemplatePreview(props: Props) {
  const params = await props.params
  const {isEnabled: isDraftMode} = await draftMode()

  const {data: template} = await sanityFetch({
    query: sectionTemplateQuery,
    params: {id: params.id},
  })

  if (!template?._id) {
    notFound()
  }

  // Transform the template into a section-compatible format
  const sectionBlock = {
    _key: template._id,
    _type: 'section',
    label: template.name,
    rows: template.rows || [],
    backgroundColor: template.backgroundColor,
    minHeight: template.minHeight,
    verticalAlign: template.verticalAlign,
    maxWidth: template.maxWidth,
    paddingTop: template.paddingTop,
  }

  return (
    <main className="min-h-screen">
      {/* Template Info Header (only in non-draft mode or as a subtle indicator) */}
      {!isDraftMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="container mx-auto">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Template Preview:</span> {template.name}
              {template.category && (
                <span className="ml-2 text-blue-500">({template.category})</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Render the section */}
      <Section
        block={sectionBlock}
        index={0}
        pageId={isDraftMode ? template._id : undefined}
        pageType={isDraftMode ? 'sectionTemplate' : undefined}
      />
    </main>
  )
}
