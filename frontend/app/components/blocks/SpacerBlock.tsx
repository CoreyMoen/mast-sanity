interface SpacerBlockProps {
  block: {
    _key: string
    _type: string
    sizeDesktop?: string
    sizeMobile?: string
  }
  index: number
}

// Desktop spacing (lg breakpoint)
const desktopSizeClasses: Record<string, string> = {
  '2': 'lg:h-2',
  '4': 'lg:h-4',
  '6': 'lg:h-6',
  '8': 'lg:h-8',
  '12': 'lg:h-12',
  '16': 'lg:h-16',
  '24': 'lg:h-24',
}

// Mobile spacing (base)
const mobileSizeClasses: Record<string, string> = {
  '2': 'h-2',
  '4': 'h-4',
  '6': 'h-6',
  '8': 'h-8',
  '12': 'h-12',
  '16': 'h-16',
  '24': 'h-24',
}

export default function SpacerBlock({block}: SpacerBlockProps) {
  const {sizeDesktop = '8', sizeMobile = 'inherit'} = block

  // Calculate effective mobile size
  const effectiveMobileSize = sizeMobile === 'inherit' ? sizeDesktop : sizeMobile

  const desktopClass = desktopSizeClasses[sizeDesktop] || desktopSizeClasses['8']
  const mobileClass = mobileSizeClasses[effectiveMobileSize] || mobileSizeClasses['8']

  return <div className={`${mobileClass} ${desktopClass}`} aria-hidden="true" />
}
