"use client"

import dynamic from "next/dynamic"

/**
 * Solo el visor en cliente (`ssr: false`). El marco (título, copy) vive en el Server Component
 * de la página para que el HTML siempre incluya la sección en deploy (Vercel).
 */
const ArtworkWallARViewer = dynamic(
  () => import("./ArtworkWallARViewer"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[min(70vh,420px)] rounded-xl bg-stone-100 animate-pulse"
        aria-hidden
      />
    ),
  }
)

export default function ArtworkARViewerIsland({
  artworkCode,
  title,
  widthCm,
  heightCm,
}: {
  artworkCode: string
  title: string
  widthCm: number | null
  heightCm: number | null
}) {
  return (
    <ArtworkWallARViewer
      artworkCode={artworkCode}
      title={title}
      widthCm={widthCm}
      heightCm={heightCm}
    />
  )
}
