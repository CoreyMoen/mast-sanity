import ResolvedLink from '@/app/components/ResolvedLink'

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

// Variant + Color combinations
const variantColorClasses: Record<string, Record<string, string>> = {
  primary: {
    black: 'bg-black text-white hover:bg-gray-800',
    brand: 'bg-brand text-white hover:bg-orange-600',
    blue: 'bg-blue text-white hover:bg-blue-700',
    white: 'bg-white text-black hover:bg-gray-100',
  },
  secondary: {
    black: 'border-2 border-black text-black hover:bg-black hover:text-white',
    brand: 'border-2 border-brand text-brand hover:bg-brand hover:text-white',
    blue: 'border-2 border-blue text-blue hover:bg-blue hover:text-white',
    white: 'border-2 border-white text-white hover:bg-white hover:text-black',
  },
  ghost: {
    black: 'text-black hover:bg-black/10',
    brand: 'text-brand hover:bg-brand/10',
    blue: 'text-blue hover:bg-blue/10',
    white: 'text-white hover:bg-white/10',
  },
}

// Size classes
const sizeClasses: Record<string, string> = {
  sm: 'py-2 px-4 text-sm',
  md: 'py-3 px-6 text-base',
  lg: 'py-4 px-8 text-lg',
}

// Alignment wrapper classes
const alignClasses: Record<string, string> = {
  left: 'flex justify-start',
  center: 'flex justify-center',
  right: 'flex justify-end',
  full: 'flex',
}

// Icons
const icons: Record<string, React.ReactNode> = {
  none: null,
  'arrow-right': (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 ml-2"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  external: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 ml-2"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  ),
  download: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 ml-2"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  ),
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

  const variantColors = variantColorClasses[variant] || variantColorClasses.primary
  const colorClass = variantColors[color] || variantColors.black
  const sizeClass = sizeClasses[size] || sizeClasses.md
  const alignClass = alignClasses[align] || alignClasses.left
  const fullWidthClass = align === 'full' ? 'w-full justify-center' : ''

  const buttonClasses = `
    inline-flex items-center rounded-full font-medium
    transition-colors duration-200
    ${colorClass}
    ${sizeClass}
    ${fullWidthClass}
  `.trim()

  return (
    <div className={`${alignClass} mb-4`}>
      <ResolvedLink link={link} className={buttonClasses}>
        {text}
        {icons[icon]}
      </ResolvedLink>
    </div>
  )
}
