import JSZip from "jszip"
import { generateArtworkContent } from "@/lib/anthropic/generate"
import { classifyArtwork } from "@/lib/anthropic/services/artwork-classifier"
import { uploadBufferToCloudinary } from "@/lib/cloudinary/upload-server"
import { mimeFromFilename, parseArtworkFromZipPath } from "@/lib/import/zip-match"
import type { ArtworkCategory } from "@/types/artwork"
import type { ValidationSummary, ValidatedRow } from "@/types/import"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export interface BulkImportSkipped {
  code: string
  reason: string
}

export interface BulkImportResult {
  created: number
  skipped: BulkImportSkipped[]
}

export interface BulkImportRowProgress {
  index: number
  total: number
  code: string
  outcome: "created" | "skipped"
  skipReason?: string
}

function rowOk(r: ValidatedRow): boolean {
  return r.status !== "error"
}

export async function zipImagesByCode(zipBuffer: ArrayBuffer): Promise<{
  buffers: Map<string, Buffer>
  mimes: Map<string, string>
}> {
  const zip = await JSZip.loadAsync(zipBuffer)
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir)

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

type DbClient = SupabaseClient<Database>

/**
 * Procesa todas las filas; opcionalmente notifica tras cada fila (para barra de progreso).
 */
export async function runBulkImportCore(
  supabase: DbClient,
  params: {
    rows: ValidatedRow[]
    imageMap: Map<string, Buffer>
    mimeMap: Map<string, string>
    onRowDone?: (p: BulkImportRowProgress) => void
  }
): Promise<BulkImportResult> {
  const { rows, imageMap, mimeMap, onRowDone } = params
  const total = rows.length

  const codes = rows.map((r) => r.data.code)
  const { data: existingRows } = await supabase.from("artworks").select("code").in("code", codes)
  const existingCodes = new Set((existingRows ?? []).map((r) => r.code))

  const skipped: BulkImportSkipped[] = []
  let created = 0
  let index = 0

  const notify = (code: string, outcome: "created" | "skipped", skipReason?: string) => {
    onRowDone?.({
      index,
      total,
      code,
      outcome,
      skipReason,
    })
  }

  for (const row of rows) {
    index += 1
    const code = row.data.code

    if (existingCodes.has(code)) {
      skipped.push({ code, reason: "Ya existe en la base de datos" })
      notify(code, "skipped", "Ya existe en la base de datos")
      continue
    }

    const imgBuf = imageMap.get(code)
    if (!imgBuf) {
      const reason =
        "Sin imagen en el ZIP (usa E-001.jpg o E-001-1.jpg, mismo código que en Excel)"
      skipped.push({ code, reason })
      notify(code, "skipped", reason)
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
      const reason = e instanceof Error ? e.message.slice(0, 120) : "Error al subir imagen"
      skipped.push({ code, reason })
      notify(code, "skipped", reason)
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
      // ok
    }

    let title = `Importación ${code}`
    let description: string | null = null
    let tags: string[] | null = null
    let contentFromAi = false

    try {
      const content = await generateArtworkContent({
        image_url: cloudinaryUrl,
        category: row.data.category,
        subcategory: subcategory ?? undefined,
        technique: row.data.technique,
        width_cm: row.data.width_cm ?? undefined,
        height_cm: row.data.height_cm ?? undefined,
        has_frame: hasFrame,
        frame_material: row.data.frame_material || undefined,
        frame_color: frameColor ?? undefined,
        cost: row.data.cost ?? undefined,
      })
      const t = content.title?.trim()
      if (t) title = t
      const d = content.description?.trim()
      if (d) description = d
      if (content.tags?.length) tags = content.tags
      if (!row.data.subcategory && content.subcategory?.trim()) {
        subcategory = content.subcategory.trim()
      }
      contentFromAi = true
    } catch {
      // ok
    }

    const price = row.data.price
    const showPrice = price != null && price > 0

    const { data: artwork, error: insErr } = await supabase
      .from("artworks")
      .insert({
        code,
        title,
        description,
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
        ai_generated: aiHint || contentFromAi,
        manually_edited: false,
        tags,
        published_at: null,
      })
      .select("id")
      .single()

    if (insErr || !artwork) {
      const reason = insErr?.message ?? "Error al crear obra"
      skipped.push({ code, reason })
      notify(code, "skipped", reason)
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
      alt_text: title.length > 64 ? title.slice(0, 61) + "…" : title,
    })

    if (imgErr) {
      await supabase.from("artworks").delete().eq("id", artwork.id)
      const reason = "Error al guardar imagen en la obra"
      skipped.push({ code, reason })
      notify(code, "skipped", reason)
      continue
    }

    existingCodes.add(code)
    created += 1
    notify(code, "created")
  }

  return { created, skipped }
}

export function filterValidRows(summary: ValidationSummary): ValidatedRow[] {
  return summary.rows.filter(rowOk)
}
