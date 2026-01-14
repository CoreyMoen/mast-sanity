/**
 * ImagePickerDialog Component
 *
 * Modal dialog for selecting images to attach to chat messages.
 * Supports two sources:
 * 1. Upload from computer (drag & drop or file picker)
 * 2. Select from Sanity Media Library
 */

import {useState, useCallback, useRef, useEffect} from 'react'
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
} from '@sanity/ui'
import {UploadIcon, ImageIcon, CheckmarkIcon, SearchIcon} from '@sanity/icons'
import type {SanityClient} from 'sanity'
import type {ImageAttachment} from '../types'

export interface ImagePickerDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Callback when dialog is closed */
  onClose: () => void
  /** Callback when an image is selected */
  onSelect: (image: ImageAttachment) => void
  /** Sanity client for querying media library */
  client?: SanityClient
}

/** Sanity image asset from GROQ query */
interface SanityImageAsset {
  _id: string
  _type: string
  originalFilename?: string
  url: string
  mimeType: string
  metadata?: {
    dimensions?: {
      width: number
      height: number
    }
  }
}

/**
 * Generate unique ID for attachments
 */
function generateAttachmentId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Extract just the base64 data (remove data:image/...;base64, prefix)
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Fetch image as base64 from URL
 * Returns both the base64 data and the actual mime type from the response
 */
async function urlToBase64(url: string): Promise<{base64: string; mimeType: string}> {
  const response = await fetch(url)
  const blob = await response.blob()
  // Get the actual mime type from the response (may differ from original asset)
  const actualMimeType = blob.type || 'image/jpeg'

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve({base64, mimeType: actualMimeType})
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function ImagePickerDialog({
  isOpen,
  onClose,
  onSelect,
  client,
}: ImagePickerDialogProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [libraryImages, setLibraryImages] = useState<SanityImageAsset[]>([])
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load media library when tab switches to library
  useEffect(() => {
    if (activeTab === 'library' && client && libraryImages.length === 0) {
      loadMediaLibrary()
    }
  }, [activeTab, client])

  /**
   * Load images from Sanity media library
   */
  const loadMediaLibrary = useCallback(async () => {
    if (!client) return

    setIsLoadingLibrary(true)
    try {
      const query = `*[_type == "sanity.imageAsset"] | order(_createdAt desc) [0...50] {
        _id,
        _type,
        originalFilename,
        url,
        mimeType,
        metadata {
          dimensions {
            width,
            height
          }
        }
      }`
      const assets = await client.fetch<SanityImageAsset[]>(query)
      setLibraryImages(assets)
    } catch (err) {
      console.error('Failed to load media library:', err)
    } finally {
      setIsLoadingLibrary(false)
    }
  }, [client])

  /**
   * Handle file selection from input or drop
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      setIsUploading(true)
      try {
        const base64 = await fileToBase64(file)

        // Create a data URL for preview
        const dataUrl = `data:${file.type};base64,${base64}`

        // Get dimensions from image
        const img = new Image()
        const dimensions = await new Promise<{width: number; height: number}>((resolve) => {
          img.onload = () => resolve({width: img.width, height: img.height})
          img.src = dataUrl
        })

        const attachment: ImageAttachment = {
          id: generateAttachmentId(),
          name: file.name,
          mimeType: file.type,
          base64,
          url: dataUrl,
          width: dimensions.width,
          height: dimensions.height,
          source: 'upload',
        }

        onSelect(attachment)
        onClose()
      } catch (err) {
        console.error('Failed to process file:', err)
        alert('Failed to process image file')
      } finally {
        setIsUploading(false)
      }
    },
    [onSelect, onClose]
  )

  /**
   * Handle selecting from media library
   */
  const handleLibrarySelect = useCallback(
    async (asset: SanityImageAsset) => {
      setSelectedAssetId(asset._id)
      setIsUploading(true)

      try {
        // Fetch the image and convert to base64
        // Use the actual mime type from the response (CDN may transform format)
        const {base64, mimeType: actualMimeType} = await urlToBase64(asset.url)

        const attachment: ImageAttachment = {
          id: generateAttachmentId(),
          name: asset.originalFilename || 'image',
          mimeType: actualMimeType, // Use actual mime type from response, not original asset
          base64,
          url: asset.url,
          sanityAssetId: asset._id,
          // Include full Sanity asset reference for use in documents
          sanityAssetRef: {
            _type: 'reference',
            _ref: asset._id,
          },
          width: asset.metadata?.dimensions?.width,
          height: asset.metadata?.dimensions?.height,
          source: 'library',
        }

        onSelect(attachment)
        onClose()
      } catch (err) {
        console.error('Failed to load image from media library:', err)
        alert('Failed to load image from media library')
      } finally {
        setIsUploading(false)
        setSelectedAssetId(null)
      }
    },
    [onSelect, onClose]
  )

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  /**
   * Filter library images by search query
   */
  const filteredImages = libraryImages.filter((asset) => {
    if (!searchQuery) return true
    const filename = asset.originalFilename?.toLowerCase() || ''
    return filename.includes(searchQuery.toLowerCase())
  })

  if (!isOpen) return null

  return (
    <Dialog
      id="image-picker-dialog"
      header="Add Image"
      onClose={onClose}
      width={1}
      zOffset={1000}
    >
      <Box padding={4}>
        <TabList space={2}>
          <Tab
            id="upload-tab"
            label="Upload"
            aria-controls="upload-panel"
            selected={activeTab === 'upload'}
            onClick={() => setActiveTab('upload')}
          />
          <Tab
            id="library-tab"
            label="Media Library"
            aria-controls="library-panel"
            selected={activeTab === 'library'}
            onClick={() => setActiveTab('library')}
            disabled={!client}
          />
        </TabList>

        <Box marginTop={4}>
          {/* Upload Tab */}
          <TabPanel
            id="upload-panel"
            aria-labelledby="upload-tab"
            hidden={activeTab !== 'upload'}
          >
            <Card
              padding={5}
              radius={2}
              border
              tone={isDragging ? 'primary' : 'default'}
              style={{
                borderStyle: 'dashed',
                borderWidth: 2,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Flex direction="column" align="center" justify="center" gap={4}>
                {isUploading ? (
                  <>
                    <Spinner muted />
                    <Text muted>Processing image...</Text>
                  </>
                ) : (
                  <>
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        backgroundColor: 'var(--card-bg2-color)',
                      }}
                    >
                      <UploadIcon style={{fontSize: 24}} />
                    </Flex>
                    <Flex direction="column" align="center" gap={2}>
                      <Text weight="semibold" align="center">
                        Drop an image here or click to browse
                      </Text>
                      <Text size={1} muted align="center">
                        Supports JPEG, PNG, GIF, WebP
                      </Text>
                    </Flex>
                  </>
                )}
              </Flex>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                style={{display: 'none'}}
              />
            </Card>
          </TabPanel>

          {/* Media Library Tab */}
          <TabPanel
            id="library-panel"
            aria-labelledby="library-tab"
            hidden={activeTab !== 'library'}
          >
            <Stack space={4}>
              {/* Search input */}
              <Card
                padding={2}
                radius={2}
                border
                style={{display: 'flex', alignItems: 'center', gap: 8}}
              >
                <SearchIcon style={{opacity: 0.5}} />
                <input
                  type="text"
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 14,
                    color: 'inherit',
                  }}
                />
              </Card>

              {/* Image grid */}
              {isLoadingLibrary ? (
                <Flex align="center" justify="center" padding={5}>
                  <Spinner muted />
                </Flex>
              ) : filteredImages.length === 0 ? (
                <Card padding={5} tone="transparent">
                  <Text align="center" muted>
                    {searchQuery ? 'No images match your search' : 'No images in media library'}
                  </Text>
                </Card>
              ) : (
                <Box
                  style={{
                    maxHeight: 400,
                    overflowY: 'auto',
                  }}
                >
                  <Grid columns={[2, 3, 4]} gap={2}>
                    {filteredImages.map((asset) => (
                      <Card
                        key={asset._id}
                        radius={2}
                        style={{
                          position: 'relative',
                          paddingBottom: '100%',
                          cursor: isUploading ? 'wait' : 'pointer',
                          overflow: 'hidden',
                          border: selectedAssetId === asset._id
                            ? '2px solid var(--card-focus-ring-color)'
                            : '2px solid transparent',
                        }}
                        onClick={() => !isUploading && handleLibrarySelect(asset)}
                      >
                        <img
                          src={`${asset.url}?w=200&h=200&fit=crop`}
                          alt={asset.originalFilename || 'Image'}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        {selectedAssetId === asset._id && (
                          <Flex
                            align="center"
                            justify="center"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            }}
                          >
                            <Spinner />
                          </Flex>
                        )}
                      </Card>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Refresh button */}
              <Flex justify="flex-end">
                <Button
                  text="Refresh"
                  mode="ghost"
                  onClick={loadMediaLibrary}
                  disabled={isLoadingLibrary}
                />
              </Flex>
            </Stack>
          </TabPanel>
        </Box>
      </Box>
    </Dialog>
  )
}
