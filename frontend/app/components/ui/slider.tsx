'use client'

import * as React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Fade from 'embla-carousel-fade'
import {CaretLeft, CaretRight} from '@phosphor-icons/react'
import {cn} from '@/lib/utils'

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

const gapClasses: Record<string, string> = {
  '0': 'gap-0',
  '2': 'gap-2',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
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
  const plugins = React.useMemo(() => {
    const pluginList = []
    if (autoplay) {
      pluginList.push(
        Autoplay({
          delay: autoplayDelay,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
        })
      )
    }
    if (effect === 'fade') {
      pluginList.push(Fade())
    }
    return pluginList
  }, [autoplay, autoplayDelay, effect])

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop,
      align: centeredSlides ? 'center' : 'start',
      slidesToScroll: 1,
      duration: speed,
      containScroll: centeredSlides ? false : 'trimSnaps',
    },
    plugins
  )

  const [prevBtnDisabled, setPrevBtnDisabled] = React.useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = React.useState(true)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([])

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = React.useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [emblaApi])

  React.useEffect(() => {
    if (!emblaApi) return
    onSelect()
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

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
      disabled={disabled}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border transition-all',
        navigationPosition.startsWith('overlay')
          ? 'border-white/30 bg-white/90 backdrop-blur-sm hover:bg-white disabled:bg-white/50'
          : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50',
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

  // Pagination component
  const Pagination = () => {
    if (!showPagination || scrollSnaps.length <= 1) return null
    return (
      <div className="flex items-center gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              index === selectedIndex ? 'bg-brand w-4' : 'bg-gray-300 hover:bg-gray-400'
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === selectedIndex ? 'true' : 'false'}
          />
        ))}
      </div>
    )
  }

  // Determine if navigation is overlay style
  const isOverlay = navigationPosition.startsWith('overlay')
  const isSides = navigationPosition === 'sides'

  return (
    <div
      className={cn(
        'relative',
        isSides && 'px-14', // Add padding for side navigation
        className
      )}
      style={
        {
          '--slides-desktop': slidesPerViewDesktop,
          '--slides-tablet': slidesPerViewTablet,
          '--slides-mobile': slidesPerViewMobile,
          '--gap': gap === '0' ? '0px' : `${parseInt(gap) * 4}px`,
        } as React.CSSProperties
      }
    >
      {/* Side Navigation - Left */}
      {showNavigation && isSides && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <NavButton direction="prev" onClick={scrollPrev} disabled={prevBtnDisabled} />
        </div>
      )}

      <div className={cn(overflowVisible ? 'overflow-visible' : 'overflow-hidden')} ref={emblaRef}>
        <div className={cn('flex', gapClasses[gap])}>
          {React.Children.map(children, (child, index) => (
            <div
              key={index}
              className="min-w-0 flex-shrink-0"
              style={{
                flex: `0 0 calc(100% / var(--slides-mobile) - var(--gap) * (var(--slides-mobile) - 1) / var(--slides-mobile))`,
              }}
            >
              <style jsx>{`
                @media (min-width: 768px) {
                  div {
                    flex: 0 0 calc(100% / var(--slides-tablet) - var(--gap) * (var(--slides-tablet) - 1) / var(--slides-tablet)) !important;
                  }
                }
                @media (min-width: 1024px) {
                  div {
                    flex: 0 0 calc(100% / var(--slides-desktop) - var(--gap) * (var(--slides-desktop) - 1) / var(--slides-desktop)) !important;
                  }
                }
              `}</style>
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Side Navigation - Right */}
      {showNavigation && isSides && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <NavButton direction="next" onClick={scrollNext} disabled={nextBtnDisabled} />
        </div>
      )}

      {/* Overlay Navigation - Center */}
      {showNavigation && navigationPosition === 'overlay-center' && (
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4 z-10">
          <NavButton direction="prev" onClick={scrollPrev} disabled={prevBtnDisabled} />
          <Pagination />
          <NavButton direction="next" onClick={scrollNext} disabled={nextBtnDisabled} />
        </div>
      )}

      {/* Overlay Navigation - Edges */}
      {showNavigation && navigationPosition === 'overlay-edges' && (
        <>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <NavButton direction="prev" onClick={scrollPrev} disabled={prevBtnDisabled} />
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <NavButton direction="next" onClick={scrollNext} disabled={nextBtnDisabled} />
          </div>
          {showPagination && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center z-10">
              <Pagination />
            </div>
          )}
        </>
      )}

      {/* Below Navigation (default) */}
      {showNavigation && navigationPosition === 'below' && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <NavButton direction="prev" onClick={scrollPrev} disabled={prevBtnDisabled} />
          <div className="mx-4">
            <Pagination />
          </div>
          <NavButton direction="next" onClick={scrollNext} disabled={nextBtnDisabled} />
        </div>
      )}

      {/* Pagination only (no navigation) */}
      {!showNavigation && showPagination && (
        <div className="flex justify-center mt-6">
          <Pagination />
        </div>
      )}
    </div>
  )
}

// Individual slide wrapper for semantic clarity
export function SliderSlide({children, className}: {children: React.ReactNode; className?: string}) {
  return <div className={cn('h-full', className)}>{children}</div>
}
