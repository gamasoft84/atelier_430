"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition, useState, useEffect, useRef } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import type { SortOption } from "@/types/catalog"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recientes",   label: "Más recientes" },
  { value: "precio_asc",  label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
  { value: "tamano_asc",  label: "Tamaño: menor a mayor" },
  { value: "tamano_desc", label: "Tamaño: mayor a menor" },
]

interface CatalogToolbarProps {
  total: number
  hasFilters: boolean
  currentSort: SortOption
  currentQ: string
  onMobileFilterToggle: () => void
}

export default function CatalogToolbar({
  total,
  hasFilters,
  currentSort,
  currentQ,
  onMobileFilterToggle,
}: CatalogToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(currentQ)
  const searchDebounceReady = useRef(false)

  // Sync search input with URL param
  useEffect(() => {
    setSearch(currentQ)
  }, [currentQ])

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  // Debounced search (no disparar al montar: evita router.push fantasma y listas vacías)
  useEffect(() => {
    if (!searchDebounceReady.current) {
      searchDebounceReady.current = true
      return
    }
    const id = setTimeout(() => {
      updateParam("q", search || null)
    }, 300)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const clearFilters = () => {
    startTransition(() => {
      router.push("/catalogo", { scroll: false })
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, código o categoría…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Result count */}
        <span className="text-sm text-stone-500 hidden sm:inline whitespace-nowrap">
          {total} {total === 1 ? "obra" : "obras"}
        </span>

        {/* Sort dropdown */}
        <select
          value={currentSort}
          onChange={(e) => updateParam("orden", e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors whitespace-nowrap"
          >
            <X size={13} />
            Limpiar
          </button>
        )}

        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={onMobileFilterToggle}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <SlidersHorizontal size={14} />
          Filtros
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0" />
          )}
        </button>
      </div>

      {/* Mobile result count */}
      <p className="text-sm text-stone-500 sm:hidden">
        {total} {total === 1 ? "obra encontrada" : "obras encontradas"}
      </p>
    </div>
  )
}
