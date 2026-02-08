import React, {useState, useEffect} from 'react'
import {EyeOpenIcon, EarthGlobeIcon} from '@sanity/icons'
import {Button, Card, Flex, Text, Stack, Box} from '@sanity/ui'
import {useFormValue, type ObjectInputProps} from 'sanity'
import {UsedOnPages} from './UsedOnPages'

/**
 * Custom form input for Section Template documents that adds:
 * - A "Preview in Presentation mode" banner (only in Structure mode)
 * - A prominent global section warning banner (when isGlobal is true, in both modes)
 * - A collapsible "Used on pages" tracker (when isGlobal is true)
 */
export function SectionTemplateFormInput(props: ObjectInputProps) {
  const documentId = useFormValue(['_id']) as string | undefined
  const isGlobal = useFormValue(['isGlobal']) as boolean | undefined
  const [isInPresentation, setIsInPresentation] = useState(false)

  useEffect(() => {
    const checkPresentationMode = () => {
      setIsInPresentation(window.location.pathname.startsWith('/presentation'))
    }
    checkPresentationMode()
  }, [])

  const handleClick = () => {
    if (!documentId) return
    const cleanId = documentId.replace(/^drafts\./, '')
    const path = `/preview/template/${cleanId}`
    const presentationUrl = `/presentation?preview=${encodeURIComponent(path)}`
    window.location.href = presentationUrl
  }

  const showGlobalBanner = documentId && isGlobal
  const showPreviewBanner = !isInPresentation && documentId

  return (
    <>
      {(showGlobalBanner || showPreviewBanner) && (
        <Stack space={3} marginBottom={4}>
          {/* Global Section Warning Banner - shows in both Structure and Presentation modes */}
          {showGlobalBanner && (
            <Card
              padding={4}
              radius={2}
              style={{
                background: 'var(--card-caution-bg-color, #fef3c7)',
                border: '2px solid var(--card-caution-fg-color, #d97706)',
              }}
            >
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <Text size={2}>
                    <EarthGlobeIcon />
                  </Text>
                  <Text size={2} weight="bold">
                    Global Section
                  </Text>
                </Flex>
                <Text size={1} style={{paddingLeft: 4}}>
                  Changes to this section will update <strong>every page</strong> that uses it.
                  This is a shared, referenced section — not a prefill template.
                </Text>
                {/* Used on pages tracker - only in Structure mode due to form context limitations */}
                {!isInPresentation && (
                  <Box marginTop={2}>
                    <UsedOnPages />
                  </Box>
                )}
              </Stack>
            </Card>
          )}

          {/* Presentation Preview Banner - only shows in Structure mode */}
          {showPreviewBanner && (
            <Card padding={3} tone="primary" border radius={2}>
              <Flex align="center" justify="space-between" gap={3}>
                <Flex align="center" gap={2}>
                  <Text size={1}>
                    <EyeOpenIcon />
                  </Text>
                  <Text size={1}>Preview this template in Presentation mode</Text>
                </Flex>
                <Button
                  text="Open Preview"
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
        </Stack>
      )}
      {props.renderDefault(props)}
    </>
  )
}
