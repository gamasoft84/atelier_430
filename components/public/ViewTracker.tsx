"use client"

import { useEffect } from "react"
import { trackArtworkView } from "@/app/actions/tracking"

interface ViewTrackerProps {
  artworkId: string
}

export default function ViewTracker({ artworkId }: ViewTrackerProps) {
  useEffect(() => {
    trackArtworkView(artworkId).catch(() => {})
  // runs once per page load — intentionally no dependency on artworkId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
