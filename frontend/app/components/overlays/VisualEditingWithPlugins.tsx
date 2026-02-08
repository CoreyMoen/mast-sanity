'use client'

import {VisualEditing} from 'next-sanity/visual-editing'
import {customOverlayComponents} from './CustomOverlay'
import {BlockContextBridge} from './BlockContextBridge'

export default function VisualEditingWithPlugins() {
  return (
    <>
      <VisualEditing components={customOverlayComponents} />
      <BlockContextBridge />
    </>
  )
}
