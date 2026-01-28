import {stegaClean} from 'next-sanity'
import Image from 'next/image'
import {urlForImage, getBlurDataUrl} from '@/sanity/lib/utils'

interface ImageBlockProps {
  block: {
    _key: string
    _type: string
    image?: any
    alt?: string
    caption?: string
    size?: 'full' | 'lg' | 'md' | 'sm' | 'thumb'
    aspectRatio?: 'original' | '16/9' | '4/3' | '1/1' | '3/4' | '9/16' | '16×9' | '4×3' | '1×1' | '3×4' | '9×16' | '16x9' | '4x3' | '1x1' | '3x4' | '9x16'
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
    shadow?: boolean
  }
  index: number
}

// Size mapping
const sizeClasses: Record<string, string> = {
  full: 'w-full',
  lg: 'max-w-4xl',
  md: 'max-w-2xl',
  sm: 'max-w-md',
  thumb: 'max-w-xs',
}

// Aspect ratio CSS values
const aspectRatioStyles: Record<string, string | undefined> = {
  original: undefined,
  '16/9': '16/9',
  '4/3': '4/3',
  '1/1': '1/1',
  '3/4': '3/4',
  '9/16': '9/16',
  // Legacy values (with × multiplication sign) - normalize to standard format
  '16×9': '16/9',
  '4×3': '4/3',
  '1×1': '1/1',
  '3×4': '3/4',
  '9×16': '9/16',
  // Legacy values (with letter x) - normalize to standard format
  '16x9': '16/9',
  '4x3': '4/3',
  '1x1': '1/1',
  '3x4': '3/4',
  '9x16': '9/16',
}

// Rounded corners
const roundedClasses: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-2xl',
  full: 'rounded-full',
}

export default function ImageBlock({block}: ImageBlockProps) {
  const {
    image,
    alt = '',
    caption,
    size = 'full',
    aspectRatio = 'original',
    rounded = 'none',
    shadow = false,
  } = block

  const imageUrl = urlForImage(image)?.url()
  const blurDataUrl = getBlurDataUrl(image)

  if (!imageUrl) {
    return (
      <div className="w-full bg-muted-background text-center text-muted-foreground p-8 rounded my-2">
        No image selected
      </div>
    )
  }

  // Clean stega encoding from values before using as lookup keys
  const cleanSize = stegaClean(size)
  const cleanRounded = stegaClean(rounded)
  const cleanAspectRatio = stegaClean(aspectRatio)

  const sizeClass = sizeClasses[cleanSize] || sizeClasses.full
  const roundedClass = roundedClasses[cleanRounded] || roundedClasses.none
  const shadowClass = shadow ? 'shadow-lg' : ''
  const aspectStyle = aspectRatioStyles[cleanAspectRatio]

  return (
    <figure className={`${sizeClass} mb-4`}>
      <div
        className={`relative overflow-hidden ${roundedClass} ${shadowClass}`}
        style={aspectStyle ? {aspectRatio: aspectStyle} : undefined}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill={!!aspectStyle}
          width={aspectStyle ? undefined : 1200}
          height={aspectStyle ? undefined : 800}
          className={`${aspectStyle ? 'object-cover' : 'w-full h-auto'} ${roundedClass}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          placeholder={blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={blurDataUrl}
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
