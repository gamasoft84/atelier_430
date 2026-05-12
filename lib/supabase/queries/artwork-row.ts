import type { ArtworkPublic } from "@/types/artwork"

export const ARTWORK_SELECT = `
  id, code, title, artist, description, category, subcategory, stock_quantity, tags, technique,
  catalog_format,
  width_cm, height_cm, has_frame, frame_material, frame_color,
  frame_outer_width_cm, frame_outer_height_cm,
  price, original_price, show_price, status,
  reserved_until, reserved_by, sold_at, sold_price, sold_channel, sold_buyer_name,
  ai_generated, manually_edited, views_count, wishlist_count, whatsapp_clicks,
  created_at, updated_at, published_at,
  images:artwork_images(
    id, artwork_id, cloudinary_url, cloudinary_public_id,
    width, height, position, is_primary, is_premium, alt_text, created_at
  )
`.trim()

/** Supabase devuelve `images` sin ordenar — orden por position. */
export function normalizeArtworkRow(row: unknown): ArtworkPublic {
  if (!row || typeof row !== "object") return row as ArtworkPublic
  const r = row as Record<string, unknown>
  const images = Array.isArray(r.images)
    ? [...r.images].sort(
        (a, b) =>
          (a as { position: number }).position - (b as { position: number }).position
      )
    : []
  return {
    ...r,
    catalog_format: r.catalog_format === "vertical" ? "vertical" : "horizontal",
    images,
  } as ArtworkPublic
}
