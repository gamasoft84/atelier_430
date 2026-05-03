export const SITE_NAME = "Atelier 430"
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
export const SITE_DESCRIPTION = "430 piezas. Una sola colección. Arte curado, listo para tu hogar."

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""
export const WHATSAPP_DEFAULT_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ?? "Hola Atelier 430, me interesa una obra"

export const TOTAL_INVENTORY = Number(process.env.NEXT_PUBLIC_TOTAL_INVENTORY ?? 430)
export const MAX_IMAGES_PER_ARTWORK = 5
export const ARTWORKS_PER_PAGE = 24

export const ARTWORK_CATEGORIES = ["religiosa", "nacional", "europea", "moderna"] as const
export const ARTWORK_STATUSES = ["available", "reserved", "sold", "hidden", "draft"] as const

/** Límite por ejecución (IA + Cloudinary) para evitar timeouts en Vercel */
export const BULK_IMPORT_MAX_ROWS = 60
export const ARTWORK_TECHNIQUES = ["oleo", "impresion", "mixta", "acrilico"] as const
export const SOLD_CHANNELS = [
  "whatsapp",
  "presencial",
  "mercadolibre",
  "marketplace",
  "instagram",
  "otro",
] as const

export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ""
export const CLOUDINARY_BASE_FOLDER = "atelier430/artworks"

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6"
