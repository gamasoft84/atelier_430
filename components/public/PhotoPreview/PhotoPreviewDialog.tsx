"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Camera, Download, Share2, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  artworkPixelSize,
  fileToScaledImage,
  loadImage,
  pixelsPerCm,
  type Point,
} from "@/lib/photo-preview/scale"
import { trackWhatsAppClick } from "@/app/actions/tracking"
import { WHATSAPP_NUMBER } from "@/lib/constants"

type Step = "upload" | "reference" | "position" | "share"

interface PhotoPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artworkId: string
  artworkCode: string
  title: string
  widthCm: number
  heightCm: number
  artworkImageUrl: string
  pageUrl: string
}

const REFERENCE_PRESETS = [
  { label: "Puerta estándar", cm: 200 },
  { label: "Sofá 3 plazas", cm: 200 },
  { label: "Mesa de centro", cm: 120 },
  { label: "TV 50''", cm: 110 },
]

export default function PhotoPreviewDialog({
  open,
  onOpenChange,
  artworkId,
  artworkCode,
  title,
  widthCm,
  heightCm,
  artworkImageUrl,
  pageUrl,
}: PhotoPreviewDialogProps) {
  const [step, setStep] = useState<Step>("upload")
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const [photoSize, setPhotoSize] = useState<{ w: number; h: number } | null>(null)
  const [artwork, setArtwork] = useState<HTMLImageElement | null>(null)

  // Reference (2 puntos sobre la foto + medida real en cm)
  const [refPoints, setRefPoints] = useState<Point[]>([])
  const [refCm, setRefCm] = useState<number>(200)

  // Posición de la obra sobre la foto (en coords de la foto, no del DOM)
  const [artworkCenter, setArtworkCenter] = useState<Point>({ x: 0, y: 0 })

  const [isExporting, setIsExporting] = useState(false)
  const [shareBlobUrl, setShareBlobUrl] = useState<string | null>(null)
  const [shareFile, setShareFile] = useState<File | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const draggingRef = useRef(false)

  // Carga la imagen de la obra (Cloudinary, con CORS) cuando se abre el modal
  useEffect(() => {
    if (!open || artwork) return
    let cancelled = false
    loadImage(artworkImageUrl, true)
      .then((img) => {
        if (!cancelled) setArtwork(img)
      })
      .catch(() => {
        if (!cancelled) toast.error("No se pudo cargar la imagen de la obra")
      })
    return () => {
      cancelled = true
    }
  }, [open, artwork, artworkImageUrl])

  // Reset al cerrar
  useEffect(() => {
    if (open) return
    const id = setTimeout(() => {
      setStep("upload")
      setPhoto(null)
      setPhotoSize(null)
      setRefPoints([])
      setRefCm(200)
      setArtworkCenter({ x: 0, y: 0 })
      if (shareBlobUrl) URL.revokeObjectURL(shareBlobUrl)
      setShareBlobUrl(null)
      setShareFile(null)
    }, 200)
    return () => clearTimeout(id)
  }, [open, shareBlobUrl])

  const pxPerCm = useMemo(() => {
    if (refPoints.length < 2 || refCm <= 0) return 0
    return pixelsPerCm(refPoints[0], refPoints[1], refCm)
  }, [refPoints, refCm])

  const artworkPxSize = useMemo(() => {
    if (pxPerCm <= 0) return null
    return artworkPixelSize(widthCm, heightCm, pxPerCm)
  }, [pxPerCm, widthCm, heightCm])

  // ─── Render del canvas ──────────────────────────────────────────────────

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !photo || !photoSize) return
    canvas.width = photoSize.w
    canvas.height = photoSize.h
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(photo, 0, 0, photoSize.w, photoSize.h)

    if (step === "reference" && refPoints.length > 0) {
      drawReference(ctx, refPoints, photoSize.w)
    }

    if ((step === "position" || step === "share") && artwork && artworkPxSize) {
      drawArtwork(ctx, artwork, artworkCenter, artworkPxSize, step === "position")
    }
  }, [photo, photoSize, step, refPoints, artwork, artworkPxSize, artworkCenter])

  useEffect(() => {
    redraw()
  }, [redraw])

  // ─── Coordenadas del canvas a partir de un PointerEvent ────────────────

  const eventToCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  // ─── Step: upload ──────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    try {
      const { image, width, height } = await fileToScaledImage(file, 2400)
      setPhoto(image)
      setPhotoSize({ w: width, h: height })
      setRefPoints([])
      setStep("reference")
    } catch {
      toast.error("No se pudo abrir la imagen. Prueba con otra foto.")
    }
  }

  // ─── Step: reference ───────────────────────────────────────────────────

  const onReferenceTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = eventToCanvasCoords(e)
    setRefPoints((prev) => {
      if (prev.length >= 2) return [p]
      return [...prev, p]
    })
  }

  const canConfirmReference = refPoints.length === 2 && refCm > 0 && pxPerCm > 0

  const goToPosition = () => {
    if (!photoSize) return
    setArtworkCenter({ x: photoSize.w / 2, y: photoSize.h / 2 })
    setStep("position")
  }

  // ─── Step: position (drag) ─────────────────────────────────────────────

  const onArtworkPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!artworkPxSize) return
    const p = eventToCanvasCoords(e)
    const dx = p.x - artworkCenter.x
    const dy = p.y - artworkCenter.y
    if (
      Math.abs(dx) <= artworkPxSize.width / 2 &&
      Math.abs(dy) <= artworkPxSize.height / 2
    ) {
      draggingRef.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    } else {
      // Toque fuera: mover la obra al punto tocado
      setArtworkCenter(p)
    }
  }

  const onArtworkPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current || !photoSize || !artworkPxSize) return
    const p = eventToCanvasCoords(e)
    const halfW = artworkPxSize.width / 2
    const halfH = artworkPxSize.height / 2
    setArtworkCenter({
      x: Math.max(halfW, Math.min(photoSize.w - halfW, p.x)),
      y: Math.max(halfH, Math.min(photoSize.h - halfH, p.y)),
    })
  }

  const onArtworkPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  // ─── Step: share ───────────────────────────────────────────────────────

  const buildExport = useCallback(async (): Promise<{ blob: Blob; file: File } | null> => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    )
    if (!blob) return null
    const file = new File([blob], `atelier430-${artworkCode}-preview.jpg`, {
      type: "image/jpeg",
    })
    return { blob, file }
  }, [artworkCode])

  const goToShare = async () => {
    setIsExporting(true)
    try {
      // Pequeño delay para asegurar que el frame final ya se pintó
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      const exported = await buildExport()
      if (!exported) {
        toast.error("No se pudo generar la imagen")
        return
      }
      if (shareBlobUrl) URL.revokeObjectURL(shareBlobUrl)
      setShareBlobUrl(URL.createObjectURL(exported.blob))
      setShareFile(exported.file)
      setStep("share")
    } finally {
      setIsExporting(false)
    }
  }

  const onDownload = () => {
    if (!shareBlobUrl) return
    const a = document.createElement("a")
    a.href = shareBlobUrl
    a.download = `atelier430-${artworkCode}-preview.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const onShare = async () => {
    if (!shareFile) return
    const text = `Mira cómo se vería esta obra en mi pared\n${title} (${artworkCode})\n${pageUrl}`
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [shareFile] })
    ) {
      try {
        await navigator.share({ files: [shareFile], title, text })
        trackWhatsAppClick(artworkId).catch(() => {})
        return
      } catch (err) {
        // El usuario canceló: no es error
        if ((err as Error)?.name === "AbortError") return
      }
    }
    // Fallback (desktop o navegadores sin share API): descargar y abrir wa.me
    onDownload()
    if (WHATSAPP_NUMBER) {
      const msg = `${text}\n\n(Adjunta la imagen que acaba de descargarse)`
      const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
      window.open(href, "_blank", "noopener,noreferrer")
      trackWhatsAppClick(artworkId).catch(() => {})
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-stone-200">
          <DialogTitle className="font-display text-xl text-carbon-900">
            Vista previa con tu foto
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            {step === "upload" && "Sube una foto de tu pared o tómala con la cámara."}
            {step === "reference" &&
              "Toca dos puntos sobre algo de medida conocida en la foto y dinos cuánto mide."}
            {step === "position" && "Arrastra la obra hasta el lugar exacto donde la imaginas."}
            {step === "share" && "Listo. Descárgala o compártela por WhatsApp."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {step === "upload" && <UploadStep onFile={handleFile} />}

          {(step === "reference" || step === "position" || step === "share") && (
            <div className="space-y-4">
              <CanvasFrame>
                <canvas
                  ref={canvasRef}
                  className="block w-full h-auto rounded-lg bg-stone-100 touch-none select-none"
                  onPointerDown={
                    step === "reference"
                      ? onReferenceTap
                      : step === "position"
                        ? onArtworkPointerDown
                        : undefined
                  }
                  onPointerMove={step === "position" ? onArtworkPointerMove : undefined}
                  onPointerUp={step === "position" ? onArtworkPointerUp : undefined}
                  onPointerCancel={step === "position" ? onArtworkPointerUp : undefined}
                />
              </CanvasFrame>

              {step === "reference" && (
                <ReferenceControls
                  pointsCount={refPoints.length}
                  refCm={refCm}
                  setRefCm={setRefCm}
                  resetPoints={() => setRefPoints([])}
                  pxPerCm={pxPerCm}
                />
              )}

              {step === "position" && artworkPxSize && (
                <p className="text-xs text-stone-500 text-center">
                  La obra mide{" "}
                  <span className="font-semibold text-carbon-900">
                    {widthCm} × {heightCm} cm
                  </span>{" "}
                  · escala: {pxPerCm.toFixed(1)} px/cm
                </p>
              )}

              {step === "share" && shareBlobUrl && (
                <div className="space-y-3">
                  <p className="text-xs text-stone-500 text-center">
                    Si quieres, ajustamos lo que sea — solo regresa al paso anterior.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (step === "reference") setStep("upload")
              else if (step === "position") setStep("reference")
              else if (step === "share") setStep("position")
            }}
            disabled={step === "upload" || isExporting}
            className="gap-1.5 text-stone-500"
          >
            <ChevronLeft size={16} />
            Anterior
          </Button>

          {step === "reference" && (
            <Button
              type="button"
              onClick={goToPosition}
              disabled={!canConfirmReference}
              className="gap-1.5 bg-carbon-900 hover:bg-carbon-800 text-white"
            >
              Continuar
              <ChevronRight size={16} />
            </Button>
          )}

          {step === "position" && (
            <Button
              type="button"
              onClick={goToShare}
              disabled={isExporting}
              className="gap-1.5 bg-gold-500 hover:bg-gold-400 text-white font-semibold"
            >
              {isExporting && <Loader2 size={14} className="animate-spin" />}
              Listo
              <ChevronRight size={16} />
            </Button>
          )}

          {step === "share" && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onDownload}
                className="gap-1.5 border-stone-200 text-stone-700"
              >
                <Download size={14} />
                Descargar
              </Button>
              <Button
                type="button"
                onClick={onShare}
                className="gap-1.5 text-white font-semibold"
                style={{ backgroundColor: "#25D366" }}
              >
                <Share2 size={14} />
                Compartir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subcomponentes ─────────────────────────────────────────────────────────

function CanvasFrame({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg overflow-hidden">{children}</div>
}

function UploadStep({ onFile }: { onFile: (f: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors py-10 flex flex-col items-center gap-3"
      >
        <Camera size={28} strokeWidth={1.5} className="text-stone-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-stone-700">Subir foto de tu pared</p>
          <p className="text-xs text-stone-400 mt-1">
            Toma una foto frontal del muro donde imaginas la obra
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="sm:hidden w-full rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        Tomar foto ahora
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ""
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ""
        }}
      />
    </div>
  )
}

interface ReferenceControlsProps {
  pointsCount: number
  refCm: number
  setRefCm: (n: number) => void
  resetPoints: () => void
  pxPerCm: number
}

function ReferenceControls({
  pointsCount,
  refCm,
  setRefCm,
  resetPoints,
  pxPerCm,
}: ReferenceControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-500">
          {pointsCount === 0 && "Toca el primer extremo del objeto de referencia"}
          {pointsCount === 1 && "Toca el segundo extremo"}
          {pointsCount === 2 && "Listo. Indica la medida real abajo."}
        </p>
        {pointsCount > 0 && (
          <button
            type="button"
            onClick={resetPoints}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-carbon-900"
          >
            <RefreshCw size={12} />
            Reiniciar
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-stone-600 whitespace-nowrap">Mide:</label>
        <Input
          type="number"
          inputMode="numeric"
          min={10}
          max={1000}
          value={refCm}
          onChange={(e) => setRefCm(Number(e.target.value) || 0)}
          className="w-24"
        />
        <span className="text-sm text-stone-500">cm</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {REFERENCE_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setRefCm(p.cm)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
              refCm === p.cm
                ? "border-gold-500 bg-amber-50 text-carbon-900"
                : "border-stone-200 text-stone-500 hover:border-stone-300"
            }`}
          >
            {p.label} · {p.cm} cm
          </button>
        ))}
      </div>

      {pointsCount === 2 && pxPerCm > 0 && (
        <p className="text-[11px] text-stone-400">
          Escala calculada: {pxPerCm.toFixed(1)} píxeles por cm.
        </p>
      )}
    </div>
  )
}

// ─── Helpers de dibujo ──────────────────────────────────────────────────────

function drawReference(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  canvasW: number,
) {
  const lineWidth = Math.max(2, canvasW * 0.004)
  const dotRadius = Math.max(8, canvasW * 0.012)

  if (points.length === 2) {
    ctx.save()
    ctx.strokeStyle = "rgba(216, 165, 32, 0.95)"
    ctx.lineWidth = lineWidth
    ctx.setLineDash([lineWidth * 3, lineWidth * 2])
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    ctx.lineTo(points[1].x, points[1].y)
    ctx.stroke()
    ctx.restore()
  }

  for (const p of points) {
    ctx.save()
    ctx.fillStyle = "#D4AF37"
    ctx.strokeStyle = "white"
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
}

function drawArtwork(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  center: Point,
  size: { width: number; height: number },
  showGuide: boolean,
) {
  const x = center.x - size.width / 2
  const y = center.y - size.height / 2

  // Sombra suave realista
  ctx.save()
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)"
  ctx.shadowBlur = Math.max(12, size.width * 0.025)
  ctx.shadowOffsetX = Math.max(2, size.width * 0.005)
  ctx.shadowOffsetY = Math.max(6, size.width * 0.012)
  ctx.fillStyle = "rgba(0,0,0,0)"
  ctx.fillRect(x, y, size.width, size.height)
  ctx.restore()

  ctx.drawImage(img, x, y, size.width, size.height)

  if (showGuide) {
    ctx.save()
    ctx.strokeStyle = "rgba(212, 175, 55, 0.9)"
    ctx.lineWidth = Math.max(2, size.width * 0.005)
    ctx.setLineDash([8, 6])
    ctx.strokeRect(x, y, size.width, size.height)
    ctx.restore()
  }
}
