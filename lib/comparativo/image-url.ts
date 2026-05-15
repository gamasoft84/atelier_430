import { CLOUDINARY_CLOUD_NAME } from "@/lib/constants"
import { COMPARATIVO_PX_PER_CM } from "@/lib/comparativo/scale"

/**
 * Derivada a tamaño exacto del comparativo con gravedad sur: el contenido visual
 * se ancla al borde inferior (útil cuando la foto trae margen arriba o a los lados).
 */
export function buildComparativoImageUrl(
  publicId: string,
  widthCm: number,
  heightCm: number,
  pxPerCm: number = COMPARATIVO_PX_PER_CM,
): string {
  const w = Math.max(1, Math.round(widthCm * pxPerCm))
  const h = Math.max(1, Math.round(heightCm * pxPerCm))
  const t = `w_${w},h_${h},c_fit,g_south,q_auto:good,f_auto`
  const cloud = CLOUDINARY_CLOUD_NAME || "atelier430"
  return `https://res.cloudinary.com/${cloud}/image/upload/${t}/${publicId}`
}
