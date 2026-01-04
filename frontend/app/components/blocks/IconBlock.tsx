import {stegaClean} from 'next-sanity'
import {cn} from '@/lib/utils'
import {Icon, type IconSize, type IconColor} from '@/app/components/ui/icon-component'
import {
  CheckCircle,
  Target,
  Star,
  Trophy,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  ArrowDown,
  ShuffleSimple,
  LightbulbFilament,
  Barbell,
  Feather,
  Heart,
  Lightning,
  Rocket,
  Globe,
  Users,
  ChartLineUp,
  ShieldCheck,
  Clock,
  Calendar,
  Envelope,
  Phone,
  MapPin,
  Link,
  Code,
  Gear,
  Palette,
  Pencil,
  Trash,
  Download,
  Upload,
  Eye,
  Lock,
  Key,
  Sparkle,
  Fire,
  Sun,
  Moon,
  MoonStars,
  Cloud,
  Tree,
  Leaf,
  Compass,
  Anchor,
  Boat,
} from '@phosphor-icons/react/dist/ssr'
import type {Icon as PhosphorIcon} from '@phosphor-icons/react'

interface IconBlockProps {
  block: {
    _key: string
    _type: string
    icon?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    color?: 'inherit' | 'brand' | 'blue'
    marginBottom?: '0' | 'sm' | 'md' | 'lg'
  }
  index: number
}

// Map of icon names to Phosphor components
const iconMap: Record<string, PhosphorIcon> = {
  'check-circle': CheckCircle,
  target: Target,
  star: Star,
  trophy: Trophy,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  'arrow-left': ArrowLeft,
  'arrow-down': ArrowDown,
  'shuffle-simple': ShuffleSimple,
  'lightbulb-filament': LightbulbFilament,
  barbell: Barbell,
  feather: Feather,
  heart: Heart,
  lightning: Lightning,
  rocket: Rocket,
  globe: Globe,
  users: Users,
  'chart-line-up': ChartLineUp,
  'shield-check': ShieldCheck,
  clock: Clock,
  calendar: Calendar,
  envelope: Envelope,
  phone: Phone,
  'map-pin': MapPin,
  link: Link,
  code: Code,
  gear: Gear,
  palette: Palette,
  pencil: Pencil,
  trash: Trash,
  download: Download,
  upload: Upload,
  eye: Eye,
  lock: Lock,
  key: Key,
  sparkle: Sparkle,
  fire: Fire,
  sun: Sun,
  moon: Moon,
  'moon-stars': MoonStars,
  cloud: Cloud,
  tree: Tree,
  leaf: Leaf,
  compass: Compass,
  anchor: Anchor,
  boat: Boat,
}

// Margin bottom classes
const marginClasses: Record<string, string> = {
  '0': 'mb-0',
  sm: 'mb-2',
  md: 'mb-4',
  lg: 'mb-6',
}

export default function IconBlock({block}: IconBlockProps) {
  const {icon = 'check-circle', size = 'md', color = 'inherit', marginBottom = 'sm'} = block

  // Clean stega encoding
  const cleanIcon = stegaClean(icon)
  const cleanSize = stegaClean(size) as IconSize
  const cleanColor = stegaClean(color) as IconColor
  const cleanMargin = stegaClean(marginBottom) as '0' | 'sm' | 'md' | 'lg'

  const IconComponent = iconMap[cleanIcon]

  if (!IconComponent) {
    return null
  }

  return (
    <div className={cn(marginClasses[cleanMargin] || marginClasses.sm)}>
      <Icon icon={IconComponent} size={cleanSize} color={cleanColor} />
    </div>
  )
}
