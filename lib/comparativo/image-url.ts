import { CLOUDINARY_CLOUD_NAME } from "@/lib/constants"
import {
  COMPARATIVO_EXPORT_PX_PER_CM,
  COMPARATIVO_PDF_DPI,
  COMPARATIVO_PX_PER_CM,
} from "@/lib/comparativo/scale"

export type ComparativoImageQuality = "screen" | "export" | "pdf"

const MAX_SIDE_PX = 2400

function capDimensions(w: number, h: number, maxSide: number): { w: number; h: number } {
  const m = Math.max(w, h)
  if (m <= maxSide) return { w, h }
  const s = maxSide / m
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) }
}

function pxPerCmForQuality(quality: ComparativoImageQuality): number {
  if (quality === "export") return COMPARATIVO_EXPORT_PX_PER_CM
  if (quality === "pdf") return COMPARATIVO_PDF_DPI / 2.54
  return COMPARATIVO_PX_PER_CM
}

function cloudinaryTransform(w: number, h: number, quality: ComparativoImageQuality): string {
  if (quality === "export" || quality === "pdf") {
    return `w_${w},h_${h},c_fit,g_south,q_88,f_jpg`
  }
  return `w_${w},h_${h},c_fit,g_south,q_auto:good,f_auto`
}

/**
 * Derivada a tamaño exacto del comparativo con gravedad sur: el contenido visual
 * se ancla al borde inferior (útil cuando la foto trae margen arriba o a los lados).
 */
export function buildComparativoImageUrl(
  publicId: string,
  widthCm: number,
  heightCm: number,
  quality: ComparativoImageQuality = "screen",
): string {
  const pxPerCm = pxPerCmForQuality(quality)
  let w = Math.max(1, Math.round(widthCm * pxPerCm))
  let h = Math.max(1, Math.round(heightCm * pxPerCm))
  ;({ w, h } = capDimensions(w, h, MAX_SIDE_PX))
  const t = cloudinaryTransform(w, h, quality)
  const cloud = CLOUDINARY_CLOUD_NAME || "atelier430"
  return `https://res.cloudinary.com/${cloud}/image/upload/${t}/${publicId}`
}
