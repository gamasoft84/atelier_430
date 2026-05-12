import { createClient } from "@/lib/supabase/server"
import { ARTWORKS_PER_PAGE } from "@/lib/constants"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import type { ArtworkPublic } from "@/types/artwork"
import { isArtworkInSizeCategories } from "@/lib/artwork-size"
import type { CatalogParams, CatalogResult } from "@/types/catalog"

// ─── Price range ──────────────────────────────────────────────────────────

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select("price")
    .eq("status", "available")
    .eq("show_price", true)
    .not("price", "is", null)
    .order("price", { ascending: true })
    .limit(1)

  const { data: maxData } = await supabase
    .from("artworks")
    .select("price")
    .eq("status", "available")
    .eq("show_price", true)
    .not("price", "is", null)
    .order("price", { ascending: false })
    .limit(1)

  const minPrice = (data?.[0] as { price: number } | undefined)?.price ?? 0
  const maxPrice = (maxData?.[0] as { price: number } | undefined)?.price ?? 10000

  return { min: Math.floor(minPrice), max: Math.ceil(maxPrice) }
}

// ─── Main catalog query ───────────────────────────────────────────────────

export async function getFilteredArtworks(
  params: CatalogParams,
  perPage = ARTWORKS_PER_PAGE
): Promise<CatalogResult> {
  const supabase = await createClient()

  let query = supabase.from("artworks").select(ARTWORK_SELECT)

  // Availability
  if (params.solo_disponibles) {
    query = query.eq("status", "available")
  } else {
    query = query.in("status", ["available", "reserved", "sold"])
  }

  // Category
  if (params.categorias.length > 0) {
    query = query.in("category", params.categorias as import("@/types/artwork").ArtworkCategory[])
  }

  // Technique
  if (params.tecnicas.length > 0) {
    query = query.in("technique", params.tecnicas)
  }

  // Frame
  if (params.marco === "con") {
    query = query.eq("has_frame", true)
  } else if (params.marco === "sin") {
    query = query.eq("has_frame", false)
  }

  // Price range
  if (params.precio_min !== null) {
    query = query.gte("price", params.precio_min)
  }
  if (params.precio_max !== null) {
    query = query.lte("price", params.precio_max)
  }

  // Search: title, code, tags (ilike on title/code; tags requires special handling)
  if (params.q) {
    const q = params.q.replace(/[%_]/g, "\\$&")
    query = query.or(`title.ilike.%${q}%,code.ilike.%${q}%`)
  }

  // Sort order (applied to DB-level sort for non-size sorts)
  const needsSizeSort =
    params.orden === "tamano_asc" || params.orden === "tamano_desc"

  if (!needsSizeSort) {
    switch (params.orden) {
      case "precio_asc":
        query = query.order("price", { ascending: true, nullsFirst: false })
        break
      case "precio_desc":
        query = query.order("price", { ascending: false, nullsFirst: false })
        break
      default:
        query = query
          .order("created_at", { ascending: false })
    }
  }

  // Fetch all matching rows (size filter + size sort applied in JS)
  // With ≤430 artworks this is acceptable
  const { data, error } = await query.limit(1000)

  if (error || !data) {
    return { artworks: [], total: 0, page: params.page, totalPages: 0 }
  }

  // Normalize images
  let rows = (data as unknown[]).map(normalizeArtworkRow) as ArtworkPublic[]

  // Size filter (JS layer)
  if (params.tamanos.length > 0) {
    rows = rows.filter((a) =>
      isArtworkInSizeCategories(a.width_cm, a.height_cm, params.tamanos)
    )
  }

  if (params.formatos.length > 0) {
    rows = rows.filter((a) => params.formatos.includes(a.catalog_format))
  }

  // Size sort (JS layer)
  if (needsSizeSort) {
    rows.sort((a, b) => {
      const sizeA = Math.max(a.width_cm ?? 0, a.height_cm ?? 0)
      const sizeB = Math.max(b.width_cm ?? 0, b.height_cm ?? 0)
      return params.orden === "tamano_asc" ? sizeA - sizeB : sizeB - sizeA
    })
  }

  // Pagination
  const total = rows.length
  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / perPage))
  const safePage = total === 0 ? 1 : Math.min(params.page, totalPages)
  const offset = (safePage - 1) * perPage
  const artworks = rows.slice(offset, offset + perPage)

  return { artworks, total, page: safePage, totalPages }
}

