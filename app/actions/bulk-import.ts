"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  filterValidRows,
  runBulkImportCore,
  zipImagesByCode,
  type BulkImportResult,
  type BulkImportSkipped,
} from "@/lib/import/bulk-import-core"
import { BULK_IMPORT_MAX_ROWS } from "@/lib/constants"
import type { ValidationSummary } from "@/types/import"

export type { BulkImportResult, BulkImportSkipped }

export async function runBulkImport(
  formData: FormData
): Promise<{ ok: true; result: BulkImportResult } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const zipFile = formData.get("zip")
  const payloadRaw = formData.get("payload")
  if (!(zipFile instanceof File)) return { error: "Falta el archivo ZIP" }
  if (typeof payloadRaw !== "string") return { error: "Faltan datos de validación" }

  let summary: ValidationSummary
  try {
    summary = JSON.parse(payloadRaw) as ValidationSummary
  } catch {
    return { error: "Payload inválido" }
  }

  const rows = filterValidRows(summary)
  if (rows.length === 0) return { error: "No hay filas válidas para importar" }
  if (rows.length > BULK_IMPORT_MAX_ROWS) {
    return {
      error: `Máximo ${BULK_IMPORT_MAX_ROWS} obras por lote. Divide tu archivo o reduce filas.`,
    }
  }

  const zipBuffer = await zipFile.arrayBuffer()
  let imageMap: Map<string, Buffer>
  let mimeMap: Map<string, string>
  try {
    const z = await zipImagesByCode(zipBuffer)
    imageMap = z.buffers
    mimeMap = z.mimes
  } catch {
    return { error: "No se pudo leer el ZIP. Comprueba que sea un .zip válido." }
  }

  const result = await runBulkImportCore(supabase, {
    rows,
    imageMap,
    mimeMap,
  })

  revalidatePath("/admin/obras")
  revalidatePath("/admin/obras/importar/revision")

  return { ok: true, result }
}

export async function bulkPublishDrafts(
  artworkIds: string[]
): Promise<{ published: number } | { error: string }> {
  if (artworkIds.length === 0) return { error: "Selecciona al menos una obra" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("artworks")
    .update({
      status: "available",
      published_at: now,
    })
    .eq("status", "draft")
    .in("id", artworkIds)
    .select("id")

  if (error) return { error: error.message }

  revalidatePath("/admin/obras")
  revalidatePath("/admin/obras/importar/revision")

  return { published: data?.length ?? 0 }
}
