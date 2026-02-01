import createImageUrlBuilder from '@sanity/image-url'
import {Link} from '@/sanity.types'
import {dataset, projectId, studioUrl} from '@/sanity/lib/api'
import {createDataAttribute, CreateDataAttributeProps} from 'next-sanity'
import {getImageDimensions} from '@sanity/asset-utils'

const imageBuilder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

export const urlForImage = (source: any) => {
  // Ensure that source image contains a valid reference
  if (!source?.asset?._ref) {
    return undefined
  }

  const imageRef = source?.asset?._ref
  const crop = source.crop

  // get the image's og dimensions
  const {width, height} = getImageDimensions(imageRef)

  if (Boolean(crop)) {
    // compute the cropped image's area
    const croppedWidth = Math.floor(width * (1 - (crop.right + crop.left)))

    const croppedHeight = Math.floor(height * (1 - (crop.top + crop.bottom)))

    // compute the cropped image's position
    const left = Math.floor(width * crop.left)
    const top = Math.floor(height * crop.top)

    // gather into a url
    return imageBuilder?.image(source).rect(left, top, croppedWidth, croppedHeight).auto('format')
  }

  return imageBuilder?.image(source).auto('format')
}

/**
 * Generate a tiny blurred placeholder image URL for use with next/image blur placeholder
 * This creates a small, heavily blurred version of the image that loads instantly
 */
export function getBlurDataUrl(source: any): string | undefined {
  if (!source?.asset?._ref) {
    return undefined
  }

  // Generate a tiny 20px wide, heavily blurred image as a data URL placeholder
  // The blur and small size make it load very fast while providing a preview
  return urlForImage(source)?.width(20).blur(50).quality(30).url()
}

/**
 * Get image data with blur placeholder for use with next/image
 * Returns both the main image URL builder and a blur data URL
 */
export function getImageWithBlur(source: any) {
  if (!source?.asset?._ref) {
    return undefined
  }

  const imageRef = source?.asset?._ref
  const {width, height} = getImageDimensions(imageRef)

  return {
    urlBuilder: urlForImage(source),
    blurDataUrl: getBlurDataUrl(source),
    dimensions: {width, height},
  }
}

export function resolveOpenGraphImage(image: any, width = 1200, height = 627) {
  if (!image) return
  const url = urlForImage(image)?.width(1200).height(627).fit('crop').url()
  if (!url) return
  return {url, alt: image?.alt as string, width, height}
}

// Link-like object that may or may not have _type (navigation links don't have it)
type LinkLike = {
  linkType?: string
  href?: string
  openInNewTab?: boolean
  page?: string | { _ref: string; _type: 'reference' }
  post?: string | { _ref: string; _type: 'reference' }
  variable?: {
    _id?: string
    variableType?: 'link'
    linkValue?: LinkLike
  }
}

// Depending on the type of link, we need to fetch the corresponding page, post, or URL.  Otherwise return null.
export function linkResolver(link: Link | LinkLike | undefined): string | null {
  if (!link) return null

  // If linkType is not set but href is, lets set linkType to "href".  This comes into play when pasting links into the portable text editor because a link type is not assumed.
  if (!link.linkType && link.href) {
    link.linkType = 'href'
  }

  // Cast to string for runtime comparison (handles legacy 'external' values)
  const linkType = link.linkType as string
  switch (linkType) {
    case 'href':
    case 'external': // Legacy alias for 'href'
      return link.href || null
    case 'page':
      if (link?.page && typeof link.page === 'string') {
        return `/${link.page}`
      }
      return null
    case 'post':
      if (link?.post && typeof link.post === 'string') {
        return `/posts/${link.post}`
      }
      return null
    case 'variable':
      // Content Variable link type - resolve the nested linkValue
      if (link?.variable?.linkValue) {
        return linkResolver(link.variable.linkValue)
      }
      return null
    default:
      return null
  }
}

type DataAttributeConfig = CreateDataAttributeProps &
  Required<Pick<CreateDataAttributeProps, 'id' | 'type' | 'path'>>

export function dataAttr(config: DataAttributeConfig) {
  return createDataAttribute({
    projectId,
    dataset,
    baseUrl: studioUrl,
  }).combine(config)
}
