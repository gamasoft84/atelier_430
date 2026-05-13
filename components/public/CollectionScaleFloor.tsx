"use client"

import Image from "next/image"
import Link from "next/link"
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getCloudinaryUrl } from "@/lib/cloudinary/transform"
import { pickScaleBarSegment } from "@/lib/collection-scale-bar"
import {
  buildFloorSlots,
  fitPixelsPerCm,
  maxSlotHeightCm,
  totalTrackWidthCm,
  visibleSlotIndices,
  type FloorSlot,
  type ScaleLayoutArtwork,
} from "@/lib/collection-scale"
import type { ScaleCollectionClientItem } from "@/lib/supabase/queries/public"

const MIN_PX_PER_CM = 0.012
const MAX_PX_PER_CM = 3.2
const BUFFER_CM = 100
const ZOOM_FACTOR = 1.15
/** Espacio lateral de la columna fija de referencia (px, sin zoom). */
const HUMAN_RAIL_PADDING_X = 18

function ZoomIconMinus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ZoomIconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function clampUserZoom(basePxPerCm: number, zoom: number): number {
  if (!Number.isFinite(basePxPerCm) || basePxPerCm <= 0) return 1
  const maxZ = MAX_PX_PER_CM / basePxPerCm
  const minZ = MIN_PX_PER_CM / basePxPerCm
  return Math.min(maxZ, Math.max(minZ, zoom))
}

export interface CollectionScaleFloorProps {
  items: ScaleCollectionClientItem[]
  excludedWithoutDimensions?: number
  humanHeightCm?: number
  humanFootprintCm?: number
  gapCm?: number
  horizontalPaddingPx?: number
  /**
   * Texto de ayuda junto a los controles; enviarlo desde el Server Component
   * para que SSR y cliente coincidan (evita hydration mismatch con caché de dev).
   */
  introPieces?: { before: string; humanCm: number; after: string }
}

function toLayoutArtworks(items: ScaleCollectionClientItem[]): ScaleLayoutArtwork[] {
  return items.map((i) => ({
    id: i.id,
    code: i.code,
    title: i.title,
    widthCm: i.widthCm,
    heightCm: i.heightCm,
  }))
}

/**
 * Ancho del viewBox en unidades (= cm): figura anatómica 50 cm de ancho × 170 cm de alto.
 * Debe coincidir con el ancho del `viewBox` del SVG para escala 1:1 con las obras en el eje X.
 */
const HUMAN_SILHOUETTE_VIEWBOX_WIDTH_CM = 50

interface HumanReferenceSilhouetteProps {
  humanHeightCm: number
  basePxPerCm: number
  userZoom: number
}

/**
 * Silueta a escala: mismas unidades que `renderArtworkSlot` (basePxPerCm en layout + scale(userZoom)),
 * así la altura en pantalla es humanHeightCm × effectivePxPerCm, igual que slot.heightCm × effectivePxPerCm.
 */
function HumanReferenceSilhouette({ humanHeightCm, basePxPerCm, userZoom }: HumanReferenceSilhouetteProps) {
  const wPx = HUMAN_SILHOUETTE_VIEWBOX_WIDTH_CM * basePxPerCm
  const hPx = humanHeightCm * basePxPerCm
  const refMeters = `${(humanHeightCm / 100).toFixed(2)} m`

  return (
    <div
      className="relative inline-block shrink-0 select-none text-[#3a2f1f]"
      style={{
        width: wPx,
        height: hPx,
        transform: `scale(${userZoom})`,
        transformOrigin: "bottom center",
      }}
    >
      <div className="h-full w-full">
        <svg
          viewBox="0 0 50 170"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-full w-full"
          aria-label={`Figura humana de referencia ${refMeters}`}
        >
          <g fill="currentColor" opacity={0.72}>
            <ellipse cx="25" cy="13" rx="8.5" ry="11" />
            <path d="M22,24 L22,29 L28,29 L28,24 Z" />
            <path d="M5,29 Q25,27 45,29 L38,68 Q41,78 43,88 L7,88 Q9,78 12,68 Z" />
            <path d="M11,88 L23,88 L22,170 L12,170 Z" />
            <path d="M27,88 L39,88 L38,170 L28,170 Z" />
          </g>
        </svg>
      </div>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap text-xs tabular-nums text-stone-500">
        {humanHeightCm} cm
      </span>
    </div>
  )
}

export default function CollectionScaleFloor({
  items,
  excludedWithoutDimensions = 0,
  humanHeightCm = 170,
  humanFootprintCm = 66,
  gapCm = 12,
  horizontalPaddingPx = 24,
  introPieces,
}: CollectionScaleFloorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const layoutArtworks = useMemo(() => toLayoutArtworks(items), [items])

  const slots = useMemo(
    () =>
      buildFloorSlots(layoutArtworks, {
        humanHeightCm,
        humanFootprintCm,
        gapCm,
      }),
    [layoutArtworks, humanHeightCm, humanFootprintCm, gapCm],
  )

  const totalWidthCm = useMemo(() => totalTrackWidthCm(slots), [slots])
  const maxHeightCm = useMemo(() => maxSlotHeightCm(slots), [slots])

  /** Ancho en cm solo del tramo desplazable (sin silueta ni hueco inicial). */
  const scrollTotalWidthCm = useMemo(() => {
    if (slots.length < 2) return totalWidthCm
    return Math.max(1, totalWidthCm - humanFootprintCm - gapCm)
  }, [slots.length, totalWidthCm, humanFootprintCm, gapCm])

  const humanSlot = slots[0]
  const artworkSlots = useMemo(() => slots.slice(1), [slots])

  const scrollFrameSlots = useMemo(
    () =>
      artworkSlots.map((s) => ({
        ...s,
        xCm: s.xCm - humanFootprintCm - gapCm,
      })),
    [artworkSlots, humanFootprintCm, gapCm],
  )

  const [viewportInnerPx, setViewportInnerPx] = useState(800)
  const [basePxPerCm, setBasePxPerCm] = useState(0.08)
  const [userZoom, setUserZoom] = useState(1)
  const [visible, setVisible] = useState<number[]>([])

  const effectivePxPerCm = basePxPerCm * userZoom
  const barChoice = useMemo(() => pickScaleBarSegment(effectivePxPerCm), [effectivePxPerCm])
  const barLenPx = barChoice.segmentCm * effectivePxPerCm

  const thumbById = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const it of items) m.set(it.id, it.thumbnailPublicId)
    return m
  }, [items])

  const recomputeVisible = useCallback(() => {
    const el = scrollRef.current
    if (!el || effectivePxPerCm <= 0) return
    const idx = visibleSlotIndices(
      scrollFrameSlots,
      el.scrollLeft,
      el.clientWidth,
      effectivePxPerCm,
      BUFFER_CM,
    )
    setVisible(idx)
  }, [scrollFrameSlots, effectivePxPerCm])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setViewportInnerPx(Math.max(200, el.clientWidth))
    })
    ro.observe(el)
    setViewportInnerPx(Math.max(200, el.clientWidth))
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (scrollTotalWidthCm <= 0) return
    const fit = fitPixelsPerCm(
      scrollTotalWidthCm,
      viewportInnerPx,
      horizontalPaddingPx,
      MIN_PX_PER_CM,
      MAX_PX_PER_CM,
    )
    setBasePxPerCm(fit)
  }, [scrollTotalWidthCm, viewportInnerPx, horizontalPaddingPx])

  useEffect(() => {
    setUserZoom((z) => clampUserZoom(basePxPerCm, z))
  }, [basePxPerCm])

  useEffect(() => {
    recomputeVisible()
  }, [recomputeVisible, basePxPerCm, userZoom, scrollFrameSlots])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      window.requestAnimationFrame(recomputeVisible)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [recomputeVisible])

  const layoutW = scrollTotalWidthCm * basePxPerCm
  const layoutH = Math.max(120, maxHeightCm * basePxPerCm)
  const scaledW = layoutW * userZoom
  const scaledH = layoutH * userZoom

  const zoomIn = () => {
    setUserZoom((z) => clampUserZoom(basePxPerCm, z * ZOOM_FACTOR))
  }
  const zoomOut = () => {
    setUserZoom((z) => clampUserZoom(basePxPerCm, z / ZOOM_FACTOR))
  }
  const resetFit = () => {
    if (scrollTotalWidthCm <= 0) return
    setBasePxPerCm(
      fitPixelsPerCm(
        scrollTotalWidthCm,
        viewportInnerPx,
        horizontalPaddingPx,
        MIN_PX_PER_CM,
        MAX_PX_PER_CM,
      ),
    )
    setUserZoom(1)
    scrollRef.current?.scrollTo({ left: 0 })
  }

  const humanLayoutWPx = humanFootprintCm * basePxPerCm
  const humanRailOuterWPx = humanLayoutWPx * userZoom + HUMAN_RAIL_PADDING_X * 2

  const renderHumanFigure = () => {
    if (!humanSlot || humanSlot.kind !== "human") return null
    return (
      <HumanReferenceSilhouette humanHeightCm={humanHeightCm} basePxPerCm={basePxPerCm} userZoom={userZoom} />
    )
  }

  const renderArtworkSlot = (slot: FloorSlot) => {
    const wPx = slot.widthCm * basePxPerCm
    const hPx = slot.heightCm * basePxPerCm
    const leftPx = (slot.xCm - humanFootprintCm - gapCm) * basePxPerCm

    const thumbPid = thumbById.get(slot.id) ?? null
    const imgSrc =
      typeof thumbPid === "string" && thumbPid.length > 0
        ? getCloudinaryUrl(thumbPid, "thumbnail")
        : null

    const hoverTitle = `${slot.title}\n${slot.widthCm} × ${slot.heightCm} cm`

    return (
      <Link
        href={`/catalogo/${slot.code}`}
        title={hoverTitle}
        className="absolute block overflow-hidden rounded-md border border-stone-300 bg-white shadow-sm outline-none ring-gold-500/40 focus-visible:ring-2"
        style={{
          left: leftPx,
          bottom: 0,
          width: wPx,
          height: hPx,
        }}
        aria-label={`${slot.title}, código ${slot.code}, ${slot.widthCm} por ${slot.heightCm} centímetros`}
      >
        <div className="relative h-full w-full">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt=""
              fill
              className="object-contain p-0.5"
              sizes="200px"
              unoptimized
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-stone-100 px-1 text-center">
              <span className="font-mono text-[10px] font-semibold text-gold-600">{slot.code}</span>
              <span className="text-[9px] leading-tight text-stone-500 line-clamp-2">{slot.title}</span>
              <span className="text-[9px] font-medium text-stone-600 tabular-nums">Sin miniatura</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  if (slots.length <= 1) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-12 text-center text-sm text-stone-600">
        No hay obras disponibles con medidas para mostrar a escala.
        {excludedWithoutDimensions > 0 ? (
          <p className="mt-2 text-xs text-stone-500">
            {excludedWithoutDimensions} disponible{excludedWithoutDimensions === 1 ? "" : "s"} sin
            ancho y alto válidos en la ficha.
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600 max-w-xl">
          {introPieces ? (
            <>
              {introPieces.before}
              <span className="font-medium text-carbon-900">{introPieces.humanCm} cm</span>
              {introPieces.after}
            </>
          ) : (
            <>
              Cada rectángulo respeta las medidas de la ficha (ancho × alto). La silueta de{" "}
              <span className="font-medium text-carbon-900">{humanHeightCm} cm</span> queda fija a la
              izquierda como referencia; desplázate horizontalmente para recorrer las obras.
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={zoomOut} aria-label="Alejar">
            <ZoomIconMinus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={zoomIn} aria-label="Acercar">
            <ZoomIconPlus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetFit}>
            Ajustar a pantalla
          </Button>
        </div>
      </div>

      <p className="text-xs text-stone-500 tabular-nums" aria-live="polite">
        Escala aproximada:{" "}
        <span className="font-medium text-carbon-900">1 cm ≈ {effectivePxPerCm.toFixed(3)} px</span>
        {" · "}
        {items.length} obra{items.length === 1 ? "" : "s"} en pista
        {excludedWithoutDimensions > 0
          ? ` · ${excludedWithoutDimensions} sin medidas completas`
          : ""}
      </p>

      <div
        className="w-full overflow-hidden rounded-xl border border-stone-200 bg-[#FAF7F0] shadow-inner"
        role="presentation"
      >
        <div className="flex min-w-0 pb-7">
          <aside
            className="flex shrink-0 flex-col items-center justify-end border-r border-stone-300/90 bg-cream shadow-[inset_-6px_0_12px_-8px_rgba(15,15,15,0.06)]"
            style={{
              width: humanRailOuterWPx,
              minHeight: scaledH,
            }}
          >
            <span className="sr-only">Referencia humana fija en el borde izquierdo</span>
            {renderHumanFigure()}
          </aside>
          <div
            ref={scrollRef}
            role="region"
            aria-label="Pista a escala de obras; referencia humana fija a la izquierda del panel"
            className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div
              className="flex flex-col"
              style={{
                width: Math.max(scaledW, viewportInnerPx),
                minHeight: scaledH,
              }}
            >
              <div
                className="flex w-full shrink-0 items-end justify-start"
                style={{ height: scaledH }}
              >
                <div
                  className="relative"
                  style={{
                    width: layoutW,
                    height: layoutH,
                    transform: `scale(${userZoom})`,
                    transformOrigin: "bottom left",
                  }}
                >
                  {visible.map((i) => {
                    const slot = artworkSlots[i]
                    if (!slot) return null
                    return <Fragment key={slot.id}>{renderArtworkSlot(slot)}</Fragment>
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex shrink-0 items-center gap-3 border-t border-stone-200/80 px-4 py-2"
          role="img"
          aria-label={`Barra gráfica de escala, segmento de ${barChoice.segmentCm} centímetros`}
        >
          <div
            className="h-0.5 shrink-0 rounded-full bg-stone-700"
            style={{ width: Math.max(1, barLenPx) }}
            aria-hidden
          />
          {barChoice.label ? (
            <span className="text-xs text-stone-600 tabular-nums">{barChoice.label}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
