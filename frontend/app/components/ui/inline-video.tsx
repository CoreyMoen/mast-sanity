'use client'

import * as React from 'react'
import Image from 'next/image'
import {Pause, Play} from '@phosphor-icons/react/dist/ssr'
import {cn} from '@/lib/utils'

type AspectRatio = '16/9' | '4/3' | '1/1' | '9/16' | '21/9' | '16×9' | '4×3' | '1×1' | '9×16' | '21×9' | '16x9' | '4x3' | '1x1' | '9x16' | '21x9'
type ControlPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'

interface InlineVideoProps {
  src: string
  poster?: string
  posterAlt?: string
  aspectRatio?: AspectRatio
  autoplayOnScroll?: boolean
  loop?: boolean
  muted?: boolean
  controlPosition?: ControlPosition
  showControls?: boolean
  className?: string
}

const aspectRatioClasses: Record<AspectRatio, string> = {
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '9/16': 'aspect-[9/16]',
  '21/9': 'aspect-[21/9]',
  // Legacy values (with × multiplication sign) - normalize to standard format
  '16×9': 'aspect-video',
  '4×3': 'aspect-[4/3]',
  '1×1': 'aspect-square',
  '9×16': 'aspect-[9/16]',
  '21×9': 'aspect-[21/9]',
  // Legacy values (with letter x) - normalize to standard format
  '16x9': 'aspect-video',
  '4x3': 'aspect-[4/3]',
  '1x1': 'aspect-square',
  '9x16': 'aspect-[9/16]',
  '21x9': 'aspect-[21/9]',
}

const controlPositionClasses: Record<ControlPosition, string> = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
}

export function InlineVideo({
  src,
  poster,
  posterAlt = 'Video poster',
  aspectRatio = '16/9',
  autoplayOnScroll = true,
  loop = true,
  muted = true,
  controlPosition = 'bottom-right',
  showControls = true,
  className,
}: InlineVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [showPoster, setShowPoster] = React.useState(!!poster)

  // Intersection Observer for autoplay on scroll
  React.useEffect(() => {
    if (!autoplayOnScroll || !videoRef.current) return

    const video = videoRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Autoplay was prevented, user needs to interact
            })
          } else {
            video.pause()
          }
        })
      },
      {
        threshold: 0.5, // Trigger when 50% visible
      }
    )

    observer.observe(video)

    return () => {
      observer.disconnect()
    }
  }, [autoplayOnScroll])

  // Update playing state
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => {
      setIsPlaying(true)
      setShowPoster(false)
    }
    const handlePause = () => setIsPlaying(false)
    const handleLoadedData = () => setIsLoaded(true)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('loadeddata', handleLoadedData)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [])

  const togglePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg bg-[var(--color-black)]',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        loop={loop}
        muted={muted}
        playsInline
        preload="metadata"
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
          showPoster && !isLoaded ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* Poster image */}
      {poster && showPoster && (
        <div className="absolute inset-0">
          <Image
            src={poster}
            alt={posterAlt}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Play/Pause control */}
      {showControls && (
        <button
          onClick={togglePlayPause}
          className={cn(
            'absolute z-10 flex items-center justify-center rounded-full transition-all',
            'bg-white/90 backdrop-blur-sm shadow-lg',
            'hover:bg-white hover:scale-105',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
            controlPosition === 'center' ? 'h-16 w-16' : 'h-10 w-10',
            controlPositionClasses[controlPosition]
          )}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? (
            <Pause
              className={cn(
                'text-black',
                controlPosition === 'center' ? 'h-7 w-7' : 'h-5 w-5'
              )}
              weight="fill"
            />
          ) : (
            <Play
              className={cn(
                'text-black ml-0.5',
                controlPosition === 'center' ? 'h-7 w-7' : 'h-5 w-5'
              )}
              weight="fill"
            />
          )}
        </button>
      )}
    </div>
  )
}
