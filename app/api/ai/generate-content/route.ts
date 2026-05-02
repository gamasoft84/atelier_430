import { NextResponse } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { generateArtworkContent } from "@/lib/anthropic/generate"

// ─── Request schema ────────────────────────────────────────────────────────

const bodySchema = z.object({
  image_url: z.string().url("Se requiere una URL de imagen válida"),
  category: z.enum(["religiosa", "nacional", "europea", "moderna"]),
  subcategory: z.string().optional(),
  technique: z.string().optional(),
  width_cm: z.coerce.number().positive().optional(),
  height_cm: z.coerce.number().positive().optional(),
  has_frame: z.boolean().optional(),
  frame_material: z.string().optional(),
  frame_color: z.string().optional(),
  cost: z.coerce.number().positive().optional(),
})

// ─── Error message helpers ─────────────────────────────────────────────────

function anthropicErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401) return "API key de Anthropic inválida o no autorizada."
    if (err.status === 429) return "Límite de uso de IA alcanzado. Espera un momento e inténtalo de nuevo."
    if (err.status === 529) return "El servicio de IA está sobrecargado. Inténtalo en unos minutos."
    if (err.status >= 500) return "Error en el servicio de IA. Inténtalo en unos minutos."
    return `Error de Anthropic (${err.status}): ${err.message}`
  }
  if (err instanceof SyntaxError) {
    return "La IA devolvió un formato inesperado. Inténtalo de nuevo."
  }
  if (err instanceof Error) {
    if (err.message.includes("JSON")) return "La IA devolvió un formato inesperado. Inténtalo de nuevo."
    if (err.message.includes("conexión") || err.message.includes("fetch")) {
      return "Error de conexión con el servicio de IA."
    }
    return err.message
  }
  return "Error inesperado al generar contenido."
}

// ─── POST /api/ai/generate-content ────────────────────────────────────────

export async function POST(request: Request) {
  // API key check — fail fast before touching the DB
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Servicio de IA no disponible (ANTHROPIC_API_KEY no configurada)." },
      { status: 503 }
    )
  }

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Parse + validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos de entrada inválidos."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Generate
  try {
    const result = await generateArtworkContent(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    const message = anthropicErrorMessage(err)
    const status =
      err instanceof Anthropic.APIError && err.status === 401 ? 503
      : err instanceof Anthropic.APIError && err.status === 429 ? 429
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
