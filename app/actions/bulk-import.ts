"use server"

import { revalidatePath } from "next/cache"
import JSZip from "jszip"
import { createClient } from "@/lib/supabase/server"
import { classifyArtwork } from "@/lib/anthropic/services/artwork-classifier"
import { uploadBufferToCloudinary } from "@/lib/cloudinary/upload-server"
import { mimeFromFilename, parseArtworkFromZipPath } from "@/lib/import/zip-match"
import { BULK_IMPORT_MAX_ROWS } from "@/lib/constants"
import type { ArtworkCategory } from "@/types/artwork"
import type { ValidationSummary, ValidatedRow } from "@/types/import"

export interface BulkImportSkipped {
  code: string
  reason: string
}

export interface BulkImportResult {
  created: number
  skipped: BulkImportSkipped[]
}

function rowOk(r: ValidatedRow): boolean {
  return r.status !== "error"
}

async function zipImagesByCode(zipBuffer: ArrayBuffer): Promise<{
  buffers: Map<string, Buffer>
  mimes: Map<string, string>
}> {
  const zip = await JSZip.loadAsync(zipBuffer)
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir)

  /** Mejor archivo por código: menor sortKey gana (E-001.jpg antes que E-001-2.jpg). */
  const best = new Map<string, { sortKey: number; path: string }>()
  for (const path of paths) {
    if (!/\.(jpe?g|png|webp)$/i.test(path)) continue
    const parsed = parseArtworkFromZipPath(path)
    if (!parsed) continue
    const prev = best.get(parsed.code)
    if (prev && parsed.sortKey > prev.sortKey) continue
    if (prev && parsed.sortKey === prev.sortKey) continue
    best.set(parsed.code, { sortKey: parsed.sortKey, path })
  }

  const buffers = new Map<string, Buffer>()
  const mimes = new Map<string, string>()
  for (const [code, { path }] of best) {
    const entry = zip.file(path)
    if (!entry) continue
    const buf = await entry.async("nodebuffer")
    buffers.set(code, Buffer.from(buf))
    mimes.set(code, mimeFromFilename(path))
  }
  return { buffers, mimes }
}

/**
 * Recibe Excel ya validado (JSON) + ZIP con fotos por código.
 * Nombres válidos: `E-001.jpg` o varias por obra `E-001-1.jpg`, `E-001-2.jpg` (se usa la de menor sufijo / sin sufijo si existe).
 * Crea obras en estado `draft`, sube una imagen principal a Cloudinary y enriquece con classifyArtwork.
 */
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

  const rows = summary.rows.filter(rowOk)
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

  const codes = rows.map((r) => r.data.code)
  const { data: existingRows } = await supabase.from("artworks").select("code").in("code", codes)
  const existingCodes = new Set((existingRows ?? []).map((r) => r.code))

  const skipped: BulkImportSkipped[] = []
  let created = 0

  for (const row of rows) {
    const code = row.data.code
    if (existingCodes.has(code)) {
      skipped.push({ code, reason: "Ya existe en la base de datos" })
      continue
    }
    const imgBuf = imageMap.get(code)
    if (!imgBuf) {
      skipped.push({
        code,
        reason:
          "Sin imagen en el ZIP (usa E-001.jpg o E-001-1.jpg, mismo código que en Excel)",
      })
      continue
    }

    const category = row.data.category as ArtworkCategory
    const hasFrame = row.data.has_frame === "si"
    const mime = mimeMap.get(code) ?? "image/jpeg"

    let cloudinaryUrl: string
    let cloudinaryPublicId: string
    let imgWidth: number | null = null
    let imgHeight: number | null = null
    try {
      const up = await uploadBufferToCloudinary(imgBuf, mime, code, 0)
      cloudinaryUrl = up.cloudinary_url
      cloudinaryPublicId = up.cloudinary_public_id
      imgWidth = up.width
      imgHeight = up.height
    } catch (e) {
      skipped.push({
        code,
        reason: e instanceof Error ? e.message.slice(0, 120) : "Error al subir imagen",
      })
      continue
    }

    let subcategory: string | null = row.data.subcategory || null
    let frameColor: string | null = row.data.frame_color || null
    let aiHint = false

    try {
      const cls = await classifyArtwork(cloudinaryUrl)
      aiHint = true
      if (!subcategory && cls.subcategory) subcategory = cls.subcategory
      if (!frameColor && cls.frame_color) frameColor = cls.frame_color
    } catch {
      // Continúa solo con datos del Excel
    }

    const price = row.data.price
    const showPrice = price != null && price > 0

    const { data: artwork, error: insErr } = await supabase
      .from("artworks")
      .insert({
        code,
        title: `Importación ${code}`,
        description: null,
        category,
        subcategory,
        technique: row.data.technique,
        width_cm: row.data.width_cm,
        height_cm: row.data.height_cm,
        has_frame: hasFrame,
        frame_material: row.data.frame_material || null,
        frame_color: frameColor,
        price: price ?? null,
        original_price: null,
        cost: row.data.cost,
        show_price: showPrice,
        status: "draft",
        location_in_storage: row.data.location_in_storage || null,
        admin_notes: row.data.admin_notes || null,
        ai_generated: aiHint,
        manually_edited: false,
        tags: null,
        published_at: null,
      })
      .select("id")
      .single()

    if (insErr || !artwork) {
      skipped.push({ code, reason: insErr?.message ?? "Error al crear obra" })
      continue
    }

    const { error: imgErr } = await supabase.from("artwork_images").insert({
      artwork_id: artwork.id,
      cloudinary_url: cloudinaryUrl,
      cloudinary_public_id: cloudinaryPublicId,
      width: imgWidth,
      height: imgHeight,
      position: 0,
      is_primary: true,
      alt_text: code,
    })

    if (imgErr) {
      await supabase.from("artworks").delete().eq("id", artwork.id)
      skipped.push({ code, reason: "Error al guardar imagen en la obra" })
      continue
    }

    existingCodes.add(code)
    created += 1
  }

  revalidatePath("/admin/obras")
  revalidatePath("/admin/obras/importar/revision")

  return { ok: true, result: { created, skipped } }
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
