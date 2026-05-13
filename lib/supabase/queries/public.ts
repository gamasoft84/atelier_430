import type { SupabaseClient } from "@supabase/supabase-js"
import { createAnonSupabaseClient } from "@/lib/supabase/anon"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import { selectShowcaseImage } from "@/lib/images/select-showcase"
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
  Array<{
    category: ArtworkCategory
    count: number
    thumbnail: { url: string; width: number | null; height: number | null } | null
  }>
> {
  const supabase = await createClient()
  const categories: ArtworkCategory[] = ["religiosa", "nacional", "europea", "moderna"]
  const preferPremium = await getPreferPremiumInCatalog()

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
          .select("images:artwork_images(cloudinary_url, width, height, is_primary, is_premium, position)")
          .eq("status", "available")
          .eq("category", category)
          .order("views_count", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const images =
        (thumbRes.data?.images as Array<{
          cloudinary_url: string
          width: number | null
          height: number | null
          is_primary: boolean
          is_premium: boolean
          position: number
        }> | null) ?? []
      const showcase = selectShowcaseImage(images, preferPremium)

      return {
        category,
        count: countRes.count ?? 0,
        thumbnail: showcase
          ? {
              url: showcase.cloudinary_url,
              width: showcase.width ?? null,
              height: showcase.height ?? null,
            }
          : null,
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

/**
 * Si en `site_settings` el flag `prefer_premium_in_catalog` está activo, el
 * catálogo público y la página de detalle muestran la imagen premium (cuando
 * exista) en lugar de la primary. Default: `true`.
 */
export async function getPreferPremiumInCatalog(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "prefer_premium_in_catalog")
    .maybeSingle()
  if (!data) return true
  const v = data.value
  if (typeof v === "boolean") return v
  if (typeof v === "object" && v !== null && "enabled" in v) {
    return Boolean((v as { enabled: unknown }).enabled)
  }
  return true
}

export interface ScaleCollectionClientItem {
  id: string
  code: string
  title: string
  widthCm: number
  heightCm: number
  thumbnailPublicId: string | null
}

/**
 * Obras disponibles con medidas para la vista a escala (piso + referencia humana).
 * Excluye filas sin ancho/alto válidos; `excludedWithoutDimensions` cuenta el resto de disponibles.
 */
export async function getScaleCollectionData(): Promise<{
  items: ScaleCollectionClientItem[]
  excludedWithoutDimensions: number
}> {
  const supabase = await createClient()
  const [countRes, preferPremium, sizedRes] = await Promise.all([
    supabase.from("artworks").select("*", { count: "exact", head: true }).eq("status", "available"),
    getPreferPremiumInCatalog(),
    supabase
      .from("artworks")
      .select(
        `id, code, title, width_cm, height_cm,
         images:artwork_images(cloudinary_public_id, is_primary, is_premium, position)`
      )
      .eq("status", "available")
      .not("width_cm", "is", null)
      .not("height_cm", "is", null)
      .gt("width_cm", 0)
      .gt("height_cm", 0)
      .order("category", { ascending: true })
      .order("code", { ascending: true }),
  ])

  const totalAvailable = countRes.count ?? 0
  const rows = sizedRes.data ?? []
  if (sizedRes.error) {
    return { items: [], excludedWithoutDimensions: Math.max(0, totalAvailable) }
  }

  const items: ScaleCollectionClientItem[] = rows.map((row) => {
    const r = row as {
      id: string
      code: string
      title: string
      width_cm: number
      height_cm: number
      images: Array<{
        cloudinary_public_id: string
        is_primary: boolean | null
        is_premium: boolean | null
        position: number | null
      }>
    }
    const img = selectShowcaseImage(r.images ?? [], preferPremium)
    const pid =
      typeof img?.cloudinary_public_id === "string" && img.cloudinary_public_id.length > 0
        ? img.cloudinary_public_id
        : null
    return {
      id: r.id,
      code: r.code,
      title: r.title,
      widthCm: r.width_cm,
      heightCm: r.height_cm,
      thumbnailPublicId: pid,
    }
  })

  const excludedWithoutDimensions = Math.max(0, totalAvailable - items.length)
  return { items, excludedWithoutDimensions }
}
