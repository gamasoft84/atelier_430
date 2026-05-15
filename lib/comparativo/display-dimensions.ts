import type { ArtworkPublic } from "@/types/artwork"

export type ComparativoDimensionSource = "frame" | "canvas"

/**
 * Escala del comparativo: **con marco** si hay medidas de marco válidas; si no, **lienzo**.
 */
export function getComparativoDisplayDimensionsCm(artwork: ArtworkPublic): {
  widthCm: number
  heightCm: number
  source: ComparativoDimensionSource
} {
  const fw = artwork.frame_outer_width_cm
  const fh = artwork.frame_outer_height_cm
  const useFrame =
    artwork.has_frame &&
    typeof fw === "number" &&
    Number.isFinite(fw) &&
    fw > 0 &&
    typeof fh === "number" &&
    Number.isFinite(fh) &&
    fh > 0
  if (useFrame) {
    return { widthCm: fw, heightCm: fh, source: "frame" }
  }
  const cw = artwork.width_cm
  const ch = artwork.height_cm
  if (typeof cw === "number" && Number.isFinite(cw) && cw > 0 && typeof ch === "number" && Number.isFinite(ch) && ch > 0) {
    return { widthCm: cw, heightCm: ch, source: "canvas" }
  }
  return { widthCm: 0, heightCm: 0, source: "canvas" }
}
