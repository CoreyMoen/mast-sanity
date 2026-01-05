'use client'

import * as React from 'react'
import {useSearchParams} from 'next/navigation'
import {stegaClean} from 'next-sanity'
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  VideoModalContent,
} from '../ui/modal'
import {Button} from '../ui/button'
import ContentBlockRenderer from './ContentBlockRenderer'

interface ModalContentBlock {
  _key: string
  _type: string
  [key: string]: any
}

interface ModalBlockProps {
  modalId?: string
  triggerLabel?: string
  triggerVariant?: 'primary' | 'secondary' | 'ghost'
  /** Brand, black, or white. Legacy 'blue' maps to 'brand' */
  triggerColor?: 'brand' | 'black' | 'white' | 'blue'
  contentType?: 'content' | 'video'
  modalTitle?: string
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  content?: ModalContentBlock[]
  youtubeUrl?: string
}

// Extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export default function ModalBlock({
  modalId,
  triggerLabel = 'Open Modal',
  triggerVariant = 'primary',
  triggerColor = 'brand',
  contentType = 'content',
  modalTitle,
  modalSize = 'md',
  content,
  youtubeUrl,
}: ModalBlockProps) {
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = React.useState(false)

  const cleanContentType = stegaClean(contentType)
  const cleanModalSize = stegaClean(modalSize)
  const cleanTriggerVariant = stegaClean(triggerVariant)
  // Map legacy 'blue' color to 'brand' for backwards compatibility
  const rawTriggerColor = stegaClean(triggerColor)
  const cleanTriggerColor = (rawTriggerColor === 'blue' ? 'brand' : rawTriggerColor) as 'brand' | 'black' | 'white'
  const cleanModalId = stegaClean(modalId)

  // Check URL parameter for opening modal
  React.useEffect(() => {
    if (cleanModalId && searchParams.get('modal') === cleanModalId) {
      setIsOpen(true)
    }
  }, [searchParams, cleanModalId])

  const videoId = youtubeUrl ? getYouTubeId(stegaClean(youtubeUrl)) : null

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        <Button variant={cleanTriggerVariant} colorScheme={cleanTriggerColor}>
          {triggerLabel}
        </Button>
      </ModalTrigger>

      {cleanContentType === 'video' && videoId ? (
        <VideoModalContent videoId={videoId} title={modalTitle} size={cleanModalSize} />
      ) : (
        <ModalContent size={cleanModalSize}>
          {modalTitle && (
            <ModalHeader>
              <ModalTitle>{modalTitle}</ModalTitle>
            </ModalHeader>
          )}
          <ModalBody>
            {content?.map((block, index) => (
              <ContentBlockRenderer key={block._key} block={block} index={index} />
            ))}
          </ModalBody>
        </ModalContent>
      )}
    </Modal>
  )
}
