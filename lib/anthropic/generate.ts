import { anthropic, MODEL } from "./client"
import { ARTWORK_CONTENT_PROMPT, SOCIAL_POST_PROMPT } from "./prompts"
import type { GenerateContentRequest, GenerateContentResponse, GeneratePostResponse } from "@/types/api"
import type { ArtworkPublic } from "@/types/artwork"

// Extracts the first JSON object from a string — handles cases where Claude
// adds preamble text before the JSON block.
function extractJson(text: string): string {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No se encontró un objeto JSON válido en la respuesta")
  }
  return text.slice(start, end + 1)
}

export async function generateArtworkContent(
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

export async function generateSocialPosts(
  artwork: Pick<ArtworkPublic, "title" | "description" | "category" | "width_cm" | "height_cm" | "price">,
  url: string
): Promise<GeneratePostResponse> {
  const prompt = SOCIAL_POST_PROMPT
    .replace("{title}", artwork.title)
    .replace("{description}", artwork.description ?? "")
    .replace("{price}", artwork.price ? `$${artwork.price} MXN` : "Consultar precio")
    .replace("{category}", artwork.category)
    .replace("{width}", String(artwork.width_cm ?? "?"))
    .replace("{height}", String(artwork.height_cm ?? "?"))
    .replace("{url}", url)

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = message.content[0].type === "text" ? message.content[0].text : ""
  const json = extractJson(raw)
  return JSON.parse(json) as GeneratePostResponse
}
