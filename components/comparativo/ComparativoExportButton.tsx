"use client"

import { useCallback, useState } from "react"
import { Download } from "lucide-react"
import { toPng } from "html-to-image"
import { Button } from "@/components/ui/button"

interface ComparativoExportButtonProps {
  boardId: string
  filename?: string
}

export default function ComparativoExportButton({
  boardId,
  filename = "atelier430-comparativo.png",
}: ComparativoExportButtonProps) {
  const [busy, setBusy] = useState(false)

  const exportPng = useCallback(async () => {
    const node = document.getElementById(boardId)
    if (!node) return
    setBusy(true)
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#f5f2eb",
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = filename
      a.click()
    } catch {
      /* ignore */
    } finally {
      setBusy(false)
    }
  }, [boardId, filename])

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() => void exportPng()}
      className="gap-2 border-stone-300 bg-white"
    >
      <Download className="size-4" aria-hidden />
      {busy ? "Generando PNG…" : "Descargar PNG"}
    </Button>
  )
}
