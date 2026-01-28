'use client'

import {stegaClean} from 'next-sanity'
import Image from 'next/image'
import {urlForImage, getBlurDataUrl} from '@/sanity/lib/utils'
import {Slider, SliderSlide} from '../ui/slider'

/**
 * Image Slide - simplified structure with direct image field.
 * For other slide types, create separate slider components.
 */
interface ImageSlide {
  _key: string
  _type: 'imageSlide'
  image?: any
  alt?: string
  caption?: string
}

type SlidesPerView = 1 | 2 | 3 | 4 | 5 | 6
type GapSize = '0' | '2' | '4' | '6' | '8'
type NavigationPosition = 'below' | 'overlay-center' | 'overlay-edges' | 'sides'
type SlideEffect = 'slide' | 'fade'

interface SliderBlockProps {
  block: {
    _key: string
    _type: string
    slides?: ImageSlide[]
    slidesPerViewDesktop?: number
    slidesPerViewTablet?: number
    slidesPerViewMobile?: number
    gap?: string
    autoplay?: boolean
    autoplayDelay?: number
    loop?: boolean
    showNavigation?: boolean
    navigationPosition?: string
    showPagination?: boolean
    effect?: string
    speed?: number
    centeredSlides?: boolean
    overflowVisible?: boolean
    aspectRatio?: string
  }
  index: number
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

export default function SliderBlock({block}: SliderBlockProps) {
  const {
    slides,
    slidesPerViewDesktop = 3,
    slidesPerViewTablet = 2,
    slidesPerViewMobile = 1,
    gap = '4',
    autoplay = false,
    autoplayDelay = 4000,
    loop = false,
    showNavigation = true,
    navigationPosition = 'below',
    showPagination = true,
    effect = 'slide',
    speed = 500,
    centeredSlides = false,
    overflowVisible = false,
    aspectRatio = '16/9',
  } = block

  if (!slides || slides.length === 0) return null

  const cleanAspectRatio = stegaClean(aspectRatio)
  const aspectStyle = aspectRatioStyles[cleanAspectRatio]

  return (
    <div className="my-6">
      <Slider
        slidesPerViewDesktop={stegaClean(slidesPerViewDesktop) as SlidesPerView}
        slidesPerViewTablet={stegaClean(slidesPerViewTablet) as SlidesPerView}
        slidesPerViewMobile={stegaClean(slidesPerViewMobile) as SlidesPerView}
        gap={stegaClean(gap) as GapSize}
        autoplay={stegaClean(autoplay)}
        autoplayDelay={stegaClean(autoplayDelay)}
        loop={stegaClean(loop)}
        showNavigation={stegaClean(showNavigation)}
        navigationPosition={stegaClean(navigationPosition) as NavigationPosition}
        showPagination={stegaClean(showPagination)}
        effect={stegaClean(effect) as SlideEffect}
        speed={stegaClean(speed)}
        centeredSlides={stegaClean(centeredSlides)}
        overflowVisible={stegaClean(overflowVisible)}
      >
        {slides.map((slide) => {
          const imageUrl = urlForImage(slide.image)?.url()
          const blurDataUrl = getBlurDataUrl(slide.image)

          if (!imageUrl) {
            return (
              <SliderSlide key={slide._key}>
                <div className="w-full bg-muted-background text-center text-muted-foreground p-8 rounded">
                  No image selected
                </div>
              </SliderSlide>
            )
          }

          return (
            <SliderSlide key={slide._key}>
              <figure>
                <div
                  className="relative overflow-hidden rounded-lg"
                  style={aspectStyle ? {aspectRatio: aspectStyle} : undefined}
                >
                  <Image
                    src={imageUrl}
                    alt={slide.alt || ''}
                    fill={!!aspectStyle}
                    width={aspectStyle ? undefined : 1200}
                    height={aspectStyle ? undefined : 800}
                    className={aspectStyle ? 'object-cover' : 'w-full h-auto'}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    placeholder={blurDataUrl ? 'blur' : 'empty'}
                    blurDataURL={blurDataUrl}
                  />
                </div>
                {slide.caption && (
                  <figcaption className="mt-2 text-sm text-muted-foreground text-center">
                    {slide.caption}
                  </figcaption>
                )}
              </figure>
            </SliderSlide>
          )
        })}
      </Slider>
    </div>
  )
}
