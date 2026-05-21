"use client"

import { useEffect, useRef } from "react"
import { GalleryImageLoader, useImageLoadState } from "@/components/public/GalleryImageLoader"
import { usePinchZoom } from "@/hooks/usePinchZoom"
import { cn } from "@/lib/utils"

interface ArtworkLightboxZoomImageProps {
  src: string
  alt: string
  onZoomedChange?: (zoomed: boolean) => void
  onTouchStart?: (e: React.TouchEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
  className?: string
}

export default function ArtworkLightboxZoomImage({
  src,
  alt,
  onZoomedChange,
  onTouchStart: swipeTouchStart,
  onTouchEnd: swipeTouchEnd,
  className,
}: ArtworkLightboxZoomImageProps) {
  const zoom = usePinchZoom(onZoomedChange)
  const imageLoad = useImageLoadState(src)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      imageLoad.onLoaded()
    }
  }, [src, imageLoad.onLoaded])

  const handleTouchStart = (e: React.TouchEvent) => {
    zoom.onTouchStart(e)
    if (zoom.scale <= 1.02 && e.touches.length === 1) {
      swipeTouchStart?.(e)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const wasZoomed = zoom.scale > 1.02
    const singleFinger = e.changedTouches.length === 1
    zoom.onTouchEnd(e)
    if (!wasZoomed && singleFinger) {
      swipeTouchEnd?.(e)
    }
  }

  return (
    <div
      ref={zoom.containerRef}
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden touch-none",
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={zoom.onTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <GalleryImageLoader loading={imageLoad.loading} variant="dark" />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        onLoad={imageLoad.onLoaded}
        className={cn(
          "max-h-full max-w-full select-none object-contain transition-[opacity,transform] duration-300 ease-out",
          imageLoad.loaded ? "opacity-100" : "opacity-0",
        )}
        style={{
          transform: `translate(${zoom.translate.x}px, ${zoom.translate.y}px) scale(${zoom.scale})`,
        }}
        decoding="async"
      />
      {zoom.isZoomed ? (
        <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-carbon-900/50 px-2.5 py-0.5 text-[10px] text-cream/80 backdrop-blur-sm">
          Pellizca para alejar · arrastra para mover
        </p>
      ) : (
        <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-carbon-900/40 px-2.5 py-0.5 text-[10px] text-cream/70 backdrop-blur-sm sm:hidden">
          Pellizca para acercar
        </p>
      )}
    </div>
  )
}
