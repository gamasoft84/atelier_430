"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react"
import type { ArtworkImage } from "@/types/artwork"
import { getCloudinaryUrl } from "@/lib/cloudinary/transform"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import ArtworkLightboxZoomImage from "@/components/public/ArtworkLightboxZoomImage"
import {
  GalleryImageLoader,
  GalleryThumbnailPulse,
  useImageLoadState,
} from "@/components/public/GalleryImageLoader"
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe"
import { cn } from "@/lib/utils"

interface ArtworkGalleryProps {
  images: ArtworkImage[]
  title: string
}

function GalleryThumb({
  img,
  title,
  index,
  active,
  onSelect,
  dark = false,
}: {
  img: ArtworkImage
  title: string
  index: number
  active: boolean
  onSelect: () => void
  dark?: boolean
}) {
  const load = useImageLoadState(img.cloudinary_public_id)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
        dark ? "h-14 w-11" : "h-20 w-16",
        active
          ? "border-gold-500"
          : dark
            ? "border-white/20 hover:border-white/40"
            : "border-transparent hover:border-stone-300",
      )}
      aria-label={`Ver imagen ${index + 1}`}
      aria-current={active ? "true" : undefined}
    >
      {dark ? (
        load.loading ? (
          <div className="absolute inset-0 z-[1] animate-pulse bg-white/10" aria-hidden />
        ) : null
      ) : (
        <GalleryThumbnailPulse loading={load.loading} />
      )}
      {dark ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getCloudinaryUrl(img.cloudinary_public_id, "thumbnail")}
            alt=""
            onLoad={load.onLoaded}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-200",
              load.loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      ) : (
        <Image
          src={getCloudinaryUrl(img.cloudinary_public_id, "thumbnail")}
          alt={img.alt_text ?? `${title} ${index + 1}`}
          fill
          sizes="64px"
          className={cn(
            "object-cover transition-opacity duration-200",
            load.loaded ? "opacity-100" : "opacity-0",
          )}
          unoptimized
          onLoad={load.onLoaded}
        />
      )}
    </button>
  )
}

function isHorizontal(img: ArtworkImage): boolean {
  return (
    typeof img.width === "number" &&
    typeof img.height === "number" &&
    img.height > 0 &&
    img.width > img.height
  )
}

export default function ArtworkGallery({ images, title }: ArtworkGalleryProps) {
  const sorted = useMemo(
    () => [...images].sort((a, b) => a.position - b.position),
    [images],
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxZoomed, setLightboxZoomed] = useState(false)
  const active = sorted[activeIndex]
  const hasMany = sorted.length > 1

  useEffect(() => {
    if (sorted.length === 0) return
    if (activeIndex >= sorted.length) setActiveIndex(0)
  }, [activeIndex, sorted.length])

  const goTo = useCallback(
    (index: number) => {
      if (sorted.length === 0) return
      const next = ((index % sorted.length) + sorted.length) % sorted.length
      setActiveIndex(next)
    },
    [sorted.length],
  )

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])

  const mainSwipe = useHorizontalSwipe(goPrev, goNext, hasMany)
  const lightboxSwipe = useHorizontalSwipe(
    goPrev,
    goNext,
    hasMany && lightboxOpen && !lightboxZoomed,
  )

  useEffect(() => {
    if (!lightboxOpen) setLightboxZoomed(false)
  }, [lightboxOpen, activeIndex])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxOpen, goPrev, goNext])

  if (sorted.length === 0 || !active) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-stone-100">
        <span className="text-sm text-stone-300">Sin imagen</span>
      </div>
    )
  }

  const activeHorizontal = isHorizontal(active)
  const mainImageKey = active.cloudinary_public_id
  const mainImageLoad = useImageLoadState(mainImageKey)

  return (
    <div className="space-y-3">
      {/* Imagen principal — clic abre lightbox */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl bg-stone-100 touch-pan-y",
          activeHorizontal ? "aspect-[4/3]" : "aspect-[3/4]",
        )}
        onTouchStart={mainSwipe.onTouchStart}
        onTouchEnd={mainSwipe.onTouchEnd}
      >
        <button
          type="button"
          onClick={() => {
            if (mainSwipe.consumeClick()) return
            setLightboxOpen(true)
          }}
          className="relative block h-full w-full cursor-zoom-in p-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          aria-label={`Ampliar imagen ${activeIndex + 1} de ${sorted.length}. Desliza para cambiar de foto.`}
        >
          <span className="relative block h-full w-full overflow-hidden rounded-lg bg-stone-100">
            <GalleryImageLoader loading={mainImageLoad.loading} />
            <Image
              src={getCloudinaryUrl(mainImageKey, "detail")}
              alt={active.alt_text ?? title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn(
                "transition-[opacity,transform] duration-300 group-hover:scale-[1.02]",
                activeHorizontal ? "object-contain" : "object-cover",
                mainImageLoad.loaded ? "opacity-100" : "opacity-0",
              )}
              priority
              loading="eager"
              unoptimized
              onLoad={mainImageLoad.onLoaded}
              onLoadingComplete={mainImageLoad.onLoaded}
            />
          </span>

          <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-carbon-900/55 px-2.5 py-1 text-[11px] font-medium text-cream opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:opacity-100">
            <Maximize2 className="size-3.5" aria-hidden />
            Ampliar
          </span>

          {hasMany ? (
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-carbon-900/45 px-2 py-0.5 font-mono text-[10px] text-cream backdrop-blur-sm">
              {activeIndex + 1} / {sorted.length}
            </span>
          ) : null}
        </button>

        {hasMany ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/80 bg-white/90 text-carbon-900 shadow-sm backdrop-blur-sm transition-colors hover:border-gold-500 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="size-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/80 bg-white/90 text-carbon-900 shadow-sm backdrop-blur-sm transition-colors hover:border-gold-500 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="size-5" strokeWidth={2} />
            </button>
          </>
        ) : null}
      </div>

      {/* Miniaturas */}
      {hasMany ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <GalleryThumb
              key={img.id}
              img={img}
              title={title}
              index={i}
              active={i === activeIndex}
              onSelect={() => setActiveIndex(i)}
            />
          ))}
        </div>
      ) : null}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-[100vw] max-w-[100vw] flex-col gap-0 border-0 bg-carbon-900/96 p-0 shadow-none sm:rounded-none [&>button:last-child]:hidden">
          <DialogTitle className="sr-only">
            {title} — imagen {activeIndex + 1} de {sorted.length}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Vista ampliada. Desliza para cambiar de foto, pellizca con dos dedos para acercar, o usa
            las flechas del teclado.
          </DialogDescription>

          <div className="relative flex min-h-0 flex-1 flex-col">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 z-30 flex size-11 items-center justify-center rounded-full border border-white/10 bg-carbon-900/50 text-cream shadow-lg backdrop-blur-sm transition-colors hover:bg-white/15 active:scale-95 top-[calc(env(safe-area-inset-top,0px)+3.75rem)] sm:top-4"
              aria-label="Cerrar vista ampliada"
            >
              <X className="size-5" strokeWidth={2.5} />
            </button>

            {hasMany ? (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-cream backdrop-blur-sm transition-colors hover:border-gold-500/50 hover:bg-white/15"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="size-6" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-cream backdrop-blur-sm transition-colors hover:border-gold-500/50 hover:bg-white/15"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="size-6" strokeWidth={2} />
                </button>
              </>
            ) : null}

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-2 pt-[calc(env(safe-area-inset-top,0px)+4.5rem)] sm:px-20 sm:pb-4 sm:pt-16">
              <ArtworkLightboxZoomImage
                key={active.id}
                src={getCloudinaryUrl(active.cloudinary_public_id, "lightbox")}
                alt={active.alt_text ?? title}
                onZoomedChange={setLightboxZoomed}
                onTouchStart={lightboxSwipe.onTouchStart}
                onTouchEnd={lightboxSwipe.onTouchEnd}
                className="min-h-0 flex-1"
              />
            </div>

            <div className="shrink-0 border-t border-white/10 px-4 py-3">
              <p className="truncate text-center font-display text-sm text-cream/90">{title}</p>
              {hasMany ? (
                <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
                  {sorted.map((img, i) => (
                    <GalleryThumb
                      key={img.id}
                      img={img}
                      title={title}
                      index={i}
                      active={i === activeIndex}
                      onSelect={() => setActiveIndex(i)}
                      dark
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
