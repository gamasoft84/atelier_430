/**
 * Geometría pura para la vista "piso" a escala: posiciones en cm y culling por scroll.
 */

export interface ScaleLayoutArtwork {
  id: string
  code: string
  title: string
  widthCm: number
  heightCm: number
}

export type FloorSlotKind = "human" | "artwork"

export interface FloorSlot {
  kind: FloorSlotKind
  id: string
  xCm: number
  widthCm: number
  heightCm: number
  code?: string
  title?: string
}

export interface FloorLayoutOptions {
  humanHeightCm: number
  humanFootprintCm: number
  gapCm: number
}

/** Silueta de referencia a la izquierda, luego obras en orden, con hueco constante entre piezas. */
export function buildFloorSlots(
  artworks: readonly ScaleLayoutArtwork[],
  options: FloorLayoutOptions,
): FloorSlot[] {
  const { humanHeightCm, humanFootprintCm, gapCm } = options
  const slots: FloorSlot[] = [
    {
      kind: "human",
      id: "ref-human",
      xCm: 0,
      widthCm: humanFootprintCm,
      heightCm: humanHeightCm,
    },
  ]
  let x = humanFootprintCm + gapCm
  for (const a of artworks) {
    slots.push({
      kind: "artwork",
      id: a.id,
      xCm: x,
      widthCm: a.widthCm,
      heightCm: a.heightCm,
      code: a.code,
      title: a.title,
    })
    x += a.widthCm + gapCm
  }
  return slots
}

export function totalTrackWidthCm(slots: readonly FloorSlot[]): number {
  if (slots.length === 0) return 0
  const last = slots[slots.length - 1]!
  return last.xCm + last.widthCm
}

export function maxSlotHeightCm(slots: readonly FloorSlot[]): number {
  let m = 0
  for (const s of slots) {
    if (s.heightCm > m) m = s.heightCm
  }
  return m
}

export function fitPixelsPerCm(
  totalWidthCm: number,
  viewportInnerWidthPx: number,
  horizontalPaddingPx: number,
  minPxPerCm: number,
  maxPxPerCm: number,
): number {
  const usable = Math.max(1, viewportInnerWidthPx - horizontalPaddingPx * 2)
  const raw = usable / Math.max(1, totalWidthCm)
  return Math.min(maxPxPerCm, Math.max(minPxPerCm, raw))
}

/** Índices de slots que intersectan la ventana horizontal en espacio cm (más buffer). */
export function visibleSlotIndices(
  slots: readonly FloorSlot[],
  scrollLeftPx: number,
  viewportWidthPx: number,
  pxPerCm: number,
  bufferCm: number,
): number[] {
  if (slots.length === 0 || pxPerCm <= 0 || viewportWidthPx <= 0) return []
  const viewStartCm = scrollLeftPx / pxPerCm
  const viewEndCm = viewStartCm + viewportWidthPx / pxPerCm
  const out: number[] = []
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]!
    const start = s.xCm - bufferCm
    const end = s.xCm + s.widthCm + bufferCm
    if (end >= viewStartCm && start <= viewEndCm) out.push(i)
  }
  return out
}
