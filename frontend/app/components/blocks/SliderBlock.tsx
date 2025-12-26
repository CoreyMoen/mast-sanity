'use client'

import {stegaClean} from 'next-sanity'
import {Slider, SliderSlide} from '../ui/slider'
import ContentBlockRenderer from './ContentBlockRenderer'

interface SlideContent {
  _key: string
  _type: string
  [key: string]: any
}

interface Slide {
  _key: string
  content?: SlideContent[]
}

type NavigationPosition = 'below' | 'overlay-center' | 'overlay-edges' | 'sides'
type SlideEffect = 'slide' | 'fade'

interface SliderBlockProps {
  slides?: Slide[]
  slidesPerViewDesktop?: 1 | 2 | 3 | 4 | 5 | 6
  slidesPerViewTablet?: 1 | 2 | 3 | 4 | 5 | 6
  slidesPerViewMobile?: 1 | 2 | 3 | 4 | 5 | 6
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
}

export default function SliderBlock({
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
}: SliderBlockProps) {
  if (!slides || slides.length === 0) return null

  return (
    <div className="my-6">
      <Slider
        slidesPerViewDesktop={stegaClean(slidesPerViewDesktop)}
        slidesPerViewTablet={stegaClean(slidesPerViewTablet)}
        slidesPerViewMobile={stegaClean(slidesPerViewMobile)}
        gap={stegaClean(gap)}
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
        {slides.map((slide) => (
          <SliderSlide key={slide._key}>
            {slide.content?.map((block, index) => (
              <ContentBlockRenderer key={block._key} block={block} index={index} />
            ))}
          </SliderSlide>
        ))}
      </Slider>
    </div>
  )
}
