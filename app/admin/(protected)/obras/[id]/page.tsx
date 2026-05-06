import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import ArtworkForm from "@/components/admin/ArtworkForm"
import type { Artwork, ArtworkImage } from "@/types/artwork"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("artworks").select("title, code").eq("id", id).single()
  if (!data) return { title: "Obra no encontrada" }
  return { title: `Editar · ${data.code}` }
}

export default async function EditarObraPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from("artworks")
    .select(`*, artwork_images(*)`)
    .eq("id", id)
    .single()

  if (!raw) notFound()

  const r = raw as Artwork & { stock_quantity?: number }
  const artwork: Artwork = {
    ...raw,
    stock_quantity: typeof r.stock_quantity === "number" ? r.stock_quantity : 1,
    images: (raw.artwork_images as ArtworkImage[]).sort((a, b) => a.position - b.position),
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/obras"
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-carbon-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Obras
        </Link>
        <span className="text-stone-300">/</span>
        <span className="font-mono text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
          {artwork.code}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-carbon-900 line-clamp-2">{artwork.title}</h1>
        <p className="text-sm text-stone-500 mt-1">Edita los datos de la obra.</p>
      </div>

      <ArtworkForm mode="edit" artwork={artwork} />
    </div>
  )
}
