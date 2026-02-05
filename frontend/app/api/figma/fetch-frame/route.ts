/**
 * Figma Fetch Frame API Endpoint
 *
 * Fetches frame data from Figma API and returns a simplified node tree
 * for Claude to interpret and map to Sanity page builder blocks.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Simplified Figma node structure for Claude
 */
interface FigmaNode {
  id: string
  name: string
  type: string
  componentName?: string
  characters?: string
  style?: {
    fontSize?: number
    fontWeight?: number
    textAlignHorizontal?: string
    textAlignVertical?: string
    letterSpacing?: number
    lineHeightPx?: number
  }
  layoutMode?: string
  itemSpacing?: number
  primaryAxisAlignItems?: string
  counterAxisAlignItems?: string
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  fills?: Array<{
    type: string
    imageRef?: string
    color?: { r: number; g: number; b: number; a: number }
  }>
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  children?: FigmaNode[]
}

/**
 * Image reference found in the Figma frame
 */
interface ImageReference {
  nodeId: string
  name: string
  type: 'fill' | 'export'
  imageRef?: string
}

/**
 * Parse Figma URL to extract fileKey and nodeId
 */
function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  try {
    const urlObj = new URL(url)
    // Match both /design/ and /file/ paths
    const pathMatch = urlObj.pathname.match(/\/(design|file)\/([a-zA-Z0-9]+)/)
    const fileKey = pathMatch?.[2]

    const nodeIdParam = urlObj.searchParams.get('node-id')
    // Figma uses both "1-234" and "1:234" formats, API expects "1:234"
    const nodeId = nodeIdParam?.replace(/-/g, ':')

    if (!fileKey || !nodeId) return null
    return { fileKey, nodeId }
  } catch {
    return null
  }
}

/**
 * Transform Figma API node to simplified structure
 */
function transformNode(node: any): FigmaNode {
  const simplified: FigmaNode = {
    id: node.id,
    name: node.name,
    type: node.type,
  }

  // For INSTANCE nodes (component instances), include the component name
  if (node.type === 'INSTANCE' && node.componentId) {
    // The component name is often in the name field for instances
    simplified.componentName = node.name
  }

  // For TEXT nodes, include the text content and style
  if (node.type === 'TEXT') {
    simplified.characters = node.characters
    if (node.style) {
      simplified.style = {
        fontSize: node.style.fontSize,
        fontWeight: node.style.fontWeight,
        textAlignHorizontal: node.style.textAlignHorizontal,
        textAlignVertical: node.style.textAlignVertical,
        letterSpacing: node.style.letterSpacing,
        lineHeightPx: node.style.lineHeightPx,
      }
    }
  }

  // Include layout properties for FRAME nodes
  if (node.layoutMode) {
    simplified.layoutMode = node.layoutMode
    simplified.itemSpacing = node.itemSpacing
    simplified.primaryAxisAlignItems = node.primaryAxisAlignItems
    simplified.counterAxisAlignItems = node.counterAxisAlignItems
    simplified.paddingLeft = node.paddingLeft
    simplified.paddingRight = node.paddingRight
    simplified.paddingTop = node.paddingTop
    simplified.paddingBottom = node.paddingBottom
  }

  // Include fills (for background colors and images)
  if (node.fills && Array.isArray(node.fills)) {
    simplified.fills = node.fills.map((fill: any) => ({
      type: fill.type,
      imageRef: fill.imageRef,
      color: fill.color,
    }))
  }

  // Include bounding box for size info
  if (node.absoluteBoundingBox) {
    simplified.absoluteBoundingBox = node.absoluteBoundingBox
  }

  // Recursively transform children
  if (node.children && Array.isArray(node.children)) {
    simplified.children = node.children.map(transformNode)
  }

  return simplified
}

/**
 * Find all image references in the node tree
 */
function findImageReferences(node: FigmaNode, refs: ImageReference[] = []): ImageReference[] {
  // Check for image fills
  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.type === 'IMAGE' && fill.imageRef) {
        refs.push({
          nodeId: node.id,
          name: node.name,
          type: 'fill',
          imageRef: fill.imageRef,
        })
      }
    }
  }

  // Check if this node should be exported as an image (e.g., icons, illustrations)
  // Nodes with names starting with "Image" or containing "icon" are candidates
  const nameLower = node.name.toLowerCase()
  if (
    nameLower.startsWith('image') ||
    nameLower.includes('icon') ||
    nameLower.includes('illustration') ||
    nameLower.includes('logo')
  ) {
    refs.push({
      nodeId: node.id,
      name: node.name,
      type: 'export',
    })
  }

  // Recursively check children
  if (node.children) {
    for (const child of node.children) {
      findImageReferences(child, refs)
    }
  }

  return refs
}

export async function POST(request: NextRequest) {
  try {
    // Validate Figma token
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

    // Parse request body
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Figma URL is required',
        },
        { status: 400 }
      )
    }

    // Parse Figma URL
    const parsed = parseFigmaUrl(url)
    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Figma URL. Expected format: https://www.figma.com/design/{fileKey}/...?node-id={nodeId}',
        },
        { status: 400 }
      )
    }

    const { fileKey, nodeId } = parsed

    // Fetch from Figma API
    const figmaApiUrl = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`

    const figmaResponse = await fetch(figmaApiUrl, {
      headers: {
        'X-Figma-Token': figmaToken,
      },
    })

    if (!figmaResponse.ok) {
      const errorText = await figmaResponse.text()
      console.error('[Figma API Error]', figmaResponse.status, errorText)

      if (figmaResponse.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error: 'Figma access denied. Check that your token has access to this file.',
          },
          { status: 403 }
        )
      }

      if (figmaResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: 'Figma file or node not found. Check the URL is correct.',
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: `Figma API error: ${figmaResponse.status}`,
        },
        { status: figmaResponse.status }
      )
    }

    const figmaData = await figmaResponse.json()

    // Get the node data
    const nodeData = figmaData.nodes?.[nodeId]
    if (!nodeData || !nodeData.document) {
      return NextResponse.json(
        {
          success: false,
          error: 'Node data not found in Figma response',
        },
        { status: 404 }
      )
    }

    // Transform to simplified structure
    const document = transformNode(nodeData.document)

    // Find image references
    const images = findImageReferences(document)

    return NextResponse.json({
      success: true,
      fileKey,
      nodeId,
      name: document.name,
      document,
      images,
    })
  } catch (error) {
    console.error('[Figma Fetch Frame Error]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
