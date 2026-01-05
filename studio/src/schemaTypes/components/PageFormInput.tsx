import React, {useState, useEffect} from 'react'
import {EyeOpenIcon} from '@sanity/icons'
import {Button, Card, Flex, Text} from '@sanity/ui'
import {useFormValue, type ObjectInputProps} from 'sanity'

/**
 * Custom form input for Page documents that adds a banner
 * with a link to open the page in Presentation mode.
 * Only shows banner when in Structure mode (not Presentation).
 */
export function PageFormInput(props: ObjectInputProps) {
  const slug = useFormValue(['slug', 'current']) as string | undefined
  const [isInPresentation, setIsInPresentation] = useState(false)

  useEffect(() => {
    // Check if we're in Presentation mode by looking at the URL path
    const checkPresentationMode = () => {
      setIsInPresentation(window.location.pathname.startsWith('/presentation'))
    }
    checkPresentationMode()
  }, [])

  const handleClick = () => {
    const path = slug ? `/${slug}` : '/'
    const presentationUrl = `/presentation?preview=${encodeURIComponent(path)}`
    window.location.href = presentationUrl
  }

  // Only show banner when in Structure mode (not Presentation)
  const showBanner = !isInPresentation

  return (
    <>
      {showBanner && (
        <Card padding={3} tone="primary" border radius={2} marginBottom={4}>
          <Flex align="center" justify="space-between" gap={3}>
            <Flex align="center" gap={2}>
              <Text size={1}>
                <EyeOpenIcon />
              </Text>
              <Text size={1}>Edit this page visually in Presentation mode</Text>
            </Flex>
            <Button
              text="Open in Presentation"
              tone="primary"
              icon={EyeOpenIcon}
              onClick={handleClick}
              mode="ghost"
              fontSize={1}
              padding={2}
            />
          </Flex>
        </Card>
      )}
      {props.renderDefault(props)}
    </>
  )
}
