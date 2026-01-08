'use client'

import {stegaClean} from 'next-sanity'
import {InlineVideo} from '../ui/inline-video'
import {urlForImage} from '@/sanity/lib/utils'

interface InlineVideoBlockProps {
  block: {
    _key: string
    _type: string
    videoFile?: {
      asset?: {
        url?: string
      }
    }
    videoUrl?: string
    poster?: {
      asset?: {_ref: string}
      alt?: string
    }
    aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16' | '21/9'
    autoplayOnScroll?: boolean
    loop?: boolean
    muted?: boolean
    controlPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
    showControls?: boolean
  }
  index?: number
}

export default function InlineVideoBlock({block}: InlineVideoBlockProps) {
  const {
    videoFile,
    videoUrl,
    poster,
    aspectRatio = '16/9',
    autoplayOnScroll = true,
    loop = true,
    muted = true,
    controlPosition = 'bottom-right',
    showControls = true,
  } = block

  // Get video source - prefer uploaded file over external URL
  const videoSrc = videoFile?.asset?.url || stegaClean(videoUrl)

  if (!videoSrc) return null

  // Get poster image URL
  const posterUrl = poster?.asset
    ? urlForImage(poster)?.width(1200).height(675).url()
    : undefined

  return (
    <div className="my-6">
      <InlineVideo
        src={videoSrc}
        poster={posterUrl || undefined}
        posterAlt={poster?.alt || 'Video poster'}
        aspectRatio={stegaClean(aspectRatio)}
        autoplayOnScroll={stegaClean(autoplayOnScroll)}
        loop={stegaClean(loop)}
        muted={stegaClean(muted)}
        controlPosition={stegaClean(controlPosition)}
        showControls={stegaClean(showControls)}
      />
    </div>
  )
}
