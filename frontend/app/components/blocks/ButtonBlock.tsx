import {stegaClean} from 'next-sanity'
import {ArrowRight, Download, ExternalLink} from 'lucide-react'
import ResolvedLink from '@/app/components/ResolvedLink'
import {Button} from '@/app/components/ui/button'
import {linkResolver} from '@/sanity/lib/utils'
import {cn} from '@/lib/utils'
import {resolveSmartString} from '@/app/lib/resolveContentVariable'
import type {SmartString} from '@/app/types/blocks'

interface ButtonBlockProps {
  block: {
    _key: string
    _type: string
    text?: SmartString | string
    link?: any
    variant?: 'primary' | 'secondary' | 'ghost'
    /** Brand, black, or white. Legacy 'blue' maps to 'brand' */
    color?: 'brand' | 'black' | 'white' | 'blue'
    icon?: 'none' | 'arrow-right' | 'external' | 'download'
  }
  index: number
}

// Icon components using Lucide (shadcn's icon library)
const icons: Record<string, React.ReactNode> = {
  none: null,
  'arrow-right': <ArrowRight className="h-4 w-4 ml-2" />,
  external: <ExternalLink className="h-4 w-4 ml-2" />,
  download: <Download className="h-4 w-4 ml-2" />,
}

export default function ButtonBlock({block}: ButtonBlockProps) {
  const {
    text,
    link,
    variant = 'primary',
    color = 'brand',
    icon = 'none',
  } = block

  // Resolve SmartString to text value (handles both static text and variable references)
  const resolvedText = resolveSmartString(text, 'Click here')

  // Clean stega encoding from values before using as lookup keys
  const cleanVariant = stegaClean(variant) as 'primary' | 'secondary' | 'ghost'
  // Map legacy 'blue' color to 'brand' for backwards compatibility
  const rawColor = stegaClean(color)
  const cleanColor = (rawColor === 'blue' ? 'brand' : rawColor) as 'brand' | 'black' | 'white'
  const cleanIcon = stegaClean(icon)

  // Check if link is valid
  const resolvedLink = linkResolver(link)
  const hasValidLink = typeof resolvedLink === 'string'

  // If no valid link, render button without asChild to maintain proper styling
  // Add magenta dashed outline to indicate missing link in preview/edit mode
  if (!hasValidLink) {
    return (
      <Button
        variant={cleanVariant}
        colorScheme={cleanColor}
        className="outline outline-3 outline-offset-3 outline-dashed outline-[#FF00FF] cursor-not-allowed"
      >
        {resolvedText}
        {icons[cleanIcon]}
      </Button>
    )
  }

  return (
    <Button
      variant={cleanVariant}
      colorScheme={cleanColor}
      asChild
    >
      <ResolvedLink link={link}>
        {resolvedText}
        {icons[cleanIcon]}
      </ResolvedLink>
    </Button>
  )
}
