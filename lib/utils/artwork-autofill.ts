import type { ClassificationResult, AutoFillResult } from "@/types/classification"

/**
 * Material por defecto cuando la IA no devuelve uno explícito.
 * Las religiosas en Atelier 430 suelen venir en marcos de polirresina dorada.
 * El resto del catálogo es mayoritariamente madera (pino/MDF).
 */
function pickFrameMaterial(
  classification: ClassificationResult,
  fallback: string,
): string {
  if (classification.frame_material && classification.frame_material.trim().length > 0) {
    return classification.frame_material.trim().toLowerCase()
  }
  return fallback
}

export function applyAutoFill(classification: ClassificationResult): AutoFillResult {
  if (classification.category === "religiosa") {
    return {
      category: "religiosa",
      subcategory: classification.subcategory ?? "",
      technique: "impresion",
      has_frame: true,
      frame_material: pickFrameMaterial(classification, "polirresina"),
      frame_color: classification.frame_color ?? "dorado",
      width_cm: 55,
      height_cm: 65,
    }
  }

  return {
    category: classification.category,
    subcategory: classification.subcategory ?? "",
    technique: "oleo",
    has_frame: classification.has_frame,
    frame_material: classification.has_frame
      ? pickFrameMaterial(classification, "madera")
      : "",
    frame_color: classification.frame_color ?? "",
  }
}
