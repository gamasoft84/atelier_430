import { buildComparativoImageUrl } from "@/lib/comparativo/image-url"
import { getComparativoDisplayDimensionsCm } from "@/lib/comparativo/display-dimensions"
import { orientComparativoCmPair } from "@/lib/comparativo/orientation"
import { selectShowcaseImage } from "@/lib/images/select-showcase"
import type { ArtworkPublic } from "@/types/artwork"

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
    const dispRaw = getComparativoDisplayDimensionsCm(a)
    const disp = orientComparativoCmPair(a, dispRaw.widthCm, dispRaw.heightCm)
    if (disp.widthCm <= 0 || disp.heightCm <= 0) continue
    const showcase = selectShowcaseImage(a.images, preferPremium)
    const pid = typeof showcase?.cloudinary_public_id === "string" ? showcase.cloudinary_public_id.trim() : ""
    if (!pid) continue
    const canvasRaw = orientComparativoCmPair(
      a,
      typeof a.width_cm === "number" && a.width_cm > 0 ? a.width_cm : 0,
      typeof a.height_cm === "number" && a.height_cm > 0 ? a.height_cm : 0,
    )
    const frameRawW =
      typeof a.frame_outer_width_cm === "number" && a.frame_outer_width_cm > 0
        ? a.frame_outer_width_cm
        : null
    const frameRawH =
      typeof a.frame_outer_height_cm === "number" && a.frame_outer_height_cm > 0
        ? a.frame_outer_height_cm
        : null
    const frameOriented =
      frameRawW != null && frameRawH != null
        ? orientComparativoCmPair(a, frameRawW, frameRawH)
        : null
    out.push({
      code: a.code,
      title: a.title,
      imageUrl: buildComparativoImageUrl(pid, disp.widthCm, disp.heightCm),
      canvasWidthCm: canvasRaw.widthCm,
      canvasHeightCm: canvasRaw.heightCm,
      frameOuterWidthCm: frameOriented?.widthCm ?? null,
      frameOuterHeightCm: frameOriented?.heightCm ?? null,
      displayWidthCm: disp.widthCm,
      displayHeightCm: disp.heightCm,
      displaySource: dispRaw.source,
      showPrice: a.show_price,
      priceMxn: typeof a.price === "number" ? a.price : null,
      techniqueLabel: formatTechnique(a.technique),
    })
  }
  return out
}
