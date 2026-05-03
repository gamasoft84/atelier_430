import { createAnonSupabaseClient } from "@/lib/supabase/anon"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import type { ArtworkPublic } from "@/types/artwork"

/**
 * Obras de la wishlist de una sesión, en orden (más reciente primero).
 * Omite obras `hidden` (el ítem de wishlist queda huérfano en DB hasta limpieza).
 */
export async function getWishlistArtworksForSession(
  sessionId: string
): Promise<ArtworkPublic[]> {
  const supabase = createAnonSupabaseClient()
  const { data: items, error: e1 } = await supabase
    .from("wishlist_items")
    .select("artwork_id, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
  if (e1 || !items?.length) return []

  const ids = items.map((i) => i.artwork_id)
  const { data: rows, error: e2 } = await supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .in("id", ids)
    .neq("status", "hidden")
  if (e2 || !rows?.length) return []

  const byId = new Map(
    (rows as unknown[]).map((r) => {
      const a = normalizeArtworkRow(r)
      return [a.id, a] as const
    })
  )
  return ids.map((id) => byId.get(id)).filter((a): a is ArtworkPublic => a != null)
}
