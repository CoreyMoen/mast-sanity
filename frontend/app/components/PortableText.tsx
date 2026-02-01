/**
 * This component uses Portable Text to render a post body.
 *
 * You can learn more about Portable Text on:
 * https://www.sanity.io/docs/block-content
 * https://github.com/portabletext/react-portabletext
 * https://portabletext.org/
 *
 */

import {PortableText, type PortableTextComponents, type PortableTextBlock} from 'next-sanity'

import ResolvedLink from '@/app/components/ResolvedLink'
import {resolveInlineVariable} from '@/app/lib/resolveContentVariable'
import type {ContentVariableInline} from '@/app/types/blocks'

// Anchor link icon for headings
function AnchorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  )
}

// Heading wrapper with anchor link
function HeadingWithAnchor({
  as: Tag,
  className,
  anchorKey,
  children,
}: {
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className: string
  anchorKey?: string
  children: React.ReactNode
}) {
  return (
    <Tag className={`${className} group relative`}>
      {children}
      <a
        href={`#${anchorKey}`}
        className="absolute left-0 top-0 bottom-0 -ml-6 flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <AnchorIcon />
      </a>
    </Tag>
  )
}

export default function CustomPortableText({
  className,
  value,
  disableProse = false,
}: {
  className?: string
  value: PortableTextBlock[]
  disableProse?: boolean
}) {
  const components: PortableTextComponents = {
    block: {
      normal: ({children}) => <p>{children}</p>,
      h1: ({children, value}) => (
        <HeadingWithAnchor as="h1" className="text-h1" anchorKey={value?._key}>
          {children}
        </HeadingWithAnchor>
      ),
      h2: ({children, value}) => (
        <HeadingWithAnchor as="h2" className="text-h2" anchorKey={value?._key}>
          {children}
        </HeadingWithAnchor>
      ),
      h3: ({children, value}) => (
        <HeadingWithAnchor as="h3" className="text-h3" anchorKey={value?._key}>
          {children}
        </HeadingWithAnchor>
      ),
      h4: ({children, value}) => (
        <HeadingWithAnchor as="h4" className="text-h4" anchorKey={value?._key}>
          {children}
        </HeadingWithAnchor>
      ),
      h5: ({children, value}) => (
        <HeadingWithAnchor as="h5" className="text-h5" anchorKey={value?._key}>
          {children}
        </HeadingWithAnchor>
      ),
      h6: ({children, value}) => (
        <HeadingWithAnchor as="h6" className="text-h6" anchorKey={value?._key}>
          {children}
        </HeadingWithAnchor>
      ),
    },
    marks: {
      link: ({children, value: link}) => {
        return <ResolvedLink link={link}>{children}</ResolvedLink>
      },
    },
    types: {
      // Inline Content Variable - renders the resolved text value inline
      contentVariableInline: ({value}: {value: ContentVariableInline}) => {
        const resolvedText = resolveInlineVariable(value)
        return <span data-variable-key={value.reference?.key?.current}>{resolvedText}</span>
      },
    },
  }

  const wrapperClasses = disableProse
    ? [className].filter(Boolean).join(' ')
    : ['prose prose-a:text-brand max-w-none', className].filter(Boolean).join(' ')

  return (
    <div className={wrapperClasses || undefined}>
      <PortableText components={components} value={value} />
    </div>
  )
}
