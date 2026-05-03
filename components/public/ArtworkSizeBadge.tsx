import { artworkSizeLabelFromDimensions } from "@/lib/artwork-size"

interface ArtworkSizeBadgeProps {
  widthCm: number | null
  heightCm: number | null
  /** Sobre la imagen (catálogo) o mismo estilo que técnica/medidas (ficha). */
  variant?: "overlay" | "chip"
  className?: string
}

export default function ArtworkSizeBadge({
  widthCm,
  heightCm,
  variant = "overlay",
  className = "",
}: ArtworkSizeBadgeProps) {
  const label = artworkSizeLabelFromDimensions(widthCm, heightCm)
  if (!label) return null

  if (variant === "chip") {
    return (
      <span
        className={`px-3 py-1.5 rounded-lg bg-stone-100 text-xs text-stone-600 ${className}`}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      className={`pointer-events-none absolute bottom-2 left-2 z-10 text-[10px] font-medium text-stone-600 bg-white/90 backdrop-blur-sm border border-stone-200/80 px-2 py-0.5 rounded shadow-sm ${className}`}
    >
      {label}
    </span>
  )
}
