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
const VALID_SORTS = new Set<string>([
  "code",
  "title",
  "category",
  "size",
  "status",
  "price",
  "created_at",
])

export default async function ObrasPage(props: {
  searchParams: Promise<{
    q?: string
    category?: string
    status?: string
    page?: string
    size?: string
    sort?: string
    dir?: string
  }>
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

  const safeSize = (params.size ?? "").match(/^(\d+)\s*x\s*(\d+)$/i)
  const sizeWidth = safeSize ? Number(safeSize[1]) : null
  const sizeHeight = safeSize ? Number(safeSize[2]) : null

  const safeSort = VALID_SORTS.has(params.sort ?? "")
    ? (params.sort as "code" | "title" | "category" | "size" | "status" | "price" | "created_at")
    : "created_at"
  const safeDir = params.dir === "asc" ? "asc" : "desc"
  const ascending = safeDir === "asc"

  const supabase = await createClient()

  // Build size options (distinct, from DB)
  const { data: sizeRows } = await supabase
    .from("artworks")
    .select("width_cm, height_cm")
    .not("width_cm", "is", null)
    .not("height_cm", "is", null)
    .limit(2000)

  const sizeOptions = Array.from(
    new Set(
      (sizeRows ?? [])
        .map((r) => `${r.width_cm}x${r.height_cm}`)
        .filter((s) => !s.includes("null"))
    )
  ).sort((a, b) => {
    const [aw, ah] = a.split("x").map(Number)
    const [bw, bh] = b.split("x").map(Number)
    if (aw !== bw) return aw - bw
    return ah - bh
  })

  let query = supabase
    .from("artworks")
    .select(
      `id, code, title, category, status, price, original_price, show_price, created_at,
       width_cm, height_cm, price_locked, stock_quantity,
       artwork_images(cloudinary_url, cloudinary_public_id, is_primary, position)`,
      { count: "exact" }
    )
    .range(from, to)

  // Sorting
  switch (safeSort) {
    case "code":
      query = query.order("code", { ascending, nullsFirst: false })
      break
    case "title":
      query = query.order("title", { ascending, nullsFirst: false })
      break
    case "category":
      query = query.order("category", { ascending, nullsFirst: false })
      break
    case "status":
      query = query.order("status", { ascending, nullsFirst: false })
      break
    case "price":
      query = query.order("price", { ascending, nullsFirst: false })
      break
    case "size":
      // Primary sort by width, then height (both nullable)
      query = query
        .order("width_cm", { ascending, nullsFirst: false })
        .order("height_cm", { ascending, nullsFirst: false })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  if (params.q?.trim()) {
    const q = params.q.trim()
    query = query.or(`title.ilike.%${q}%,code.ilike.%${q}%,location_in_storage.ilike.%${q}%`)
  }
  if (safeCategory) {
    query = query.eq("category", safeCategory)
  }
  if (safeStatus) {
    query = query.eq("status", safeStatus)
  }
  if (sizeWidth !== null && sizeHeight !== null) {
    query = query.eq("width_cm", sizeWidth).eq("height_cm", sizeHeight)
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
        <ArtworksFilters sizeOptions={sizeOptions} />
      </Suspense>

      <ArtworksTable
        artworks={artworks}
        page={page}
        totalPages={totalPages}
        currentParams={{
          q: params.q,
          category: params.category,
          status: params.status,
          size: params.size,
          sort: safeSort,
          dir: safeDir,
        }}
      />
    </div>
  )
}
