'use client'

import {createContext, useContext, useState, useCallback, type ReactNode} from 'react'

interface OverlayHoverContextValue {
  activeOverlayId: string | null
  setActiveOverlay: (id: string | null) => void
}

const OverlayHoverContext = createContext<OverlayHoverContextValue>({
  activeOverlayId: null,
  setActiveOverlay: () => {},
})

export function OverlayHoverProvider({children}: {children: ReactNode}) {
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null)

  const setActiveOverlay = useCallback((id: string | null) => {
    setActiveOverlayId(id)
  }, [])

  return (
    <OverlayHoverContext.Provider value={{activeOverlayId, setActiveOverlay}}>
      {children}
    </OverlayHoverContext.Provider>
  )
}

export function useOverlayHover() {
  return useContext(OverlayHoverContext)
}
