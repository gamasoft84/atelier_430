/**
 * Alinea medidas en cm con la orientación real de la foto.
 * Si lienzo/marco están guardados al revés (p. ej. 98×108 para una foto horizontal),
 * intercambia ancho y alto. Misma regla que AR (`/api/artwork-ar/[code]`).
 */
export function shouldSwapCmToMatchImage(
  widthCm: number,
  heightCm: number,
  imageWidthPx: number | null | undefined,
  imageHeightPx: number | null | undefined,
): boolean {
  if (widthCm <= 0 || heightCm <= 0) return false
  if (imageWidthPx == null || imageHeightPx == null || imageHeightPx <= 0) return false
  const dimAspect = widthCm / heightCm
  const imgAspect = imageWidthPx / imageHeightPx
  return (dimAspect < 1 && imgAspect > 1) || (dimAspect > 1 && imgAspect < 1)
}

export function orientCmToMatchImage(
  widthCm: number,
  heightCm: number,
  imageWidthPx: number | null | undefined,
  imageHeightPx: number | null | undefined,
): { widthCm: number; heightCm: number } {
  if (!shouldSwapCmToMatchImage(widthCm, heightCm, imageWidthPx, imageHeightPx)) {
    return { widthCm, heightCm }
  }
  return { widthCm: heightCm, heightCm: widthCm }
}
