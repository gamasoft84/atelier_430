import { normalizePublicUrl } from "@/lib/urls/normalize-public-url"

export interface ArtworkWhatsAppMessageInput {
  code: string
  title: string
  widthCm: number | null
  heightCm: number | null
  hasFrame?: boolean
  frameOuterWidthCm?: number | null
  frameOuterHeightCm?: number | null
  price: number | null
  showPrice: boolean
  pageUrl: string
}

/**
 * Construye el mensaje pre-rellenado para WhatsApp con el formato estándar.
 * Si la obra tiene marco y dimensiones exteriores, se agrega una línea adicional.
 */
export function buildArtworkWhatsAppMessage(data: ArtworkWhatsAppMessageInput): string {
  const innerDimensions =
    data.widthCm && data.heightCm
      ? `${data.widthCm} × ${data.heightCm} cm`
      : data.widthCm
        ? `${data.widthCm} cm`
        : data.heightCm
          ? `${data.heightCm} cm`
          : null

  const outerDimensions =
    data.hasFrame && data.frameOuterWidthCm && data.frameOuterHeightCm
      ? `${data.frameOuterWidthCm} × ${data.frameOuterHeightCm} cm`
      : null

  const lines: Array<string | null> = [
    `¡Hola Atelier 430! Me interesa esta obra:`,
    `🎨 ${data.code} - "${data.title}"`,
  ]

  if (innerDimensions && outerDimensions) {
    lines.push(`📐 Obra: ${innerDimensions}`)
    lines.push(`🖼️ Con marco: ${outerDimensions}`)
  } else if (innerDimensions) {
    lines.push(`📐 ${innerDimensions}`)
  }

  if (data.showPrice && data.price) {
    lines.push(`💰 $${data.price.toLocaleString("es-MX")} MXN`)
  }

  // URL en línea propia (sin emoji delante): WhatsApp a veces recorta la "h" de https://
  lines.push(``)
  lines.push(`Ver obra en el catálogo:`)
  lines.push(normalizePublicUrl(data.pageUrl))
  lines.push(``)
  lines.push(`¿Sigue disponible?`)

  return lines.filter((l) => l !== null).join("\n")
}
