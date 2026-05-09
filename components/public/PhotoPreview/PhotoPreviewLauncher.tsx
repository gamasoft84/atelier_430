"use client"

import { useState, lazy, Suspense } from "react"
import { Camera } from "lucide-react"

const PhotoPreviewDialog = lazy(() => import("./PhotoPreviewDialog"))

interface PhotoPreviewLauncherProps {
  artworkId: string
  artworkCode: string
  title: string
  widthCm: number
  heightCm: number
  artworkImageUrl: string
  pageUrl: string
}

export default function PhotoPreviewLauncher(props: PhotoPreviewLauncherProps) {
  const [open, setOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setHasMounted(true)
          setOpen(true)
        }}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-carbon-900 hover:border-gold-500 hover:text-gold-500 transition-colors"
      >
        <Camera size={15} />
        Ver con foto de tu pared
      </button>

      {hasMounted && (
        <Suspense fallback={null}>
          <PhotoPreviewDialog open={open} onOpenChange={setOpen} {...props} />
        </Suspense>
      )}
    </>
  )
}
