"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ArtworkFormData, SellArtworkData, ReserveArtworkData, ArtworkCategory } from "@/types/artwork"
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

  const { data: artwork, error: artworkError } = await supabase
    .from("artworks")
    .insert({
      code,
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      subcategory: formData.subcategory || null,
      technique: formData.technique || null,
      width_cm: formData.width_cm,
      height_cm: formData.height_cm,
      has_frame: formData.has_frame,
      frame_material: formData.frame_material || null,
      frame_color: formData.frame_color || null,
      price: formData.price,
      original_price: formData.original_price,
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

// ─── Update artwork ───────────────────────────────────────────────────────

export async function updateArtwork(
  id: string,
  formData: ArtworkFormData,
  images: UploadedImage[]
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { error: artworkError } = await supabase
    .from("artworks")
    .update({
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      subcategory: formData.subcategory || null,
      technique: formData.technique || null,
      width_cm: formData.width_cm,
      height_cm: formData.height_cm,
      has_frame: formData.has_frame,
      frame_material: formData.frame_material || null,
      frame_color: formData.frame_color || null,
      price: formData.price,
      original_price: formData.original_price,
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

  // Delete from Cloudinary (fire-and-forget — DB cascade handles the records)
  if (images && images.length > 0) {
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    Promise.all(
      images.map((img) =>
        fetch(`${origin}/api/upload`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: img.cloudinary_public_id }),
        }).catch(console.error)
      )
    )
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

  const { error } = await supabase
    .from("artworks")
    .update({
      status: "sold",
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
    details: { sold_price: data.sold_price, sold_channel: data.sold_channel },
  })

  revalidatePath("/admin/obras")
  revalidatePath("/admin/ventas")
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
