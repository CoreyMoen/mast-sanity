import {Suspense} from 'react'

import ResolvedLink from '@/app/components/ResolvedLink'
import {CallToAction} from '@/sanity.types'

type CtaProps = {
  block: CallToAction
  index: number
}

export default function CTA({block}: CtaProps) {
  return (
    <div className="container my-12">
      <div className="bg-muted-background border border-border rounded-2xl max-w-3xl">
        <div className="px-12 py-12 flex flex-col gap-6">
          <div className="max-w-xl flex flex-col gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {block.heading}
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">{block.text}</p>
          </div>

          <Suspense fallback={null}>
            <div className="flex items-center gap-x-6 lg:mt-0 lg:flex-shrink-0">
              <ResolvedLink
                link={block.link}
                className="rounded-[0.5rem] flex gap-2 mr-6 items-center bg-brand hover:bg-brand-dark focus:bg-brand-dark py-3 px-6 text-white transition-colors duration-300"
              >
                {block.buttonText}
              </ResolvedLink>
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  )
}
