import { orientCmToMatchImage } from "@/lib/artwork/orient-cm-to-image"

/** Alinea un par de medidas (lienzo, marco o escala) con la imagen del comparativo. */
export function orientComparativoCmPair(
  widthCm: number,
  heightCm: number,
  imageWidthPx: number | null | undefined,
  imageHeightPx: number | null | undefined,
): { widthCm: number; heightCm: number } {
  return orientCmToMatchImage(widthCm, heightCm, imageWidthPx, imageHeightPx)
}
