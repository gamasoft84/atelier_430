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

export interface ZipImage {
  buffer: Buffer
  mime: string
  /** 0 = primary (is_primary = true), 1+ = additional */
  position: number
}

function rowOk(r: ValidatedRow): boolean {
  return r.status !== "error"
}

// ─── Build a map: code → all images sorted by position ────────────────────

export async function zipImagesByCode(zipBuffer: ArrayBuffer): Promise<{
  imagesByCode: Map<string, ZipImage[]>
}> {
  const zip = await JSZip.loadAsync(zipBuffer)
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir)

  // Collect every valid (code, sortKey, path) triple from the ZIP
  const all: { code: string; sortKey: number; path: string }[] = []
  for (const path of paths) {
    if (!/\.(jpe?g|png|webp)$/i.test(path)) continue
    const parsed = parseArtworkFromZipPath(path)
    if (!parsed) continue
    all.push({ code: parsed.code, sortKey: parsed.sortKey, path })
  }

  // Group by code
  const grouped = new Map<string, { sortKey: number; path: string }[]>()
  for (const item of all) {
    const arr = grouped.get(item.code) ?? []
    arr.push(item)
    grouped.set(item.code, arr)
  }

  // For each code: sort by sortKey, deduplicate same sortKey, read buffers
  const imagesByCode = new Map<string, ZipImage[]>()
  for (const [code, items] of grouped) {
    const sorted = items
      .sort((a, b) => a.sortKey - b.sortKey)
      .filter((item, idx, arr) => idx === 0 || item.sortKey !== arr[idx - 1].sortKey)

    const images: ZipImage[] = []
    for (let i = 0; i < sorted.length; i++) {
      const entry = zip.file(sorted[i].path)
      if (!entry) continue
      const buf = await entry.async("nodebuffer")
      images.push({
        buffer: Buffer.from(buf),
        mime:   mimeFromFilename(sorted[i].path),
        position: i,
      })
    }
    if (images.length > 0) imagesByCode.set(code, images)
  }

  return { imagesByCode }
}

type DbClient = SupabaseClient<Database>

/**
 * Procesa todas las filas; sube TODAS las imágenes por obra (del ZIP),
 * pero solo analiza con IA la imagen principal (position 0).
 */
export async function runBulkImportCore(
  supabase: DbClient,
  params: {
    rows:         ValidatedRow[]
    imagesByCode: Map<string, ZipImage[]>
    onRowDone?: (p: BulkImportRowProgress) => void
  }
): Promise<BulkImportResult> {
  const { rows, imagesByCode, onRowDone } = params
  const total = rows.length

  const codes = rows.map((r) => r.data.code)
  const { data: existingRows } = await supabase.from("artworks").select("code").in("code", codes)
  const existingCodes = new Set((existingRows ?? []).map((r) => r.code))

  const skipped: BulkImportSkipped[] = []
  let created = 0
  let index = 0

  const notify = (code: string, outcome: "created" | "skipped", skipReason?: string) => {
    onRowDone?.({ index, total, code, outcome, skipReason })
  }

  for (const row of rows) {
    index += 1
    const code = row.data.code

    if (existingCodes.has(code)) {
      skipped.push({ code, reason: "Ya existe en la base de datos" })
      notify(code, "skipped", "Ya existe en la base de datos")
      continue
    }

    const artworkImages = imagesByCode.get(code)
    if (!artworkImages || artworkImages.length === 0) {
      const reason = "Sin imagen en el ZIP (usa E-001.jpg o E-001-1.jpg, mismo código que en Excel)"
      skipped.push({ code, reason })
      notify(code, "skipped", reason)
      continue
    }

    const primary = artworkImages[0]
    const category = row.data.category as ArtworkCategory
    const hasFrame = row.data.has_frame === "si"

    // Upload primary image first (needed for AI analysis URL)
    let primaryUrl: string
    let primaryPublicId: string
    let primaryWidth: number | null = null
    let primaryHeight: number | null = null
    try {
      const up = await uploadBufferToCloudinary(primary.buffer, primary.mime, code, 0)
      primaryUrl       = up.cloudinary_url
      primaryPublicId  = up.cloudinary_public_id
      primaryWidth     = up.width
      primaryHeight    = up.height
    } catch (e) {
      const reason = e instanceof Error ? e.message.slice(0, 120) : "Error al subir imagen"
      skipped.push({ code, reason })
      notify(code, "skipped", reason)
      continue
    }

    // AI classification on primary image only
    let subcategory: string | null = row.data.subcategory || null
    let frameMaterial: string | null = row.data.frame_material || null
    let frameColor: string | null = row.data.frame_color || null
    let aiHint = false
    try {
      const cls = await classifyArtwork(primaryUrl)
      aiHint = true
      if (!subcategory && cls.subcategory) subcategory = cls.subcategory
      if (!frameMaterial && cls.frame_material) frameMaterial = cls.frame_material
      if (!frameColor && cls.frame_color)  frameColor  = cls.frame_color
    } catch {
      // ok — continue without AI classification
    }
    // Defaults seguros si tiene marco pero no se determinó material.
    if (hasFrame && !frameMaterial) {
      frameMaterial = row.data.category === "religiosa" ? "polirresina" : "madera"
    }

    // AI content generation from primary image
    let title = `Importación ${code}`
    let description: string | null = null
    let tags: string[] | null = null
    let contentFromAi = false
    try {
      const content = await generateArtworkContent({
        image_url:      primaryUrl,
        category:       row.data.category,
        subcategory:    subcategory ?? undefined,
        technique:      row.data.technique,
        width_cm:       row.data.width_cm ?? undefined,
        height_cm:      row.data.height_cm ?? undefined,
        has_frame:      hasFrame,
        frame_material: frameMaterial ?? undefined,
        frame_color:    frameColor ?? undefined,
        cost:           row.data.cost ?? undefined,
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
      // ok — continue with defaults
    }

    const price     = row.data.price
    const showPrice = price != null && price > 0

    const { data: artwork, error: insErr } = await supabase
      .from("artworks")
      .insert({
        code,
        stock_quantity: 1,
        title,
        description,
        category,
        subcategory,
        technique:           row.data.technique,
        width_cm:            row.data.width_cm,
        height_cm:           row.data.height_cm,
        has_frame:           hasFrame,
        frame_material:      hasFrame ? frameMaterial : null,
        frame_color:         frameColor,
        price:               price ?? null,
        original_price:      null,
        cost:                row.data.cost,
        show_price:          showPrice,
        status:              "draft",
        location_in_storage: row.data.location_in_storage || null,
        admin_notes:         row.data.admin_notes || null,
        ai_generated:        aiHint || contentFromAi,
        manually_edited:     false,
        tags,
        published_at:        null,
      })
      .select("id")
      .single()

    if (insErr || !artwork) {
      const reason = insErr?.message ?? "Error al crear obra"
      skipped.push({ code, reason })
      notify(code, "skipped", reason)
      continue
    }

    // Upload additional images (non-blocking — failure is not reason to skip the artwork)
    const additionalUploads: {
      cloudinary_url:        string
      cloudinary_public_id:  string
      width:                 number | null
      height:                number | null
      position:              number
    }[] = []

    for (let i = 1; i < artworkImages.length; i++) {
      const extra = artworkImages[i]
      try {
        const up = await uploadBufferToCloudinary(extra.buffer, extra.mime, code, i)
        additionalUploads.push({
          cloudinary_url:       up.cloudinary_url,
          cloudinary_public_id: up.cloudinary_public_id,
          width:                up.width,
          height:               up.height,
          position:             i,
        })
      } catch {
        // skip this extra image, don't fail the whole artwork
      }
    }

    // Batch insert all images (primary + extras) in one shot
    const altText = title.length > 64 ? title.slice(0, 61) + "…" : title
    const imagesToInsert = [
      {
        artwork_id:           artwork.id,
        cloudinary_url:       primaryUrl,
        cloudinary_public_id: primaryPublicId,
        width:                primaryWidth,
        height:               primaryHeight,
        position:             0,
        is_primary:           true,
        is_premium:           false,
        alt_text:             altText,
      },
      ...additionalUploads.map((u) => ({
        artwork_id:           artwork.id,
        cloudinary_url:       u.cloudinary_url,
        cloudinary_public_id: u.cloudinary_public_id,
        width:                u.width,
        height:               u.height,
        position:             u.position,
        is_primary:           false,
        is_premium:           false,
        alt_text:             altText,
      })),
    ]

    const { error: imgErr } = await supabase.from("artwork_images").insert(imagesToInsert)

    if (imgErr) {
      await supabase.from("artworks").delete().eq("id", artwork.id)
      const reason = "Error al guardar imágenes de la obra"
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
