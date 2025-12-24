'use client'

import * as React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import {CaretLeft, CaretRight} from '@phosphor-icons/react'
import {cn} from '@/lib/utils'

type SlidesPerView = 1 | 2 | 3 | 4 | 5 | 6

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
  showPagination?: boolean
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
  showPagination = true,
  className,
}: SliderProps) {
  const plugins = React.useMemo(() => {
    if (autoplay) {
      return [
        Autoplay({
          delay: autoplayDelay,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
        }),
      ]
    }
    return []
  }, [autoplay, autoplayDelay])

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop,
      align: 'start',
      slidesToScroll: 1,
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

  // Calculate slide width based on breakpoint
  const slideWidthDesktop = `calc(${100 / slidesPerViewDesktop}% - ${gap === '0' ? '0px' : `var(--gap) * ${(slidesPerViewDesktop - 1) / slidesPerViewDesktop}`})`
  const slideWidthTablet = `calc(${100 / slidesPerViewTablet}% - ${gap === '0' ? '0px' : `var(--gap) * ${(slidesPerViewTablet - 1) / slidesPerViewTablet}`})`
  const slideWidthMobile = `calc(${100 / slidesPerViewMobile}% - ${gap === '0' ? '0px' : `var(--gap) * ${(slidesPerViewMobile - 1) / slidesPerViewMobile}`})`

  return (
    <div
      className={cn('relative', className)}
      style={
        {
          '--slides-desktop': slidesPerViewDesktop,
          '--slides-tablet': slidesPerViewTablet,
          '--slides-mobile': slidesPerViewMobile,
          '--gap': gap === '0' ? '0px' : `${parseInt(gap) * 4}px`,
        } as React.CSSProperties
      }
    >
      <div className="overflow-hidden" ref={emblaRef}>
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

      {/* Navigation Arrows */}
      {showNavigation && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-all',
              'hover:border-gray-400 hover:bg-gray-50',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white'
            )}
            aria-label="Previous slide"
          >
            <CaretLeft className="h-5 w-5" weight="bold" />
          </button>

          {/* Pagination dots */}
          {showPagination && scrollSnaps.length > 1 && (
            <div className="flex items-center gap-2 mx-4">
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
          )}

          <button
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-all',
              'hover:border-gray-400 hover:bg-gray-50',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white'
            )}
            aria-label="Next slide"
          >
            <CaretRight className="h-5 w-5" weight="bold" />
          </button>
        </div>
      )}
    </div>
  )
}

// Individual slide wrapper for semantic clarity
export function SliderSlide({children, className}: {children: React.ReactNode; className?: string}) {
  return <div className={cn('h-full', className)}>{children}</div>
}
