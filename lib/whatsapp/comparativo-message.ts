import { normalizePublicUrl } from "@/lib/urls/normalize-public-url"

/** Mensaje pre-rellenado al compartir un comparativo editorial por WhatsApp. */
export function buildComparativoWhatsAppMessage(codes: string[], pageUrl: string): string {
  const list = codes.join(", ")
  return [
    "Hola Atelier 430, te comparto este comparativo a escala:",
    list,
    "",
    "Ver en el sitio:",
    normalizePublicUrl(pageUrl),
  ].join("\n")
}
