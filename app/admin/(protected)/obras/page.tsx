import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { Plus, FileDown } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ARTWORK_CATEGORIES, ARTWORK_STATUSES } from "@/lib/constants"
import ArtworksFilters from "@/components/admin/ArtworksFilters"
import ArtworksTable, { type ArtworkRow } from "@/components/admin/ArtworksTable"
import type { ArtworkCategory, ArtworkStatus } from "@/types/artwork"

export const metadata: Metadata = { title: "Obras" }

const PAGE_SIZE = 20
const VALID_CATEGORIES = new Set<string>(ARTWORK_CATEGORIES)
const VALID_STATUSES = new Set<string>(ARTWORK_STATUSES)

export default async function ObrasPage(props: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>
}) {
  const params = await props.searchParams

  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const safeCategory = VALID_CATEGORIES.has(params.category ?? "")
    ? (params.category as ArtworkCategory)
    : undefined
  const safeStatus = VALID_STATUSES.has(params.status ?? "")
    ? (params.status as ArtworkStatus)
    : undefined

  const supabase = await createClient()

  let query = supabase
    .from("artworks")
    .select(
      `id, code, title, category, status, price, show_price, created_at,
       artwork_images(cloudinary_url, cloudinary_public_id, is_primary, position)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  if (params.q?.trim()) {
    query = query.or(`title.ilike.%${params.q.trim()}%,code.ilike.%${params.q.trim()}%`)
  }
  if (safeCategory) {
    query = query.eq("category", safeCategory)
  }
  if (safeStatus) {
    query = query.eq("status", safeStatus)
  }

  const { data, count } = await query

  const artworks = (data ?? []) as ArtworkRow[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-carbon-900">Obras</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {count !== null
              ? `${count} obra${count !== 1 ? "s" : ""} en inventario`
              : "Cargando inventario..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/catalogo/pdf?categoria=todas"
            className="flex items-center gap-2 border border-stone-200 text-stone-600 hover:border-stone-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            download
          >
            <FileDown size={16} />
            PDF catálogo
          </a>
          <Link
            href="/admin/obras/nueva"
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nueva obra
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="h-10 rounded-lg bg-stone-100 animate-pulse" />}>
        <ArtworksFilters />
      </Suspense>

      <ArtworksTable
        artworks={artworks}
        page={page}
        totalPages={totalPages}
        currentParams={{
          q: params.q,
          category: params.category,
          status: params.status,
        }}
      />
    </div>
  )
}
