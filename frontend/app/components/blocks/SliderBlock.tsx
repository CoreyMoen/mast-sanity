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
  showPagination?: boolean
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
  showPagination = true,
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
        showPagination={stegaClean(showPagination)}
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
