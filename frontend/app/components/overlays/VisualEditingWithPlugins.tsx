'use client'

import {VisualEditing} from 'next-sanity/visual-editing'
import {customOverlayComponents} from './CustomOverlay'

export default function VisualEditingWithPlugins() {
  return <VisualEditing components={customOverlayComponents} />
}
