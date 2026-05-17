"use client"

import { useCallback, useState } from "react"
import { Download, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { exportComparativoBoardPng } from "@/lib/comparativo/export-png"
import {
  downloadComparativoPdf,
  shareComparativoPdfViaWhatsApp,
} from "@/lib/comparativo/share-pdf-whatsapp"
import { WHATSAPP_NUMBER } from "@/lib/constants"

interface ComparativoExportButtonProps {
  boardId: string
  codes: string[]
  filename?: string
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function ComparativoExportButton({
  boardId,
  codes,
  filename = "atelier430-comparativo.png",
}: ComparativoExportButtonProps) {
  const [busy, setBusy] = useState(false)
  const [busyAction, setBusyAction] = useState<"png" | "pdf" | "whatsapp" | null>(null)

  const canShare = codes.length >= 3 && Boolean(WHATSAPP_NUMBER)

  const exportPng = useCallback(async () => {
    setBusy(true)
    setBusyAction("png")
    try {
      const dataUrl = await exportComparativoBoardPng(boardId)
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      toast.error("No se pudo generar el PNG")
    } finally {
      setBusy(false)
      setBusyAction(null)
    }
  }, [boardId, filename])

  const exportPdf = useCallback(async () => {
    setBusy(true)
    setBusyAction("pdf")
    try {
      await downloadComparativoPdf(codes)
    } catch {
      toast.error("No se pudo generar el PDF")
    } finally {
      setBusy(false)
      setBusyAction(null)
    }
  }, [codes])

  const shareWhatsApp = useCallback(async () => {
    setBusy(true)
    setBusyAction("whatsapp")
    try {
      await shareComparativoPdfViaWhatsApp(codes)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo compartir"
      toast.error(msg)
    } finally {
      setBusy(false)
      setBusyAction(null)
    }
  }, [codes])

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => void exportPng()}
        className="gap-2 border-[#d4cdc3] bg-[#faf8f4] font-sans text-stone-600"
      >
        <Download className="size-4" aria-hidden />
        {busyAction === "png" ? "Generando PNG…" : "Descargar PNG"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || codes.length < 3}
        onClick={() => void exportPdf()}
        className="gap-2 border-[#d4cdc3] bg-[#faf8f4] font-sans text-stone-600"
      >
        <FileText className="size-4" aria-hidden />
        {busyAction === "pdf" ? "Generando PDF…" : "Descargar PDF"}
      </Button>
      {canShare ? (
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => void shareWhatsApp()}
          className="gap-2 bg-[#25D366] font-sans text-white hover:bg-[#20bd5a]"
        >
          <WhatsAppIcon className="size-4 shrink-0" />
          {busyAction === "whatsapp" ? "Preparando PDF…" : "Enviar por WhatsApp"}
        </Button>
      ) : null}
    </div>
  )
}
