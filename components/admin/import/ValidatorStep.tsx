"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  RotateCcw,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { validateImportFile } from "@/app/actions/import"
import type { ValidationSummary, ValidatedRow } from "@/types/import"

interface ValidatorStepProps {
  onValidated: (summary: ValidationSummary) => void
  validationResult: ValidationSummary | null
  onContinueToImages?: (summary: ValidationSummary) => void
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: "neutral" | "success" | "error" | "warning"
}) {
  const styles = {
    neutral: "bg-stone-50 border-stone-200 text-carbon-900",
    success: "bg-green-50 border-green-200 text-green-800",
    error:   "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  }
  return (
    <div className={cn("rounded-lg border p-4 text-center", styles[variant])}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-75">{label}</p>
    </div>
  )
}

// ─── Row status icon ─────────────────────────────────────────────────────────

function RowStatusIcon({ status }: { status: ValidatedRow["status"] }) {
  if (status === "valid")   return <CheckCircle2   size={15} className="text-green-500 flex-shrink-0" />
  if (status === "error")   return <XCircle        size={15} className="text-red-500 flex-shrink-0" />
  return                           <AlertTriangle  size={15} className="text-amber-500 flex-shrink-0" />
}

// ─── Results table ────────────────────────────────────────────────────────────

function ResultsTable({ rows }: { rows: ValidatedRow[] }) {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)

  const filtered = showOnlyErrors
    ? rows.filter((r) => r.status !== "valid")
    : rows

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-carbon-900">
          Detalle por fila
          <span className="text-stone-400 font-normal ml-1">({filtered.length} de {rows.length})</span>
        </p>
        <button
          type="button"
          onClick={() => setShowOnlyErrors((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors",
            showOnlyErrors
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-700"
          )}
        >
          <Filter size={11} />
          {showOnlyErrors ? "Ver todas" : "Solo errores/warnings"}
        </button>
      </div>

      <div className="rounded-lg border border-stone-200 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[48px_110px_110px_110px_1fr] gap-0 bg-stone-50 border-b border-stone-200">
          {["Fila", "Código", "Categoría", "Técnica", "Mensaje"].map((h) => (
            <div key={h} className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">
              {h}
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-stone-400">
              No hay filas que mostrar
            </div>
          )}
          {filtered.map((row) => {
            const rowBg =
              row.status === "valid"   ? "" :
              row.status === "error"   ? "bg-red-50/60" :
              "bg-amber-50/60"

            const messages = [...row.errors, ...row.warnings]

            return (
              <div
                key={row.rowIndex}
                className={cn(
                  "grid grid-cols-[48px_110px_110px_110px_1fr] gap-0 items-start text-sm",
                  rowBg
                )}
              >
                <div className="px-3 py-2.5 text-stone-400 text-xs font-mono">{row.rowIndex}</div>
                <div className="px-3 py-2.5 font-mono text-xs text-carbon-900 truncate">
                  {row.data.code || <span className="text-stone-300 italic">vacío</span>}
                </div>
                <div className="px-3 py-2.5 text-xs text-stone-600 truncate capitalize">
                  {row.data.category || "—"}
                </div>
                <div className="px-3 py-2.5 text-xs text-stone-600 truncate">
                  {row.data.technique || "—"}
                </div>
                <div className="px-3 py-2.5">
                  {messages.length === 0 ? (
                    <span className="flex items-center gap-1.5 text-green-600 text-xs">
                      <RowStatusIcon status="valid" />
                      Válida
                    </span>
                  ) : (
                    <ul className="space-y-0.5">
                      {messages.map((msg, mi) => (
                        <li key={mi} className="flex items-start gap-1.5 text-xs">
                          <RowStatusIcon status={row.status} />
                          <span className={row.status === "error" ? "text-red-700" : "text-amber-700"}>
                            {msg}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ValidatorStep({
  onValidated,
  validationResult,
  onContinueToImages,
}: ValidatorStepProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName]         = useState<string | null>(null)
  const [globalError, setGlobalError]   = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setGlobalError(null)
    setIsProcessing(true)

    try {
      const fd = new FormData()
      fd.append("file", file)
      const result = await validateImportFile(fd)

      if ("error" in result) {
        setGlobalError(result.error)
      } else {
        onValidated(result.summary)
      }
    } catch {
      setGlobalError("Error inesperado al procesar el archivo. Intenta de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }, [onValidated])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: isProcessing,
    onDrop: (accepted) => {
      if (accepted[0]) handleFile(accepted[0])
    },
  })

  const reset = () => {
    setFileName(null)
    setGlobalError(null)
    onValidated({ total: 0, valid: 0, withErrors: 0, withWarnings: 0, rows: [] })
  }

  const hasResults = validationResult !== null && validationResult.total > 0
  const isClean    = hasResults && validationResult.withErrors === 0

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-white p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-carbon-900 text-lg">Paso 2: Subir y validar Excel</h2>
            <p className="text-sm text-stone-500 mt-1">
              Sube el archivo que llenaste en el Paso 1. Revisaremos cada fila antes de importar.
            </p>
          </div>
          {hasResults && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 shrink-0"
            >
              <RotateCcw size={13} />
              Subir otro archivo
            </button>
          )}
        </div>

        {/* Drop zone */}
        {!hasResults && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-gold-500 bg-amber-50"
                : isProcessing
                ? "border-stone-200 bg-stone-50 cursor-default"
                : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
            )}
          >
            <input {...getInputProps()} />
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={36} className="animate-spin text-stone-300" />
                <div>
                  <p className="font-medium text-carbon-900">Validando {fileName}…</p>
                  <p className="text-sm text-stone-400 mt-0.5">Revisando estructura y datos</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center">
                  <Upload size={24} className="text-stone-400" />
                </div>
                <div>
                  <p className="font-medium text-carbon-900">
                    {isDragActive ? "Suelta el archivo aquí" : "Arrastra tu Excel aquí"}
                  </p>
                  <p className="text-sm text-stone-400 mt-0.5">
                    o haz click para seleccionar · Acepta .xlsx y .csv
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global error */}
        {globalError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">No se pudo procesar el archivo</p>
              <p className="text-sm text-red-700 mt-0.5">{globalError}</p>
              <button
                type="button"
                onClick={() => setGlobalError(null)}
                className="text-xs text-red-600 underline underline-offset-2 mt-1.5"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}

        {/* Results summary */}
        {hasResults && (
          <div className="space-y-5">
            {/* Summary name */}
            {fileName && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <FileSpreadsheet size={16} className="text-stone-400" />
                <span className="font-mono text-xs">{fileName}</span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Total filas"  value={validationResult.total}        variant="neutral" />
              <StatCard label="Válidas"       value={validationResult.valid}        variant="success" />
              <StatCard label="Con errores"   value={validationResult.withErrors}   variant={validationResult.withErrors > 0 ? "error" : "success"} />
              <StatCard label="Advertencias"  value={validationResult.withWarnings} variant={validationResult.withWarnings > 0 ? "warning" : "neutral"} />
            </div>

            {/* Status banner */}
            {isClean ? (
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    {validationResult.withWarnings > 0
                      ? `Listo para importar — ${validationResult.withWarnings} advertencia${validationResult.withWarnings > 1 ? "s" : ""} (no bloquean)`
                      : "Archivo válido — listo para el Paso 3"}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {validationResult.valid} obra{validationResult.valid > 1 ? "s" : ""} correctamente definida{validationResult.valid > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <XCircle size={20} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    {validationResult.withErrors} fila{validationResult.withErrors > 1 ? "s" : ""} con errores — corrige tu Excel y vuelve a subir
                  </p>
                  <p className="text-xs text-red-700 mt-0.5">
                    Revisa el detalle de errores abajo. Los errores impiden la importación.
                  </p>
                </div>
              </div>
            )}

            {/* Rows table */}
            <ResultsTable rows={validationResult.rows} />
          </div>
        )}
      </div>

      {/* CTA */}
      {hasResults && (
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!isClean || !validationResult}
            onClick={() => {
              if (isClean && validationResult) onContinueToImages?.(validationResult)
            }}
            className={cn(
              "gap-2",
              isClean
                ? "bg-gold-500 hover:bg-gold-400 text-white font-semibold"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            )}
            title={!isClean ? "Corrige los errores primero" : undefined}
          >
            <FileSpreadsheet size={15} />
            Continuar al Paso 3
          </Button>
        </div>
      )}
    </div>
  )
}
