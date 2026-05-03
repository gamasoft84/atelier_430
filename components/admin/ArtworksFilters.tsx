"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { ARTWORK_CATEGORIES, ARTWORK_STATUSES } from "@/lib/constants"

const CATEGORY_LABELS: Record<string, string> = {
  religiosa: "Religiosa",
  nacional: "Nacional",
  europea: "Europea",
  moderna: "Moderna",
}

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservada",
  sold: "Vendida",
  hidden: "Oculta",
  draft: "Borrador",
}

export default function ArtworksFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmed = search.trim()
      if (trimmed) {
        params.set("q", trimmed)
      } else {
        params.delete("q")
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeCategory = searchParams.get("category") ?? ""
  const activeStatus = searchParams.get("status") ?? ""
  const hasFilters = search || activeCategory || activeStatus

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-52">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título o código..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-carbon-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-colors"
        />
      </div>

      <select
        value={activeCategory}
        onChange={(e) => updateParam("category", e.target.value)}
        className="text-sm bg-white border border-stone-200 rounded-lg px-3 py-2 text-carbon-900 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-colors cursor-pointer"
      >
        <option value="">Todas las categorías</option>
        {ARTWORK_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {CATEGORY_LABELS[cat]}
          </option>
        ))}
      </select>

      <select
        value={activeStatus}
        onChange={(e) => updateParam("status", e.target.value)}
        className="text-sm bg-white border border-stone-200 rounded-lg px-3 py-2 text-carbon-900 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-colors cursor-pointer"
      >
        <option value="">Todos los estados</option>
        {ARTWORK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("")
            router.push(pathname)
          }}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-carbon-900 transition-colors"
        >
          <X size={14} />
          Limpiar
        </button>
      )}
    </div>
  )
}
