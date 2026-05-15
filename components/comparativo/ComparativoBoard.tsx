import type { ComparativoPreparedItem } from "@/lib/comparativo/prepare-items"
import type { ComparativoEditorialCopy } from "@/lib/supabase/queries/comparativo"
import ComparativoExportButton from "@/components/comparativo/ComparativoExportButton"
import ComparativoFlourish from "@/components/comparativo/ComparativoFlourish"
import { comparativoSerif } from "@/components/comparativo/comparativo-font"
import { COMPARATIVO_PX_PER_CM } from "@/lib/comparativo/scale"

export const COMPARATIVO_BOARD_ID = "comparativo-editorial-board"

const GAP_PX = 80
const META_TOP_PX = 40

function formatPrice(item: ComparativoPreparedItem): string {
  if (!item.showPrice || item.priceMxn == null) return "Privado"
  return `$${item.priceMxn.toLocaleString("es-MX")}`
}

function formatDims(w: number, h: number): string {
  return `${Math.round(w)} × ${Math.round(h)} cm`
}

function hasFrameDims(item: ComparativoPreparedItem): boolean {
  return (
    item.frameOuterWidthCm != null &&
    item.frameOuterHeightCm != null &&
    item.frameOuterWidthCm > 0 &&
    item.frameOuterHeightCm > 0
  )
}

function hasCanvasDims(item: ComparativoPreparedItem): boolean {
  return item.canvasWidthCm > 0 && item.canvasHeightCm > 0
}

function galleryWidthPx(items: ComparativoPreparedItem[]): number {
  const widths = items.map((i) => i.displayWidthCm * COMPARATIVO_PX_PER_CM)
  return widths.reduce((a, b) => a + b, 0) + GAP_PX * Math.max(0, items.length - 1)
}

interface ComparativoBoardProps {
  items: ComparativoPreparedItem[]
  copy: ComparativoEditorialCopy
  showExport?: boolean
  exportFilename?: string
}

export default function ComparativoBoard({
  items,
  copy,
  showExport = true,
  exportFilename,
}: ComparativoBoardProps) {
  const maxH = Math.max(...items.map((i) => i.displayHeightCm), 1)
  const maxDisplayPx = maxH * COMPARATIVO_PX_PER_CM
  const galleryW = galleryWidthPx(items)
  const filename =
    exportFilename ??
    `atelier430-comparativo-${items.map((i) => i.code).join("-")}.png`.replace(/[^a-zA-Z0-9._-]+/g, "-")

  return (
    <div className="space-y-6">
      {showExport ? (
        <div className="flex justify-end print:hidden">
          <ComparativoExportButton boardId={COMPARATIVO_BOARD_ID} filename={filename} />
        </div>
      ) : null}

      <EditorialBoardCanvas
        items={items}
        copy={copy}
        maxDisplayPx={maxDisplayPx}
        galleryW={galleryW}
      />
    </div>
  )
}

function EditorialBoardCanvas({
  items,
  copy,
  maxDisplayPx,
  galleryW,
}: {
  items: ComparativoPreparedItem[]
  copy: ComparativoEditorialCopy
  maxDisplayPx: number
  galleryW: number
}) {
  const showCanvasRow = items.some(hasCanvasDims)
  const showFrameRow = items.some(hasFrameDims)

  return (
    <div
      id={COMPARATIVO_BOARD_ID}
      className={`${comparativoSerif.className} ${comparativoSerif.variable} comparativo-linen-surface comparativo-showroom-light comparativo-board-root w-full px-10 py-14 sm:px-16 sm:py-24`}
    >
      <div className="comparativo-board-inner mx-auto flex w-full flex-col items-center">
        <header className="comparativo-header w-full">
          <h1 className="comparativo-header-title">ATELIER 430</h1>
          <ComparativoFlourish className="comparativo-ornament mx-auto mt-5" />
          <p className="comparativo-header-tagline">{copy.tagline}</p>
        </header>

        <div className="comparativo-gallery-scroll w-full">
          <div
            className="comparativo-gallery-scroll-inner overflow-x-auto pb-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="comparativo-gallery mx-auto shrink-0" style={{ width: galleryW }}>
              <div
                className="comparativo-art-row flex items-end"
                style={{ gap: GAP_PX, height: maxDisplayPx, width: galleryW }}
              >
                {items.map((item) => {
                  const wPx = item.displayWidthCm * COMPARATIVO_PX_PER_CM
                  const hPx = item.displayHeightCm * COMPARATIVO_PX_PER_CM
                  return (
                    <div
                      key={item.code}
                      className="comparativo-piece shrink-0"
                      style={{ width: wPx, height: maxDisplayPx }}
                    >
                      <div className="flex h-full flex-col justify-end" style={{ width: wPx }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          width={Math.round(wPx)}
                          height={Math.round(hPx)}
                          className="comparativo-art-img mx-auto block"
                          style={{ width: wPx, height: hPx }}
                          crossOrigin="anonymous"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div
                className="comparativo-meta-row flex"
                style={{ gap: GAP_PX, width: galleryW, marginTop: META_TOP_PX }}
              >
                {items.map((item, index) => {
                  const wPx = item.displayWidthCm * COMPARATIVO_PX_PER_CM
                  const withFrame = hasFrameDims(item)
                  const withCanvas = hasCanvasDims(item)
                  return (
                    <article
                      key={item.code}
                      className="comparativo-meta-col shrink-0"
                      style={{ width: wPx }}
                    >
                      <p className="comparativo-meta-index">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h2 className="comparativo-meta-title">{item.title}</h2>
                      <p className="comparativo-meta-line">{item.techniqueLabel}</p>
                      {showCanvasRow ? (
                        <p className="comparativo-meta-line">
                          {withCanvas
                            ? `Lienzo: ${formatDims(item.canvasWidthCm, item.canvasHeightCm)}`
                            : "\u00a0"}
                        </p>
                      ) : null}
                      {showFrameRow ? (
                        <p className="comparativo-meta-line">
                          {withFrame
                            ? `Con marco: ${formatDims(item.frameOuterWidthCm!, item.frameOuterHeightCm!)}`
                            : "\u00a0"}
                        </p>
                      ) : null}
                      <p className="comparativo-meta-price">{formatPrice(item)}</p>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <footer className="comparativo-footer w-full">
          <div className="comparativo-footer-rule" aria-hidden />
          <p className="comparativo-footer-text">{copy.footer}</p>
          <ComparativoFlourish className="comparativo-ornament mx-auto mt-6" />
        </footer>
      </div>
    </div>
  )
}
