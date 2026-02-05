/**
 * Figma Export Image API Endpoint
 *
 * Exports an image from a Figma node and uploads it to Sanity.
 * Returns a Sanity asset reference for use in imageBlock.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '6lj3hi0f',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

interface ExportImageRequest {
  fileKey: string
  nodeId: string
  filename: string
  scale?: number
  format?: 'png' | 'jpg' | 'svg'
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN
    if (!figmaToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'FIGMA_ACCESS_TOKEN environment variable is not configured',
        },
        { status: 500 }
      )
    }

    const sanityToken = process.env.SANITY_API_TOKEN
    if (!sanityToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'SANITY_API_TOKEN environment variable is not configured',
        },
        { status: 500 }
      )
    }

    // Parse request body
    const body: ExportImageRequest = await request.json()
    const { fileKey, nodeId, filename, scale = 2, format = 'png' } = body

    if (!fileKey || !nodeId || !filename) {
      return NextResponse.json(
        {
          success: false,
          error: 'fileKey, nodeId, and filename are required',
        },
        { status: 400 }
      )
    }

    // Step 1: Get image export URL from Figma
    const figmaExportUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&scale=${scale}&format=${format}`

    const exportResponse = await fetch(figmaExportUrl, {
      headers: {
        'X-Figma-Token': figmaToken,
      },
    })

    if (!exportResponse.ok) {
      const errorText = await exportResponse.text()
      console.error('[Figma Export Error]', exportResponse.status, errorText)
      return NextResponse.json(
        {
          success: false,
          error: `Figma export failed: ${exportResponse.status}`,
        },
        { status: exportResponse.status }
      )
    }

    const exportData = await exportResponse.json()

    // The Figma API returns URLs keyed by node ID (with : replaced by -)
    // Try both formats
    const nodeIdWithColon = nodeId.includes(':') ? nodeId : nodeId.replace(/-/g, ':')
    const nodeIdWithDash = nodeId.includes('-') ? nodeId : nodeId.replace(/:/g, '-')

    const imageUrl = exportData.images?.[nodeIdWithColon] || exportData.images?.[nodeIdWithDash]

    if (!imageUrl) {
      console.error('[Figma Export] No image URL in response', exportData)
      return NextResponse.json(
        {
          success: false,
          error: 'No image URL returned from Figma',
        },
        { status: 500 }
      )
    }

    // Step 2: Download the image from Figma's CDN
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to download image from Figma CDN: ${imageResponse.status}`,
        },
        { status: 500 }
      )
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer], { type: `image/${format}` })

    // Step 3: Upload to Sanity
    const contentType = format === 'svg' ? 'image/svg+xml' : `image/${format}`

    // Ensure filename has correct extension
    const finalFilename = filename.endsWith(`.${format}`)
      ? filename
      : `${filename}.${format}`

    const asset = await sanityClient.assets.upload('image', imageBlob, {
      filename: finalFilename,
      contentType,
    })

    // Return Sanity asset reference
    return NextResponse.json({
      success: true,
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
      assetId: asset._id,
      url: asset.url,
      filename: finalFilename,
    })
  } catch (error) {
    console.error('[Figma Export Image Error]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
