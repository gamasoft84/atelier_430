"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import Link from "next/link"
import { Archive, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { runBulkImport } from "@/app/actions/bulk-import"
import { BULK_IMPORT_MAX_ROWS } from "@/lib/constants"
import type { ValidationSummary } from "@/types/import"
import { toast } from "sonner"

interface ZipImportStepProps {
  summary: ValidationSummary
  onBack: () => void
}

export default function ZipImportStep({ summary, onBack }: ZipImportStepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<{
    created: number
    skipped: { code: string; reason: string }[]
  } | null>(null)

  const validRows = summary.rows.filter((r) => r.status !== "error")
  const processZip = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (validRows.length > BULK_IMPORT_MAX_ROWS) {
        toast.error(`Máximo ${BULK_IMPORT_MAX_ROWS} filas por lote`)
        return
      }
      setFileName(file.name)
      setIsUploading(true)
      setResult(null)
      try {
        const fd = new FormData()
        fd.append("zip", file)
        fd.append("payload", JSON.stringify(summary))
        const res = await runBulkImport(fd)
        if ("error" in res) {
          toast.error(res.error)
        } else {
          setResult(res.result)
          toast.success(
            res.result.created > 0
              ? `Se crearon ${res.result.created} borrador${res.result.created > 1 ? "es" : ""}`
              : "Ninguna obra nueva"
          )
        }
      } catch {
        toast.error("Error al procesar la importación")
      } finally {
        setIsUploading(false)
      }
    },
    [summary, validRows.length]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/zip": [".zip"], "application/x-zip-compressed": [".zip"] },
    maxFiles: 1,
    disabled: isUploading || result !== null,
    onDrop: (accepted) => {
      if (accepted[0]) void processZip(accepted)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-carbon-900"
        >
          <ArrowLeft size={16} />
          Volver al Excel
        </button>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-8 space-y-6">
        <div>
          <h2 className="font-semibold text-carbon-900 text-lg">Paso 3: ZIP de imágenes</h2>
          <p className="text-sm text-stone-500 mt-1">
            Un .zip con una imagen principal por código (o varias por obra). Ejemplos:{" "}
            <span className="font-mono text-xs bg-stone-100 px-1 rounded">E-001.jpg</span>,{" "}
            <span className="font-mono text-xs bg-stone-100 px-1 rounded">E-001-1.jpg</span>,{" "}
            <span className="font-mono text-xs bg-stone-100 px-1 rounded">N-042.png</span>.
            Máximo <strong>{BULK_IMPORT_MAX_ROWS}</strong> obras por lote. Listas válidas:{" "}
            <strong>{validRows.length}</strong>.
          </p>
        </div>

        {!result && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-gold-500 bg-amber-50"
                : isUploading
                ? "border-stone-200 bg-stone-50 cursor-default"
                : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={36} className="animate-spin text-gold-500" />
                <div>
                  <p className="font-medium text-carbon-900">Importando {fileName}…</p>
                  <p className="text-sm text-stone-400 mt-0.5">
                    Subiendo a Cloudinary y clasificando con IA (puede tardar varios minutos)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center">
                  <Archive size={26} className="text-stone-400" />
                </div>
                <div>
                  <p className="font-medium text-carbon-900">
                    {isDragActive ? "Suelta el ZIP aquí" : "Arrastra el ZIP o haz click"}
                  </p>
                  <p className="text-sm text-stone-400 mt-0.5">Solo archivos .zip</p>
                </div>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 size={22} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Importación terminada: {result.created} borrador{result.created !== 1 ? "es" : ""}{" "}
                  creado{result.created !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-green-800 mt-1">
                  {result.skipped.length > 0
                    ? `${result.skipped.length} código${result.skipped.length > 1 ? "s" : ""} omitido${result.skipped.length > 1 ? "s" : ""} (ver abajo)`
                    : "Todas las filas con imagen se procesaron."}
                </p>
              </div>
            </div>

            {result.skipped.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex items-center gap-2 text-amber-900 font-medium text-sm mb-2">
                  <AlertTriangle size={16} />
                  Omitidos ({result.skipped.length})
                </div>
                <ul className="text-xs text-amber-900 space-y-1 max-h-40 overflow-y-auto font-mono">
                  {result.skipped.map((s) => (
                    <li key={s.code}>
                      {s.code}: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-gold-500 hover:bg-gold-400 text-white gap-2">
                <Link href="/admin/obras/importar/revision">
                  Revisar y publicar borradores
                  <ExternalLink size={14} />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/obras">Ir al listado de obras</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
