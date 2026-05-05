"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

export type SizeGroup = {
  width_cm: number
  height_cm: number
  total: number
  sold: number
  reserved: number
  locked: number
  eligible: number
  current_price: number | null
  current_original_price: number | null
  mixed_price: boolean
  mixed_original_price: boolean
}

export async function getSizeGroups(): Promise<SizeGroup[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("artworks")
    .select("width_cm, height_cm, status, price_locked, price, original_price")
    .not("width_cm", "is", null)
    .not("height_cm", "is", null)
    .limit(2000)

  if (error || !data) return []

  const map = new Map<string, SizeGroup>()

  for (const row of data as Array<{
    width_cm: number
    height_cm: number
    status: string
    price_locked: boolean
    price: number | null
    original_price: number | null
  }>) {
    const w = row.width_cm
    const h = row.height_cm
    const key = `${w}x${h}`

    const g =
      map.get(key) ??
      {
        width_cm: w,
        height_cm: h,
        total: 0,
        sold: 0,
        reserved: 0,
        locked: 0,
        eligible: 0,
        // Current reference values are computed ONLY from eligible artworks
        current_price: null,
        current_original_price: null,
        mixed_price: false,
        mixed_original_price: false,
      }

    g.total += 1
    if (row.status === "sold") g.sold += 1
    if (row.status === "reserved") g.reserved += 1
    if (row.price_locked) g.locked += 1

    const eligible =
      row.status !== "sold" &&
      row.status !== "reserved" &&
      !row.price_locked

    if (eligible) g.eligible += 1

    // Track current values ONLY among eligible artworks.
    if (eligible) {
      if (g.eligible === 1) {
        g.current_price = row.price ?? null
        g.current_original_price = row.original_price ?? null
      } else {
        if (!g.mixed_price && g.current_price !== row.price) {
          g.mixed_price = true
          g.current_price = null
        }
        if (!g.mixed_original_price && g.current_original_price !== row.original_price) {
          g.mixed_original_price = true
          g.current_original_price = null
        }
      }
    }

    map.set(key, g)
  }

  return [...map.values()].sort((a, b) => {
    if (a.width_cm !== b.width_cm) return a.width_cm - b.width_cm
    return a.height_cm - b.height_cm
  })
}

export async function applyBulkPriceForSize(input: {
  widthCm: number
  heightCm: number
  price: number | null
  originalPrice: number | null
  applyOriginalPrice: boolean
}): Promise<{ updated: number } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  if (!Number.isFinite(input.widthCm) || !Number.isFinite(input.heightCm)) {
    return { error: "Tamaño inválido" }
  }
  if (input.price !== null && !(Number.isFinite(input.price) && input.price >= 0)) {
    return { error: "Precio inválido" }
  }
  if (
    input.applyOriginalPrice &&
    input.originalPrice !== null &&
    !(Number.isFinite(input.originalPrice) && input.originalPrice >= 0)
  ) {
    return { error: "Precio anterior inválido" }
  }

  const updatePayload: Database["public"]["Tables"]["artworks"]["Update"] = {
    price: input.price,
    ...(input.applyOriginalPrice ? { original_price: input.originalPrice } : {}),
  }

  const { error, count } = await supabase
    .from("artworks")
    .update(updatePayload, { count: "exact" })
    .eq("width_cm", input.widthCm)
    .eq("height_cm", input.heightCm)
    .neq("status", "sold")
    .neq("status", "reserved")
    .eq("price_locked", false)

  if (error) return { error: error.message }

  revalidatePath("/admin/configuracion")
  revalidatePath("/admin/obras")
  revalidatePath("/catalogo")

  return { updated: count ?? 0 }
}

