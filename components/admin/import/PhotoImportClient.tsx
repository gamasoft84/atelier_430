"use client"

import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import { Upload, CheckCircle2, XCircle, ImagePlus, ArrowRight, Loader2 } from "lucide-react"
import { processOnePhoto } from "@/app/actions/photo-import"
import type { PhotoImportResult } from "@/app/actions/photo-import"

const MAX_FILES   = 50
const BATCH_SIZE  = 4  // parallel requests to avoid rate-limiting Claude

interface FileResult {
  name: string
  result: PhotoImportResult | null  // null = processing
}

type Status = "idle" | "processing" | "done"

export default function PhotoImportClient() {
  const router = useRouter()
  const [status, setStatus]   = useState<Status>("idle")
  const [files, setFiles]     = useState<File[]>([])
  const [results, setResults] = useState<FileResult[]>([])
  const aborted = useRef(false)

  // ─── Drop zone ───────────────────────────────────────────────────────────

  const onDrop = useCallback((accepted: File[]) => {
    const valid = accepted.slice(0, MAX_FILES)
    setFiles(valid)
    setResults([])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: MAX_FILES,
    disabled: status === "processing",
  })

  // ─── Processing ──────────────────────────────────────────────────────────

  const addResult = (name: string, result: PhotoImportResult) =>
    setResults((prev) =>
      prev.map((r) => (r.name === name ? { name, result } : r))
    )

  const processFile = async (file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    const result = await processOnePhoto(fd)
    addResult(file.name, result)
  }

  const start = async () => {
    if (files.length === 0) return
    aborted.current = false
    setStatus("processing")
    setResults(files.map((f) => ({ name: f.name, result: null })))

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      if (aborted.current) break
      const batch = files.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(processFile))
    }

    setStatus("done")
  }

  // ─── Derived stats ───────────────────────────────────────────────────────

  const done      = results.filter((r) => r.result !== null).length
  const created   = results.filter((r) => r.result?.ok === true).length
  const errors    = results.filter((r) => r.result?.ok === false).length
  const total     = files.length
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0

  // ─── Reset ───────────────────────────────────────────────────────────────

  const reset = () => {
    setStatus("idle")
    setFiles([])
    setResults([])
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Drop zone */}
      {status === "idle" && (
        <>
          <div
            {...getRootProps()}
            className={[
              "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-gold-500 bg-gold-50"
                : "border-stone-200 hover:border-stone-300 bg-white",
            ].join(" ")}
          >
            <input {...getInputProps()} />
            <ImagePlus className="mx-auto mb-3 text-stone-300" size={40} />
            <p className="text-sm font-medium text-carbon-900">
              {isDragActive ? "Suelta las fotos aquí" : "Arrastra tus fotos aquí"}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              JPG, PNG o WebP · Hasta {MAX_FILES} fotos por lote
            </p>
          </div>

          {files.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-carbon-900">
                  {files.length} {files.length === 1 ? "foto seleccionada" : "fotos seleccionadas"}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Limpiar
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {files.map((f) => (
                  <span
                    key={f.name}
                    className="px-2 py-0.5 rounded bg-stone-100 text-xs text-stone-600 truncate max-w-[140px]"
                  >
                    {f.name}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={start}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gold-500 text-white text-sm font-semibold hover:bg-gold-400 transition-colors"
              >
                <Upload size={15} />
                Procesar {files.length} {files.length === 1 ? "foto" : "fotos"} con IA
              </button>
            </div>
          )}
        </>
      )}

      {/* Processing / Done */}
      {(status === "processing" || status === "done") && (
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-carbon-900">
                {status === "processing" ? "Procesando…" : "Listo"}
              </span>
              <span className="text-stone-500">
                {done} / {total}
              </span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-stone-50 text-xs"
              >
                {r.result === null ? (
                  <Loader2 size={14} className="text-stone-400 animate-spin flex-shrink-0" />
                ) : r.result.ok ? (
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle size={14} className="text-red-400 flex-shrink-0" />
                )}

                <span className="text-stone-500 truncate flex-1">{r.name}</span>

                {r.result?.ok === true && (
                  <span className="font-mono text-stone-400 flex-shrink-0">{r.result.code}</span>
                )}
                {r.result?.ok === false && (
                  <span className="text-red-400 truncate max-w-[180px]">{r.result.error}</span>
                )}
              </div>
            ))}
          </div>

          {/* Summary + actions */}
          {status === "done" && (
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <p className="text-sm text-stone-600">
                <span className="text-green-600 font-semibold">{created} creadas</span>
                {errors > 0 && (
                  <span className="text-red-500 font-semibold ml-3">{errors} con error</span>
                )}
              </p>
              <div className="flex gap-3">
                {created > 0 && (
                  <button
                    type="button"
                    onClick={() => router.push("/admin/obras/importar/revision")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-white text-sm font-semibold hover:bg-gold-400 transition-colors"
                  >
                    Revisar borradores
                    <ArrowRight size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Nueva carga
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
