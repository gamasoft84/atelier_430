"use server"

import { createClient } from "@/lib/supabase/server"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import { getPreferPremiumInCatalog } from "@/lib/supabase/queries/public"
import { isArtworkInSizeCategories } from "@/lib/artwork-size"
import {
  artworksToPickerItems,
  type ComparativoPickerArtwork,
} from "@/lib/comparativo/picker-artworks"
import {
  EMPTY_COMPARATIVO_PICKER_FILTERS,
  type ComparativoPickerFilters,
} from "@/types/comparativo-picker"
import type { ArtworkPublic, ArtworkCategory } from "@/types/artwork"

export type ComparativoSearchHit = {
  code: string
  title: string
}

const BROWSE_LIMIT = 96

function normalizeFilters(
  filters?: ComparativoPickerFilters,
): ComparativoPickerFilters {
  if (!filters) return EMPTY_COMPARATIVO_PICKER_FILTERS
  return {
    categorias: filters.categorias ?? [],
    tecnicas: filters.tecnicas ?? [],
    tamanos: filters.tamanos ?? [],
    marco: filters.marco ?? null,
  }
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
    .limit(BROWSE_LIMIT)

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

  const { data, error } = await request
  if (error || !data) return []

  let rows = (data as unknown[]).map(normalizeArtworkRow) as ArtworkPublic[]

  if (f.tamanos.length > 0) {
    rows = rows.filter((a) =>
      isArtworkInSizeCategories(a.width_cm, a.height_cm, f.tamanos),
    )
  }

  return artworksToPickerItems(rows, preferPremium)
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
