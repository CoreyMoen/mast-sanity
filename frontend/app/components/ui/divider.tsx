import {cn} from '@/lib/utils'

/**
 * Divider component - Mast design system horizontal rule
 *
 * A horizontal divider/border with configurable top and bottom spacing
 * using the project's spacing scale.
 *
 * @example
 * <Divider />
 * <Divider marginTop="8" marginBottom="12" />
 * <Divider color="brand" marginTop="16" />
 */

export type SpacingSize = '0' | '2' | '4' | '6' | '8' | '12' | '16' | '24'
export type DividerColor = 'default' | 'light' | 'dark' | 'brand' | 'blue'

interface DividerProps {
  marginTop?: SpacingSize
  marginBottom?: SpacingSize
  color?: DividerColor
  className?: string
}

// Margin top classes using Tailwind spacing
const marginTopClasses: Record<SpacingSize, string> = {
  '0': 'mt-0',
  '2': 'mt-2',
  '4': 'mt-4',
  '6': 'mt-6',
  '8': 'mt-8',
  '12': 'mt-12',
  '16': 'mt-16',
  '24': 'mt-24',
}

// Margin bottom classes using Tailwind spacing
const marginBottomClasses: Record<SpacingSize, string> = {
  '0': 'mb-0',
  '2': 'mb-2',
  '4': 'mb-4',
  '6': 'mb-6',
  '8': 'mb-8',
  '12': 'mb-12',
  '16': 'mb-16',
  '24': 'mb-24',
}

// Border color classes
// Default uses --primary-border which switches between Mid Gray 1 (light) and Mid Gray 2 (dark)
const colorClasses: Record<DividerColor, string> = {
  default: 'border-[var(--primary-border)]',
  light: 'border-[var(--primary-border)]/50',
  dark: 'border-foreground/40',
  brand: 'border-brand',
  blue: 'border-blue',
}

export function Divider({
  marginTop = '8',
  marginBottom = '8',
  color = 'default',
  className,
}: DividerProps) {
  return (
    <hr
      className={cn(
        'w-full border-0 border-t',
        marginTopClasses[marginTop],
        marginBottomClasses[marginBottom],
        colorClasses[color],
        className,
      )}
    />
  )
}

export default Divider
