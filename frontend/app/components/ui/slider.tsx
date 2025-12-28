'use client'

import * as React from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import {Navigation, Pagination, Autoplay, EffectFade} from 'swiper/modules'
import type {Swiper as SwiperType} from 'swiper'
import {CaretLeft, CaretRight} from '@phosphor-icons/react'
import {cn} from '@/lib/utils'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

type SlidesPerView = 1 | 2 | 3 | 4 | 5 | 6
type NavigationPosition = 'below' | 'overlay-center' | 'overlay-edges' | 'sides'
type SlideEffect = 'slide' | 'fade'

interface SliderProps {
  children: React.ReactNode
  slidesPerViewDesktop?: SlidesPerView
  slidesPerViewTablet?: SlidesPerView
  slidesPerViewMobile?: SlidesPerView
  gap?: '0' | '2' | '4' | '6' | '8'
  autoplay?: boolean
  autoplayDelay?: number
  loop?: boolean
  showNavigation?: boolean
  navigationPosition?: NavigationPosition
  showPagination?: boolean
  effect?: SlideEffect
  speed?: number
  centeredSlides?: boolean
  overflowVisible?: boolean
  className?: string
}

// Convert Tailwind spacing scale to pixels
const gapToPixels: Record<string, number> = {
  '0': 0,
  '2': 8,
  '4': 16,
  '6': 24,
  '8': 32,
}

export function Slider({
  children,
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
  className,
}: SliderProps) {
  const [swiperInstance, setSwiperInstance] = React.useState<SwiperType | null>(null)
  const [isBeginning, setIsBeginning] = React.useState(true)
  const [isEnd, setIsEnd] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [totalSlides, setTotalSlides] = React.useState(0)

  const spaceBetween = gapToPixels[gap] || 16

  // Determine if navigation is overlay or sides style
  const isOverlay = navigationPosition.startsWith('overlay')
  const isSides = navigationPosition === 'sides'
  const isBelow = navigationPosition === 'below'

  // Custom navigation handlers
  const handlePrev = React.useCallback(() => {
    swiperInstance?.slidePrev()
  }, [swiperInstance])

  const handleNext = React.useCallback(() => {
    swiperInstance?.slideNext()
  }, [swiperInstance])

  const handleSlideChange = React.useCallback((swiper: SwiperType) => {
    setIsBeginning(swiper.isBeginning)
    setIsEnd(swiper.isEnd)
    setActiveIndex(swiper.realIndex)
  }, [])

  const handleInit = React.useCallback((swiper: SwiperType) => {
    setSwiperInstance(swiper)
    setIsBeginning(swiper.isBeginning)
    setIsEnd(swiper.isEnd)
    setActiveIndex(swiper.realIndex)
    setTotalSlides(swiper.slides.length)
  }, [])

  // Navigation button component
  const NavButton = ({
    direction,
    onClick,
    disabled,
  }: {
    direction: 'prev' | 'next'
    onClick: () => void
    disabled: boolean
  }) => (
    <button
      onClick={onClick}
      disabled={disabled && !loop}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border transition-all cursor-pointer',
        isOverlay
          ? 'border-white/30 bg-white/90 backdrop-blur-sm hover:bg-white disabled:bg-white/50 text-foreground'
          : 'border-brand bg-brand text-white hover:bg-brand/90',
        'disabled:opacity-40 disabled:cursor-not-allowed'
      )}
      aria-label={direction === 'prev' ? 'Previous slide' : 'Next slide'}
    >
      {direction === 'prev' ? (
        <CaretLeft className="h-5 w-5" weight="bold" />
      ) : (
        <CaretRight className="h-5 w-5" weight="bold" />
      )}
    </button>
  )

  // Custom pagination component
  const CustomPagination = () => {
    if (!showPagination || totalSlides <= 1) return null
    return (
      <div className="flex items-center gap-2">
        {Array.from({length: totalSlides}).map((_, index) => (
          <button
            key={index}
            onClick={() => swiperInstance?.slideToLoop(index)}
            className={cn(
              'h-2 w-2 rounded-full transition-all cursor-pointer',
              index === activeIndex ? 'bg-brand w-4' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : 'false'}
          />
        ))}
      </div>
    )
  }

  // Build modules array
  const modules = React.useMemo(() => {
    const mods = [Navigation, Pagination]
    if (autoplay) mods.push(Autoplay)
    if (effect === 'fade') mods.push(EffectFade)
    return mods
  }, [autoplay, effect])

  // Convert children to array for SwiperSlide wrapping
  const slides = React.Children.toArray(children)

  return (
    <div
      className={cn(
        'relative slider-container',
        isSides && 'px-14',
        className
      )}
    >
      {/* Side Navigation - Left */}
      {showNavigation && isSides && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <NavButton direction="prev" onClick={handlePrev} disabled={isBeginning} />
        </div>
      )}

      <Swiper
        modules={modules}
        spaceBetween={spaceBetween}
        slidesPerView={slidesPerViewMobile}
        breakpoints={{
          768: {
            slidesPerView: slidesPerViewTablet,
          },
          1024: {
            slidesPerView: slidesPerViewDesktop,
          },
        }}
        loop={loop}
        speed={speed}
        centeredSlides={centeredSlides}
        effect={effect}
        fadeEffect={effect === 'fade' ? {crossFade: true} : undefined}
        autoplay={
          autoplay
            ? {
                delay: autoplayDelay,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        onSwiper={handleInit}
        onSlideChange={handleSlideChange}
        className={cn(overflowVisible && 'overflow-visible')}
        style={overflowVisible ? {overflow: 'visible'} : undefined}
      >
        {slides.map((child, index) => (
          <SwiperSlide key={index}>{child}</SwiperSlide>
        ))}
      </Swiper>

      {/* Side Navigation - Right */}
      {showNavigation && isSides && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <NavButton direction="next" onClick={handleNext} disabled={isEnd} />
        </div>
      )}

      {/* Overlay Navigation - Center */}
      {showNavigation && navigationPosition === 'overlay-center' && (
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4 z-10">
          <NavButton direction="prev" onClick={handlePrev} disabled={isBeginning} />
          <CustomPagination />
          <NavButton direction="next" onClick={handleNext} disabled={isEnd} />
        </div>
      )}

      {/* Overlay Navigation - Edges */}
      {showNavigation && navigationPosition === 'overlay-edges' && (
        <>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <NavButton direction="prev" onClick={handlePrev} disabled={isBeginning} />
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <NavButton direction="next" onClick={handleNext} disabled={isEnd} />
          </div>
          {showPagination && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center z-10">
              <CustomPagination />
            </div>
          )}
        </>
      )}

      {/* Below Navigation (default) */}
      {showNavigation && isBelow && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <NavButton direction="prev" onClick={handlePrev} disabled={isBeginning} />
          <div className="mx-4">
            <CustomPagination />
          </div>
          <NavButton direction="next" onClick={handleNext} disabled={isEnd} />
        </div>
      )}

      {/* Pagination only (no navigation) */}
      {!showNavigation && showPagination && (
        <div className="flex justify-center mt-6">
          <CustomPagination />
        </div>
      )}
    </div>
  )
}

// Individual slide wrapper for semantic clarity (kept for backwards compatibility)
export function SliderSlide({children, className}: {children: React.ReactNode; className?: string}) {
  return <div className={cn('h-full', className)}>{children}</div>
}
