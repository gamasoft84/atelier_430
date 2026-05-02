import { NextResponse } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { classifyArtwork } from "@/lib/anthropic/services/artwork-classifier"

const bodySchema = z.object({
  image_url: z.string().url("Se requiere una URL de imagen válida"),
})

function errorMessage(err: unknown): { message: string; status: number } {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401) return { message: "API key de Anthropic inválida.", status: 503 }
    if (err.status === 429) return { message: "Límite de uso de IA alcanzado. Espera un momento.", status: 429 }
    if (err.status >= 500) return { message: "Error en el servicio de IA. Inténtalo en unos minutos.", status: 500 }
    return { message: `Error de Anthropic (${err.status}): ${err.message}`, status: 500 }
  }
  if (err instanceof z.ZodError) {
    return { message: "La IA devolvió un formato inesperado. Inténtalo de nuevo.", status: 500 }
  }
  if (err instanceof SyntaxError || (err instanceof Error && err.message.includes("JSON"))) {
    return { message: "La IA devolvió un formato inesperado. Inténtalo de nuevo.", status: 500 }
  }
  if (err instanceof Error) return { message: err.message, status: 500 }
  return { message: "Error inesperado al clasificar la obra.", status: 500 }
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Servicio de IA no disponible (ANTHROPIC_API_KEY no configurada)." },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de entrada inválidos." },
      { status: 400 }
    )
  }

  try {
    const result = await classifyArtwork(parsed.data.image_url)
    return NextResponse.json(result)
  } catch (err) {
    const { message, status } = errorMessage(err)
    return NextResponse.json({ error: message }, { status })
  }
}
