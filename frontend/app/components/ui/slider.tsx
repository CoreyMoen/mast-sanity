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

// Import Mast CSS component styles
import '@/app/components/slider.css'

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

// Convert gap scale to pixels
const gapToPixels: Record<string, number> = {
  '0': 0,
  '2': 8,
  '4': 16,
  '6': 24,
  '8': 32,
}

// Navigation position class mapping
const navPositionClasses: Record<NavigationPosition, string> = {
  below: '',
  'overlay-center': 'cc-nav-overlay-center',
  'overlay-edges': 'cc-nav-overlay-edges',
  sides: 'cc-nav-sides',
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

  // Determine navigation position type
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
    overlay = false,
    overlayEdge = false,
  }: {
    direction: 'prev' | 'next'
    onClick: () => void
    disabled: boolean
    overlay?: boolean
    overlayEdge?: boolean
  }) => (
    <button
      onClick={onClick}
      disabled={disabled && !loop}
      className={cn(
        'slider-nav_button',
        overlay && 'cc-overlay',
        overlayEdge && 'cc-overlay-edge',
        overlayEdge && direction === 'prev' && 'cc-prev',
        overlayEdge && direction === 'next' && 'cc-next'
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
  const CustomPagination = ({standalone = false, overlayBottom = false}: {standalone?: boolean; overlayBottom?: boolean}) => {
    if (!showPagination || totalSlides <= 1) return null
    return (
      <div
        className={cn(
          'slider-pagination',
          standalone && 'cc-standalone',
          overlayBottom && 'cc-overlay-bottom'
        )}
      >
        {Array.from({length: totalSlides}).map((_, index) => (
          <button
            key={index}
            onClick={() => swiperInstance?.slideToLoop(index)}
            className={cn(
              'slider-pagination_button',
              index === activeIndex && 'cc-active'
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
        'slider-component',
        navPositionClasses[navigationPosition],
        overflowVisible && 'cc-overflow-visible',
        className
      )}
      style={{
        '--slider-slides-desktop': slidesPerViewDesktop,
        '--slider-slides-tablet': slidesPerViewTablet,
        '--slider-slides-mobile': slidesPerViewMobile,
      } as React.CSSProperties}
    >
      {/* Side Navigation - Left */}
      {showNavigation && isSides && (
        <div className="slider-nav cc-sides-left">
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
      >
        {slides.map((child, index) => (
          <SwiperSlide key={index}>{child}</SwiperSlide>
        ))}
      </Swiper>

      {/* Side Navigation - Right */}
      {showNavigation && isSides && (
        <div className="slider-nav cc-sides-right">
          <NavButton direction="next" onClick={handleNext} disabled={isEnd} />
        </div>
      )}

      {/* Overlay Navigation - Center */}
      {showNavigation && navigationPosition === 'overlay-center' && (
        <div className="slider-nav cc-overlay-center">
          <NavButton direction="prev" onClick={handlePrev} disabled={isBeginning} overlay />
          <CustomPagination />
          <NavButton direction="next" onClick={handleNext} disabled={isEnd} overlay />
        </div>
      )}

      {/* Overlay Navigation - Edges */}
      {showNavigation && navigationPosition === 'overlay-edges' && (
        <>
          <NavButton
            direction="prev"
            onClick={handlePrev}
            disabled={isBeginning}
            overlay
            overlayEdge
          />
          <NavButton
            direction="next"
            onClick={handleNext}
            disabled={isEnd}
            overlay
            overlayEdge
          />
          {showPagination && <CustomPagination overlayBottom />}
        </>
      )}

      {/* Below Navigation (default) */}
      {showNavigation && isBelow && (
        <div className="slider-nav cc-below">
          <NavButton direction="prev" onClick={handlePrev} disabled={isBeginning} />
          <CustomPagination />
          <NavButton direction="next" onClick={handleNext} disabled={isEnd} />
        </div>
      )}

      {/* Pagination only (no navigation) */}
      {!showNavigation && showPagination && <CustomPagination standalone />}
    </div>
  )
}

// Individual slide wrapper for semantic clarity (kept for backwards compatibility)
export function SliderSlide({children, className}: {children: React.ReactNode; className?: string}) {
  return <div className={cn('slider-slide', className)}>{children}</div>
}
