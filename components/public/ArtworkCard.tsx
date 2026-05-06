"use client"

import Image from "next/image"
import Link from "next/link"
import type { ArtworkPublic } from "@/types/artwork"
import ArtworkSizeBadge from "@/components/public/ArtworkSizeBadge"
import WishlistHeartButton from "@/components/public/WishlistHeartButton"

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  sold:     { label: "VENDIDA",   className: "bg-carbon-900 text-cream" },
  reserved: { label: "RESERVADA", className: "bg-amber-100 text-amber-800" },
}

const CATEGORY_LABEL: Record<string, string> = {
  religiosa: "Religiosa",
  nacional:  "Nacional",
  europea:   "Europea",
  moderna:   "Moderna",
}

interface ArtworkCardProps {
  artwork: ArtworkPublic
  showPrice?: boolean
  priority?: boolean
}

export default function ArtworkCard({ artwork, showPrice = true, priority = false }: ArtworkCardProps) {
  const primaryImage =
    artwork.images?.find((i) => i.is_primary) ?? artwork.images?.[0]
  const hasRenderableImage =
    typeof primaryImage?.cloudinary_url === "string" && primaryImage.cloudinary_url.length > 0

  const badge = STATUS_BADGE[artwork.status]
  const isSold = artwork.status === "sold"
  const isHorizontal =
    Boolean(primaryImage?.width && primaryImage?.height) &&
    (primaryImage!.width as number) > (primaryImage!.height as number)

  return (
    <div className="relative">
      <Link href={`/catalogo/${artwork.code}`} className="group block">
        <div
          className={[
            "relative overflow-hidden rounded-lg bg-stone-100",
            isHorizontal ? "aspect-[4/3]" : "aspect-[3/4]",
          ].join(" ")}
        >
          {hasRenderableImage ? (
            <div className="h-full w-full p-2">
              <div className="relative h-full w-full overflow-hidden rounded-md bg-stone-100">
                <Image
                  src={primaryImage!.cloudinary_url}
                  alt={primaryImage.alt_text ?? artwork.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`${isHorizontal ? "object-contain" : "object-cover"} transition-transform duration-500 group-hover:scale-[1.03] ${isSold ? "opacity-60" : ""}`}
                  priority={priority}
                  loading={priority ? "eager" : "lazy"}
                />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
              <span className="text-stone-300 text-sm">Sin imagen</span>
            </div>
          )}

          {badge && (
            <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded ${badge.className}`}>
              {badge.label}
            </span>
          )}

          <ArtworkSizeBadge widthCm={artwork.width_cm} heightCm={artwork.height_cm} />

          <div className="absolute inset-0 bg-carbon-900/0 group-hover:bg-carbon-900/20 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
            <span className="text-xs font-medium text-white bg-carbon-900/70 px-3 py-1 rounded-full backdrop-blur-sm">
              Ver obra
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-0.5">
          <p className="text-[11px] uppercase tracking-widest text-stone-400">
            {CATEGORY_LABEL[artwork.category]}
          </p>
          <p className="font-display text-sm leading-snug text-carbon-900 line-clamp-2 group-hover:text-gold-500 transition-colors">
            {artwork.title}
          </p>
          {artwork.category === "religiosa" &&
            artwork.status === "available" &&
            typeof artwork.stock_quantity === "number" &&
            artwork.stock_quantity > 1 && (
            <p className="text-xs text-stone-500">
              {artwork.stock_quantity} disponibles
            </p>
          )}
          {showPrice && artwork.show_price && artwork.price ? (
            <p className="text-sm font-semibold text-carbon-900">
              ${artwork.price.toLocaleString("es-MX")} MXN
            </p>
          ) : showPrice && !artwork.show_price ? (
            <p className="text-xs text-stone-400">Consultar precio</p>
          ) : null}
        </div>
      </Link>

      <WishlistHeartButton
        artworkId={artwork.id}
        className="absolute top-2 right-2 z-20 shadow-sm"
      />
    </div>
  )
}
