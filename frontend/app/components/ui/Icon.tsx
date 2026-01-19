import {type Icon as PhosphorIcon} from '@phosphor-icons/react'
import {cn} from '@/lib/utils'

/**
 * Icon component - Mast design system icon wrapper
 *
 * Uses Phosphor Icons library with predefined sizes and color options
 * matching the Mast framework.
 *
 * @example
 * import {CheckCircle, Target, Star} from '@phosphor-icons/react'
 *
 * <Icon icon={CheckCircle} size="md" color="brand" />
 * <Icon icon={Target} size="lg" color="blue" />
 * <Icon icon={Star} size="sm" />
 */

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'inherit'
export type IconColor = 'inherit' | 'foreground' | 'brand' | 'blue' | 'yellow' | 'black' | 'white' | 'gray' | 'muted'

interface IconProps {
  icon: PhosphorIcon
  size?: IconSize
  color?: IconColor
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  className?: string
}

// Size mapping matching Mast framework (in rem)
const sizeClasses: Record<IconSize, string> = {
  xs: 'text-[1rem]',
  sm: 'text-[1.5rem]',
  md: 'text-[2rem]',
  lg: 'text-[3rem]',
  xl: 'text-[4rem]',
  inherit: 'text-[1em]',
}

// Pixel sizes for Phosphor icons
const sizePixels: Record<IconSize, number | string> = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  inherit: '1em',
}

// Color mapping
const colorClasses: Record<IconColor, string> = {
  inherit: '',
  foreground: 'text-foreground',
  brand: 'text-brand',
  blue: 'text-blue',
  yellow: 'text-yellow',
  black: 'text-black',
  white: 'text-white',
  gray: 'text-muted-foreground',
  muted: 'text-muted-foreground',
}

export function Icon({
  icon: IconComponent,
  size = 'md',
  color = 'inherit',
  weight = 'regular',
  className,
}: IconProps) {
  const iconSize = sizePixels[size]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
    >
      <IconComponent size={iconSize} weight={weight} />
    </span>
  )
}

export default Icon
