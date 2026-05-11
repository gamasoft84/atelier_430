"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ArtworkFormData, SellArtworkData, ReserveArtworkData, ArtworkCategory } from "@/types/artwork"
import { normalizeStockQuantityForSave } from "@/lib/stock"
import { normalizeImagesForCode } from "@/lib/cloudinary/normalize"
import { destroyCloudinaryAsset } from "@/lib/cloudinary/admin"
import type { UploadedImage } from "@/hooks/useImageUpload"

// ─── Code generation ──────────────────────────────────────────────────────

const CATEGORY_PREFIX: Record<ArtworkCategory, string> = {
  religiosa: "R",
  nacional: "N",
  europea: "E",
  moderna: "M",
}

export async function generateArtworkCode(category: ArtworkCategory): Promise<string> {
  const supabase = await createClient()
  const prefix = CATEGORY_PREFIX[category]

  const { data } = await supabase
    .from("artworks")
    .select("code")
    .like("code", `${prefix}-%`)
    .order("code", { ascending: false })
    .limit(1)

  if (!data || data.length === 0) {
    return `${prefix}-001`
  }

  const lastCode = data[0].code // e.g. "R-007"
  const lastNum = parseInt(lastCode.split("-")[1] ?? "0", 10)
  const next = String(lastNum + 1).padStart(3, "0")
  return `${prefix}-${next}`
}

// ─── Create artwork ───────────────────────────────────────────────────────

export async function createArtwork(
  formData: ArtworkFormData,
  images: UploadedImage[]
): Promise<{ id: string; code: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const code = await generateArtworkCode(formData.category)
  const stockQty = normalizeStockQuantityForSave(formData.category, formData.stock_quantity)

  const { data: artwork, error: artworkError } = await supabase
    .from("artworks")
    .insert({
      code,
      stock_quantity: stockQty,
      title: formData.title,
      artist: formData.artist?.trim() ? formData.artist.trim() : null,
      description: formData.description || null,
      category: formData.category,
      subcategory: formData.subcategory || null,
      technique: formData.technique || null,
      width_cm: formData.width_cm,
      height_cm: formData.height_cm,
      has_frame: formData.has_frame,
      frame_material: formData.frame_material || null,
      frame_color: formData.frame_color || null,
      frame_outer_width_cm: formData.has_frame ? formData.frame_outer_width_cm : null,
      frame_outer_height_cm: formData.has_frame ? formData.frame_outer_height_cm : null,
      price: formData.price,
      original_price: formData.original_price,
      price_locked: Boolean(formData.price_locked),
      cost: formData.cost,
      show_price: formData.show_price,
      status: formData.status,
      location_in_storage: formData.location_in_storage || null,
      admin_notes: formData.admin_notes || null,
      tags: formData.tags.length > 0 ? formData.tags : null,
      published_at: formData.status === "available" ? new Date().toISOString() : null,
    })
    .select("id, code")
    .single()

  if (artworkError || !artwork) {
    return { error: artworkError?.message ?? "Error al crear la obra" }
  }

  // Insert images
  if (images.length > 0) {
    const imageRows = images.map((img) => ({
      artwork_id: artwork.id,
      cloudinary_url: img.cloudinary_url,
      cloudinary_public_id: img.cloudinary_public_id,
      width: img.width,
      height: img.height,
      position: img.position,
      is_primary: img.is_primary,
      alt_text: artwork.code,
    }))

    const { error: imgError } = await supabase.from("artwork_images").insert(imageRows)
    if (imgError) {
      // Rollback: delete the artwork
      await supabase.from("artworks").delete().eq("id", artwork.id)
      return { error: "Error al guardar las imágenes" }
    }

    // Cloudinary: mover assets de tmp-XXX/IMP-XXX a la carpeta canónica del
    // código real (atelier430/artworks/<code>/<code>-<sufijo>). Si falla, queda
    // la URL vieja en BD — la obra sigue funcionando, solo no queda canónica.
    await syncImageRowsToCanonicalFolder(artwork.id, artwork.code, images)
  }

  // Activity log
  await supabase.from("admin_activity").insert({
    action: "artwork_created",
    entity_type: "artwork",
    entity_id: artwork.id,
    details: { code: artwork.code, title: formData.title },
  })

  revalidatePath("/admin/obras")
  return { id: artwork.id, code: artwork.code }
}

/**
 * Renombra en Cloudinary y actualiza `artwork_images` para dejar todas las
 * imágenes de la obra bajo `atelier430/artworks/<code>/<code>-<sufijo>`.
 *
 * Idempotente: si una imagen ya está en la carpeta canónica, no la toca.
 */
async function syncImageRowsToCanonicalFolder(
  artworkId: string,
  code: string,
  images: Pick<UploadedImage, "cloudinary_url" | "cloudinary_public_id">[],
) {
  const supabase = await createClient()
  const normalized = await normalizeImagesForCode(images, code)

  await Promise.all(
    normalized.map((n, i) => {
      if (!n.changed) return null
      const original = images[i]
      return supabase
        .from("artwork_images")
        .update({
          cloudinary_url: n.cloudinary_url,
          cloudinary_public_id: n.cloudinary_public_id,
        })
        .eq("artwork_id", artworkId)
        .eq("cloudinary_public_id", original.cloudinary_public_id)
    }),
  )
}

// ─── Update artwork ───────────────────────────────────────────────────────

export async function updateArtwork(
  id: string,
  formData: ArtworkFormData,
  images: UploadedImage[],
  /** Imágenes que estaban en BD y el usuario quitó del form. Se borran de Cloudinary
   *  solo después de que el commit en BD haya tenido éxito, para no dejar inconsistencia
   *  si el guardado falla o el usuario cancela en algún punto previo. */
  pendingDeletes: string[] = []
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const stockQty = normalizeStockQuantityForSave(formData.category, formData.stock_quantity)

  const { error: artworkError } = await supabase
    .from("artworks")
    .update({
      stock_quantity: stockQty,
      title: formData.title,
      artist: formData.artist?.trim() ? formData.artist.trim() : null,
      description: formData.description || null,
      category: formData.category,
      subcategory: formData.subcategory || null,
      technique: formData.technique || null,
      width_cm: formData.width_cm,
      height_cm: formData.height_cm,
      has_frame: formData.has_frame,
      frame_material: formData.frame_material || null,
      frame_color: formData.frame_color || null,
      frame_outer_width_cm: formData.has_frame ? formData.frame_outer_width_cm : null,
      frame_outer_height_cm: formData.has_frame ? formData.frame_outer_height_cm : null,
      price: formData.price,
      original_price: formData.original_price,
      price_locked: Boolean(formData.price_locked),
      cost: formData.cost,
      show_price: formData.show_price,
      status: formData.status,
      location_in_storage: formData.location_in_storage || null,
      admin_notes: formData.admin_notes || null,
      tags: formData.tags.length > 0 ? formData.tags : null,
      manually_edited: true,
    })
    .eq("id", id)

  if (artworkError) return { error: artworkError.message }

  // Replace all images
  await supabase.from("artwork_images").delete().eq("artwork_id", id)

  if (images.length > 0) {
    const imageRows = images.map((img) => ({
      artwork_id: id,
      cloudinary_url: img.cloudinary_url,
      cloudinary_public_id: img.cloudinary_public_id,
      width: img.width,
      height: img.height,
      position: img.position,
      is_primary: img.is_primary,
      alt_text: formData.title,
    }))

    const { error: imgError } = await supabase.from("artwork_images").insert(imageRows)
    if (imgError) return { error: "Error al actualizar las imágenes" }

    // Normaliza a la carpeta canónica las imágenes que aún vivan en tmp-XXX/IMP-XXX
    // (típicamente herencia de obras creadas antes del fix de carpetas).
    const { data: artworkRow } = await supabase
      .from("artworks")
      .select("code")
      .eq("id", id)
      .single()
    if (artworkRow?.code) {
      await syncImageRowsToCanonicalFolder(id, artworkRow.code, images)
    }
  }

  // BD ya está consistente. Ahora sí borrar de Cloudinary los assets que el usuario
  // quitó en el form pero que aún existían (sólo public_ids que no estén en `images`,
  // por si el usuario los volvió a agregar / restauró el orden).
  //
  // Importante: se ESPERA (await) a que Cloudinary confirme. En entornos serverless
  // (Vercel) los fire-and-forget se cortan al terminar la función, dejando assets
  // huérfanos. El costo es ~150-300ms por imagen; aceptable y consistente.
  if (pendingDeletes.length > 0) {
    const keptIds = new Set(images.map((i) => i.cloudinary_public_id))
    const toActuallyDelete = pendingDeletes.filter((id) => !keptIds.has(id))
    if (toActuallyDelete.length > 0) {
      const results = await Promise.allSettled(
        toActuallyDelete.map((publicId) => destroyCloudinaryAsset(publicId)),
      )
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(
            `[updateArtwork] No se pudo borrar de Cloudinary ${toActuallyDelete[i]}:`,
            r.reason,
          )
        }
      })
    }
  }

  await supabase.from("admin_activity").insert({
    action: "artwork_updated",
    entity_type: "artwork",
    entity_id: id,
    details: { title: formData.title },
  })

  revalidatePath("/admin/obras")
  revalidatePath(`/admin/obras/${id}`)
  return { success: true }
}

// ─── Delete artwork ───────────────────────────────────────────────────────

export async function deleteArtwork(id: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  // Get images to delete from Cloudinary
  const { data: images } = await supabase
    .from("artwork_images")
    .select("cloudinary_public_id")
    .eq("artwork_id", id)

  // Delete from Cloudinary. Se ESPERA (await) la confirmación de Cloudinary
  // antes de borrar la fila de BD; en serverless el fire-and-forget se cortaba
  // dejando assets huérfanos.
  if (images && images.length > 0) {
    const results = await Promise.allSettled(
      images.map((img) => destroyCloudinaryAsset(img.cloudinary_public_id)),
    )
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(
          `[deleteArtwork] No se pudo borrar de Cloudinary ${images[i].cloudinary_public_id}:`,
          r.reason,
        )
      }
    })
  }

  const { data: artwork } = await supabase
    .from("artworks")
    .select("code, title")
    .eq("id", id)
    .single()

  const { error } = await supabase.from("artworks").delete().eq("id", id)
  if (error) return { error: error.message }

  await supabase.from("admin_activity").insert({
    action: "artwork_deleted",
    entity_type: "artwork",
    entity_id: id,
    details: { code: artwork?.code, title: artwork?.title },
  })

  revalidatePath("/admin/obras")
  return { success: true }
}

// ─── Sell artwork ─────────────────────────────────────────────────────────

export async function sellArtwork(
  id: string,
  data: SellArtworkData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { data: row, error: fetchErr } = await supabase
    .from("artworks")
    .select("id, status, category, stock_quantity")
    .eq("id", id)
    .single()

  if (fetchErr || !row) return { error: "Obra no encontrada" }
  if (row.status === "sold") return { error: "La obra ya está marcada como vendida" }

  let qty =
    row.category === "religiosa"
      ? data.quantity_sold ?? row.stock_quantity ?? 1
      : row.stock_quantity ?? 1
  const maxQty = Math.max(1, row.stock_quantity ?? 1)
  qty = Math.min(Math.max(1, Math.floor(qty)), maxQty)

  const remaining = (row.stock_quantity ?? 1) - qty

  if (remaining > 0) {
    const { error } = await supabase
      .from("artworks")
      .update({
        stock_quantity: remaining,
      })
      .eq("id", id)

    if (error) return { error: error.message }

    await supabase.from("admin_activity").insert({
      action: "artwork_partial_sale",
      entity_type: "artwork",
      entity_id: id,
      details: {
        quantity_sold: qty,
        sold_price: data.sold_price,
        sold_channel: data.sold_channel,
        remaining_stock: remaining,
      },
    })

    revalidatePath("/admin/obras")
    revalidatePath("/admin/reportes")
    revalidatePath("/admin/dashboard")
    revalidatePath("/catalogo")
    return { success: true }
  }

  const { error } = await supabase
    .from("artworks")
    .update({
      status: "sold",
      stock_quantity: 0,
      sold_at: new Date().toISOString(),
      sold_price: data.sold_price,
      sold_channel: data.sold_channel,
      sold_buyer_name: data.sold_buyer_name || null,
      sold_buyer_contact: data.sold_buyer_contact || null,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  await supabase.from("admin_activity").insert({
    action: "artwork_sold",
    entity_type: "artwork",
    entity_id: id,
    details: { sold_price: data.sold_price, sold_channel: data.sold_channel, quantity_sold: qty },
  })

  revalidatePath("/admin/obras")
  revalidatePath("/admin/ventas")
  revalidatePath("/admin/reportes")
  revalidatePath("/admin/dashboard")
  revalidatePath("/catalogo")
  return { success: true }
}

// ─── Reserve artwork ──────────────────────────────────────────────────────

export async function reserveArtwork(
  id: string,
  data: ReserveArtworkData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { error } = await supabase
    .from("artworks")
    .update({
      status: "reserved",
      reserved_by: data.reserved_by,
      reserved_until: data.reserved_until,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/obras")
  return { success: true }
}

// ─── Toggle visibility ────────────────────────────────────────────────────

export async function toggleArtworkVisibility(
  id: string,
  currentStatus: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const newStatus = currentStatus === "hidden" ? "available" : "hidden"
  const { error } = await supabase.from("artworks").update({ status: newStatus }).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/obras")
  return { success: true }
}
