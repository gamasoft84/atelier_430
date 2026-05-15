import type { ArtworkPublic } from "@/types/artwork"

export function isComparativoHorizontalArtwork(artwork: ArtworkPublic): boolean {
  return artwork.catalog_format === "horizontal"
}

/** Intercambia ancho/alto (p. ej. 98×108 → 108×98) para render del comparativo. */
export function swapComparativoCmPair(
  widthCm: number,
  heightCm: number,
): { widthCm: number; heightCm: number } {
  if (widthCm <= 0 || heightCm <= 0) return { widthCm, heightCm }
  return { widthCm: heightCm, heightCm: widthCm }
}

export function orientComparativoCmPair(
  artwork: ArtworkPublic,
  widthCm: number,
  heightCm: number,
): { widthCm: number; heightCm: number } {
  if (!isComparativoHorizontalArtwork(artwork)) {
    return { widthCm, heightCm }
  }
  return swapComparativoCmPair(widthCm, heightCm)
}
