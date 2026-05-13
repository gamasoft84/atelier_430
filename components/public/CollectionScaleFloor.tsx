"use client"

import Image from "next/image"
import Link from "next/link"
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Minus, Plus, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCloudinaryUrl } from "@/lib/cloudinary/transform"
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

export interface CollectionScaleFloorProps {
  items: ScaleCollectionClientItem[]
  excludedWithoutDimensions?: number
  humanHeightCm?: number
  humanFootprintCm?: number
  gapCm?: number
  horizontalPaddingPx?: number
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

function HumanSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 164"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="24" cy="18" rx="14" ry="16" className="fill-stone-400/90" />
      <path
        d="M24 34 L10 52 L14 54 L24 42 L34 54 L38 52 Z"
        className="fill-stone-500/85"
      />
      <rect x="18" y="42" width="12" height="52" rx="4" className="fill-stone-500/85" />
      <path
        d="M18 70 L6 118 L12 120 L20 78 M30 78 L38 120 L44 118 L32 70"
        className="stroke-stone-500/85 stroke-[5] stroke-linecap-round stroke-linejoin-round fill-none"
      />
      <path
        d="M22 94 L18 156 L24 158 L30 156 L26 94"
        className="fill-stone-500/85"
      />
    </svg>
  )
}

export default function CollectionScaleFloor({
  items,
  excludedWithoutDimensions = 0,
  humanHeightCm = 164,
  humanFootprintCm = 48,
  gapCm = 12,
  horizontalPaddingPx = 24,
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

  const [viewportInnerPx, setViewportInnerPx] = useState(800)
  const [pxPerCm, setPxPerCm] = useState(0.08)
  const [visible, setVisible] = useState<number[]>([])
  const [showThumbnails, setShowThumbnails] = useState(false)

  const thumbById = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const it of items) m.set(it.id, it.thumbnailPublicId)
    return m
  }, [items])

  const recomputeVisible = useCallback(() => {
    const el = scrollRef.current
    if (!el || pxPerCm <= 0) return
    const idx = visibleSlotIndices(
      slots,
      el.scrollLeft,
      el.clientWidth,
      pxPerCm,
      BUFFER_CM,
    )
    setVisible(idx)
  }, [slots, pxPerCm])

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
    if (totalWidthCm <= 0) return
    const fit = fitPixelsPerCm(
      totalWidthCm,
      viewportInnerPx,
      horizontalPaddingPx,
      MIN_PX_PER_CM,
      MAX_PX_PER_CM,
    )
    setPxPerCm(fit)
  }, [totalWidthCm, viewportInnerPx, horizontalPaddingPx])

  useEffect(() => {
    recomputeVisible()
  }, [recomputeVisible, pxPerCm, slots])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      window.requestAnimationFrame(recomputeVisible)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [recomputeVisible])

  const trackWidthPx = totalWidthCm * pxPerCm
  const trackHeightPx = maxHeightCm * pxPerCm

  const zoomIn = () => {
    setPxPerCm((v) => Math.min(MAX_PX_PER_CM, v * ZOOM_FACTOR))
  }
  const zoomOut = () => {
    setPxPerCm((v) => Math.max(MIN_PX_PER_CM, v / ZOOM_FACTOR))
  }
  const resetFit = () => {
    if (totalWidthCm <= 0) return
    setPxPerCm(
      fitPixelsPerCm(
        totalWidthCm,
        viewportInnerPx,
        horizontalPaddingPx,
        MIN_PX_PER_CM,
        MAX_PX_PER_CM,
      ),
    )
    scrollRef.current?.scrollTo({ left: 0 })
  }

  const renderSlot = (slot: FloorSlot) => {
    const wPx = slot.widthCm * pxPerCm
    const hPx = slot.heightCm * pxPerCm
    const leftPx = slot.xCm * pxPerCm

    if (slot.kind === "human") {
      return (
        <div
          role="img"
          aria-label={`Silueta de referencia de ${humanHeightCm} centímetros de altura`}
          className="absolute flex flex-col items-center justify-end border border-dashed border-stone-300 rounded-lg bg-stone-100/60"
          style={{
            left: leftPx,
            bottom: 0,
            width: wPx,
            height: hPx,
          }}
        >
          <HumanSilhouette className="h-[92%] w-auto max-w-[85%]" />
          <span className="mb-1 text-[10px] font-medium text-stone-500 tabular-nums">
            {humanHeightCm} cm
          </span>
        </div>
      )
    }

    const thumbPid = showThumbnails ? thumbById.get(slot.id) : null
    const imgSrc =
      typeof thumbPid === "string" && thumbPid.length > 0
        ? getCloudinaryUrl(thumbPid, "thumbnail")
        : null

    return (
      <Link
        href={`/catalogo/${slot.code}`}
        className="absolute group block overflow-hidden rounded-md border border-stone-300 bg-white shadow-sm outline-none ring-gold-500/40 focus-visible:ring-2"
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1 text-center">
              <span className="font-mono text-[10px] font-semibold text-gold-600">{slot.code}</span>
              <span className="text-[9px] leading-tight text-stone-500 line-clamp-3">{slot.title}</span>
            </div>
          )}
          <span className="pointer-events-none absolute bottom-0 left-0 right-0 bg-carbon-900/75 py-0.5 text-center text-[9px] font-medium text-cream opacity-0 transition-opacity group-hover:opacity-100">
            {slot.code}
          </span>
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
          Cada rectángulo respeta las medidas de la ficha (ancho × alto). La silueta mide{" "}
          <span className="font-medium text-carbon-900">{humanHeightCm} cm</span> de alto. Desplázate
          horizontalmente para recorrer la colección.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={zoomOut} aria-label="Alejar">
            <Minus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={zoomIn} aria-label="Acercar">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetFit}>
            Ajustar a pantalla
          </Button>
          <Button
            type="button"
            variant={showThumbnails ? "default" : "outline"}
            size="sm"
            className={showThumbnails ? "bg-gold-500 text-cream hover:bg-gold-400" : ""}
            onClick={() => setShowThumbnails((v) => !v)}
            aria-pressed={showThumbnails}
          >
            <ImageIcon className="h-4 w-4 mr-1.5 inline" aria-hidden />
            Fotos
          </Button>
        </div>
      </div>

      <p className="text-xs text-stone-500 tabular-nums" aria-live="polite">
        Escala aproximada: <span className="font-medium text-carbon-900">1 cm ≈ {pxPerCm.toFixed(3)} px</span>
        {" · "}
        {items.length} obra{items.length === 1 ? "" : "s"} en pista
        {excludedWithoutDimensions > 0
          ? ` · ${excludedWithoutDimensions} sin medidas completas`
          : ""}
      </p>

      <div
        ref={scrollRef}
        role="region"
        aria-label="Pista a escala de la colección con referencia humana"
        className="w-full overflow-x-auto overflow-y-hidden rounded-xl border border-stone-200 bg-[#FAF7F0] shadow-inner"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="relative mx-auto"
          style={{
            width: Math.max(trackWidthPx, viewportInnerPx),
            height: Math.max(120, trackHeightPx + 8),
            minHeight: 160,
          }}
        >
          <div
            className="relative"
            style={{
              width: trackWidthPx,
              height: Math.max(120, trackHeightPx),
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {visible.map((i) => {
              const slot = slots[i]
              if (!slot) return null
              return <Fragment key={slot.id}>{renderSlot(slot)}</Fragment>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
