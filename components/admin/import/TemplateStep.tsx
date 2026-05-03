"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface TemplateStepProps {
  onDownloaded: () => void
}

export default function TemplateStep({ onDownloaded }: TemplateStepProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch("/api/template/excel")
      if (!res.ok) throw new Error("Error al generar la plantilla")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "Atelier430_Plantilla_Carga_Masiva.xlsx"
      a.click()
      URL.revokeObjectURL(url)
      onDownloaded()
    } catch {
      // placeholder
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-8 space-y-6">
      <div>
        <h2 className="font-semibold text-carbon-900 text-lg">Paso 1: Descargar plantilla</h2>
        <p className="text-sm text-stone-500 mt-1">
          Descarga el archivo Excel y llénalo offline con los datos de tus obras.
          Incluye validaciones, ejemplos y dropdowns para facilitar la captura.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        {[
          { label: "3 hojas",          desc: "Obras · Instrucciones · Resumen" },
          { label: "13 columnas",       desc: "Con validaciones y dropdowns" },
          { label: "Lotes de 60 obras", desc: "Máximo por ZIP + IA (repite si hace falta)" },
        ].map(({ label, desc }) => (
          <div key={label} className="rounded-lg border border-stone-100 bg-stone-50 p-3">
            <p className="font-semibold text-carbon-900">{label}</p>
            <p className="text-stone-400 text-xs mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="gap-2 bg-carbon-900 hover:bg-carbon-800 text-white"
        >
          {isDownloading ? (
            <><Loader2 size={15} className="animate-spin" />Generando...</>
          ) : (
            <><Download size={15} />Descargar plantilla Excel</>
          )}
        </Button>
        <button
          type="button"
          onClick={onDownloaded}
          className="text-sm text-stone-400 hover:text-stone-600 underline underline-offset-2"
        >
          Ya tengo la plantilla, continuar
        </button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium">Convención de códigos</p>
        <ul className="mt-1.5 space-y-0.5 text-amber-700">
          <li><span className="font-mono font-medium">R-001, R-002…</span> — Obras religiosas</li>
          <li><span className="font-mono font-medium">N-001, N-002…</span> — Obras nacionales</li>
          <li><span className="font-mono font-medium">E-001, E-002…</span> — Obras europeas</li>
          <li><span className="font-mono font-medium">M-001, M-002…</span> — Obras modernas</li>
        </ul>
        <p className="mt-2 text-amber-600">
          Guarda las fotos con el mismo código: <span className="font-mono">R-001-1.jpg</span>, <span className="font-mono">R-001-2.jpg</span>…
          (para el Paso 3 en Sesión 2)
        </p>
      </div>
    </div>
  )
}
