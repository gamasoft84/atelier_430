"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface ArtworkWhatsAppData {
  artworkId: string
  code: string
  title: string
  price: number | null
  showPrice: boolean
  widthCm: number | null
  heightCm: number | null
  primaryImageUrl: string | null
  pageUrl: string
}

interface ArtworkWhatsAppContextValue {
  data: ArtworkWhatsAppData | null
  setData: (data: ArtworkWhatsAppData | null) => void
}

const ArtworkWhatsAppContext = createContext<ArtworkWhatsAppContextValue>({
  data: null,
  setData: () => {},
})

export function ArtworkWhatsAppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ArtworkWhatsAppData | null>(null)
  return (
    <ArtworkWhatsAppContext.Provider value={{ data, setData }}>
      {children}
    </ArtworkWhatsAppContext.Provider>
  )
}

export function useArtworkWhatsApp() {
  return useContext(ArtworkWhatsAppContext)
}
