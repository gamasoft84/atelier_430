"use server"

import { createAdminClient } from "@/lib/supabase/server"

export async function trackArtworkView(artworkId: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.rpc("increment_artwork_views", { p_id: artworkId })
  } catch {
    // fire-and-forget: never block the UI
  }
}

export async function trackWhatsAppClick(artworkId: string): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.rpc("increment_artwork_whatsapp_clicks", { p_id: artworkId })
  } catch {
    // fire-and-forget
  }
}
