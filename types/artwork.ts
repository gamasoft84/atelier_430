export type ArtworkCategory = "religiosa" | "nacional" | "europea" | "moderna"
export type ArtworkStatus = "available" | "reserved" | "sold" | "hidden" | "draft"
export type SoldChannel = "whatsapp" | "presencial" | "mercadolibre" | "marketplace" | "instagram" | "otro"

export interface ArtworkImage {
  id: string
  artwork_id: string
  cloudinary_url: string
  cloudinary_public_id: string
  width: number | null
  height: number | null
  position: number
  is_primary: boolean
  alt_text: string | null
  created_at: string
}

export interface Artwork {
  id: string
  code: string
  title: string
  description: string | null
  ai_generated: boolean
  manually_edited: boolean
  category: ArtworkCategory
  subcategory: string | null
  tags: string[] | null
  technique: string | null
  width_cm: number | null
  height_cm: number | null
  has_frame: boolean
  frame_material: string | null
  frame_color: string | null
  price: number | null
  original_price: number | null
  cost: number | null
  show_price: boolean
  status: ArtworkStatus
  reserved_until: string | null
  reserved_by: string | null
  sold_at: string | null
  sold_price: number | null
  sold_channel: SoldChannel | null
  sold_buyer_name: string | null
  sold_buyer_contact: string | null
  location_in_storage: string | null
  admin_notes: string | null
  views_count: number
  wishlist_count: number
  whatsapp_clicks: number
  created_at: string
  updated_at: string
  published_at: string | null
  images?: ArtworkImage[]
}

export type ArtworkPublic = Omit<
  Artwork,
  "cost" | "location_in_storage" | "admin_notes" | "sold_buyer_contact"
>

export interface ArtworkFormData {
  code?: string
  title: string
  description: string
  category: ArtworkCategory
  subcategory: string
  technique: string
  width_cm: number | null
  height_cm: number | null
  has_frame: boolean
  frame_material: string
  frame_color: string
  price: number | null
  original_price: number | null
  cost: number | null
  show_price: boolean
  status: ArtworkStatus
  location_in_storage: string
  admin_notes: string
  tags: string[]
}

export interface SellArtworkData {
  sold_price: number
  sold_channel: SoldChannel
  sold_buyer_name: string
  sold_buyer_contact: string
}

export interface ReserveArtworkData {
  reserved_by: string
  reserved_until: string
}
