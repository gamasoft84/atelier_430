"use client"

import { Heart } from "lucide-react"
import { useWishlist } from "@/components/public/WishlistProvider"
import { cn } from "@/lib/utils"

interface WishlistHeartButtonProps {
  artworkId: string
  className?: string
  size?: "sm" | "md"
}

export default function WishlistHeartButton({
  artworkId,
  className,
  size = "sm",
}: WishlistHeartButtonProps) {
  const { has, toggle, ready } = useWishlist()
  const active = has(artworkId)
  const iconSize = size === "md" ? "h-6 w-6" : "h-4 w-4"
  const pad = size === "md" ? "p-2.5" : "p-1.5"

  return (
    <button
      type="button"
      aria-label={active ? "Quitar de favoritos" : "Añadir a favoritos"}
      aria-pressed={active}
      disabled={!ready}
      className={cn(
        "rounded-full backdrop-blur-sm shadow-md ring-1 ring-black/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 disabled:opacity-50",
        // Fondo blanco sólido: legible sobre fotos oscuras y claras; evita que el relleno dorado se pierda sobre gold-50
        "bg-white/95 text-stone-600 hover:text-gold-600 hover:ring-gold-500/35",
        pad,
        active &&
          "text-gold-600 ring-2 ring-gold-500/70 bg-white shadow-lg hover:text-gold-600",
        className
      )}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void toggle(artworkId)
      }}
    >
      <Heart className={cn(iconSize, active && "fill-current")} strokeWidth={1.75} />
    </button>
  )
}
