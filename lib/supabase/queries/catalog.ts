import { createClient } from "@/lib/supabase/server"
import type { ArtworkPublic } from "@/types/artwork"
import type { CatalogParams, CatalogResult, SizeOption } from "@/types/catalog"
import { ARTWORKS_PER_PAGE } from "@/lib/constants"

const ARTWORK_SELECT = `
  id, code, title, description, category, subcategory, tags, technique,
  width_cm, height_cm, has_frame, frame_material, frame_color,
  price, original_price, show_price, status,
  reserved_until, reserved_by, sold_at, sold_price, sold_channel, sold_buyer_name,
  ai_generated, manually_edited, views_count, wishlist_count, whatsapp_clicks,
  created_at, updated_at, published_at,
  images:artwork_images(
    id, artwork_id, cloudinary_url, cloudinary_public_id,
    width, height, position, is_primary, alt_text, created_at
  )
`.trim()

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

// ─── Size helper ──────────────────────────────────────────────────────────

const SIZE_RANGES: Record<SizeOption, [number, number]> = {
  chico:   [0,   50],
  mediano: [50,  80],
  grande:  [80, 120],
  xl:      [120, Infinity],
}

function matchesSize(
  widthCm: number | null,
  heightCm: number | null,
  sizes: SizeOption[]
): boolean {
  if (sizes.length === 0) return true
  const maxSide = Math.max(widthCm ?? 0, heightCm ?? 0)
  return sizes.some(
    (s) => maxSide >= SIZE_RANGES[s][0] && maxSide < SIZE_RANGES[s][1]
  )
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
    query = query.in("category", params.categorias)
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
  let rows = (data as unknown[]).map(normalizeImages) as ArtworkPublic[]

  // Size filter (JS layer)
  if (params.tamanos.length > 0) {
    rows = rows.filter((a) => matchesSize(a.width_cm, a.height_cm, params.tamanos))
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
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(params.page, totalPages)
  const offset = (safePage - 1) * perPage
  const artworks = rows.slice(offset, offset + perPage)

  return { artworks, total, page: safePage, totalPages }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function normalizeImages(row: unknown): unknown {
  if (!row || typeof row !== "object") return row
  const r = row as Record<string, unknown>
  const images = Array.isArray(r.images)
    ? [...r.images].sort(
        (a, b) =>
          (a as { position: number }).position - (b as { position: number }).position
      )
    : []
  return { ...r, images }
}
