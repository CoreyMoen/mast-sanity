import React, {useState, useEffect} from 'react'
import {EyeOpenIcon, EarthGlobeIcon, WarningOutlineIcon} from '@sanity/icons'
import {Button, Card, Flex, Text, Stack, Box} from '@sanity/ui'
import {useFormValue, type ObjectInputProps} from 'sanity'
import {UsedOnPages} from './UsedOnPages'

/**
 * Custom form input for Section Template documents that adds:
 * - A "Preview in Presentation mode" banner (for all templates)
 * - A prominent global section warning banner (when isGlobal is true)
 * - A "Used on pages" tracker (when isGlobal is true)
 *
 * Only shows banners when in Structure mode (not Presentation).
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

  const showBanner = !isInPresentation && documentId

  return (
    <>
      {showBanner && (
        <Stack space={3} marginBottom={4}>
          {/* Global Section Warning Banner */}
          {isGlobal && (
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
                <Box paddingLeft={1}>
                  <Stack space={2}>
                    <Flex align="flex-start" gap={2}>
                      <Text size={1}>
                        <WarningOutlineIcon />
                      </Text>
                      <Text size={1}>
                        Changes to this section will update <strong>every page</strong> that uses it.
                        This is a shared, referenced section — not a prefill template.
                      </Text>
                    </Flex>
                  </Stack>
                </Box>
                {/* Used on pages tracker */}
                <Box marginTop={1}>
                  <UsedOnPages />
                </Box>
              </Stack>
            </Card>
          )}

          {/* Presentation Preview Banner */}
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
        </Stack>
      )}
      {props.renderDefault(props)}
    </>
  )
}
