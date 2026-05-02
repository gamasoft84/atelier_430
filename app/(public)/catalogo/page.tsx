import { Suspense } from "react"
import ArtworkCard from "@/components/public/ArtworkCard"
import { getPublicArtworks, getShowPrices } from "@/lib/supabase/queries/public"

export const metadata = { title: "Catálogo" }

async function ArtworkGrid() {
  const [artworks, showPrices] = await Promise.all([
    getPublicArtworks(),
    getShowPrices(),
  ])

  if (artworks.length === 0) {
    return (
      <div className="text-center py-24 space-y-3">
        <p className="font-display text-xl text-carbon-900">Próximamente nuevas obras</p>
        <p className="text-sm text-stone-500">
          Estamos preparando nuestra colección. Vuelve pronto.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {artworks.map((artwork, i) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          showPrice={showPrices}
          priority={i < 8}
        />
      ))}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4] bg-stone-200 rounded-lg animate-pulse" />
          <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-stone-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function CatalogoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-carbon-900">Catálogo</h1>
        <p className="text-sm text-stone-500 mt-1">Colección completa disponible</p>
      </div>

      <Suspense fallback={<GridSkeleton />}>
        <ArtworkGrid />
      </Suspense>
    </div>
  )
}
