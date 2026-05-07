"use server"

import { createClient } from "@/lib/supabase/server"
import { uploadBufferToCloudinary } from "@/lib/cloudinary/upload-server"
import { classifyArtwork } from "@/lib/anthropic/services/artwork-classifier"
import { generateArtworkContent } from "@/lib/anthropic/generate"
import type { ArtworkCategory } from "@/types/artwork"

export interface PhotoImportSuccess {
  ok: true
  code: string
  title: string
}
export interface PhotoImportError {
  ok: false
  error: string
}
export type PhotoImportResult = PhotoImportSuccess | PhotoImportError

const CATEGORY_PREFIX: Record<ArtworkCategory, string> = {
  religiosa: "R",
  nacional:  "N",
  europea:   "E",
  moderna:   "M",
}

async function nextCode(category: ArtworkCategory): Promise<string> {
  const supabase = await createClient()
  const prefix = CATEGORY_PREFIX[category]
  const { data } = await supabase
    .from("artworks")
    .select("code")
    .like("code", `${prefix}-%`)
    .order("code", { ascending: false })
    .limit(1)

  if (!data || data.length === 0) return `${prefix}-001`
  const last = parseInt(data[0].code.split("-")[1] ?? "0", 10)
  return `${prefix}-${String(last + 1).padStart(3, "0")}`
}

export async function processOnePhoto(formData: FormData): Promise<PhotoImportResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "No autorizado" }

  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false, error: "Archivo inválido" }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mime = file.type || "image/jpeg"

  // Temp code for Cloudinary path (will use real code once we know the category)
  const tempCode = `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  // 1. Upload to Cloudinary
  let cloudinaryUrl: string
  let cloudinaryPublicId: string
  let width: number | null
  let height: number | null
  try {
    const up = await uploadBufferToCloudinary(buffer, mime, tempCode, 0)
    cloudinaryUrl       = up.cloudinary_url
    cloudinaryPublicId  = up.cloudinary_public_id
    width               = up.width
    height              = up.height
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 120) : "Error al subir imagen" }
  }

  // 2. Classify with AI
  let category: ArtworkCategory = "nacional"
  let subcategory: string | null = null
  let hasFrame = false
  let frameColor: string | null = null
  try {
    const cls = await classifyArtwork(cloudinaryUrl)
    category   = cls.category
    subcategory = cls.subcategory ?? null
    hasFrame   = cls.has_frame
    frameColor = cls.frame_color ?? null
  } catch {
    // default to nacional if classification fails
  }

  // 3. Generate title, description, tags
  let title = `Importación ${tempCode}`
  let description: string | null = null
  let tags: string[] | null = null
  try {
    const content = await generateArtworkContent({
      image_url:   cloudinaryUrl,
      category,
      subcategory: subcategory ?? undefined,
      has_frame:   hasFrame,
      frame_color: frameColor ?? undefined,
    })
    if (content.title?.trim()) title = content.title.trim()
    if (content.description?.trim()) description = content.description.trim()
    if (content.tags?.length) tags = content.tags
    if (!subcategory && content.subcategory?.trim()) subcategory = content.subcategory.trim()
  } catch {
    // continue with defaults
  }

  // 4. Generate real code
  const code = await nextCode(category)

  // 5. Insert draft artwork
  const { data: artwork, error: insErr } = await supabase
    .from("artworks")
    .insert({
      code,
      title,
      description,
      category,
      subcategory,
      has_frame:       hasFrame,
      frame_color:     frameColor,
      stock_quantity:  1,
      show_price:      false,
      status:          "draft",
      ai_generated:    true,
      manually_edited: false,
      tags,
    })
    .select("id")
    .single()

  if (insErr || !artwork) {
    return { ok: false, error: insErr?.message ?? "Error al crear obra en BD" }
  }

  // 6. Insert image record
  const altText = title.length > 64 ? title.slice(0, 61) + "…" : title
  const { error: imgErr } = await supabase.from("artwork_images").insert({
    artwork_id:           artwork.id,
    cloudinary_url:       cloudinaryUrl,
    cloudinary_public_id: cloudinaryPublicId,
    width,
    height,
    position:    0,
    is_primary:  true,
    alt_text:    altText,
  })

  if (imgErr) {
    await supabase.from("artworks").delete().eq("id", artwork.id)
    return { ok: false, error: "Error al guardar imagen" }
  }

  return { ok: true, code, title }
}
