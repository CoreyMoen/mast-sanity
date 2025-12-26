'use client'

import * as React from 'react'
import {cn} from '@/lib/utils'

type MarqueeOrientation = 'horizontal' | 'vertical'

interface MarqueeProps {
  children: React.ReactNode
  orientation?: MarqueeOrientation
  reverse?: boolean
  pauseOnHover?: boolean
  fadeEdges?: boolean
  duration?: number // in seconds
  gap?: number // in pixels
  className?: string
}

export function Marquee({
  children,
  orientation = 'horizontal',
  reverse = false,
  pauseOnHover = true,
  fadeEdges = false,
  duration = 30,
  gap = 24,
  className,
}: MarqueeProps) {
  const isVertical = orientation === 'vertical'

  // Animation keyframes based on orientation and direction
  const getAnimationName = () => {
    if (isVertical) {
      return reverse ? 'marquee-scroll-up' : 'marquee-scroll-down'
    }
    return reverse ? 'marquee-scroll-right' : 'marquee-scroll-left'
  }

  // Fade mask based on orientation
  const getFadeMask = () => {
    if (!fadeEdges) return undefined
    if (isVertical) {
      return 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
    }
    return 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
  }

  return (
    <>
      {/* Inject keyframes */}
      <style jsx global>{`
        @keyframes marquee-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes marquee-scroll-right {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        @keyframes marquee-scroll-up {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }
        @keyframes marquee-scroll-down {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
      `}</style>

      <div
        className={cn(
          'relative overflow-hidden',
          isVertical ? 'flex flex-col' : 'flex',
          pauseOnHover && '[&:hover_.marquee-group]:pause',
          className
        )}
        style={{
          maskImage: getFadeMask(),
          WebkitMaskImage: getFadeMask(),
        }}
      >
        <div
          className={cn(
            'flex',
            isVertical ? 'flex-col' : 'flex-row'
          )}
          style={{
            [isVertical ? 'marginTop' : 'marginLeft']: `calc(0px - ${gap}px)`,
            [isVertical ? 'marginBottom' : 'marginRight']: `calc(0px - ${gap}px)`,
          }}
        >
          {/* First group */}
          <div
            className={cn(
              'marquee-group flex shrink-0',
              isVertical ? 'flex-col' : 'flex-row'
            )}
            style={{
              gap: `${gap}px`,
              [isVertical ? 'paddingTop' : 'paddingLeft']: `${gap / 2}px`,
              [isVertical ? 'paddingBottom' : 'paddingRight']: `${gap / 2}px`,
              animation: `${getAnimationName()} ${duration}s linear infinite`,
            }}
          >
            {children}
          </div>

          {/* Duplicate group for seamless loop */}
          <div
            className={cn(
              'marquee-group flex shrink-0',
              isVertical ? 'flex-col' : 'flex-row'
            )}
            aria-hidden="true"
            style={{
              gap: `${gap}px`,
              [isVertical ? 'paddingTop' : 'paddingLeft']: `${gap / 2}px`,
              [isVertical ? 'paddingBottom' : 'paddingRight']: `${gap / 2}px`,
              animation: `${getAnimationName()} ${duration}s linear infinite`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// Simple item wrapper for consistent styling
interface MarqueeItemProps {
  children: React.ReactNode
  className?: string
  minWidth?: string
}

export function MarqueeItem({children, className, minWidth}: MarqueeItemProps) {
  return (
    <div
      className={cn('shrink-0', className)}
      style={{minWidth}}
    >
      {children}
    </div>
  )
}
