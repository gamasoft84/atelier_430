"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import ArtworkCard from "@/components/public/ArtworkCard"
import { useWishlist } from "@/components/public/WishlistProvider"
import { SITE_URL, WHATSAPP_NUMBER } from "@/lib/constants"
import { getWishlistArtworksForSession } from "@/lib/supabase/queries/wishlist"
import type { ArtworkPublic } from "@/types/artwork"

interface FavoritosPageClientProps {
  showPrices: boolean
  sharedSessionId: string | null
  sharedArtworks: ArtworkPublic[] | null
}

function buildWhatsAppUrl(artworks: ArtworkPublic[]): string {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}` : ""
  const lines = artworks.map((a) => `• ${a.code} — ${a.title}`)
  const text = encodeURIComponent(
    ["Hola Atelier 430, me interesan estas obras de mi selección:", "", ...lines].join("\n")
  )
  return base ? `${base}?text=${text}` : ""
}

export default function FavoritosPageClient({
  showPrices,
  sharedSessionId,
  sharedArtworks,
}: FavoritosPageClientProps) {
  const { sessionId, ready, ids, add, refresh } = useWishlist()
  const [mine, setMine] = useState<ArtworkPublic[]>([])
  const [loadingMine, setLoadingMine] = useState(true)

  const sharedMode = sharedSessionId !== null
  const sharedList = sharedArtworks ?? []

  useEffect(() => {
    if (sharedMode || !ready || !sessionId) {
      setLoadingMine(false)
      return
    }
    let cancelled = false
    setLoadingMine(true)
    void getWishlistArtworksForSession(sessionId).then((rows) => {
      if (!cancelled) {
        setMine(rows)
        setLoadingMine(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [sharedMode, ready, sessionId, ids.join(",")])

  const copyShareLink = useCallback(() => {
    if (!sessionId) return
    const url = `${SITE_URL.replace(/\/$/, "")}/favoritos?list=${encodeURIComponent(sessionId)}`
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Enlace copiado"),
      () => toast.error("No se pudo copiar")
    )
  }, [sessionId])

  const mergeSharedIntoMine = useCallback(async () => {
    if (!sharedList.length) return
    for (const a of sharedList) {
      await add(a.id)
    }
    await refresh()
    toast.success("Obras añadidas a tus favoritos")
  }, [sharedList, add, refresh])

  if (sharedMode) {
    const wa = buildWhatsAppUrl(sharedList)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-widest text-stone-400">Lista compartida</p>
          <h1 className="font-display text-3xl text-carbon-900">Selección compartida</h1>
          <p className="text-sm text-stone-500 max-w-xl">
            Alguien te compartió esta lista. Puedes añadir todas las obras a tus favoritos o
            consultar por WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            type="button"
            onClick={() => void mergeSharedIntoMine()}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-gold-500 text-white text-sm font-medium hover:bg-gold-400 transition-colors"
          >
            Añadir todo a mis favoritos
          </button>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm font-medium text-carbon-900 hover:bg-stone-50 transition-colors"
            >
              Consultar por WhatsApp
            </a>
          ) : null}
          <Link
            href="/catalogo"
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:text-carbon-900"
          >
            Ir al catálogo
          </Link>
        </div>

        {sharedList.length === 0 ? (
          <p className="text-sm text-stone-500">Esta lista está vacía o las obras ya no están disponibles.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {sharedList.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                showPrice={showPrices}
                priority={false}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-carbon-900">Favoritos</h1>
          <p className="text-sm text-stone-500 mt-1">
            Obras que guardaste para ver después
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyShareLink}
            disabled={!sessionId || mine.length === 0}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-carbon-900 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Compartir mi lista
          </button>
          {mine.length > 0 && buildWhatsAppUrl(mine) ? (
            <a
              href={buildWhatsAppUrl(mine)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gold-500 text-white text-sm font-medium hover:bg-gold-400 transition-colors"
            >
              Consultar por WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      {loadingMine ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-stone-100 rounded-lg animate-pulse" />
              <div className="h-3 w-16 bg-stone-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : mine.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-6 py-14 text-center">
          <p className="text-sm text-stone-600 mb-4">Aún no tienes obras guardadas.</p>
          <Link
            href="/catalogo"
            className="inline-flex text-sm font-medium text-gold-600 hover:text-gold-500"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {mine.map((artwork, i) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              showPrice={showPrices}
              priority={i < 8}
            />
          ))}
        </div>
      )}
    </div>
  )
}
