"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import Link from "next/link"
import { Archive, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BulkImportResult } from "@/app/actions/bulk-import"
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
  const [uploadPhase, setUploadPhase] = useState<"uploading" | "processing">("uploading")
  const [progressTotal, setProgressTotal] = useState(0)
  const [progressIndex, setProgressIndex] = useState(0)
  const [progressCode, setProgressCode] = useState<string | null>(null)
  const [progressOutcome, setProgressOutcome] = useState<"created" | "skipped" | null>(null)
  const [progressSkipReason, setProgressSkipReason] = useState<string | null>(null)
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
      setUploadPhase("uploading")
      setProgressTotal(0)
      setProgressIndex(0)
      setProgressCode(null)
      setProgressOutcome(null)
      setProgressSkipReason(null)
      setResult(null)
      try {
        const fd = new FormData()
        fd.append("zip", file)
        fd.append("payload", JSON.stringify(summary))

        const res = await fetch("/api/admin/bulk-import", {
          method: "POST",
          body: fd,
          credentials: "same-origin",
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => null) as { error?: string } | null
          toast.error(errBody?.error ?? `Error HTTP ${res.status}`)
          return
        }

        setUploadPhase("processing")
        setProgressTotal(validRows.length)

        const reader = res.body?.getReader()
        if (!reader) {
          toast.error("No se pudo leer la respuesta del servidor")
          return
        }

        const decoder = new TextDecoder()
        let buf = ""
        let finalResult: BulkImportResult | null = null

        while (true) {
          const { done, value } = await reader.read()
          buf += decoder.decode(value, { stream: !done })
          const lines = buf.split("\n")
          buf = lines.pop() ?? ""
          for (const line of lines) {
            const t = line.trim()
            if (!t) continue
            let msg: Record<string, unknown>
            try {
              msg = JSON.parse(t) as Record<string, unknown>
            } catch {
              continue
            }
            const typ = msg.type as string
            if (typ === "start") {
              setProgressTotal(typeof msg.total === "number" ? msg.total : validRows.length)
            }
            if (typ === "progress") {
              setProgressIndex(typeof msg.index === "number" ? msg.index : 0)
              setProgressTotal(typeof msg.total === "number" ? msg.total : validRows.length)
              setProgressCode(typeof msg.code === "string" ? msg.code : null)
              setProgressOutcome(
                msg.outcome === "created" || msg.outcome === "skipped" ? msg.outcome : null
              )
              setProgressSkipReason(typeof msg.skipReason === "string" ? msg.skipReason : null)
            }
            if (typ === "done") {
              finalResult = msg.result as BulkImportResult
            }
            if (typ === "error") {
              throw new Error(typeof msg.message === "string" ? msg.message : "Error al importar")
            }
          }
          if (done) break
        }

        const tail = buf.trim()
        if (tail) {
          try {
            const msg = JSON.parse(tail) as Record<string, unknown>
            if (msg.type === "done" && msg.result) finalResult = msg.result as BulkImportResult
          } catch {
            /* ignore */
          }
        }

        if (finalResult) {
          setResult(finalResult)
          toast.success(
            finalResult.created > 0
              ? `Se crearon ${finalResult.created} borrador${finalResult.created > 1 ? "es" : ""}`
              : "Ninguna obra nueva"
          )
        } else {
          toast.error("La importación terminó sin resultado")
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al procesar la importación")
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
              <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
                <Loader2 size={36} className="animate-spin text-gold-500" />
                <div className="text-center w-full">
                  <p className="font-medium text-carbon-900">
                    {uploadPhase === "uploading"
                      ? `Subiendo ${fileName}…`
                      : "Procesando obras"}
                  </p>
                  {uploadPhase === "processing" && progressTotal > 0 && (
                    <>
                      <p className="text-sm text-stone-600 mt-2">
                        {progressIndex > 0 ? (
                          <>
                            Obra <strong>{progressIndex}</strong> de <strong>{progressTotal}</strong>
                            {progressCode && (
                              <>
                                {" "}
                                · <span className="font-mono">{progressCode}</span>
                                {progressOutcome === "created" && (
                                  <span className="text-green-700"> · creada</span>
                                )}
                                {progressOutcome === "skipped" && (
                                  <span className="text-amber-700"> · omitida</span>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          <>Listo para procesar <strong>{progressTotal}</strong> filas válidas</>
                        )}
                      </p>
                      {progressOutcome === "skipped" && progressSkipReason && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {progressSkipReason}
                        </p>
                      )}
                      <div className="mt-3 h-2 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className="h-full bg-gold-500 transition-[width] duration-300 ease-out"
                          style={{
                            width:
                              progressTotal > 0
                                ? `${Math.min(100, Math.round((progressIndex / progressTotal) * 100))}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <p className="text-xs text-stone-400 mt-2">
                        Cloudinary + IA por obra; puedes dejar esta pestaña abierta.
                      </p>
                    </>
                  )}
                  {uploadPhase === "uploading" && (
                    <p className="text-sm text-stone-400 mt-0.5">
                      Después se procesará cada obra con IA (varios minutos en lotes grandes).
                    </p>
                  )}
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
