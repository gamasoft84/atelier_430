import { z } from "zod"
import { anthropic, MODEL } from "../client"
import { CLASSIFICATION_PROMPT } from "../prompts"
import type { ClassificationResult } from "@/types/classification"

const classificationSchema = z.object({
  category: z.enum(["religiosa", "nacional", "europea", "moderna"]),
  subcategory: z.string().nullable(),
  has_frame: z.boolean(),
  frame_color: z.string().nullable(),
  confidence: z.number().min(0).max(1),
})

function extractJson(text: string): string {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No se encontró JSON válido en la respuesta")
  }
  return text.slice(start, end + 1)
}

export async function classifyArtwork(imageUrl: string): Promise<ClassificationResult> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: CLASSIFICATION_PROMPT },
        ],
      },
    ],
  })

  const raw = message.content[0].type === "text" ? message.content[0].text : ""
  const json = extractJson(raw)
  const parsed = classificationSchema.parse(JSON.parse(json))
  return parsed
}
