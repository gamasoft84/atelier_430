"use client"

import { useEffect } from "react"
import { useArtworkWhatsApp, type ArtworkWhatsAppData } from "@/contexts/ArtworkWhatsAppContext"

export default function ArtworkWhatsAppSetter(props: ArtworkWhatsAppData) {
  const { setData } = useArtworkWhatsApp()

  useEffect(() => {
    setData(props)
    return () => setData(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.artworkId])

  return null
}
