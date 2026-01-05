'use client'

import {stegaClean} from 'next-sanity'
import {Tabs, TabsList, TabsTrigger, TabsContent, TabsPlayPause} from '../ui/tabs'
import ContentBlockRenderer from './ContentBlockRenderer'

interface TabContent {
  _key: string
  _type: string
  [key: string]: any
}

interface TabItem {
  _key: string
  label: string
  icon?: string
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
  const cleanContentGap = stegaClean(contentGap)
  const cleanAutoplay = stegaClean(autoplay)
  const cleanAutoplayDuration = stegaClean(autoplayDuration)
  const cleanPauseOnHover = stegaClean(pauseOnHover)
  const cleanShowProgress = stegaClean(showProgress)

  // Use first tab as default if not specified
  const defaultValue = defaultTab || tabs[0]?._key

  return (
    <div className="my-6">
      <Tabs
        defaultValue={defaultValue}
        orientation={cleanOrientation}
        menuPosition={cleanMenuPosition}
        mobileDropdown={cleanMobileDropdown}
        contentGap={cleanContentGap}
        autoplay={cleanAutoplay}
        autoplayDuration={cleanAutoplayDuration}
        pauseOnHover={cleanPauseOnHover}
        showProgress={cleanShowProgress}
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab._key} value={tab._key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab._key} value={tab._key}>
            {tab.content?.map((block, index) => (
              <ContentBlockRenderer key={block._key} block={block} index={index} />
            ))}
          </TabsContent>
        ))}

        {/* Play/Pause button positioned below tab content */}
        <TabsPlayPause className="mt-4" />
      </Tabs>
    </div>
  )
}
