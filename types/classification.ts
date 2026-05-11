import type { ArtworkCategory } from "@/types/artwork"

export interface ClassificationResult {
  category: ArtworkCategory
  subcategory: string | null
  has_frame: boolean
  /** Material detectado: "madera" | "mdf" | "polirresina" | "metal" | "compuesto" | null. */
  frame_material: string | null
  frame_color: string | null
  confidence: number
}

export interface AutoFillResult {
  category: ArtworkCategory
  subcategory: string
  technique: string
  has_frame: boolean
  frame_material: string
  frame_color: string
  width_cm?: number
  height_cm?: number
}
