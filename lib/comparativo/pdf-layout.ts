import type { ComparativoPreparedItem } from "@/lib/comparativo/prepare-items"

export const COMPARATIVO_PDF_PAGE = {
  widthPt: 1191,
  heightPt: 842,
  paddingPt: 72,
  artGapPt: 40,
  metaGapPt: 28,
  maxArtRowHeightPt: 380,
} as const

export type ComparativoPdfPieceLayout = {
  code: string
  widthPt: number
  heightPt: number
  artWidthPt: number
  artHeightPt: number
}

export function layoutComparativoPdfPieces(
  items: Pick<ComparativoPreparedItem, "code" | "displayWidthCm" | "displayHeightCm">[],
): { pxPerCm: number; rowHeightPt: number; pieces: ComparativoPdfPieceLayout[] } {
  const contentW =
    COMPARATIVO_PDF_PAGE.widthPt - COMPARATIVO_PDF_PAGE.paddingPt * 2
  const maxH = Math.max(...items.map((i) => i.displayHeightCm), 1)
  let pxPerCm = COMPARATIVO_PDF_PAGE.maxArtRowHeightPt / maxH
  const gaps = COMPARATIVO_PDF_PAGE.artGapPt * Math.max(0, items.length - 1)
  const naturalW = items.reduce((s, i) => s + i.displayWidthCm * pxPerCm, 0) + gaps
  if (naturalW > contentW) {
    pxPerCm *= (contentW - gaps) / (naturalW - gaps)
  }
  const rowHeightPt = maxH * pxPerCm
  const pieces = items.map((item) => {
    const artWidthPt = item.displayWidthCm * pxPerCm
    const artHeightPt = item.displayHeightCm * pxPerCm
    return {
      code: item.code,
      widthPt: artWidthPt,
      heightPt: rowHeightPt,
      artWidthPt,
      artHeightPt,
    }
  })
  return { pxPerCm, rowHeightPt, pieces }
}
