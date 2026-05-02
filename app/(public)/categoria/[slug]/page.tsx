import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from "next"
import CatalogClient from "@/components/public/catalog/CatalogClient"
import { getFilteredArtworks, getPriceRange } from "@/lib/supabase/queries/catalog"
import { getShowPrices } from "@/lib/supabase/queries/public"
import { parseCatalogParams } from "@/types/catalog"
import type { ArtworkCategory } from "@/types/artwork"

const VALID_SLUGS: ArtworkCategory[] = ["religiosa", "nacional", "europea", "moderna"]

const CATEGORY_META: Record<ArtworkCategory, { label: string; description: string }> = {
  religiosa: {
    label: "Arte Religiosa",
    description: "Impresiones y obras de devoción para el hogar mexicano.",
  },
  nacional: {
    label: "Arte Nacional",
    description: "Paisajes mexicanos al óleo: campo, mar, montaña y ciudad.",
  },
  europea: {
    label: "Arte Europea",
    description: "Reproducciones clásicas al óleo de los grandes maestros europeos.",
  },
  moderna: {
    label: "Arte Moderna",
    description: "Arte contemporáneo, abstracto y expresionista.",
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!VALID_SLUGS.includes(slug as ArtworkCategory)) return { title: "Categoría no encontrada" }
  const meta = CATEGORY_META[slug as ArtworkCategory]
  return { title: meta.label, description: meta.description }
}

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

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ slug }, raw] = await Promise.all([params, searchParams])

  if (!VALID_SLUGS.includes(slug as ArtworkCategory)) notFound()

  const category = slug as ArtworkCategory
  const meta = CATEGORY_META[category]

  // Force the category into parsed params (locked, non-overridable)
  const catalogParams = parseCatalogParams({ ...raw, categoria: category })

  const [result, showPrices, priceRange] = await Promise.all([
    getFilteredArtworks(catalogParams),
    getShowPrices(),
    getPriceRange(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Categoría</p>
        <h1 className="font-display text-3xl text-carbon-900">{meta.label}</h1>
        <p className="text-sm text-stone-500 mt-1">{meta.description}</p>
        <p className="text-xs text-stone-400 mt-1">
          {result.total} {result.total === 1 ? "obra disponible" : "obras disponibles"}
        </p>
      </div>

      <Suspense fallback={<GridSkeleton />}>
        <CatalogClient
          artworks={result.artworks}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          params={catalogParams}
          showPrices={showPrices}
          priceRange={priceRange}
          lockedCategory={category}
        />
      </Suspense>
    </div>
  )
}
