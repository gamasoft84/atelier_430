"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import ArtworkCard from "@/components/public/ArtworkCard"
import FilterSidebar from "@/components/public/catalog/FilterSidebar"
import CatalogToolbar from "@/components/public/catalog/CatalogToolbar"
import Pagination from "@/components/public/catalog/Pagination"
import EmptyState from "@/components/public/catalog/EmptyState"
import type { ArtworkPublic } from "@/types/artwork"
import type { CatalogParams, SortOption, SizeOption, MarcoOption } from "@/types/catalog"
import { hasActiveFilters } from "@/types/catalog"

interface CatalogClientProps {
  artworks: ArtworkPublic[]
  total: number
  page: number
  totalPages: number
  params: CatalogParams
  showPrices: boolean
  priceRange: { min: number; max: number }
  lockedCategory?: string
}

export default function CatalogClient({
  artworks,
  total,
  page,
  totalPages,
  params,
  showPrices,
  priceRange,
  lockedCategory,
}: CatalogClientProps) {
  const searchParams = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const active = hasActiveFilters(params)

  const buildHref = (p: number) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (p === 1) sp.delete("page"); else sp.set("page", String(p))
    return `?${sp.toString()}`
  }

  const clearHref = lockedCategory ? `/categoria/${lockedCategory}` : "/catalogo"

  return (
    <div className="flex gap-8 items-start">
      <FilterSidebar
        categorias={params.categorias}
        tecnicas={params.tecnicas}
        tamanos={params.tamanos as SizeOption[]}
        marco={params.marco as MarcoOption | null}
        precioMin={params.precio_min}
        precioMax={params.precio_max}
        soloDisponibles={params.solo_disponibles}
        showPrices={showPrices}
        priceRange={priceRange}
        lockedCategory={lockedCategory}
        mobileOpen={mobileFiltersOpen}
        onMobileClose={() => setMobileFiltersOpen(false)}
      />

      <div className="flex-1 min-w-0 space-y-5">
        <CatalogToolbar
          total={total}
          hasFilters={active}
          currentSort={params.orden as SortOption}
          currentQ={params.q}
          onMobileFilterToggle={() => setMobileFiltersOpen(true)}
        />

        {artworks.length === 0 ? (
          <EmptyState
            hasFilters={active}
            onClear={() => { window.location.href = clearHref }}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {artworks.map((artwork, i) => (
                <div key={artwork.id}>
                  <ArtworkCard artwork={artwork} showPrice={showPrices} priority={i < 8} />
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </div>
    </div>
  )
}
