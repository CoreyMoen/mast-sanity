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
  tabs?: TabItem[]
  orientation?: 'horizontal' | 'vertical'
  autoplay?: boolean
  autoplayDuration?: number
  pauseOnHover?: boolean
  defaultTab?: string
}

export default function TabsBlock({
  tabs,
  orientation = 'horizontal',
  autoplay = false,
  autoplayDuration = 5000,
  pauseOnHover = true,
  defaultTab,
}: TabsBlockProps) {
  if (!tabs || tabs.length === 0) return null

  const cleanOrientation = stegaClean(orientation)
  const cleanAutoplay = stegaClean(autoplay)
  const cleanAutoplayDuration = stegaClean(autoplayDuration)
  const cleanPauseOnHover = stegaClean(pauseOnHover)

  // Use first tab as default if not specified
  const defaultValue = defaultTab || tabs[0]?._key

  return (
    <div className="my-6">
      <Tabs
        defaultValue={defaultValue}
        orientation={cleanOrientation}
        autoplay={cleanAutoplay}
        autoplayDuration={cleanAutoplayDuration}
        pauseOnHover={cleanPauseOnHover}
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
      </Tabs>
    </div>
  )
}
