"use client"

import { useCallback, useState } from "react"
import { Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportComparativoBoardPng } from "@/lib/comparativo/export-png"

interface ComparativoExportButtonProps {
  boardId: string
  codes: string[]
  filename?: string
}

export default function ComparativoExportButton({
  boardId,
  codes,
  filename = "atelier430-comparativo.png",
}: ComparativoExportButtonProps) {
  const [busy, setBusy] = useState(false)

  const pdfFilename = filename.replace(/\.png$/i, ".pdf")
  const pdfHref = `/api/comparativo/pdf?obras=${encodeURIComponent(codes.join(","))}`

  const exportPng = useCallback(async () => {
    setBusy(true)
    try {
      const dataUrl = await exportComparativoBoardPng(boardId)
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      /* ignore */
    } finally {
      setBusy(false)
    }
  }, [boardId, filename])

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
        {busy ? "Generando PNG…" : "Descargar PNG"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || codes.length < 3}
        asChild
        className="gap-2 border-[#d4cdc3] bg-[#faf8f4] font-sans text-stone-600"
      >
        <a href={pdfHref} download={pdfFilename} target="_blank" rel="noopener noreferrer">
          <FileText className="size-4" aria-hidden />
          Descargar PDF
        </a>
      </Button>
    </div>
  )
}
