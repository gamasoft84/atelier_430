import { buildComparativoImageUrl } from "@/lib/comparativo/image-url"
import { selectShowcaseImage } from "@/lib/images/select-showcase"
import type { ArtworkPublic } from "@/types/artwork"
import { getComparativoDisplayDimensionsCm } from "@/lib/comparativo/display-dimensions"

export type ComparativoPreparedItem = {
  code: string
  title: string
  imageUrl: string
  canvasWidthCm: number
  canvasHeightCm: number
  frameOuterWidthCm: number | null
  frameOuterHeightCm: number | null
  displayWidthCm: number
  displayHeightCm: number
  displaySource: "frame" | "canvas"
  showPrice: boolean
  priceMxn: number | null
  techniqueLabel: string
}

function formatTechnique(raw: string | null | undefined): string {
  if (!raw || !String(raw).trim()) return "Óleo sobre lienzo"
  const t = String(raw).trim().toLowerCase()
  if (t === "oleo" || t === "óleo") return "Óleo sobre lienzo"
  if (t === "impresion" || t === "impresión") return "Impresión"
  return String(raw).trim()
}

export function prepareComparativoItems(
  artworks: ArtworkPublic[],
  preferPremium: boolean,
): ComparativoPreparedItem[] {
  const out: ComparativoPreparedItem[] = []
  for (const a of artworks) {
    const disp = getComparativoDisplayDimensionsCm(a)
    if (disp.widthCm <= 0 || disp.heightCm <= 0) continue
    const showcase = selectShowcaseImage(a.images, preferPremium)
    const pid = typeof showcase?.cloudinary_public_id === "string" ? showcase.cloudinary_public_id.trim() : ""
    if (!pid) continue
    const cw = typeof a.width_cm === "number" && a.width_cm > 0 ? a.width_cm : 0
    const ch = typeof a.height_cm === "number" && a.height_cm > 0 ? a.height_cm : 0
    const fw =
      typeof a.frame_outer_width_cm === "number" && a.frame_outer_width_cm > 0 ? a.frame_outer_width_cm : null
    const fh =
      typeof a.frame_outer_height_cm === "number" && a.frame_outer_height_cm > 0 ? a.frame_outer_height_cm : null
    out.push({
      code: a.code,
      title: a.title,
      imageUrl: buildComparativoImageUrl(pid, disp.widthCm, disp.heightCm),
      canvasWidthCm: cw,
      canvasHeightCm: ch,
      frameOuterWidthCm: fw,
      frameOuterHeightCm: fh,
      displayWidthCm: disp.widthCm,
      displayHeightCm: disp.heightCm,
      displaySource: disp.source,
      showPrice: a.show_price,
      priceMxn: typeof a.price === "number" ? a.price : null,
      techniqueLabel: formatTechnique(a.technique),
    })
  }
  return out
}
