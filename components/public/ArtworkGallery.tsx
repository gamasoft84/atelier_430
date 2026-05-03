"use client"

import { useState } from "react"
import Image from "next/image"
import type { ArtworkImage } from "@/types/artwork"

interface ArtworkGalleryProps {
  images: ArtworkImage[]
  title: string
}

export default function ArtworkGallery({ images, title }: ArtworkGalleryProps) {
  const sorted = [...images].sort((a, b) => a.position - b.position)
  const [activeIndex, setActiveIndex] = useState(0)
  const active = sorted[activeIndex]

  if (sorted.length === 0) {
    return (
      <div className="aspect-[3/4] rounded-xl bg-stone-100 flex items-center justify-center">
        <span className="text-stone-300 text-sm">Sin imagen</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-100">
        <div className="absolute inset-2 overflow-hidden rounded-lg">
          <Image
            src={active.cloudinary_url}
            alt={active.alt_text ?? title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            priority
          />
        </div>
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative flex-shrink-0 w-16 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                i === activeIndex
                  ? "border-gold-500"
                  : "border-transparent hover:border-stone-300"
              }`}
            >
              <Image
                src={img.cloudinary_url}
                alt={img.alt_text ?? `${title} ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
