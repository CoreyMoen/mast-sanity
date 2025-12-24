import {stegaClean} from 'next-sanity'
import {ArrowRight, Download, ExternalLink} from 'lucide-react'
import ResolvedLink from '@/app/components/ResolvedLink'
import {Button} from '@/app/components/ui/button'
import {cn} from '@/lib/utils'

interface ButtonBlockProps {
  block: {
    _key: string
    _type: string
    text?: string
    link?: any
    variant?: 'primary' | 'secondary' | 'ghost'
    color?: 'black' | 'brand' | 'blue' | 'white'
    size?: 'sm' | 'md' | 'lg'
    align?: 'left' | 'center' | 'right' | 'full'
    icon?: 'none' | 'arrow-right' | 'external' | 'download'
  }
  index: number
}

// Alignment wrapper classes
const alignClasses: Record<string, string> = {
  left: 'flex justify-start',
  center: 'flex justify-center',
  right: 'flex justify-end',
  full: 'flex',
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
    text = 'Click here',
    link,
    variant = 'primary',
    color = 'black',
    size = 'md',
    align = 'left',
    icon = 'none',
  } = block

  // Clean stega encoding from values before using as lookup keys
  const cleanVariant = stegaClean(variant) as 'primary' | 'secondary' | 'ghost'
  const cleanColor = stegaClean(color) as 'black' | 'brand' | 'blue' | 'white'
  const cleanSize = stegaClean(size) as 'sm' | 'md' | 'lg'
  const cleanAlign = stegaClean(align)
  const cleanIcon = stegaClean(icon)

  const alignClass = alignClasses[cleanAlign] || alignClasses.left
  const fullWidthClass = cleanAlign === 'full' ? 'w-full' : ''

  return (
    <div className={cn(alignClass, 'mb-4')}>
      <Button
        variant={cleanVariant}
        colorScheme={cleanColor}
        size={cleanSize}
        rounded="full"
        className={fullWidthClass}
        asChild
      >
        <ResolvedLink link={link}>
          {text}
          {icons[cleanIcon]}
        </ResolvedLink>
      </Button>
    </div>
  )
}
