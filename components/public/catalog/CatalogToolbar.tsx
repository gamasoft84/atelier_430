"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition, useState, useEffect, useRef } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import type { SortOption } from "@/types/catalog"

const SEARCH_DEBOUNCE_MS = 350

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recientes", label: "Más recientes" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
  { value: "tamano_asc", label: "Tamaño: menor a mayor" },
  { value: "tamano_desc", label: "Tamaño: mayor a menor" },
]

interface CatalogToolbarProps {
  total: number
  hasFilters: boolean
  currentSort: SortOption
  currentQ: string
  /** Base path al limpiar filtros (respeta página de categoría). Default `/catalogo`. */
  clearFiltersHref?: string
  onMobileFilterToggle: () => void
}

function readUrlQ(): string {
  if (typeof window === "undefined") return ""
  return new URLSearchParams(window.location.search).get("q") ?? ""
}

export default function CatalogToolbar({
  total,
  hasFilters,
  currentSort,
  currentQ,
  clearFiltersHref = "/catalogo",
  onMobileFilterToggle,
}: CatalogToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(currentQ)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingQRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipInitialDebounce = useRef(true)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : searchParams.toString(),
      )
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams],
  )

  const commitQToUrl = useCallback(
    (value: string) => {
      const urlQ = readUrlQ()
      if (value === urlQ) {
        pendingQRef.current = null
        return
      }
      pendingQRef.current = value
      updateParam("q", value || null)
    },
    [updateParam],
  )

  const flushDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }, [])

  // URL → input: solo sin foco; nunca pisar mientras escribes o borras
  useEffect(() => {
    if (inputRef.current === document.activeElement) return

    if (pendingQRef.current !== null) {
      if (currentQ === pendingQRef.current) {
        pendingQRef.current = null
      }
      return
    }

    setSearch(currentQ)
  }, [currentQ])

  // Input → URL (debounced)
  useEffect(() => {
    if (skipInitialDebounce.current) {
      skipInitialDebounce.current = false
      return
    }

    flushDebounce()

    if (search === readUrlQ()) {
      pendingQRef.current = null
      return
    }

    debounceRef.current = setTimeout(() => {
      commitQToUrl(search)
      debounceRef.current = null
    }, SEARCH_DEBOUNCE_MS)

    return flushDebounce
  }, [search, commitQToUrl, flushDebounce])

  const handleSearchBlur = () => {
    flushDebounce()
    if (search !== readUrlQ()) {
      commitQToUrl(search)
    }
  }

  const clearFilters = () => {
    flushDebounce()
    pendingQRef.current = null
    setSearch("")
    startTransition(() => {
      router.push(clearFiltersHref, { scroll: false })
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
          ref={inputRef}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={handleSearchBlur}
          placeholder="Buscar por título, código o categoría…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm text-stone-500 hidden sm:inline whitespace-nowrap">
          {total} {total === 1 ? "obra" : "obras"}
        </span>

        <select
          value={currentSort}
          onChange={(e) => updateParam("orden", e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 cursor-pointer max-w-[9rem] sm:max-w-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

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

      <p className="text-sm text-stone-500 sm:hidden">
        {total} {total === 1 ? "obra encontrada" : "obras encontradas"}
      </p>
    </div>
  )
}