import { anthropic, MODEL } from "./client"
import { SOCIAL_POST_PROMPT } from "./prompts"
import type { GenerateContentRequest, GenerateContentResponse, GeneratePostResponse } from "@/types/api"
import type { ArtworkPublic } from "@/types/artwork"
import { analyzeArtwork } from "./services/artwork-analysis"

export async function generateArtworkContent(
  params: GenerateContentRequest
): Promise<GenerateContentResponse> {
  return analyzeArtwork(params)
}

function extractJson(text: string): string {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No se encontró un objeto JSON válido en la respuesta")
  }
  return text.slice(start, end + 1)
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
