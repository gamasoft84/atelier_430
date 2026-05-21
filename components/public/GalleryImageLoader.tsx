"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GalleryImageLoaderProps {
  loading: boolean
  variant?: "light" | "dark"
  className?: string
  label?: string
}

export function GalleryImageLoader({
  loading,
  variant = "light",
  className,
  label = "Cargando imagen…",
}: GalleryImageLoaderProps) {
  if (!loading) return null

  return (
    <div
      className={cn(
        "absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2.5",
        variant === "dark" ? "bg-carbon-900/85" : "bg-stone-100",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2
        className={cn(
          "size-7 animate-spin",
          variant === "dark" ? "text-gold-400" : "text-gold-500",
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      <span
        className={cn(
          "text-xs font-medium tracking-wide",
          variant === "dark" ? "text-cream/75" : "text-stone-500",
        )}
      >
        {label}
      </span>
    </div>
  )
}

/** Reinicia el estado al cambiar de imagen (p. ej. otro public_id). */
export function useImageLoadState(imageKey: string) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [imageKey])

  const onLoaded = useCallback(() => setLoaded(true), [])

  return {
    loaded,
    loading: !loaded,
    onLoaded,
  }
}

/** Miniatura con pulso mientras carga (sin texto). */
export function GalleryThumbnailPulse({ loading }: { loading: boolean }) {
  if (!loading) return null
  return (
    <div
      className="absolute inset-0 z-[1] animate-pulse bg-stone-200"
      aria-hidden
    />
  )
}
