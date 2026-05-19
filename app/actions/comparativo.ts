"use server"

import { createClient } from "@/lib/supabase/server"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import { getPriceRange } from "@/lib/supabase/queries/catalog"
import { getPreferPremiumInCatalog } from "@/lib/supabase/queries/public"
import { isArtworkInSizeCategories } from "@/lib/artwork-size"
import {
  artworksToPickerItems,
  type ComparativoPickerArtwork,
} from "@/lib/comparativo/picker-artworks"
import {
  EMPTY_COMPARATIVO_PICKER_FILTERS,
  type ComparativoExactSize,
  type ComparativoPickerFilters,
} from "@/types/comparativo-picker"
import type { ArtworkPublic, ArtworkCategory } from "@/types/artwork"

export type ComparativoSearchHit = {
  code: string
  title: string
}

export type ComparativoFilterMeta = {
  priceRange: { min: number; max: number }
  dimensionOptions: ComparativoExactSize[]
}

const BROWSE_LIMIT = 96
const FETCH_CAP = 500

function normalizeFilters(
  filters?: ComparativoPickerFilters,
): ComparativoPickerFilters {
  if (!filters) return EMPTY_COMPARATIVO_PICKER_FILTERS
  return {
    categorias: filters.categorias ?? [],
    tecnicas: filters.tecnicas ?? [],
    tamanos: filters.tamanos ?? [],
    marco: filters.marco ?? null,
    formato: filters.formato ?? null,
    medida: filters.medida ?? null,
    precio_min: filters.precio_min ?? null,
    precio_max: filters.precio_max ?? null,
  }
}

export async function getComparativoFilterMeta(): Promise<ComparativoFilterMeta> {
  const supabase = await createClient()

  const [priceRange, { data: sizeRows }] = await Promise.all([
    getPriceRange(),
    supabase
      .from("artworks")
      .select("width_cm, height_cm")
      .eq("status", "available")
      .not("width_cm", "is", null)
      .not("height_cm", "is", null)
      .limit(2000),
  ])

  const seen = new Set<string>()
  const dimensionOptions: ComparativoExactSize[] = []

  for (const row of sizeRows ?? []) {
    const w = row.width_cm
    const h = row.height_cm
    if (typeof w !== "number" || typeof h !== "number" || w <= 0 || h <= 0) continue
    const key = `${w}x${h}`
    if (seen.has(key)) continue
    seen.add(key)
    dimensionOptions.push({ width_cm: w, height_cm: h })
  }

  dimensionOptions.sort((a, b) => {
    if (a.width_cm !== b.width_cm) return a.width_cm - b.width_cm
    return a.height_cm - b.height_cm
  })

  return { priceRange, dimensionOptions }
}

/** Obras disponibles con imagen y medidas, para el selector visual. */
export async function browseComparativoArtworks(
  query: string,
  filters?: ComparativoPickerFilters,
): Promise<ComparativoPickerArtwork[]> {
  const q = query.trim()
  const f = normalizeFilters(filters)
  const supabase = await createClient()
  const preferPremium = await getPreferPremiumInCatalog()

  let request = supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .eq("status", "available")
    .order("views_count", { ascending: false })
    .order("code", { ascending: true })
    .limit(FETCH_CAP)

  if (q.length > 0) {
    const safe = q.replace(/[%_]/g, "\\$&")
    request = request.or(
      `code.ilike.%${safe}%,title.ilike.%${safe}%,artist.ilike.%${safe}%`,
    )
  }

  if (f.categorias.length > 0) {
    request = request.in("category", f.categorias as ArtworkCategory[])
  }

  if (f.tecnicas.length > 0) {
    request = request.in("technique", f.tecnicas)
  }

  if (f.marco === "con") {
    request = request.eq("has_frame", true)
  } else if (f.marco === "sin") {
    request = request.eq("has_frame", false)
  }

  if (f.formato) {
    request = request.eq("catalog_format", f.formato)
  }

  if (f.medida) {
    request = request
      .eq("width_cm", f.medida.width_cm)
      .eq("height_cm", f.medida.height_cm)
  }

  if (f.precio_min !== null) {
    request = request.gte("price", f.precio_min)
  }
  if (f.precio_max !== null) {
    request = request.lte("price", f.precio_max)
  }

  const { data, error } = await request
  if (error || !data) return []

  let rows = (data as unknown[]).map(normalizeArtworkRow) as ArtworkPublic[]

  if (f.tamanos.length > 0) {
    rows = rows.filter((a) =>
      isArtworkInSizeCategories(a.width_cm, a.height_cm, f.tamanos),
    )
  }

  return artworksToPickerItems(rows.slice(0, BROWSE_LIMIT), preferPremium)
}

export async function searchComparativoArtworks(query: string): Promise<ComparativoSearchHit[]> {
  const items = await browseComparativoArtworks(query)
  return items.map(({ code, title }) => ({ code, title }))
}

export async function getComparativoArtworkPreview(code: string): Promise<ArtworkPublic | null> {
  const c = code.trim().toUpperCase()
  if (!c) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .eq("code", c)
    .eq("status", "available")
    .maybeSingle()
  if (!data) return null
  return normalizeArtworkRow(data)
}
