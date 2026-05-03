import type { Metadata } from "next"
import Link from "next/link"
import DraftsReviewClient from "@/components/admin/import/DraftsReviewClient"
import type { DraftRow } from "@/components/admin/import/DraftsReviewClient"
import { createClient } from "@/lib/supabase/server"
import type { ArtworkCategory } from "@/types/artwork"

export const metadata: Metadata = {
  title: "Revisar borradores",
}

export default async function ImportRevisionPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("artworks")
    .select(
      `
      id,
      code,
      title,
      category,
      technique,
      created_at,
      artwork_images(cloudinary_url, is_primary, position)
    `
    )
    .eq("status", "draft")
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        No se pudieron cargar los borradores: {error.message}
      </div>
    )
  }

  const drafts = (data ?? []) as DraftRow[]

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/obras/importar"
          className="text-xs text-stone-400 hover:text-stone-600 mb-2 inline-block"
        >
          ← Importar masivo
        </Link>
        <h1 className="font-display text-2xl text-carbon-900">Borradores de importación</h1>
        <p className="text-sm text-stone-500 mt-1">
          Obras creadas desde Excel + ZIP en estado borrador. Edítalas o publícalas al catálogo.
        </p>
      </div>

      <DraftsReviewClient drafts={drafts.map((r) => ({ ...r, category: r.category as ArtworkCategory }))} />
    </div>
  )
}
