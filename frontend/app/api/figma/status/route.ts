/**
 * Figma Status API Endpoint
 *
 * Simple endpoint to check if Figma integration is configured.
 * Used by the Claude Assistant to show warnings when Figma features
 * are enabled but the token is not set.
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const configured = !!process.env.FIGMA_ACCESS_TOKEN

  return NextResponse.json({
    configured,
    message: configured
      ? 'Figma integration is configured'
      : 'FIGMA_ACCESS_TOKEN environment variable is not set',
  })
}
