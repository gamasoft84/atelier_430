import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { anthropic, MODEL } from "@/lib/anthropic/client"
import { SOCIAL_POST_PROMPT } from "@/lib/anthropic/prompts"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { artworkId } = body as { artworkId?: string }
  if (!artworkId) return NextResponse.json({ error: "artworkId requerido" }, { status: 400 })

  const { data, error } = await supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .eq("id", artworkId)
    .single()

  if (error || !data) return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 })

  const artwork = normalizeArtworkRow(data as Parameters<typeof normalizeArtworkRow>[0])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atelier430.com"
  const prompt  = SOCIAL_POST_PROMPT
    .replace("{title}",       artwork.title        ?? "")
    .replace("{description}", artwork.description  ?? "Sin descripción")
    .replace("{price}",       artwork.show_price && artwork.price
                                ? `$${artwork.price.toLocaleString("es-MX")} MXN`
                                : "Consultar precio")
    .replace("{category}",    artwork.category     ?? "")
    .replace("{width}",       String(artwork.width_cm  ?? ""))
    .replace("{height}",      String(artwork.height_cm ?? ""))
    .replace("{url}",         `${siteUrl}/catalogo/${artwork.code}`)

  const message = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: 1024,
    messages:   [{ role: "user", content: prompt }],
  })

  const text  = message.content[0]?.type === "text" ? message.content[0].text : ""
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json({ error: "Respuesta IA inválida" }, { status: 500 })

  const posts = JSON.parse(match[0]) as { instagram: string; facebook: string; whatsapp: string }
  return NextResponse.json({ posts })
}
