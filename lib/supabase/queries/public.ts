import type { SupabaseClient } from "@supabase/supabase-js"
import { createAnonSupabaseClient } from "@/lib/supabase/anon"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"
import type { ArtworkPublic, ArtworkCategory } from "@/types/artwork"

export { ARTWORK_SELECT, normalizeArtworkRow }

export async function getAvailableCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("artworks")
    .select("*", { count: "exact", head: true })
    .eq("status", "available")
  return count ?? 0
}

export async function getFeaturedArtworks(limit = 8): Promise<ArtworkPublic[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .eq("status", "available")
    .order("views_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
  if (!data) return []
  return (data as unknown[]).map(normalizeArtworkRow) as ArtworkPublic[]
}

export async function getCategoryStats(): Promise<
  Array<{ category: ArtworkCategory; count: number; thumbnail: string | null }>
> {
  const supabase = await createClient()
  const categories: ArtworkCategory[] = ["religiosa", "nacional", "europea", "moderna"]

  const results = await Promise.all(
    categories.map(async (category) => {
      const [countRes, thumbRes] = await Promise.all([
        supabase
          .from("artworks")
          .select("*", { count: "exact", head: true })
          .eq("status", "available")
          .eq("category", category),
        supabase
          .from("artworks")
          .select("images:artwork_images(cloudinary_url, is_primary, position)")
          .eq("status", "available")
          .eq("category", category)
          .order("views_count", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const images = (thumbRes.data?.images as Array<{ cloudinary_url: string; is_primary: boolean; position: number }> | null) ?? []
      const primary = images.find((i) => i.is_primary) ?? images.sort((a, b) => a.position - b.position)[0]

      return {
        category,
        count: countRes.count ?? 0,
        thumbnail: primary?.cloudinary_url ?? null,
      }
    })
  )

  return results
}

export async function getPublicArtworks(limit = 48): Promise<ArtworkPublic[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .in("status", ["available", "reserved", "sold"])
    .neq("status", "hidden")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit)
  if (!data) return []
  return (data as unknown[]).map(normalizeArtworkRow) as ArtworkPublic[]
}

async function selectArtworkByCode(
  supabase: SupabaseClient<Database>,
  code: string
): Promise<ArtworkPublic | null> {
  const { data } = await supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .eq("code", code)
    .in("status", ["available", "reserved", "sold"])
    .maybeSingle()
  if (!data) return null
  return normalizeArtworkRow(data)
}

export async function getArtworkByCode(code: string): Promise<ArtworkPublic | null> {
  const supabase = await createClient()
  return selectArtworkByCode(supabase, code)
}

/** Igual que `getArtworkByCode`, pero con cliente anónimo (p. ej. API routes sin sesión). */
export async function getArtworkByCodeAnon(code: string): Promise<ArtworkPublic | null> {
  return selectArtworkByCode(createAnonSupabaseClient(), code)
}

export async function getRelatedArtworks(
  category: ArtworkCategory,
  excludeId: string,
  limit = 4
): Promise<ArtworkPublic[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .eq("status", "available")
    .eq("category", category)
    .neq("id", excludeId)
    .order("views_count", { ascending: false })
    .limit(limit)
  if (!data) return []
  return data.map(normalizeArtworkRow) as ArtworkPublic[]
}

export async function getShowPrices(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "show_prices_globally")
    .maybeSingle()
  if (!data) return true
  const v = data.value
  if (typeof v === "boolean") return v
  if (typeof v === "object" && v !== null && "enabled" in v) return Boolean((v as { enabled: unknown }).enabled)
  return true
}
