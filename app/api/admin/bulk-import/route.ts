import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  filterValidRows,
  runBulkImportCore,
  zipImagesByCode,
  type BulkImportResult,
} from "@/lib/import/bulk-import-core"
import { BULK_IMPORT_MAX_ROWS } from "@/lib/constants"
import type { ValidationSummary } from "@/types/import"

/** Import masivo puede tardar varios minutos (ZIP + Cloudinary + IA por obra). */
export const maxDuration = 300

type StreamMsg =
  | { type: "start"; total: number }
  | {
      type: "progress"
      index: number
      total: number
      code: string
      outcome: "created" | "skipped"
      skipReason?: string
    }
  | { type: "done"; result: BulkImportResult }
  | { type: "error"; message: string }

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 })
  }

  const zipFile = formData.get("zip")
  const payloadRaw = formData.get("payload")
  if (!(zipFile instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo ZIP" }, { status: 400 })
  }
  if (typeof payloadRaw !== "string") {
    return NextResponse.json({ error: "Faltan datos de validación" }, { status: 400 })
  }

  let summary: ValidationSummary
  try {
    summary = JSON.parse(payloadRaw) as ValidationSummary
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const rows = filterValidRows(summary)
  if (rows.length === 0) {
    return NextResponse.json({ error: "No hay filas válidas para importar" }, { status: 400 })
  }
  if (rows.length > BULK_IMPORT_MAX_ROWS) {
    return NextResponse.json(
      { error: `Máximo ${BULK_IMPORT_MAX_ROWS} obras por lote.` },
      { status: 400 }
    )
  }

  const zipBuffer = await zipFile.arrayBuffer()
  let imagesByCode: Awaited<ReturnType<typeof zipImagesByCode>>["imagesByCode"]
  try {
    const z = await zipImagesByCode(zipBuffer)
    imagesByCode = z.imagesByCode
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el ZIP. Comprueba que sea un .zip válido." },
      { status: 400 }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (msg: StreamMsg) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(msg)}\n`))
      }

      try {
        send({ type: "start", total: rows.length })
        const result = await runBulkImportCore(supabase, {
          rows,
          imagesByCode,
          onRowDone: (p) =>
            send({
              type: "progress",
              index: p.index,
              total: p.total,
              code: p.code,
              outcome: p.outcome,
              skipReason: p.skipReason,
            }),
        })

        revalidatePath("/admin/obras")
        revalidatePath("/admin/obras/importar/revision")
        send({ type: "done", result })
      } catch (e) {
        const message =
          e instanceof Error ? e.message.slice(0, 500) : "Error al importar"
        send({ type: "error", message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
