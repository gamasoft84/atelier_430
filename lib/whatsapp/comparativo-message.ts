/** Mensaje pre-rellenado al compartir comparativo por WhatsApp (sin URLs). */
export function buildComparativoWhatsAppMessage(codes: string[]): string {
  return [
    "Hola Atelier 430, te comparto este comparativo a escala:",
    codes.join(", "),
  ].join("\n")
}
