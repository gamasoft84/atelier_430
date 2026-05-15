import type { ComparativoPreparedItem } from "@/lib/comparativo/prepare-items"
import type { ComparativoEditorialCopy } from "@/lib/supabase/queries/comparativo"
import ComparativoExportButton from "@/components/comparativo/ComparativoExportButton"
import { COMPARATIVO_PX_PER_CM } from "@/lib/comparativo/scale"

export const COMPARATIVO_BOARD_ID = "comparativo-editorial-board"

const GAP_PX = 28

function formatPrice(item: ComparativoPreparedItem): string {
  if (!item.showPrice || item.priceMxn == null) return "Privado"
  return `$${item.priceMxn.toLocaleString("es-MX")}`
}

function formatDims(w: number, h: number): string {
  return `${Math.round(w)} × ${Math.round(h)} cm`
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
  const filename =
    exportFilename ??
    `atelier430-comparativo-${items.map((i) => i.code).join("-")}.png`.replace(/[^a-zA-Z0-9._-]+/g, "-")

  return (
    <div className="space-y-4">
      {showExport ? (
        <div className="flex justify-end print:hidden">
          <ComparativoExportButton boardId={COMPARATIVO_BOARD_ID} filename={filename} />
        </div>
      ) : null}

      <EditorialBoardCanvas items={items} copy={copy} maxDisplayPx={maxDisplayPx} />
    </div>
  )
}

function EditorialBoardCanvas({
  items,
  copy,
  maxDisplayPx,
}: {
  items: ComparativoPreparedItem[]
  copy: ComparativoEditorialCopy
  maxDisplayPx: number
}) {
  return (
    <div
      id={COMPARATIVO_BOARD_ID}
      className="overflow-x-auto rounded-xl border border-stone-200/80 bg-[#f5f2eb] px-6 py-10 shadow-sm sm:px-10 sm:py-12"
    >
      <header className="mb-10 text-center">
        <p className="font-display text-2xl font-semibold tracking-[0.35em] text-carbon-900 sm:text-3xl">
          ATELIER 430
        </p>
        <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.28em] text-stone-600 sm:text-xs">
          {copy.tagline}
        </p>
      </header>

      <div className="relative mx-auto w-fit max-w-full px-2">
        {/* Misma línea inferior (a ras de piso); la más alta define el alto del bloque */}
        <div className="relative" style={{ height: maxDisplayPx }}>
          <div
            className="flex justify-center"
            style={{ gap: GAP_PX, height: maxDisplayPx }}
          >
            {items.map((item) => {
              const wPx = item.displayWidthCm * COMPARATIVO_PX_PER_CM
              const hPx = item.displayHeightCm * COMPARATIVO_PX_PER_CM
              return (
                <div
                  key={item.code}
                  className="flex shrink-0 flex-col justify-end"
                  style={{
                    width: wPx,
                    height: maxDisplayPx,
                    maxWidth: "min(100%, 320px)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    width={Math.round(wPx)}
                    height={Math.round(hPx)}
                    className="block shrink-0 drop-shadow-[0_10px_28px_rgba(15,15,15,0.12)]"
                    style={{ width: wPx, height: hPx }}
                    crossOrigin="anonymous"
                  />
                </div>
              )
            })}
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-stone-400/55 to-transparent"
            aria-hidden
          />
        </div>

        <div className="mt-5 flex items-start justify-center" style={{ gap: GAP_PX }}>
          {items.map((item, index) => {
            const hasFrameDims =
              item.frameOuterWidthCm != null &&
              item.frameOuterHeightCm != null &&
              item.frameOuterWidthCm > 0 &&
              item.frameOuterHeightCm > 0
            const colW = item.displayWidthCm * COMPARATIVO_PX_PER_CM
            return (
              <article
                key={`${item.code}-meta`}
                className="shrink-0 space-y-1 text-center"
                style={{ width: colW, maxWidth: "min(100%, 320px)" }}
              >
                <p className="font-display text-lg text-carbon-900">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="font-display text-sm font-medium text-carbon-900">{item.title}</p>
                <p className="text-[11px] text-stone-600">{item.techniqueLabel}</p>
                {item.canvasWidthCm > 0 && item.canvasHeightCm > 0 ? (
                  <p className="text-[11px] text-stone-500">
                    Lienzo: {formatDims(item.canvasWidthCm, item.canvasHeightCm)}
                  </p>
                ) : null}
                {hasFrameDims ? (
                  <p className="text-[11px] text-stone-500">
                    Con marco: {formatDims(item.frameOuterWidthCm!, item.frameOuterHeightCm!)}
                  </p>
                ) : null}
                <p className="text-[10px] text-stone-400">
                  Escala según {item.displaySource === "frame" ? "marco" : "lienzo"}
                </p>
                <p className="pt-1 font-display text-base font-semibold text-carbon-900">
                  {formatPrice(item)}
                </p>
              </article>
            )
          })}
        </div>
      </div>

      <footer className="mt-12 border-t border-stone-300/70 pt-6 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-600 sm:text-[11px]">
          {copy.footer}
        </p>
      </footer>
    </div>
  )
}
