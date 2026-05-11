import { Suspense } from "react"
import type { Metadata } from "next"
import CatalogClient from "@/components/public/catalog/CatalogClient"
import { getFilteredArtworks, getPriceRange } from "@/lib/supabase/queries/catalog"
import { getShowPrices, getPreferPremiumInCatalog } from "@/lib/supabase/queries/public"
import { parseCatalogParams } from "@/types/catalog"

export const metadata: Metadata = { title: "Catálogo" }

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const params = parseCatalogParams(raw)

  const [result, showPrices, priceRange, preferPremium] = await Promise.all([
    getFilteredArtworks(params),
    getShowPrices(),
    getPriceRange(),
    getPreferPremiumInCatalog(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-carbon-900">Catálogo</h1>
        <p className="text-sm text-stone-500 mt-1">
          {result.total} {result.total === 1 ? "obra" : "obras"} en la colección
        </p>
      </div>

      <Suspense fallback={<GridSkeleton />}>
        <CatalogClient
          artworks={result.artworks}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          params={params}
          showPrices={showPrices}
          priceRange={priceRange}
          preferPremium={preferPremium}
        />
      </Suspense>
    </div>
  )
}
