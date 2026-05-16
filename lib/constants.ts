export const SITE_NAME = "Atelier 430"
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
export const SITE_DESCRIPTION = "430 piezas. Una sola colección. Arte curado, listo para tu hogar."

/** Dígitos para wa.me: 521 + 10 dígitos (México). Acepta 5515377335 o 5215515377335. */
function normalizeWhatsAppNumber(raw: string | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "")
  if (!digits) return ""
  if (digits.length === 13 && digits.startsWith("521")) return digits
  if (digits.length === 10) return `521${digits}`
  return digits
}

export const WHATSAPP_NUMBER = normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)
export const WHATSAPP_DEFAULT_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ?? "Hola Atelier 430, me interesa una obra"

export const TOTAL_INVENTORY = Number(process.env.NEXT_PUBLIC_TOTAL_INVENTORY ?? 430)
export const MAX_IMAGES_PER_ARTWORK = 5
export const ARTWORKS_PER_PAGE = 24

export const ARTWORK_CATEGORIES = ["religiosa", "nacional", "europea", "moderna"] as const
export const ARTWORK_STATUSES = ["available", "reserved", "sold", "hidden", "draft"] as const

/** Límite por ejecución (IA + Cloudinary) para evitar timeouts en Vercel */
export const BULK_IMPORT_MAX_ROWS = 60
export const ARTWORK_TECHNIQUES = ["oleo", "impresion"] as const
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
