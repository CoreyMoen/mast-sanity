'use client'

import {stegaClean} from 'next-sanity'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../ui/tabs'
import ContentBlockRenderer from './ContentBlockRenderer'

interface TabContent {
  _key: string
  _type: string
  [key: string]: any
}

interface TabItem {
  _key: string
  label: string
  content?: TabContent[]
}

interface TabsBlockProps {
  block: {
    _key: string
    _type: string
    tabs?: TabItem[]
    orientation?: 'horizontal' | 'vertical'
    menuPosition?: 'above' | 'below' | 'left' | 'right'
    mobileDropdown?: boolean
    contentGap?: string
    autoplay?: boolean
    autoplayDuration?: number
    pauseOnHover?: boolean
    showProgress?: boolean
    defaultTab?: string
  }
  index: number
}

export default function TabsBlock({block}: TabsBlockProps) {
  const {
    tabs,
    orientation = 'horizontal',
    menuPosition = 'above',
    mobileDropdown = false,
    contentGap = '4',
    autoplay = false,
    autoplayDuration = 5000,
    pauseOnHover = true,
    showProgress = true,
    defaultTab,
  } = block

  if (!tabs || tabs.length === 0) return null

  const cleanOrientation = stegaClean(orientation)
  const cleanMenuPosition = stegaClean(menuPosition)
  const cleanMobileDropdown = stegaClean(mobileDropdown)
  const cleanAutoplay = stegaClean(autoplay)
  const cleanAutoplayDuration = stegaClean(autoplayDuration)
  const cleanPauseOnHover = stegaClean(pauseOnHover)

  // Find default tab index - use first tab if not specified
  const defaultIndex = defaultTab
    ? tabs.findIndex(tab => tab._key === defaultTab)
    : 0

  return (
    <div className="u-mb-md">
      <Tabs
        defaultIndex={defaultIndex >= 0 ? defaultIndex : 0}
        orientation={cleanOrientation}
        menuPosition={cleanMenuPosition}
        mobileDropdown={cleanMobileDropdown}
        autoplay={cleanAutoplay}
        autoplayDuration={cleanAutoplayDuration}
        pauseOnHover={cleanPauseOnHover}
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab._key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab, tabIndex) => (
          <TabsContent key={tab._key} index={tabIndex}>
            {tab.content?.map((block, blockIndex) => (
              <ContentBlockRenderer key={block._key} block={block} index={blockIndex} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
