import { z } from "zod"

export const ARTWORK_CREATE_DEFAULTS_SETTING_KEY = "artwork_create_defaults" as const

export const ArtworkCreateDefaultsSchema = z
  .object({
    category: z.enum(["religiosa", "nacional", "europea", "moderna"]).default("europea"),
    subcategory: z.string().max(50).optional().default(""),
    technique: z.string().max(50).optional().default(""),
    artist: z.string().max(120).optional().default("F. Caltenco"),
    width_cm: z.number().int().min(1).max(500).optional(),
    height_cm: z.number().int().min(1).max(500).optional(),
    has_frame: z.boolean().optional().default(false),
    price: z.number().int().min(0).optional(),
    original_price: z.number().int().min(0).optional(),
  })
  .strict()

export type ArtworkCreateDefaults = z.infer<typeof ArtworkCreateDefaultsSchema>

export const DEFAULT_ARTWORK_CREATE_DEFAULTS: ArtworkCreateDefaults = {
  category: "europea",
  subcategory: "Bodegón",
  technique: "oleo",
  artist: "F. Caltenco",
  width_cm: 60,
  height_cm: 80,
  has_frame: false,
  price: 1000,
  original_price: 4560,
}

export function parseArtworkCreateDefaults(value: unknown): ArtworkCreateDefaults {
  if (!value || typeof value !== "object") return DEFAULT_ARTWORK_CREATE_DEFAULTS
  const parsed = ArtworkCreateDefaultsSchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_ARTWORK_CREATE_DEFAULTS
}

