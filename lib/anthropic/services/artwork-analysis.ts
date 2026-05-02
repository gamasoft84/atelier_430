import { anthropic, MODEL } from "../client"
import { ARTWORK_CONTENT_PROMPT } from "../prompts"
import type { GenerateContentRequest, GenerateContentResponse } from "@/types/api"

function extractJson(text: string): string {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No se encontró un objeto JSON válido en la respuesta")
  }
  return text.slice(start, end + 1)
}

export async function analyzeArtwork(
  params: GenerateContentRequest
): Promise<GenerateContentResponse> {
  const prompt = ARTWORK_CONTENT_PROMPT
    .replace("{category}", params.category)
    .replace("{subcategory}", params.subcategory ?? "no especificada")
    .replace("{width}", String(params.width_cm ?? "?"))
    .replace("{height}", String(params.height_cm ?? "?"))
    .replace("{technique}", params.technique ?? "no especificada")
    .replace("{has_frame}", params.has_frame ? "sí" : "no")
    .replace("{frame_material}", params.frame_material ?? "")
    .replace("{frame_color}", params.frame_color ?? "")
    .replace("{cost}", params.cost ? `$${params.cost} MXN` : "no proporcionado")

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: params.image_url },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  })

  const raw = message.content[0].type === "text" ? message.content[0].text : ""
  const json = extractJson(raw)
  return JSON.parse(json) as GenerateContentResponse
}
