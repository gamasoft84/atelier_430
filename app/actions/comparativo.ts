"use server"

import { createClient } from "@/lib/supabase/server"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import { getPreferPremiumInCatalog } from "@/lib/supabase/queries/public"
import {
  artworksToPickerItems,
  type ComparativoPickerArtwork,
} from "@/lib/comparativo/picker-artworks"
import type { ArtworkPublic } from "@/types/artwork"

export type ComparativoSearchHit = {
  code: string
  title: string
}

/** Obras disponibles con imagen y medidas, para el selector visual. */
export async function browseComparativoArtworks(
  query: string,
): Promise<ComparativoPickerArtwork[]> {
  const q = query.trim()
  const supabase = await createClient()
  const preferPremium = await getPreferPremiumInCatalog()

  let request = supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .eq("status", "available")
    .order("views_count", { ascending: false })
    .order("code", { ascending: true })
    .limit(72)

  if (q.length > 0) {
    request = request.or(`code.ilike.%${q}%,title.ilike.%${q}%`)
  }

  const { data, error } = await request
  if (error || !data) return []

  const rows = (data as unknown[]).map(normalizeArtworkRow) as ArtworkPublic[]
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
